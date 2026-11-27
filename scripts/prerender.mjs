// Build-time pre-rendering for search engines, link previews and AI crawlers.
//
// After `vite build`, writes a real HTML file for every public listing and the
// county, treatment and directory pages, with title, description, canonical URL,
// structured data and readable content already in the page. Visitors still get
// the normal React app: React replaces the #root content as soon as it loads.
// Also writes dist/sitemap.xml with every page.
//
// Read-only: uses the public anon key and the public listings_public view and
// counties table. If the database can't be reached, the build still succeeds.
// Privacy: listings whose operator hides the street address carry no street
// address or coordinates here, matching the site.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildListingJsonLd, isoDate } from '../src/lib/seo/listingJsonLd.js';
import { buildChangeFeed, pingIndexNow } from './freshness.mjs';

const DIST = 'dist';
const BASE_URL = 'https://soberarkansas.com';
const SITE = 'Sober Arkansas';

// Keep in sync with src/lib/treatmentTypes.ts
const TYPES = [
  { tag: 'residential', path: '/inpatient-rehab-arkansas', seg: 'inpatient', label: 'Inpatient & Residential Rehab', plural: 'inpatient and residential treatment centers', blurb: 'Live-in treatment with round-the-clock structure, usually for 30 to 90 days.' },
  { tag: 'detox', path: '/detox-centers-arkansas', seg: 'detox', label: 'Detox Centers', plural: 'detox programs', blurb: 'Medically supervised withdrawal management, often the first step before ongoing treatment.' },
  { tag: 'outpatient', path: '/outpatient-rehab-arkansas', seg: 'outpatient', label: 'Outpatient Rehab (IOP & PHP)', plural: 'outpatient programs', blurb: 'Treatment while living at home, from weekly counseling to intensive outpatient (IOP) and partial hospitalization (PHP).' },
  { tag: 'otp', path: '/methadone-clinics-arkansas', seg: 'methadone', label: 'Methadone & Suboxone Clinics (OTP)', plural: 'opioid treatment programs', blurb: 'Licensed opioid treatment programs offering medications such as methadone and buprenorphine.' },
  { tag: 'medicaid', path: '/medicaid-rehab-arkansas', seg: 'medicaid', label: 'Rehab That Takes Medicaid', plural: 'programs that accept Medicaid', blurb: 'Programs listed as accepting Medicaid. Call ahead to confirm coverage for the level of care you need.' },
];
const CITY_PAGES = [
  ['sober-living-little-rock-arkansas', 'Little Rock'], ['sober-living-fort-smith-arkansas', 'Fort Smith'],
  ['sober-living-fayetteville-arkansas', 'Fayetteville'], ['sober-living-jonesboro-arkansas', 'Jonesboro'],
];

function loadEnv() {
  const env = { ...process.env };
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
const fmtPhone = (phone) => { const d = String(phone ?? '').replace(/\D/g, ''); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : phone; };
const fmt = (n) => n.toLocaleString('en-US');
const normCounty = (s) => String(s || '').toLowerCase().replace(/\s+county$/, '').trim();
const cl = (n) => (/\sCounty$/i.test(String(n || '')) ? n : `${n} County`);
const fullUrl = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `https://${u}`);
const hasStreet = (a) => /\d/.test(String(a || ''));

