import { MapPin, DollarSign, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SoberLivingHome } from '@/data/listings';
import { Link } from 'react-router-dom';
import FavoriteButton from '@/components/FavoriteButton';

interface ListingCardProps {
  listing: SoberLivingHome;
}

const genderColors: Record<string, string> = {
  men: 'bg-primary/10 text-primary',
  women: 'bg-accent/10 text-accent',
  'co-ed': 'bg-secondary text-secondary-foreground',
};

const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link to={`/listing/${listing.id}`}>
      <Card className="group h-full transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)] cursor-pointer">
        <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
          {listing.images?.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : listing.image ? (
            <img
              src={listing.image}
              alt={listing.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Home className="h-8 w-8" />
              <span className="text-xs font-medium uppercase tracking-wider">Sober Living</span>
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold leading-tight text-card-foreground group-hover:text-accent transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
              {listing.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <FavoriteButton listingId={listing.id} />
              <Badge className={`text-xs ${genderColors[listing.gender]}`} variant="secondary">
                {listing.gender === 'co-ed' ? 'Co-Ed' : listing.gender === 'men' ? 'Men' : 'Women'}
              </Badge>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{listing.city}, AR</span>
          </div>

          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {listing.description}
          </p>

          <div className="flex items-center justify-end border-t pt-3 text-sm">
            {listing.category.includes('sober-living') ? (
              <span className="flex items-center gap-1 font-medium text-card-foreground">
                <DollarSign className="h-3.5 w-3.5" /> {listing.priceRange}
              </span>
            ) : listing.acceptsMedicaid ? (
              <span className="flex items-center gap-1 font-medium text-card-foreground">
                Medicaid/Medicare
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
