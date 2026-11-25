import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favoriteIds = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data.map((f) => f.listing_id);
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) throw new Error('Must be signed in');
      const isFav = favoriteIds.includes(listingId);
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: listingId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  return {
    favoriteIds,
    isLoading,
    isFavorite: (id: string) => favoriteIds.includes(id),
    toggleFavorite: toggleFavorite.mutate,
    isToggling: toggleFavorite.isPending,
  };
}
