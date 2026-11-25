import type { SoberLivingHome } from '@/data/listings';

export type DirFilter = 'residential' | 'outpatient' | 'detox' | 'sober' | 'otp' | 'medicaid';

export const DIR_FILTERS: { key: DirFilter; label: string }[] = [
  { key: 'residential', label: 'Inpatient / Residential' },
  { key: 'outpatient', label: 'Outpatient' },
  { key: 'detox', label: 'Detox' },
  { key: 'sober', label: 'Sober Living' },
  { key: 'otp', label: 'Medication-Assisted (OTP)' },
  { key: 'medicaid', label: 'Takes Medicaid' },
];

export const RESOURCE_CATEGORIES = ['Assessment', 'Crisis', 'Meetings', 'Housing', 'Legal', 'Family Support', 'Forms', 'Other'] as const;

const cats = (l: SoberLivingHome) => (l.category || []).map((c: string) => c.toLowerCase().replace(/\s+/g, '-'));

export type MapCategory = 'inpatient' | 'outpatient' | 'sober';

/** Map colors follow category priority, independently of gender and directory filters. */
export function listingMapCategory(l: Pick<SoberLivingHome, 'category'>): MapCategory {
  const categories = (l.category || []).map((c) => c.trim().toLowerCase().replace(/\s+/g, '-'));
  if (categories.includes('inpatient') || categories.includes('residential')) return 'inpatient';
  if (categories.includes('outpatient')) return 'outpatient';
  return 'sober';
}

/** Which directory filters a listing satisfies. Uses category tags plus detailed service flags. */
export function listingTags(l: SoberLivingHome): Set<DirFilter> {
  const c = cats(l);
  const t = new Set<DirFilter>();
  if (c.includes('sober-living') || l.careTransitionalHousing) t.add('sober');
  if (c.includes('inpatient') || c.includes('residential') || l.settingResidential || l.settingInpatient || l.settingShortTermResidential || l.settingLongTermResidential) t.add('residential');
  if (c.includes('outpatient') || l.settingOutpatient || l.settingIntensiveOutpatient || l.settingPartialHospitalization || l.levelIop || l.levelOp || l.levelPhp) t.add('outpatient');
  if (c.includes('detox') || l.detoxAvailable || l.careDetoxification || l.settingOutpatientDetox || l.settingResidentialDetox) t.add('detox');
  if (c.includes('otp') || l.otpAvailable || l.opioidCertifiedOtp || l.settingOutpatientMethadone) t.add('otp');
  if (l.acceptsMediCal || l.acceptsMedicaid || l.payMedicaid) t.add('medicaid');
  return t;
}

/** One plain-language label for the main kind of care a listing offers. */
export function careLabel(l: SoberLivingHome): string {
  const t = listingTags(l);
  if (t.has('residential')) return 'Inpatient rehab';
  if (t.has('detox')) return 'Detox';
  if (t.has('otp')) return 'Opioid treatment program';
  if (t.has('outpatient')) return 'Outpatient treatment';
  if (t.has('sober')) return 'Sober living home';
  return 'Recovery resource';
}

export const genderLabel = (g: string) => (g === 'men' ? 'Men only' : g === 'women' ? 'Women only' : 'Men & women');

export const isSoberLiving = (l: SoberLivingHome) => listingTags(l).has('sober');
export const isTreatment = (l: SoberLivingHome) => {
  const t = listingTags(l);
  return t.has('residential') || t.has('outpatient') || t.has('detox') || t.has('otp');
};

export const TAG_LABEL: Record<DirFilter, string> = Object.fromEntries(DIR_FILTERS.map((f) => [f.key, f.label])) as Record<DirFilter, string>;

/** Normalizes a county name for comparison: "Jefferson County" -> "jefferson". */
export const normCounty = (s: string) => (s || '').toLowerCase().replace(/\s+county$/, '').trim();

/**
 * Display label for a county. Arkansas counties are plain county names
 * (there is no independent-city county-equivalent), and any name
 * already ending in "County" carries its
 * suffix, so it passes through unchanged; every other name takes the
 * " County" suffix. Never renders "Pulaski County County".
 */
export const countyLabel = (name: string) => (/\sCounty$/i.test(name || '') ? name : `${name} County`);

