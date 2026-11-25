import { describe, it, expect } from 'vitest';
import { listingTags, matchesQuery, normCounty, countyLabel, REGIONS, regionForCounty } from '@/lib/arkansas';

const base: any = { category: [], city: 'Little Rock', county: 'Pulaski', zipCode: '72201', address: '', name: 'Hope House' };

describe('directory filters', () => {
  it('tags "Sober Living" category as sober living', () => {
    expect(listingTags({ ...base, category: ['Sober Living'] }).has('sober')).toBe(true);
  });
  it('counts Medicaid acceptance as "takes Medicaid"', () => {
    expect(listingTags({ ...base, acceptsMedicaid: true }).has('medicaid')).toBe(true);
    expect(listingTags(base).has('medicaid')).toBe(false);
  });
  it('matches by county name and by ZIP', () => {
    expect(matchesQuery(base, 'Pulaski County')).toBe(true);
    expect(matchesQuery(base, '72201')).toBe(true);
    expect(matchesQuery(base, 'Fayetteville')).toBe(false);
    expect(normCounty('Pulaski County')).toBe('pulaski');
  });
});

describe('county labels', () => {
  it('never renders a doubled "County County"', () => {
    expect(countyLabel('Pulaski')).toBe('Pulaski County');
    expect(countyLabel('Pulaski County')).toBe('Pulaski County');
    expect(countyLabel('St. Francis')).toBe('St. Francis County');
    expect(countyLabel('Hot Spring')).toBe('Hot Spring County');
  });
});

describe('regions', () => {
  it('covers all 75 counties exactly once', () => {
    const all = REGIONS.flatMap((r) => r.counties);
    expect(all.length).toBe(75);
    expect(new Set(all.map((c) => c.toLowerCase())).size).toBe(75);
  });
  it('places anchor counties in their regions', () => {
    expect(regionForCounty('Pulaski')).toBe('central');
    expect(regionForCounty('Washington')).toBe('northwest');
    expect(regionForCounty('Craighead')).toBe('northeast');
    expect(regionForCounty('Crittenden')).toBe('southeast');
    expect(regionForCounty('Garland')).toBe('southwest');
    expect(regionForCounty('Faulkner')).toBe('north-central');
  });
});
