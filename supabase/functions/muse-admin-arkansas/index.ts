import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';
import { idSchema, listingSchema, resourceSchema, resourceUpdateSchema, updateSchema, validBearer } from './validation.ts';

const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function readJson(req: Request): Promise<{ body?: unknown; error?: Response }> {
  if (!req.headers.get('Content-Type')?.toLowerCase().includes('application/json')) return { error: respond({ error: 'Content-Type must be application/json' }, 415) };
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > 2_000_000) return { error: respond({ error: 'Request body too large' }, 413) };
  try { return { body: JSON.parse(text) }; } catch { return { error: respond({ error: 'Invalid JSON' }, 400) }; }
}

async function fetchAll(db: SupabaseClient, table: string, order: string) {
  const rows: unknown[] = [];
  // Explicit ranges bypass the database's per-request row cap.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from(table).select('*').order(order).range(offset, offset + 499);
    if (error) return null;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return rows;
}

// Resolve `county` (name or slug) into county_id. "statewide" or null => no county.
async function resolveCounty(db: SupabaseClient, input: Record<string, unknown>, counties: Map<string, string>) {
  const { county, ...rest } = input as { county?: string } & Record<string, unknown>;
  if (county === undefined) return { row: rest };
  const key = county.trim().toLowerCase().replace(/\s+county$/, '');
  if (key === 'statewide' || key === '') return { row: { ...rest, county_id: null } };
  const id = counties.get(key) ?? counties.get(key.replace(/[^a-z]+/g, '-'));
  if (!id) return { error: `Unknown county: ${county}` };
  return { row: { ...rest, county_id: id } };
}

async function countyMap(db: SupabaseClient) {
  const { data } = await db.from('counties').select('id,name,slug');
  const m = new Map<string, string>();
  for (const c of data ?? []) { m.set(c.name.toLowerCase(), c.id); m.set(c.slug, c.id); }
  return m;
}

