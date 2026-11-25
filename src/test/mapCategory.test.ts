import { describe, expect, it } from 'vitest';
import { listingMapCategory } from '@/lib/arkansas';

describe('map category priority', () => {
  it('prioritizes inpatient over outpatient and sober living regardless of order', () => {
    expect(listingMapCategory({ category: ['Sober Living', 'Outpatient', 'Inpatient'] })).toBe('inpatient');
    expect(listingMapCategory({ category: ['Residential', 'Outpatient'] })).toBe('inpatient');
  });
  it('prioritizes outpatient over sober living', () => {
    expect(listingMapCategory({ category: ['Sober Living', 'Outpatient'] })).toBe('outpatient');
    expect(listingMapCategory({ category: ['Outpatient', 'Sober Living'] })).toBe('outpatient');
  });
  it('uses the sober living category when no higher category is present', () => {
    expect(listingMapCategory({ category: ['Sober Living'] })).toBe('sober');
  });
});