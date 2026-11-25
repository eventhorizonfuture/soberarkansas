import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
import { sendViaSES } from './shared/ses-sender.ts';
import { deliverInquiry } from './shared/featured-inquiry-delivery.ts';

const schema = z.object({
  submission_id: z.string().uuid(),
  facility_name: z.string().trim().min(1).max(300),
  contact_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50),
  city: z.string().trim().max(200),
  listing_type: z.enum(['', 'Inpatient', 'Outpatient', 'Sober living']),
  message: z.string().trim().max(3000),
}).strict();

const reply = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

// Intentionally public: visitors need not sign in to inquire. No private reads or writes are exposed.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  if (!req.headers.get('content-type')?.includes('application/json')) return reply({ error: 'Please submit a valid form.' }, 415);
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > 20000) return reply({ error: 'Your inquiry is too long.' }, 413);
    let body: unknown;
    try { body = JSON.parse(text); } catch { return reply({ error: 'Please submit a valid form.' }, 400); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return reply({ error: 'Please check all required fields and your email address.' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return reply({ error: 'Your inquiry could not be sent. Please try again; your entries have been kept.' }, 503);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'arkansas' } });
    const { submission_id, ...fields } = parsed.data;
    const { data: existing, error: readError } = await db.from('featured_inquiries').select('*').eq('id', submission_id).maybeSingle();
    if (readError) return reply({ error: 'Your inquiry could not be saved or sent. Please try again; your entries have been kept.' }, 500);
    if (existing && Object.entries(fields).some(([field, value]) => existing[field] !== value)) {
      return reply({ error: 'Please submit your inquiry again with a new request.' }, 409);
    }
    // The existing queued value records email API acceptance, not a local queue.
    if (existing?.delivery_status === 'queued') return reply({ sent: true }, 200);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: limitError } = await db.from('featured_inquiries').select('id', { count: 'exact', head: true }).eq('email', fields.email).gte('created_at', since);
    if (limitError) return reply({ error: 'Your inquiry could not be sent. Please try again; your entries have been kept.' }, 503);
    if (!existing && (count ?? 0) >= 5) return reply({ error: 'Too many inquiries from this email address. Please try again in an hour; your entries have been kept.' }, 429);
    // Ignore duplicate IDs instead of overwriting an existing inquiry on a retry.
    const { error } = await db.from('featured_inquiries').upsert({ id: submission_id, ...fields }, { onConflict: 'id', ignoreDuplicates: true });
    if (error) return reply({ error: 'Your inquiry could not be saved or sent. Please try again; your entries have been kept.' }, 500);
    // The row saved above is a backup. For Arkansas the email is the point of
    // the page, so a failed send is reported to the visitor instead of
    // being hidden behind a success message. Retries reuse the same
    // submission id, so a retry after a partial failure never creates a
    // duplicate row, and a recorded delivery is never re-sent.
    let sent = false;
    try {
      sent = await deliverInquiry(fields, submission_id, (recipient, options) => sendViaSES(recipient, options));
    } catch (sendError) {
      console.warn('Featured inquiry email not sent (SES delivery failed):', sendError);
    }
    if (!sent) {
      return reply({ error: 'Your inquiry could not be sent. Please try again; your entries have been kept.' }, 503);
    }
    try {
      // Retries also short-circuit on this recorded delivery status if this write is retried.
      await db.from('featured_inquiries').update({ delivery_status: 'queued' }).eq('id', submission_id);
    } catch (statusError) {
      console.warn('Featured inquiry delivery status not recorded:', statusError);
    }
    return reply({ sent: true }, 200);
  } catch (error) {
    return reply({ error: 'Your inquiry could not be sent. Please try again; your entries have been kept.' }, 500);
  }
});