async function handleResources(req: Request, db: SupabaseClient, url: URL, id: string | undefined) {
  if (req.method === 'GET') {
    if (id) {
      const { data } = await db.from('county_resources').select('*').eq('id', id).maybeSingle();
      return data ? respond({ resource: data }) : respond({ error: 'Resource not found' }, 404);
    }
    const county = url.searchParams.get('county');
    let q = db.from('county_resources').select('*, counties(name,slug)').order('county_id', { nullsFirst: true }).order('sort_order').limit(10000);
    if (county) {
      if (county === 'statewide') q = q.is('county_id', null);
      else {
        const cid = (await countyMap(db)).get(county.toLowerCase());
        if (!cid) return respond({ error: 'Unknown county' }, 404);
        q = q.eq('county_id', cid);
      }
    }
    const { data, error } = await q;
    if (error) return respond({ error: 'Could not load resources' }, 500);
    return respond({ resources: data, count: data?.length ?? 0 });
  }
  if (req.method === 'DELETE') {
    if (!idSchema.safeParse(id).success) return respond({ error: 'A valid resource UUID is required in /county-resources/:id' }, 400);
    const { data, error } = await db.from('county_resources').delete().eq('id', id!).select('id').maybeSingle();
    if (error) return respond({ error: 'Could not delete resource' }, 500);
    return data ? respond({ deleted: true, id: data.id }) : respond({ error: 'Resource not found' }, 404);
  }
  const { body, error: bodyErr } = await readJson(req);
  if (bodyErr) return bodyErr;
  const counties = await countyMap(db);
  if (req.method === 'POST') {
    if (id) return respond({ error: 'Use POST /county-resources' }, 405);
    // Accept one object, an array, or { resources: [...] } for bulk loading (max 1000).
    const list = Array.isArray(body) ? body : (body as { resources?: unknown[] })?.resources ?? [body];
    const parsed = z.array(resourceSchema).min(1).max(1000).safeParse(list);
    if (!parsed.success) return respond({ error: 'Invalid resource fields', details: parsed.error.flatten() }, 400);
    const rows = [];
    for (const [i, r] of parsed.data.entries()) {
      const res = await resolveCounty(db, r, counties);
      if (res.error) return respond({ error: `Item ${i}: ${res.error}` }, 400);
      rows.push(res.row);
    }
    const { data, error } = await db.from('county_resources').insert(rows).select('*');
    if (error) return respond({ error: 'Could not create resources' }, 500);
    return respond({ resources: data, count: data.length }, 201);
  }
  if (!idSchema.safeParse(id).success) return respond({ error: 'A valid resource UUID is required in /county-resources/:id' }, 400);
  const parsed = resourceUpdateSchema.safeParse(body);
  if (!parsed.success) return respond({ error: 'Invalid resource fields', details: parsed.error.flatten() }, 400);
  const res = await resolveCounty(db, parsed.data, counties);
  if (res.error) return respond({ error: res.error }, 400);
  const { data, error } = await db.from('county_resources').update(res.row).eq('id', id!).select('*').maybeSingle();
  if (error) return respond({ error: 'Could not update resource' }, 500);
  return data ? respond({ resource: data }) : respond({ error: 'Resource not found' }, 404);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const secret = Deno.env.get('MUSE_API_TOKEN_ARKANSAS');
    if (!secret) return respond({ error: 'API is not configured' }, 503);
    if (!(await validBearer(req.headers.get('Authorization'), secret))) return respond({ error: 'Unauthorized' }, 401);
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) return respond({ error: 'Method not allowed' }, 405);
    const url = new URL(req.url);
    const suffix = url.pathname.split('/muse-admin-arkansas')[1] ?? '';
    const databaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!databaseUrl || !serviceKey) return respond({ error: 'API is not configured' }, 503);
    const db = createClient(databaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'arkansas' } });

    if (/^\/counties\/?$/.test(suffix)) {
      if (req.method !== 'GET') return respond({ error: 'Counties are read-only' }, 405);
      const rows = await fetchAll(db, 'counties', 'name');
      return rows ? respond({ counties: rows, count: rows.length }) : respond({ error: 'Could not load counties' }, 500);
    }
    const resMatch = /^\/county-resources(?:\/([^/]+))?\/?$/.exec(suffix);
    if (resMatch) return await handleResources(req, db, url, resMatch[1]);

    const match = /^\/?(?:listings)?\/?$/.test(suffix);
    const idMatch = /^\/listings\/([^/]+)\/?$/.exec(suffix);
    if (!match && !idMatch) return respond({ error: 'Not found' }, 404);

    if (req.method === 'DELETE') {
      const parsedId = idSchema.safeParse(idMatch?.[1]);
      if (!parsedId.success) return respond({ error: 'A valid listing UUID is required in /listings/:id' }, 400);
      const { data, error } = await db.from('listings').delete().eq('id', parsedId.data).select('id').maybeSingle();
      if (error) return respond({ error: 'Could not delete listing' }, 500);
      if (!data) return respond({ error: 'Listing not found' }, 404);
      return respond({ deleted: true, id: data.id });
    }
    if (req.method === 'GET') {
      if (idMatch) return respond({ error: 'Use GET /listings' }, 405);
      const listings = await fetchAll(db, 'listings', 'id');
      return listings ? respond({ listings, count: listings.length }) : respond({ error: 'Could not load listings' }, 500);
    }
    if (req.method === 'POST' && idMatch) return respond({ error: 'Use POST /listings' }, 405);
    const id = idMatch?.[1] ?? url.searchParams.get('id');
    if (req.method === 'PATCH' && !idSchema.safeParse(id).success) return respond({ error: 'A valid listing UUID is required' }, 400);
    const { body, error: bodyErr } = await readJson(req);
    if (bodyErr) return bodyErr;
    const parsed = (req.method === 'POST' ? listingSchema : updateSchema).safeParse(body);
    if (!parsed.success) return respond({ error: 'Invalid listing fields', details: parsed.error.flatten() }, 400);
    if (req.method === 'POST') {
      const { data, error } = await db.from('listings').insert(parsed.data).select('*').single();
      if (error) return respond({ error: 'Could not create listing' }, 500);
      return respond({ listing: data }, 201);
    }
    const { data, error } = await db.from('listings').update(parsed.data).eq('id', id).select('*').maybeSingle();
    if (error) return respond({ error: 'Could not update listing' }, 500);
    if (!data) return respond({ error: 'Listing not found' }, 404);
    return respond({ listing: data });
  } catch {
    return respond({ error: 'Internal server error' }, 500);
  }
});
