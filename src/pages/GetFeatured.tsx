import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell, { PageHero } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { featuredInquirySchema, type FeaturedInquiry } from '@/lib/featuredInquiry';

// Only facility name and email are asked for. The inquiry function still
// expects a contact name, so send a placeholder rather than asking for it.
const emptyForm: FeaturedInquiry = { facility_name: '', contact_name: 'Not provided', email: '', phone: '', city: '', listing_type: '', message: '' };

const GetFeatured = () => {
  // Arriving from a listing's "Feature This Listing" button prefills the
  // facility name (and quietly carries the city along with the inquiry).
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<FeaturedInquiry>(() => ({
    ...emptyForm,
    facility_name: (searchParams.get('facility') ?? '').slice(0, 300),
    city: (searchParams.get('city') ?? '').slice(0, 200),
  }));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const attempt = useRef<{ payload: string; id: string } | null>(null);
  const set = (field: keyof FeaturedInquiry) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    const parsed = featuredInquirySchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Please check the form.'); return; }
    const payload = JSON.stringify(parsed.data);
    if (attempt.current?.payload !== payload) attempt.current = { payload, id: crypto.randomUUID() };
    const submission = attempt.current;
    if (!submission) return;
    setBusy(true);
    try {
      // TODO(arkansas): 'submit-featured-inquiry-arkansas' is not deployed yet — see fork-prep/REBRAND-NOTES.md (b).
      const { data, error: requestError } = await supabase.functions.invoke('submit-featured-inquiry-arkansas', {
        body: { ...parsed.data, submission_id: submission.id },
      });
      if (requestError || data?.sent !== true) {
        let message = data?.error;
        if (requestError && 'context' in requestError && requestError.context instanceof Response) {
          const response = await requestError.context.json().catch(() => null);
          message = response?.error;
        }
        throw new Error(typeof message === 'string' ? message : 'Your inquiry could not be sent. Please try again; your entries have been kept.');
      }
      setDone(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your inquiry could not be sent. Please try again; your entries have been kept.');
    } finally { setBusy(false); }
  };

  return (
    <PageShell title="Get Featured on SoberArkansas" description="Inquire about featured placement for your Arkansas treatment center or sober living home.">
      <PageHero title="Get Featured on SoberArkansas" subtitle="Featured listings get prominent placement on the homepage and in their category. Listing your facility or home is always free." />
      <section className="container mx-auto max-w-2xl px-4 py-12">
        {done ? (
          <p role="status" className="text-center text-lg font-semibold text-primary">Thanks — your inquiry has been sent. We typically respond within 24 hours.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="facility-name">Facility or home name *</Label><Input id="facility-name" required maxLength={300} className="h-12" value={form.facility_name} onChange={set('facility_name')} autoComplete="organization" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="inquiry-email">Email *</Label><Input id="inquiry-email" type="email" required maxLength={320} className="h-12" value={form.email} onChange={set('email')} autoComplete="email" /></div>
            {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <Button type="submit" disabled={busy} size="lg" className="min-h-12 bg-accent font-bold text-accent-foreground hover:bg-accent/90 sm:col-span-2">{busy ? 'Sending…' : 'Send inquiry'}</Button>
          </form>
        )}
      </section>
    </PageShell>
  );
};

export default GetFeatured;