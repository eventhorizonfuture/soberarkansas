import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, DollarSign, Home, User, Users, X, ChevronLeft, ChevronRight, Phone, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import type { SoberLivingHome } from '@/data/listings';
import { Link } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useListings } from '@/hooks/useListings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FavoriteButton from '@/components/FavoriteButton';
import FeaturedBadge from '@/components/FeaturedBadge';

interface ListingRowProps {
  listing: SoberLivingHome;
  onHover: (id: string | null) => void;
  isHovered: boolean;
  isFeatured?: boolean;
}

const genderColors: Record<string, string> = {
  men: 'bg-primary/10 text-primary',
  women: 'bg-accent/10 text-accent',
  'co-ed': 'bg-secondary text-secondary-foreground',
};

const genderIcons: Record<string, typeof User> = {
  men: User,
  women: User,
  'co-ed': Users,
};

const ListingRow = ({ listing, onHover, isHovered, isFeatured: featured = false }: ListingRowProps) => {
  const GenderIcon = genderIcons[listing.gender] || Home;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { isAdmin } = useAdmin();
  const { deleteListing } = useListings();
  const queryClient = useQueryClient();

  const allImages = listing.images?.length > 0 ? listing.images : listing.image ? [listing.image] : [];

  const openLightbox = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setLightboxIndex(index);
  };

  const closeLightbox = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLightboxIndex(null);
  };

  const navigate = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + dir + allImages.length) % allImages.length);
  };

  return (
    <>
      <Link
        to={`/listing/${listing.id}`}
        className={`block border-b p-4 transition-colors hover:bg-muted/50 ${isHovered ? 'bg-muted/60' : ''}`}
        onMouseEnter={() => onHover(listing.id)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="flex gap-3">
          {allImages.length > 0 ? (
            <div
              className="shrink-0 h-14 w-14 rounded-lg overflow-hidden cursor-zoom-in"
              onClick={(e) => openLightbox(e, 0)}
            >
              <img
                src={allImages[0]}
                alt={listing.name}
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
              />
            </div>
          ) : (
            <div className={`shrink-0 flex h-14 w-14 items-center justify-center rounded-lg ${genderColors[listing.gender]}`}>
              <GenderIcon className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3
                  className="font-semibold text-card-foreground leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {listing.name}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <FavoriteButton listingId={listing.id} />
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="h-6 px-1.5 py-0 text-[10px] rounded border border-input bg-background text-muted-foreground hover:bg-muted transition-colors"
                        title="Change category"
                      >
                        {[
                          listing.category?.includes('inpatient') && 'In',
                          listing.category?.includes('outpatient') && 'Out',
                          listing.category?.includes('sober-living') && 'SL',
                        ].filter(Boolean).join('·') || 'Cat'}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="z-50"
                    >
                      {['inpatient', 'outpatient', 'sober-living'].map((cat) => (
                        <DropdownMenuCheckboxItem
                          key={cat}
                          checked={listing.category?.includes(cat)}
                          onCheckedChange={async (checked) => {
                            const current = listing.category || [];
                            const updated = checked
                              ? [...current.filter((c: string) => c !== cat), cat]
                              : current.filter((c: string) => c !== cat);
                            const { error } = await supabase
                              .from('listings')
                              .update({ category: updated })
                              .eq('id', listing.id);
                            if (error) {
                              toast({ title: 'Error', description: error.message, variant: 'destructive' });
                            } else {
                              toast({ title: 'Category updated' });
                              queryClient.invalidateQueries({ queryKey: ['listings'] });
                            }
                          }}
                        >
                          {cat === 'inpatient' ? 'Inpatient' : cat === 'outpatient' ? 'Outpatient' : 'Sober Living'}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm(`Delete "${listing.name}"?`)) {
                          deleteListing(listing.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                
                {isAdmin ? (
                  <Select
                    value={listing.gender}
                    onValueChange={async (val) => {
                      const { error } = await supabase
                        .from('listings')
                        .update({ gender: val })
                        .eq('id', listing.id);
                      if (error) {
                        toast({ title: 'Error', description: error.message, variant: 'destructive' });
                      } else {
                        toast({ title: 'Gender updated' });
                        queryClient.invalidateQueries({ queryKey: ['listings'] });
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-6 w-[70px] text-[10px] px-1.5 py-0"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="co-ed">Co-Ed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`text-[10px] ${genderColors[listing.gender]}`} variant="secondary">
                    {listing.gender === 'co-ed' ? 'Co-Ed' : listing.gender === 'men' ? 'Men' : 'Women'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{listing.address}</span>
            </div>

            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed mb-3">
              {listing.description}
            </p>

            <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {listing.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {listing.phone}
                  </span>
                )}
                {listing.category.includes('sober-living') && listing.priceRange ? (
                  <span className="flex items-center gap-1 font-medium text-card-foreground">
                    <DollarSign className="h-3 w-3" /> {listing.priceRange}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-card-foreground">
                    {listing.acceptsMedicaid ? 'Medicaid/Medicare' : ''}
                    {listing.category.includes('inpatient') && listing.lengthOfStay && ` · ${listing.lengthOfStay}`}
                  </span>
                )}
              </div>
              {featured && <FeaturedBadge />}
            </div>
          </div>
        </div>
      </Link>

      {/* Lightbox */}
      {lightboxIndex !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => navigate(e, -1)}
                className="absolute left-4 text-white/80 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => navigate(e, 1)}
                className="absolute right-4 text-white/80 hover:text-white transition-colors"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <img
            src={allImages[lightboxIndex]}
            alt={`${listing.name} - Image ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />

          {allImages.length > 1 && (
            <div className="absolute bottom-4 text-white/70 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ListingRow;
