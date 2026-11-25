import { describe, expect, it } from 'vitest';
import { featuredInquirySchema } from '@/lib/featuredInquiry';

const valid = { facility_name: 'Arkansas Recovery Home', contact_name: 'Test Contact', email: 'contact@example.com', phone: '', city: '', listing_type: '', message: '' };

describe('Get Featured inquiry rules', () => {
  it('requires facility or home name', () => { expect(featuredInquirySchema.safeParse({ ...valid, facility_name: '  ' }).success).toBe(false); });
  it('requires contact name', () => { expect(featuredInquirySchema.safeParse({ ...valid, contact_name: '' }).success).toBe(false); });
  it('requires a valid email', () => {
    expect(featuredInquirySchema.safeParse({ ...valid, email: '' }).success).toBe(false);
    expect(featuredInquirySchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false);
    expect(featuredInquirySchema.safeParse(valid).success).toBe(true);
  });
  it('accepts only Inpatient, Outpatient, Sober living or no listing type', () => {
    for (const listing_type of ['', 'Inpatient', 'Outpatient', 'Sober living']) expect(featuredInquirySchema.safeParse({ ...valid, listing_type }).success).toBe(true);
    expect(featuredInquirySchema.safeParse({ ...valid, listing_type: 'Detox' }).success).toBe(false);
  });
  it('allows phone, city, listing type and message to remain empty', () => { expect(featuredInquirySchema.parse(valid)).toEqual(valid); });
});