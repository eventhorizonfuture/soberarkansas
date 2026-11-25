// Structured data (JSON-LD) for one listing page. Shared by the build-time
// prerender (scripts/prerender.mjs) and the live page (useListingSeo), so the
// two can never disagree. Plain JS so Node can import it without a build step.
//
// Accuracy rules (Jason's standard):
// - Only fields that are on the visible page and in the listing row. Nothing invented:
//   no ratings, hours, prices, availability.
// - No street address on the listing → no street and no coordinates in the data,
//   because coordinates would reveal what the operator chose not to publish.
// - image only when it looks like a real photo (never SVG, logo, or icon files).
//
// Shape: an ItemPage (our page) whose mainEntity is the facility. The facility's
// own website goes in `url`; our page is the `@id` / `mainEntityOfPage`.

const TITLE = (s) => String(s ?? '').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()).trim();
const fullUrl = (u) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `https://${u}`);

// Type per level of care (highest level wins, same order as the map pins):
//   inpatient / detox → MedicalOrganization  (schema.org/MedicalOrganization)
//   outpatient         → MedicalClinic        (schema.org/MedicalClinic)
//   sober living only  → Organization         (not a medical provider; LodgingBusiness would imply a hotel)
export function listingSchemaType(category = []) {
  if (category.includes('inpatient') || category.includes('detox')) return 'MedicalOrganization';
  if (category.includes('outpatient')) return 'MedicalClinic';
  return 'Organization';
}

// Street and ZIP split the same way the listing page displays them.
export function splitAddress(address = '', zipcode = '') {
  const a = String(address ?? '').trim();
  const m = a.match(/\s(\d{5}(?:-\d{4})?)$/);
  return {
    street: m ? a.replace(/\s\d{5}(?:-\d{4})?$/, '').replace(/,\s*$/, '').trim() : a,
    zip: String(zipcode || (m ? m[1] : '') || '').trim(),
  };
}

export function isLikelyPhoto(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false;
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.svg') || path.endsWith('.ico')) return false;
  if (/(^|[\/_\-.])(logo|icon|favicon|badge|certificate|seal|infographic)([\/_\-.]|$)/.test(path)) return false;
  return true;
}

// YYYY-MM-DD from an ISO timestamp, or '' if missing/invalid.
export function isoDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/**
 * @param {object} l listing row: name, city, address, zipcode, phone, website, description,
 *   category[], image, images[], lat, lng, updated_at
 * @param {{ baseUrl: string, canonical: string, siteName: string, directoryPath?: string, state?: string, breadcrumb?: boolean }} opts
 */
export function buildListingJsonLd(l, opts) {
  const { baseUrl, canonical, siteName, directoryPath = '/arkansas-directory', state = 'AR', breadcrumb = true } = opts;
  const facilityId = `${canonical}#facility`;
  const { street, zip } = splitAddress(l.address, l.zipcode);
  const city = TITLE(l.city);
  // Some rows store only a city-level address ("Cleveland, OH 44105"): once the
  // ZIP is stripped, the "street" is just the city and state. That is not a
  // street, so those listings publish city/region/country only — no
  // streetAddress, no postalCode, and no geo (their lat/lng are a city
  // centroid, not the facility's location).
  const cityState = /^([^,\d]+),\s*[A-Za-z]{2}$/.exec(street);
  const hasStreet = Boolean(street)
    && !(cityState && (!city || cityState[1].trim().toLowerCase() === city.toLowerCase()));
  const website = fullUrl(l.website);
  const photo = [...(l.images || []), l.image].find(isLikelyPhoto);
  const modified = isoDate(l.updated_at);

  const facility = {
    '@type': listingSchemaType(l.category || []),
    '@id': facilityId,
    name: l.name,
    ...(website ? { url: website } : {}),
    ...(l.phone ? { telephone: l.phone } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(hasStreet ? { streetAddress: street } : {}),
      ...(city ? { addressLocality: city } : {}),
      addressRegion: state,
      ...(hasStreet && zip ? { postalCode: zip } : {}),
      addressCountry: 'US',
    },
    ...(hasStreet && l.lat && l.lng
      ? { geo: { '@type': 'GeoCoordinates', latitude: Number(l.lat), longitude: Number(l.lng) } }
      : {}),
    ...(l.description ? { description: String(l.description).replace(/\s+/g, ' ').trim().slice(0, 500) } : {}),
    ...(photo ? { image: photo } : {}),
    mainEntityOfPage: canonical,
  };

  const page = {
    '@type': 'ItemPage',
    '@id': canonical,
    url: canonical,
    name: `${l.name} – ${city}, ${state}`,
    isPartOf: { '@type': 'WebSite', '@id': `${baseUrl}/#website`, name: siteName, url: baseUrl },
    mainEntity: { '@id': facilityId },
    ...(modified ? { dateModified: modified } : {}),
  };
  // The live page adds its own BreadcrumbList (useBreadcrumbSchema), so it passes breadcrumb: false.
  if (breadcrumb) page.breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Directory', item: `${baseUrl}${directoryPath}` },
      { '@type': 'ListItem', position: 3, name: l.name, item: canonical },
    ],
  };

  return { '@context': 'https://schema.org', '@graph': [page, facility] };
}

/**
 * Homepage structured data: the directory itself (WebSite + Organization).
 * @param {{ baseUrl: string, siteName: string, description: string, stateName: string }} opts
 */
export function buildSiteJsonLd({ baseUrl, siteName, description, stateName }) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: siteName,
        url: baseUrl,
        description,
        inLanguage: 'en-US',
        publisher: { '@id': `${baseUrl}/#organization` },
        // No SearchAction: Google retired the sitelinks search box, and its
        // "query-input" property isn't part of schema.org.
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: siteName,
        url: baseUrl,
        description: `Free directory of sober living homes, inpatient treatment, and outpatient recovery programs in ${stateName}.`,
        areaServed: { '@type': 'State', name: stateName },
        subjectOf: { '@type': 'WebPage', name: 'For AI Assistants', url: `${baseUrl}/agents` },
      },
    ],
  };
}
