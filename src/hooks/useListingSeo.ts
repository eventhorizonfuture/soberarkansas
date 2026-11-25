import { listingTags } from '@/lib/arkansas';
import { useEffect } from 'react';
import type { SoberLivingHome } from '@/data/listings';
import { buildListingJsonLd } from '@/lib/seo/listingJsonLd';

const SITE_NAME = 'Sober Arkansas';
const BASE_URL = 'https://soberarkansas.com';

function setOrRemoveMeta(name: string, content: string | undefined, property = false) {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

export function useListingSeo(listing: SoberLivingHome | undefined) {
  useEffect(() => {
    if (!listing) return;

    // Keep in sync with scripts/prerender.mjs (careLabel / listingTitle / listingDescription).
    const tags = listingTags(listing);
    const careLabel = tags.has('residential') ? 'Inpatient Rehab'
      : tags.has('detox') ? 'Detox'
      : tags.has('otp') ? 'Opioid Treatment Program'
      : tags.has('outpatient') ? 'Outpatient Treatment'
      : tags.has('sober') ? 'Sober Living Home' : 'Recovery Resource';
    const cityName = (listing.city || '').trim();
    const clip = (s: string, n: number) => {
      const t = s.replace(/\s+/g, ' ').trim();
      return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
    };
    const title = `${listing.name} – ${careLabel} in ${cityName}, AR | ${SITE_NAME}`;
    const description = listing.description && listing.description.trim().length >= 60
      ? clip(listing.description, 158)
      : clip(`${listing.name} offers ${careLabel.toLowerCase()} in ${cityName}, Arkansas${tags.has('medicaid') ? ' and accepts Medicaid' : ''}. ${listing.phone ? `Call ${listing.phone}` : 'Contact them directly'} for availability and admissions.`, 158);
    const canonicalUrl = `${BASE_URL}/listing/${listing.id}`;
    const imageUrl = listing.images?.[0] || listing.image || undefined;

    const prevTitle = document.title;
    document.title = title;

    setOrRemoveMeta('description', description);
    setCanonical(canonicalUrl);

    setOrRemoveMeta('og:title', title, true);
    setOrRemoveMeta('og:description', description, true);
    setOrRemoveMeta('og:image', imageUrl, true);
    setOrRemoveMeta('og:url', canonicalUrl, true);
    setOrRemoveMeta('og:type', 'business.business', true);

    // JSON-LD — same builder as the build-time prerender, so both match.
    // Address-hidden listings publish city only: no street, no ZIP, no geo.
    const jsonLd = buildListingJsonLd(
      { ...listing, zipcode: listing.zipCode, updated_at: listing.updatedAt },
      { baseUrl: BASE_URL, canonical: canonicalUrl, siteName: SITE_NAME },
    );

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'listing-jsonld';
    script.textContent = JSON.stringify(jsonLd);
    document.getElementById('listing-jsonld')?.remove();
    document.querySelectorAll('script[data-prerender]').forEach((el) => el.remove());
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      ['description', 'og:title', 'og:description', 'og:image', 'og:url', 'og:type'].forEach(name => {
        const isProperty = name.startsWith('og:');
        const attr = isProperty ? 'property' : 'name';
        document.querySelector(`meta[${attr}="${name}"]`)?.remove();
      });
      document.querySelector('link[rel="canonical"]')?.remove();
      document.getElementById('listing-jsonld')?.remove();
    };
  }, [listing]);
}