// Mirrors listingTags() in src/lib/arkansas.ts, on raw database columns.
function tags(r) {
  const c = (r.category || []).map((x) => String(x).toLowerCase().replace(/\s+/g, '-'));
  const t = new Set();
  if (c.includes('sober-living') || r.care_transitional_housing) t.add('sober');
  if (c.includes('inpatient') || c.includes('residential') || r.setting_residential || r.setting_inpatient || r.setting_short_term_residential || r.setting_long_term_residential) t.add('residential');
  if (c.includes('outpatient') || r.setting_outpatient || r.setting_intensive_outpatient || r.setting_partial_hospitalization || r.level_iop || r.level_op || r.level_php) t.add('outpatient');
  if (c.includes('detox') || r.detox_available || r.care_detoxification || r.setting_outpatient_detox || r.setting_residential_detox) t.add('detox');
  if (c.includes('otp') || r.otp_available || r.opioid_certified_otp || r.setting_outpatient_methadone) t.add('otp');
  if (r.accepts_medi_cal || r.accepts_medicaid || r.pay_medicaid) t.add('medicaid');
  return t;
}
const isTreatment = (t) => t.has('residential') || t.has('outpatient') || t.has('detox') || t.has('otp');
export function careLabel(t) {
  if (t.has('residential')) return 'Inpatient Rehab';
  if (t.has('detox')) return 'Detox';
  if (t.has('otp')) return 'Opioid Treatment Program';
  if (t.has('outpatient')) return 'Outpatient Treatment';
  if (t.has('sober')) return 'Sober Living Home';
  return 'Recovery Resource';
}

async function fetchAll(env, table, cols) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=${cols}&order=id.asc`, {
      headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`, 'Accept-Profile': 'arkansas', Range: `${from}-${from + 999}` },
    });
    if (!res.ok) throw new Error(`${table} HTTP ${res.status}`);
    const b = await res.json(); rows.push(...b); if (b.length < 1000) break;
  }
  return rows;
}

