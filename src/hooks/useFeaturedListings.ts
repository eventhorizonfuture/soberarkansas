import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeaturedTier } from '@/lib/featuredTiers';

export interface FeaturedListing {
  id: string;
  listing_id: string;
  city: string;
  tier: FeaturedTier;
  status: string;
}

async function fetchFeaturedListings(): Promise<FeaturedListing[]> {
  const { data, error } = await supabase
    .from('featured_listings_public' as any)
    .select('id, listing_id, city, tier, status');
  if (error) throw error;
  return (data || []) as unknown as FeaturedListing[];
}

export function useFeaturedListings() {
  const { data: featuredListings = [], isLoading } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: fetchFeaturedListings,
  });

  const isFeatured = (listingId: string): boolean =>
    featuredListings.some((f) => f.listing_id === listingId);

  const getFeaturedForCity = (city: string): FeaturedListing[] =>
    featuredListings
      .filter((f) => f.city === city)
      .sort((a, b) => {
        const order: Record<string, number> = { featured: 1, top: 1, middle: 2, bottom: 3 };
        return (order[a.tier] || 99) - (order[b.tier] || 99);
      });

  const getTierForListing = (listingId: string, city: string): FeaturedTier | null => {
    const f = featuredListings.find((fl) => fl.listing_id === listingId && fl.city === city);
    return f ? f.tier : null;
  };

  const isSlotTaken = (city: string, tier: FeaturedTier): boolean =>
    featuredListings.some((f) => f.city === city && f.tier === tier);

  return { featuredListings, isLoading, isFeatured, getFeaturedForCity, getTierForListing, isSlotTaken };
}
