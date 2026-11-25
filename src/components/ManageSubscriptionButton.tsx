import { useState } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const ManageSubscriptionButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const { data: hasSubscription } = useQuery({
    queryKey: ['has-subscription', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('featured_listings')
        .select('id')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });

  if (!user || !hasSubscription) return null;

  const handleManage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal-california');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to open subscription portal';
      if (msg.includes('No Stripe customer')) {
        toast({ title: 'No subscriptions', description: 'You don\'t have any active subscriptions to manage.' });
      } else {
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleManage} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
      Manage Subscription
    </Button>
  );
};

export default ManageSubscriptionButton;