function setHead(html, { title, description, canonical, image, jsonLd }) {
  const meta = (h, attr, name, content) => {
    const re = new RegExp(`<meta\\s+${attr}="${name}"[^>]*>`, 'i');
    const tag = `<meta ${attr}="${name}" content="${esc(content)}" />`;
    return re.test(h) ? h.replace(re, tag) : h.replace('</head>', `    ${tag}\n</head>`);
  };
  let h = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  for (const [a, n, v] of [['name', 'description', description], ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:url', canonical], ['name', 'twitter:title', title], ['name', 'twitter:description', description]]) h = meta(h, a, n, v);
  if (image) { h = meta(h, 'property', 'og:image', image); h = meta(h, 'name', 'twitter:image', image); }
  h = h.replace(/<link rel="canonical"[^>]*>\s*/i, '').replace('</head>', `    <link rel="canonical" href="${esc(canonical)}" />\n</head>`);
  if (jsonLd) h = h.replace('</head>', `    <script type="application/ld+json" data-prerender>${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n</head>`);
  return h;
}
const STYLE = 'max-width:820px;margin:2rem auto;padding:0 1rem;line-height:1.6';
const setBody = (html, inner) => html.replace(/<div id="root"><\/div>/, `<div id="root"><main style="${STYLE}">${inner}</main></div>`);
const written = [];
function write(route, html) {
  const file = route === '/' ? join(DIST, 'index.html') : join(DIST, `${route.replace(/^\//, '')}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  written.push(route);
}
const link = (l) => `<li><a href="/listing/${l.id}">${esc(l.name)}</a> – ${esc(careLabel(l.t))}, ${esc(l.city || '')}</li>`;
const breadcrumb = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });
const itemList = (name, url, ls) => ({ '@context': 'https://schema.org', '@type': 'ItemList', name, url, numberOfItems: ls.length, itemListElement: ls.slice(0, 100).map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: `${BASE_URL}/listing/${l.id}`, name: l.name })) });

async function main() {
  const tplPath = join(DIST, 'index.html');
  if (!existsSync(tplPath)) throw new Error('dist/index.html missing');
  const tpl = readFileSync(tplPath, 'utf8');
  const env = loadEnv();
  let rows, counties;
  try {
    rows = await fetchAll(env, 'listings_public', '*');
    counties = await fetchAll(env, 'counties', 'id,name,slug,access_line,access_line_label,crisis_line');
  } catch (e) { console.warn(`[prerender] skipped: ${e.message}`); return; }
  if (!rows.length) { console.warn('[prerender] skipped: no listings'); return; }
  for (const r of rows) r.t = tags(r);
  rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  counties.sort((a, b) => a.name.localeCompare(b.name));
  const inCounty = (c) => rows.filter((r) => normCounty(r.county) === normCounty(c.name));
  const treatment = rows.filter((r) => isTreatment(r.t));
  const ACTIVE = TYPES.filter((t) => treatment.some((r) => r.t.has(t.tag))); // skip types with no listings (e.g. no Medicaid data yet)

  // Listing pages
  for (const l of rows) {
    const canonical = `${BASE_URL}/listing/${l.id}`;
    const image = (l.images && l.images[0]) || l.image || '';
    const website = fullUrl(l.website);
    const street = hasStreet(l.address);
    const county = counties.find((c) => normCounty(c.name) === normCounty(l.county));
    const label = careLabel(l.t);
    const title = `${l.name} – ${label} in ${l.city || 'Arkansas'}, AR | ${SITE}`;
    const description = l.description && l.description.trim().length >= 60 ? clip(l.description, 158)
      : clip(`${l.name} offers ${label.toLowerCase()} in ${l.city || 'Arkansas'}, Arkansas${l.t.has('medicaid') ? ' and accepts Medicaid' : ''}. ${l.phone ? `Call ${fmtPhone(l.phone)}` : 'Contact them directly'} for availability and admissions.`, 158);
    // One unified JSON-LD builder, shared with the live page (useListingSeo):
    // address-hidden listings publish city only — no street, no ZIP, no geo.
    const ld = buildListingJsonLd({ ...l, zipcode: l.zip_code }, { baseUrl: BASE_URL, canonical, siteName: SITE });
    const updated = isoDate(l.updated_at);
    const services = [...l.t].map((x) => ({ residential: 'Inpatient / residential', outpatient: 'Outpatient', detox: 'Detox', sober: 'Sober living', otp: 'Medication-assisted (OTP)', 'medicaid': 'Takes Medicaid' }[x])).filter(Boolean);
    const body = `
  <nav><a href="/">${SITE}</a>${county ? ` › <a href="/treatment-centers/${county.slug}">${esc(cl(county.name))}</a>` : ''}</nav>
  <h1>${esc(l.name)}</h1>
  <p>${esc(label)} in ${esc(l.city || '')}${county ? `, ${esc(cl(county.name))}` : ''}, Arkansas</p>
  ${services.length ? `<p>Services: ${esc(services.join(' · '))}</p>` : ''}
  <address>${street ? esc(l.address) + ', ' : ''}${esc(l.city || '')}, AR ${esc(l.zip_code || '')}</address>
  ${l.phone ? `<p>Phone: <a href="tel:${esc(String(l.phone).replace(/[^0-9+]/g, ''))}">${esc(fmtPhone(l.phone))}</a></p>` : ''}
  ${website ? `<p>Website: <a href="${esc(website)}" rel="nofollow noopener">${esc(l.website)}</a></p>` : ''}
  ${l.description ? `<p>${esc(l.description)}</p>` : ''}
  ${updated ? `<p><small>Listing last updated <time datetime="${updated}">${updated}</time>. Call to confirm availability.</small></p>` : ''}
  <p>${county ? `<a href="/treatment-centers/${county.slug}">More treatment in ${esc(cl(county.name))}</a> · ` : ''}<a href="/treatment-centers">All Arkansas treatment centers</a></p>`;
    write(`/listing/${l.id}`, setBody(setHead(tpl, { title, description, canonical, image, jsonLd: ld }), body));
  }

  const typeLinks = (county) => `<ul>${ACTIVE.map((t) => `<li><a href="${county ? `/treatment-centers/${county.slug}/${t.seg}` : t.path}">${esc(t.label)}</a></li>`).join('')}</ul>`;

  // Statewide hub
  {
    const url = `${BASE_URL}/treatment-centers`;
    const title = `Addiction Treatment Centers in Arkansas | ${SITE}`;
    const description = `Find ${fmt(treatment.length)} addiction treatment centers across Arkansas: inpatient rehab, detox, outpatient programs, and methadone clinics, by county.`;
    const body = `<h1>Addiction treatment centers in Arkansas</h1><p>${fmt(treatment.length)} listed programs across all 75 counties.</p>
  <h2>By type of care</h2>${typeLinks()}
  <h2>By county</h2><ul>${counties.map((c) => `<li><a href="/treatment-centers/${c.slug}">${esc(cl(c.name))}</a> (${inCounty(c).filter((r) => isTreatment(r.t)).length})</li>`).join('')}</ul>`;
    write('/treatment-centers', setBody(setHead(tpl, { title, description, canonical: url, jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Addiction Treatment Centers in Arkansas', url, description } }), body));
  }

  // County treatment pages and county × type pages
  for (const c of counties) {
    const all = inCounty(c).filter((r) => isTreatment(r.t));
    const url = `${BASE_URL}/treatment-centers/${c.slug}`;
    const mc = all.filter((r) => r.t.has('medicaid')).length;
    const title = `Addiction Treatment Centers in ${cl(c.name)}, AR | ${SITE}`;
    const description = `${fmt(all.length)} treatment center${all.length === 1 ? '' : 's'} in ${cl(c.name)}, Arkansas: inpatient rehab, detox, outpatient, and methadone clinics${mc ? `, ${mc} taking Medicaid` : ''}.`;
    const fmtPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(p || ''); };
    const access = c.access_line ? `<p>${esc(c.access_line_label || 'Arkansas DHS access line')}: <a href="tel:${esc(c.access_line.replace(/[^0-9+]/g, ''))}">${esc(fmtPhone(c.access_line))}</a>${c.crisis_line ? ` · Crisis line: <a href="tel:${esc(c.crisis_line.replace(/[^0-9+]/g, ''))}">${esc(fmtPhone(c.crisis_line))}</a>` : ''}</p>` : '';
    const sections = ACTIVE.filter((t) => t.tag !== 'medicaid').map((t) => { const ls = all.filter((r) => r.t.has(t.tag)); return ls.length ? `<h2>${esc(t.label)} (${ls.length})</h2><ul>${ls.map(link).join('')}</ul>` : ''; }).join('');
    const body = `<nav><a href="/">${SITE}</a> › <a href="/treatment-centers">Treatment centers</a></nav><h1>Addiction treatment centers in ${esc(cl(c.name))}</h1><p>${fmt(all.length)} programs${mc ? ` · ${mc} take Medicaid` : ''}.</p>${access}${typeLinks(c)}${sections}<p><a href="/counties/${c.slug}">Sober living homes in ${esc(cl(c.name))}</a></p>`;
    write(`/treatment-centers/${c.slug}`, setBody(setHead(tpl, { title, description, canonical: url, jsonLd: [itemList(`Treatment centers in ${cl(c.name)}`, url, all), breadcrumb([[SITE, BASE_URL], ['Treatment centers', `${BASE_URL}/treatment-centers`], [`${cl(c.name)}`, url]])] }), body));
    for (const t of ACTIVE) {
      const ls = all.filter((r) => r.t.has(t.tag));
      if (!ls.length) continue; // empty combinations aren't linked or listed in the sitemap
      const u = `${url}/${t.seg}`;
      const ttl = `${t.label} in ${cl(c.name)}, AR | ${SITE}`;
      const d = clip(`${fmt(ls.length)} ${ls.length === 1 ? t.plural.replace(/s$/, '') : t.plural} in ${cl(c.name)}, Arkansas. ${t.blurb}`, 158);
      const b = `<nav><a href="/">${SITE}</a> › <a href="/treatment-centers/${c.slug}">${esc(cl(c.name))}</a></nav><h1>${esc(t.label)} in ${esc(cl(c.name))}</h1><p>${fmt(ls.length)} programs. ${esc(t.blurb)}</p>${access}<ul>${ls.map(link).join('')}</ul><p><a href="${t.path}">${esc(t.label)} across Arkansas</a></p>`;
      write(`/treatment-centers/${c.slug}/${t.seg}`, setBody(setHead(tpl, { title: ttl, description: d, canonical: u, jsonLd: [itemList(`${t.label} in ${cl(c.name)}`, u, ls), breadcrumb([[SITE, BASE_URL], [`${cl(c.name)}`, url], [t.label, u]])] }), b));
    }
    // County guide (sober living + treatment)
    const sober = inCounty(c).filter((r) => r.t.has('sober'));
    const cu = `${BASE_URL}/counties/${c.slug}`;
    write(`/counties/${c.slug}`, setBody(setHead(tpl, {
      title: `Recovery Resources in ${cl(c.name)} | ${SITE}`,
      description: `${all.length} treatment centers and ${sober.length} sober living homes in ${cl(c.name)}, Arkansas.`, canonical: cu,
    }), `<h1>Recovery resources in ${esc(cl(c.name))}</h1><p>${all.length} treatment centers · ${sober.length} sober living homes</p><p><a href="/treatment-centers/${c.slug}">Treatment centers in ${esc(cl(c.name))}</a></p><h2>Sober living homes</h2><ul>${sober.map(link).join('')}</ul>`));
  }

  // Statewide type pages
  for (const t of ACTIVE) {
    const ls = treatment.filter((r) => r.t.has(t.tag));
    const url = `${BASE_URL}${t.path}`;
    const per = counties.map((c) => ({ c, n: inCounty(c).filter((r) => isTreatment(r.t) && r.t.has(t.tag)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    const body = `<nav><a href="/">${SITE}</a> › <a href="/treatment-centers">Treatment centers</a></nav><h1>${esc(t.label)} in Arkansas</h1><p>${fmt(ls.length)} programs in ${per.length} counties. ${esc(t.blurb)}</p><ul>${per.map(({ c, n }) => `<li><a href="/treatment-centers/${c.slug}/${t.seg}">${esc(cl(c.name))}</a> (${n})</li>`).join('')}</ul>`;
    write(t.path, setBody(setHead(tpl, { title: `${t.label} in Arkansas | ${SITE}`, description: clip(`${fmt(ls.length)} ${t.plural} across Arkansas, by county. ${t.blurb}`, 158), canonical: url, jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${t.label} in Arkansas`, url } }), body));
  }

  // City pages (sober living)
  for (const [slug, city] of CITY_PAGES) {
    const ls = rows.filter((r) => String(r.city || '').trim().toLowerCase() === city.toLowerCase() && r.t.has('sober'));
    write(`/${slug}`, setBody(setHead(tpl, { title: `Sober Living in ${city}, AR — Recovery Housing | ${SITE}`, description: `Browse ${ls.length} sober living homes and recovery housing in ${city}, Arkansas.`, canonical: `${BASE_URL}/${slug}` }), `<h1>Sober living in ${esc(city)}, Arkansas</h1><p>${ls.length} homes.</p><ul>${ls.map(link).join('')}</ul>`));
  }

  // For AI Assistants page (static summary; the React page carries the full guide)
  {
    const url = `${BASE_URL}/agents`;
    const body = `<nav><a href="/">${SITE}</a> › For AI Assistants</nav>
  <h1>Search Sober Arkansas from your AI assistant</h1>
  <p>${SITE} is a free directory of ${fmt(rows.length)} recovery listings across all 75 Arkansas counties: sober living homes, residential and outpatient treatment, detox, and opioid treatment programs. AI assistants and developers can search this directory directly through the MCP server or the public API. The data is read-only, public, and free to use. No API key is required.</p>
  <h2>Connect with MCP</h2>
  <p>MCP server (name: arkansassober-com): <a href="https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/mcp-arkansas">https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/mcp-arkansas</a></p>
  <ul><li>search_facilities: search listings by city, county, ZIP code, part of a facility name, or care type (sober-living, residential, outpatient, detox, otp, medicaid).</li><li>get_facility_by_id: full public details for one listing by its id.</li><li>get_county_resources: counselor resources and crisis lines for one county, or statewide.</li></ul>
  <h2>Use the REST API</h2>
  <p>Base address: <a href="https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/agent-api-arkansas">https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/agent-api-arkansas</a></p>
  <ul><li>GET /listings: search with q, city, county, zip, care_type, limit, offset, and format (json or md).</li><li>GET /listings/{id}: one listing by id.</li><li>GET /county-resources: counselor resources for one county, or statewide.</li><li>GET /openapi.json: the OpenAPI description of the API.</li><li>GET /llms-full.txt: the entire directory as one markdown file, grouped by city.</li></ul>
  <p>Example: <a href="https://rghzzqakptptmhsujdwd.supabase.co/functions/v1/agent-api-arkansas/listings?city=Little Rock&amp;care_type=sober-living">sober living in Little Rock</a></p>
  <h2>How to cite listings</h2>
  <ul><li>Link to the listing's page on soberarkansas.com (each result includes its url) and credit SoberArkansas.com.</li><li>Use the listing's own data. Do not add details the listing does not state, such as pricing or openings.</li><li>If you say when the information was last checked, use the listing's updated_at stamp.</li><li>Tell people to call the facility to confirm availability. Beds and openings change daily.</li></ul>
  <p>The llms.txt index for this directory: <a href="/llms.txt">soberarkansas.com/llms.txt</a>. Corrections and questions: ContactSoberOhio@gmail.com.</p>`;
    write('/agents', setBody(setHead(tpl, {
      title: `For AI Assistants | ${SITE}`,
      description: `How AI assistants and developers can search ${SITE}'s directory of sober living homes and treatment centers through the MCP server and public API, and how to cite listings.`,
      canonical: url,
    }), body));
  }

  // Sitemap: everything already listed plus every page written here.
  let urls = new Set();
  if (existsSync(join(DIST, 'sitemap.xml'))) for (const m of readFileSync(join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1].trim());
  const live = new Set(rows.map((r) => `${BASE_URL}/listing/${r.id}`));
  urls = new Set([...urls].filter((u) => !u.includes('/listing/') || live.has(u))); // drop deleted listings
  for (const r of written) urls.add(`${BASE_URL}${r === '/' ? '/' : r}`);
  // lastmod: a listing's real last-updated date; other pages carry none rather
  // than a fake "today" on every build.
  const lastmod = new Map(rows.map((r) => [`${BASE_URL}/listing/${r.id}`, isoDate(r.updated_at)]));
  const entry = (u) => `  <url><loc>${esc(u)}</loc>${lastmod.get(u) ? `<lastmod>${lastmod.get(u)}</lastmod>` : ''}</url>`;
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].sort().map(entry).join('\n')}\n</urlset>\n`);

  // Freshness: change feed (same deploy as the pages it links to) and IndexNow ping.
  const host = new URL(BASE_URL).host;
  writeFileSync(join(DIST, 'changes.xml'), buildChangeFeed(rows, { baseUrl: BASE_URL, siteName: SITE, host }));
  const ping = await pingIndexNow(rows, { baseUrl: BASE_URL, host });
  console.log(`[prerender] IndexNow: ${JSON.stringify(ping)}`);
  console.log(`[prerender] wrote ${written.length} pages (${rows.length} listings); sitemap ${urls.size} URLs.`);
}

main().catch((e) => console.warn(`[prerender] skipped after error: ${e.message}`));
