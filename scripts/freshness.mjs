// Freshness signals, run at the end of the build (scripts/prerender.mjs):
//   1. /changes.xml — Atom feed of listings that changed in the last 90 days.
//   2. IndexNow — tells Bing and other IndexNow engines which listing URLs
//      changed since the previous production deploy.
//
// Both come from each listing's real updated_at stamp. The database has no
// correction log yet, so the feed says "updated" and cannot list removals;
// it says so in its subtitle rather than implying more than it knows.
// Ported from SoberOhio's PR #5 pattern; Arkansas listing URLs are
// plain /listing/<id> (no slug layer), so listingPath is local here.

export const INDEXNOW_KEY = '1a4a4257dc7ebc2b87a0b2694055d321'; // public by design; served at /1a4a4257dc7ebc2b87a0b2694055d321.txt
export const FEED_DAYS = 90;
const FEED_MAX = 1000;

const listingPath = (l) => `/listing/${l.id}`;

// AbortSignal.timeout exists in Node 18+; fall back to no timeout elsewhere.
const timeout = (ms) => (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined);

const xml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const titleCase = (s) => String(s ?? '').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()).trim();
const validDate = (ts) => {
  const d = new Date(ts);
  return ts && !Number.isNaN(d.getTime()) ? d : null;
};

/** Listings changed after `since`, newest first. */
export function changedSince(listings, since) {
  return listings
    .map((l) => ({ l, d: validDate(l.updated_at) }))
    .filter(({ d }) => d && d > since)
    .sort((a, b) => b.d - a.d);
}

export function buildChangeFeed(listings, { baseUrl, siteName, host, now = new Date() }) {
  const since = new Date(now.getTime() - FEED_DAYS * 864e5);
  const items = changedSince(listings, since).slice(0, FEED_MAX);
  const entries = items.map(({ l, d }) => {
    const url = `${baseUrl}${listingPath(l)}`;
    const iso = d.toISOString();
    return `  <entry>
    <id>tag:${host},${iso.slice(0, 10)}:listing/${xml(l.id)}/${xml(iso)}</id>
    <title>Updated: ${xml(l.name)} (${xml(titleCase(l.city))})</title>
    <link rel="alternate" type="text/html" href="${xml(url)}"/>
    <updated>${iso}</updated>
    <summary>This listing changed on ${iso.slice(0, 10)}. See the listing page for its current details.</summary>
  </entry>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xml(siteName)} – listing changes</title>
  <subtitle>Listings updated in the last ${FEED_DAYS} days, from each listing's last-updated date. Removed listings are not included. Generated when the site is built, so every entry's page is already live.</subtitle>
  <id>${baseUrl}/changes.xml</id>
  <link rel="self" type="application/atom+xml" href="${baseUrl}/changes.xml"/>
  <link rel="alternate" type="text/html" href="${baseUrl}/"/>
  <updated>${now.toISOString()}</updated>
  <author><name>${xml(siteName)}</name><uri>${baseUrl}/</uri></author>
${entries.join('\n')}
</feed>
`;
}

/** Build time of the currently live deploy, read from its /changes.xml. */
export async function previousBuildTime(baseUrl, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${baseUrl}/changes.xml`, { signal: timeout(10000) });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/<feed[\s\S]*?<updated>([^<]+)<\/updated>/);
    return m ? validDate(m[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Ping IndexNow with listing URLs changed since the live deploy was built.
 * Production builds only; never throws (a failed ping must not fail a deploy).
 */
export async function pingIndexNow(listings, { baseUrl, host, env = process.env, fetchImpl = fetch, now = new Date() }) {
  if (env.VERCEL_ENV !== 'production') return { skipped: 'not a production build' };
  const prev = await previousBuildTime(baseUrl, fetchImpl);
  const since = prev ?? new Date(now.getTime() - 864e5); // first run: last 24 hours
  const urls = changedSince(listings, since).map(({ l }) => `${baseUrl}${listingPath(l)}`).slice(0, 10000);
  if (!urls.length) return { sent: 0, since: since.toISOString() };
  try {
    const res = await fetchImpl('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`, urlList: urls }),
      signal: timeout(15000),
    });
    return { sent: urls.length, status: res.status, since: since.toISOString() };
  } catch (e) {
    return { sent: 0, error: e.message };
  }
}
