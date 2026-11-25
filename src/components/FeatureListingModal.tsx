import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FEATURED_TIERS } from '@/lib/featuredTiers';
import { useFeaturedListings } from '@/hooks/useFeaturedListings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FeatureListingModalProps {
  listingId: string;
  city: string;
}

const FeatureListingModal = ({ listingId, city }: FeatureListingModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isSlotTaken, getTierForListing } = useFeaturedListings();
  const { user, session } = useAuth();

  const currentTier = getTierForListing(listingId, city);
  const tier = FEATURED_TIERS.featured;
  const taken = isSlotTaken(city, 'featured');
  const isCurrent = currentTier === 'featured';

  const handleCheckout = async () => {
    if (!user || !session) {
      toast({ title: 'Sign in required', description: 'Please sign in to feature your listing.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-california', {
        body: {
          priceId: tier.price_id,
          listingId,
          city,
          tier: 'featured',
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to start checkout', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
          <Star className="h-3.5 w-3.5 fill-current" />
          {currentTier ? 'Manage Featured' : 'Feature This Listing'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-current" />
            Feature Your Listing in {city}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Get priority placement in {city} search results with a featured badge.
        </p>
        <div className="mt-2 rounded-lg border-2 p-4 border-amber-500 bg-amber-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{tier.label}</p>
              <p className="text-xs text-muted-foreground">{tier.description}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">{tier.price}</p>
              {isCurrent ? (
                <span className="text-xs text-amber-600 font-medium">Current</span>
              ) : taken ? (
                <span className="text-xs text-muted-foreground">Taken</span>
              ) : (
                <Button
                  size="sm"
                  className="mt-1 h-7 text-xs"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Subscribe'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureListingModal;
