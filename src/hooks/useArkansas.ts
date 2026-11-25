import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface County {
  id: string; name: string; slug: string; access_line: string; access_line_label: string; crisis_line: string; notes: string;
}
export interface CountyResource {
  id: string; county_id: string | null; title: string; description: string; phone: string; website: string; category: string; sort_order: number;
}

export function useCounties() {
  return useQuery({
    queryKey: ['counties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('counties').select('*').order('name');
      if (error) throw error;
      return (data || []) as County[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** countyId = null loads statewide resources. */
export function useCountyResources(countyId: string | null | undefined) {
  return useQuery({
    queryKey: ['county_resources', countyId ?? 'statewide'],
    enabled: countyId !== undefined,
    queryFn: async () => {
      let q = supabase.from('county_resources').select('*').order('sort_order').order('title');
      q = countyId ? q.eq('county_id', countyId) : q.is('county_id', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CountyResource[];
    },
  });
}
