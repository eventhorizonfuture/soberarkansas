/**
 * Geocoding utility with retries, multiple strategies, and rate-limit handling.
 * Validates results fall within Arkansas boundaries for accuracy.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

interface GeoResult {
  lat: number;
  lng: number;
}

// Arkansas bounding box (with small buffer)
const ARKANSAS_BOUNDS = {
  minLat: 33.00,
  maxLat: 36.50,
  minLng: -94.62,
  maxLng: -89.64,
};

function isInArkansas(lat: number, lng: number): boolean {
  return (
    lat >= ARKANSAS_BOUNDS.minLat &&
    lat <= ARKANSAS_BOUNDS.maxLat &&
    lng >= ARKANSAS_BOUNDS.minLng &&
    lng <= ARKANSAS_BOUNDS.maxLng
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchGeo(url: string): Promise<GeoResult | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SoberArkansasDirectory/1.0' },
  });

  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!res.ok) return null;

  const data = await res.json();
  if (data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    // Validate the result is actually in Arkansas
    if (!isInArkansas(lat, lng)) {
      console.warn(`Geocode result (${lat}, ${lng}) is outside Arkansas, discarding`);
      return null;
    }
    return { lat, lng };
  }
  return null;
}

/** Strategy 1: Structured search with street, city, zip, state */
async function structuredSearch(address: string, city: string, zipCode?: string): Promise<GeoResult | null> {
  const params = new URLSearchParams({
    format: 'json',
    street: address,
    city,
    state: 'Arkansas',
    country: 'US',
    limit: '1',
    addressdetails: '1',
  });
  if (zipCode) params.set('postalcode', zipCode);
  return fetchGeo(`${NOMINATIM_BASE}?${params.toString()}`);
}

/** Strategy 2: Structured with state abbreviation (some addresses geocode better with "AR") */
async function structuredSearchAbbrev(address: string, city: string, zipCode?: string): Promise<GeoResult | null> {
  const params = new URLSearchParams({
    format: 'json',
    street: address,
    city,
    state: 'AR',
    country: 'US',
    limit: '1',
    addressdetails: '1',
  });
  if (zipCode) params.set('postalcode', zipCode);
  return fetchGeo(`${NOMINATIM_BASE}?${params.toString()}`);
}

/** Strategy 3: Free-form query with full address string */
async function freeformSearch(address: string, city: string, zipCode?: string): Promise<GeoResult | null> {
  const q = `${address}, ${city}, AR${zipCode ? ' ' + zipCode : ''}, USA`;
  const params = new URLSearchParams({ format: 'json', q, limit: '1' });
  return fetchGeo(`${NOMINATIM_BASE}?${params.toString()}`);
}

/** Strategy 4: Simplified address (remove suite/unit numbers) */
async function simplifiedSearch(address: string, city: string, zipCode?: string): Promise<GeoResult | null> {
  const simplified = address
    .replace(/\b(suite|ste|unit|apt|#|building|bldg|floor|fl)\b\.?\s*\S*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (simplified === address || !simplified) return null;
  // Try structured first with simplified address
  const structured = await structuredSearch(simplified, city, zipCode);
  if (structured) return structured;
  return freeformSearch(simplified, city, zipCode);
}

/** Strategy 5: Zip code + city (more precise than city-only) */
async function zipCitySearch(address: string, city: string, zipCode?: string): Promise<GeoResult | null> {
  if (!zipCode) return null;
  const params = new URLSearchParams({
    format: 'json',
    city,
    state: 'Arkansas',
    country: 'US',
    postalcode: zipCode,
    limit: '1',
  });
  return fetchGeo(`${NOMINATIM_BASE}?${params.toString()}`);
}

/** Strategy 6: City-only fallback (least precise) */
async function cityOnlySearch(city: string): Promise<GeoResult | null> {
  const params = new URLSearchParams({
    format: 'json',
    city,
    state: 'Arkansas',
    country: 'US',
    limit: '1',
  });
  return fetchGeo(`${NOMINATIM_BASE}?${params.toString()}`);
}

type StrategyFn = (address: string, city: string, zipCode?: string) => Promise<GeoResult | null>;

const STRATEGIES: { name: string; fn: StrategyFn; cityOnly?: boolean }[] = [
  { name: 'structured', fn: structuredSearch },
  { name: 'structured-abbrev', fn: structuredSearchAbbrev },
  { name: 'freeform', fn: freeformSearch },
  { name: 'simplified', fn: simplifiedSearch },
  { name: 'zip-city', fn: zipCitySearch },
  { name: 'city-only', fn: cityOnlySearch as StrategyFn, cityOnly: true },
];

export interface GeocodeResult {
  coords: GeoResult | null;
  strategy: string;
  attempts: number;
}

/**
 * Geocode an address using multiple strategies with retries and rate-limit backoff.
 * Validates all results are within Arkansas boundaries.
 * Respects Nominatim's 1 req/sec policy.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  zipCode?: string,
  maxRetries = 2,
): Promise<GeocodeResult> {
  let totalAttempts = 0;

  for (const { name, fn, cityOnly } of STRATEGIES) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      totalAttempts++;
      try {
        // Respect rate limit
        await sleep(1100);

        let result: GeoResult | null;
        if (cityOnly) {
          result = await fn(city, city, zipCode);
        } else {
          result = await fn(address, city, zipCode);
        }

        if (result) {
          return { coords: result, strategy: name, attempts: totalAttempts };
        }
        // No result but no error — try next strategy (don't retry)
        break;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        if (message === 'RATE_LIMITED') {
          const backoff = 2000 * (attempt + 1);
          console.warn(`Rate limited on ${name}, backing off ${backoff}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await sleep(backoff);
          continue;
        }
        if (attempt < maxRetries) {
          await sleep(2000);
          continue;
        }
      }
    }
  }

  return { coords: null, strategy: 'none', attempts: totalAttempts };
}
