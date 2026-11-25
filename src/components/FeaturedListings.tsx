import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useListings } from '@/hooks/useListings';
import ListingRow from '@/components/ListingRow';
import FeaturedBadge from '@/components/FeaturedBadge';
import { Star } from 'lucide-react';

interface FeaturedListingsProps {
  city: string;
  onHover: (id: string | null) => void;
  hoveredId: string | null;
}

const FeaturedListings = ({ city, onHover, hoveredId }: FeaturedListingsProps) => {
  const { getFeaturedForCity } = useFeaturedListings();
  const { getListing } = useListings();

  if (city === 'All Cities') return null;

  const featured = getFeaturedForCity(city);
  if (featured.length === 0) return null;

  const featuredWithListings = featured
    .map((f) => ({ ...f, listing: getListing(f.listing_id) }))
    .filter((f) => f.listing);

  if (featuredWithListings.length === 0) return null;

  return (
    <div className="border-b bg-amber-500/5">
      <div className="px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <Star className="h-3 w-3 fill-current" /> Featured Homes in {city}
      </div>
      {featuredWithListings.map(({ listing }) => (
        <div key={listing!.id} className="relative">
          <div className="absolute top-4 right-4 z-10">
            <FeaturedBadge />
          </div>
          <ListingRow
            listing={listing!}
            onHover={onHover}
            isHovered={hoveredId === listing!.id}
          />
        </div>
      ))}
    </div>
  );
};

export default FeaturedListings;
