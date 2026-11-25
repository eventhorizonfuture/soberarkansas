import { z } from 'zod';

export const FEATURED_LISTING_TYPES = ['Inpatient', 'Outpatient', 'Sober living'] as const;
export const featuredInquirySchema = z.object({
  facility_name: z.string().trim().min(1, 'Facility or home name is required.').max(300),
  contact_name: z.string().trim().min(1, 'Contact name is required.').max(200),
  email: z.string().trim().email('Please enter a valid email address.').max(320),
  phone: z.string().trim().max(50),
  city: z.string().trim().max(200),
  listing_type: z.enum(['', ...FEATURED_LISTING_TYPES]),
  message: z.string().trim().max(3000),
}).strict();

export type FeaturedInquiry = z.infer<typeof featuredInquirySchema>;