import { z } from 'npm:zod@3.25.76';
import { booleanFields } from './fields.ts';

const httpUrl = z.string().max(4096).refine(value => {
  if (!value) return true;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}, 'Must be an HTTP or HTTPS URL');
const flags = Object.fromEntries(booleanFields.map(field => [field, z.boolean().optional()]));
export const listingSchema = z.object({
  ...flags,
  name: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().max(100).optional(),
  description: z.string().max(30000).optional(),
  email: z.union([z.literal(''), z.string().email().max(320)]).optional(),
  website: httpUrl.optional(),
  image: httpUrl.optional(),
  images: z.array(httpUrl).max(100).optional(),
  insurance_verification_url: httpUrl.optional(),
  zipcode: z.string().max(20).optional(),
  gender: z.enum(['men', 'women', 'co-ed']).optional(),
  features: z.array(z.string().max(500)).max(100).optional(),
  category: z.array(z.string().max(100)).max(30).optional(),
  beds: z.number().int().min(0).max(100000).optional(),
  price_range: z.string().max(200).optional(),
  length_of_stay: z.string().max(200).optional(),
  length_residential: z.string().max(200).optional(),
  length_php: z.string().max(200).optional(),
  length_iop: z.string().max(200).optional(),
  youtube_url: httpUrl.optional(),
  facebook_url: httpUrl.optional(),
  county: z.string().max(100).optional(),
  zip_code: z.string().max(20).optional(),
  accepts_medi_cal: z.boolean().optional(),
  otp_available: z.boolean().optional(),
}).strict();
export const updateSchema = listingSchema.partial().refine(value => Object.keys(value).length > 0, 'Provide at least one listing field');
export const RESOURCE_CATEGORIES = ['Assessment', 'Crisis', 'Meetings', 'Housing', 'Legal', 'Family Support', 'Forms', 'Other'] as const;
export const resourceSchema = z.object({
  county_id: z.string().uuid().nullable().optional(),
  county: z.string().trim().max(100).optional(), // county name or slug, alternative to county_id; "statewide" = no county
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional(),
  phone: z.string().max(100).optional(),
  website: httpUrl.optional(),
  category: z.enum(RESOURCE_CATEGORIES).optional(),
  sort_order: z.number().int().min(0).max(100000).optional(),
}).strict();
export const resourceUpdateSchema = resourceSchema.partial().refine(v => Object.keys(v).length > 0, 'Provide at least one field');
export const idSchema = z.string().uuid();

export async function validBearer(header: string | null, expected: string): Promise<boolean> {
  if (!header?.startsWith('Bearer ') || !expected) return false;
  const encoder = new TextEncoder();
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(header.slice(7))),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const actual = new Uint8Array(actualHash);
  const wanted = new Uint8Array(expectedHash);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ wanted[i];
  return difference === 0;
}