export const FEATURED_TIERS = {
  featured: {
    label: 'Featured Listing',
    price_id: 'price_1T19cmGPi81y7n77M3iKlNsJ',
    product_id: 'prod_Tz7svG7ZxeQRa7',
    price: '$49/mo',
    description: 'Priority placement in city results',
    order: 1,
  },
} as const;

export type FeaturedTier = keyof typeof FEATURED_TIERS;

export function getTierByProductId(productId: string): FeaturedTier | null {
  for (const [key, val] of Object.entries(FEATURED_TIERS)) {
    if (val.product_id === productId) return key as FeaturedTier;
  }
  return null;
}
