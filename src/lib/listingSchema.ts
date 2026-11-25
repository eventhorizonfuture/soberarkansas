import { z } from 'zod';

export const listingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name must be under 200 characters'),
  city: z.string().trim().min(1, 'City is required').max(100, 'City must be under 100 characters'),
  address: z.string().trim().min(1, 'Address is required').max(500, 'Address must be under 500 characters'),
  phone: z.string().trim().max(20, 'Phone must be under 20 characters').default(''),
  description: z.string().trim().max(5000, 'Description must be under 5000 characters').default(''),
  features: z.array(z.string().trim().max(100, 'Each feature must be under 100 characters')).max(50, 'Maximum 50 features').default([]),
  gender: z.enum(['men', 'women', 'co-ed'], { required_error: 'Gender is required' }),
  image: z.string().trim().max(2000, 'Image URL must be under 2000 characters').refine(
    (val) => val === '' || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
    'Must be a valid URL'
  ).default(''),
  images: z.array(z.string().trim().url('Each image must be a valid URL').max(2000)).max(20, 'Maximum 20 images').default([]),
  priceRange: z.string().trim().max(50, 'Price range must be under 50 characters').default(''),
  lat: z.number().min(36.5, 'Latitude must be within Arkansas (36.5–39.2)').max(39.2, 'Latitude must be within Arkansas (36.5–39.2)'),
  lng: z.number().min(-89.6, 'Longitude must be within Arkansas (-89.6–-81.9)').max(-81.9, 'Longitude must be within Arkansas (-89.6–-81.9)'),
  category: z.array(z.enum(['inpatient', 'outpatient', 'sober-living'])).default(['sober-living']),
  acceptsPrivatePay: z.boolean().default(false),
  acceptsMedicaid: z.boolean().default(false),
  lengthOfStay: z.string().trim().max(100, 'Length of stay must be under 100 characters').default(''),
  matAvailable: z.boolean().default(false),
  insuranceVerificationUrl: z.string().trim().max(2000, 'URL must be under 2000 characters').refine(
    (val) => val === '' || val.startsWith('http://') || val.startsWith('https://'),
    'Must be a valid URL'
  ).default(''),
  detoxAvailable: z.boolean().default(false),
  levelPhp: z.boolean().default(false),
  levelIop: z.boolean().default(false),
  levelOp: z.boolean().default(false),
  telehealthAvailable: z.boolean().default(false),
  eveningGroups: z.boolean().default(false),
  website: z.string().trim().max(2000, 'Website URL must be under 2000 characters').default(''),
});

export type ListingFormData = z.infer<typeof listingSchema>;
