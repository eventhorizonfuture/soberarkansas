import { useEffect } from 'react';
import type { SoberLivingHome } from '@/data/listings';

const SITE_NAME = 'Arkansas Recovery Resource Center';
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

interface CityPageSeoConfig {
  city: string;
  slug: string;
  county?: string;
  listings: SoberLivingHome[];
}

export function useCityPageSeo({ city, slug, county, listings }: CityPageSeoConfig) {
  useEffect(() => {
    const regionLabel = county ? `${city} and ${county}` : city;
    const title = `Sober Living in ${city}, PA — Recovery Housing | ${SITE_NAME}`;
    const description = `Browse ${listings.length > 0 ? listings.length : ''} sober living homes and recovery housing in ${regionLabel}, Arkansas. Find structured, substance-free housing with the SoberArkansas directory.`.replace('  ', ' ');
    const canonicalUrl = `${BASE_URL}/${slug}`;

    const prevTitle = document.title;
    document.title = title;

    setOrRemoveMeta('description', description);
    setCanonical(canonicalUrl);

    setOrRemoveMeta('og:title', title, true);
    setOrRemoveMeta('og:description', description, true);
    setOrRemoveMeta('og:url', canonicalUrl, true);
    setOrRemoveMeta('og:type', 'website', true);

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Sober Living Homes in ${city}, Arkansas`,
      description: `Recovery housing directory for the ${regionLabel} area.`,
      url: canonicalUrl,
      numberOfItems: listings.length,
    };

    if (listings.length > 0) {
      jsonLd.itemListElement = listings.map((l, i) => {
        const item: Record<string, any> = {
          '@type': 'ListItem',
          position: i + 1,
          url: `${BASE_URL}/listing/${l.id}`,
          name: l.name,
        };
        return item;
      });
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'city-page-jsonld';
    script.textContent = JSON.stringify(jsonLd);
    document.getElementById('city-page-jsonld')?.remove();
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      ['description', 'og:title', 'og:description', 'og:url', 'og:type'].forEach(name => {
        const isProperty = name.startsWith('og:');
        const attr = isProperty ? 'property' : 'name';
        document.querySelector(`meta[${attr}="${name}"]`)?.remove();
      });
      document.querySelector('link[rel="canonical"]')?.remove();
      document.getElementById('city-page-jsonld')?.remove();
    };
  }, [city, slug, county, listings]);
}
