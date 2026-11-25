import type Stripe from "https://esm.sh/stripe@18.5.0";

// Server-defined return origins; never trust the request Origin header.
export const ALLOWED_ORIGINS = [
  "https://soberarkansas.com",
  "https://www.soberarkansas.com",
  "https://ohio-sober-homes.lovable.app",
  "https://id-preview--20d70265-d03e-48eb-8694-553990680867.lovable.app",
  "https://20d70265-d03e-48eb-8694-553990680867.lovableproject.com",
  "http://localhost:8080",
];

export function safeOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// Server-side tier → price map; the client cannot choose the price.
export const TIER_PRICES: Record<string, string> = {
  featured: "price_1T19cmGPi81y7n77M3iKlNsJ",
};

// Customers are bound to the app user ID in metadata, never matched by email.
export async function findCustomerForUser(stripe: Stripe, userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  const res = await stripe.customers.search({
    query: `metadata['supabase_user_id']:'${userId}'`,
    limit: 1,
  });
  return res.data[0] ?? null;
}