/** Free-text match on city, county, ZIP, address, or name. */
export function matchesQuery(l: SoberLivingHome, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [l.city, l.county, l.zipCode, l.address, l.name].join(' ').toLowerCase();
  return hay.includes(s) || normCounty(l.county) === normCounty(s);
}

export const telHref = (phone: string) => `tel:${(phone || '').replace(/[^\d+]/g, '')}`;

/** Display-format a stored 10-digit phone number as 800-555-1234. */
export const fmtPhone = (phone: string) => {
  const d = (phone || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : phone;
};
export const extUrl = (u: string) => (!u ? '' : /^https?:\/\//i.test(u) ? u : `https://${u}`);

/**
 * Arkansas's six directory regions, by county. Used for the homepage
 * "Pick your part of the state" tiles and the ?region= directory filter.
 * County names are normalized with normCounty before lookup. Every one of
 * the 75 counties appears exactly once (verified in arkansas.test.ts).
 */
export interface Region {
  key: 'northwest' | 'north-central' | 'northeast' | 'central' | 'southwest' | 'southeast';
  name: string;
  short: string;
  anchor: string;
  counties: string[];
}

export const REGIONS: Region[] = [
  {
    key: 'northwest', name: 'Northwest Arkansas', short: 'Northwest', anchor: 'Fayetteville, Springdale, and Fort Smith, from the Boston Mountains down to the River Valley, along I-49 and I-40',
    counties: ['Baxter', 'Benton', 'Boone', 'Carroll', 'Crawford', 'Franklin', 'Fulton', 'Johnson', 'Logan', 'Madison', 'Marion', 'Newton', 'Pope', 'Scott', 'Searcy', 'Sebastian', 'Van Buren', 'Washington', 'Yell'],
  },
  {
    key: 'north-central', name: 'North Central Arkansas', short: 'North Central', anchor: 'Conway, Searcy, and Batesville, where the Ozarks level off toward the Delta, along US-65 and US-67',
    counties: ['Cleburne', 'Conway', 'Faulkner', 'Independence', 'Izard', 'Sharp', 'Stone', 'White'],
  },
  {
    key: 'northeast', name: 'Northeast Arkansas', short: 'Northeast', anchor: 'Jonesboro and the Crowley\u2019s Ridge country, along I-555 and US-63 toward the Mississippi',
    counties: ['Clay', 'Craighead', 'Cross', 'Greene', 'Jackson', 'Lawrence', 'Mississippi', 'Poinsett', 'Randolph', 'St. Francis', 'Woodruff'],
  },
  {
    key: 'central', name: 'Central Arkansas', short: 'Central', anchor: 'Little Rock and North Little Rock, where I-30 and I-40 cross at the Arkansas River',
    counties: ['Grant', 'Lonoke', 'Perry', 'Prairie', 'Pulaski', 'Saline'],
  },
  {
    key: 'southwest', name: 'Southwest Arkansas', short: 'Southwest', anchor: 'Hot Springs, Texarkana, and the pine woods, along I-30 and US-67',
    counties: ['Calhoun', 'Clark', 'Columbia', 'Dallas', 'Garland', 'Hempstead', 'Hot Spring', 'Howard', 'Lafayette', 'Little River', 'Miller', 'Montgomery', 'Nevada', 'Ouachita', 'Pike', 'Polk', 'Sevier', 'Union'],
  },
  {
    key: 'southeast', name: 'Southeast Arkansas & the Delta', short: 'Southeast & the Delta', anchor: 'Pine Bluff, West Memphis, and the Delta farm country along the Mississippi, down US-65 and I-55',
    counties: ['Arkansas', 'Ashley', 'Bradley', 'Chicot', 'Cleveland', 'Crittenden', 'Desha', 'Drew', 'Jefferson', 'Lee', 'Lincoln', 'Monroe', 'Phillips'],
  },
];

const REGION_BY_COUNTY = new Map<string, Region['key']>(
  REGIONS.flatMap((d) => d.counties.map((c) => [normCounty(c), d.key] as [string, Region['key']])),
);

export const regionForCounty = (county: string) => REGION_BY_COUNTY.get(normCounty(county));
