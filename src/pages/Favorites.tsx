import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Printer, MapPin, Phone } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ListingCard from '@/components/ListingCard';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { favoriteIds, isLoading: favsLoading } = useFavorites();

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['favorite-listings', favoriteIds],
    enabled: favoriteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings_public')
        .select('*')
        .in('id', favoriteIds);
      if (error) throw error;
      return (data || []).map((l: any) => ({
        ...l,
        priceRange: l.price_range ?? '',
        acceptsMedicaid: l.accepts_medicaid ?? false,
        acceptsPrivatePay: l.accepts_private_pay ?? false,
        matAvailable: l.mat_available ?? false,
        detoxAvailable: l.detox_available ?? false,
        lengthOfStay: l.length_of_stay ?? '',
      }));
    },
  });

  useEffect(() => {
    document.title = 'My Favorites | Sober Arkansas';
    return () => { document.title = 'Sober Arkansas'; };
  }, []);

  const isLoading = authLoading || favsLoading || listingsLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-10 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            <Heart className="inline h-5 w-5 text-red-500 fill-red-500 mr-2 -mt-0.5" />
            My Favorites
          </h1>
          {listings.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          )}
        </div>

        {!user && !authLoading && (
          <div className="text-center py-16 print:hidden">
            <p className="text-muted-foreground mb-4">Sign in to save your favorite listings.</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        )}

        {user && isLoading && (
          <p className="text-muted-foreground text-sm print:hidden">Loading favorites…</p>
        )}

        {user && !isLoading && listings.length === 0 && (
          <div className="text-center py-16 print:hidden">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No favorites yet. Browse the directory to save listings.</p>
            <Link to="/arkansas-directory?category=all">
              <Button variant="outline">Browse Directory</Button>
            </Link>
          </div>
        )}

        {/* Screen view */}
        {listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
            {listings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Print view */}
        {listings.length > 0 && (
          <div className="hidden print:block">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">My Favorite Listings — SoberArkansas.com</h2>
            <div className="space-y-4">
              {listings.map((listing: any) => (
                <div key={listing.id} className="border-b pb-3 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{listing.name}</h3>
                    {listing.city && (
                      <p className="text-xs font-medium text-gray-700 mt-0.5">{listing.city}, Arkansas</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600 mt-0.5">
                      {listing.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {listing.address}
                        </span>
                      )}
                      {listing.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {listing.phone}
                        </span>
                      )}
                      {listing.website && (
                        <span>{listing.website}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 text-xs text-gray-600 mt-1">
                      {listing.gender && listing.gender !== 'co-ed' && (
                        <span className="font-medium capitalize">{listing.gender}</span>
                      )}
                      {listing.gender === 'co-ed' && <span className="font-medium">Co-Ed</span>}
                      {listing.category?.map((c: string) => (
                        <span key={c} className="capitalize">{c === 'sober-living' ? 'Sober Living' : c}</span>
                      ))}
                      {listing.mat_available && <span>MAT</span>}
                      {listing.detox_available && <span>Detox</span>}
                      {listing.telehealth_available && <span>Telehealth</span>}
                      {listing.accepts_medicaid && <span>Medicaid</span>}
                      {listing.priceRange && <span>{listing.priceRange}</span>}
                    </div>
                    {listing.description && (
                      <p className="text-xs mt-1 line-clamp-3">{listing.description}</p>
                    )}
                  </div>
                  {(listing.images?.[0] || listing.image) && (
                    <img
                      src={listing.images?.[0] || listing.image}
                      alt={listing.name}
                      className="shrink-0 w-16 h-16 rounded object-cover border"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Favorites;
