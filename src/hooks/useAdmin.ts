import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Simple module-level cache to avoid re-fetching on every mount
const adminCache: Record<string, { value: boolean; ts: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(() => {
    if (!user) return false;
    const cached = adminCache[user.id];
    return cached && Date.now() - cached.ts < CACHE_TTL ? cached.value : false;
  });
  const [loading, setLoading] = useState(() => {
    if (!user) return false;
    const cached = adminCache[user.id];
    return !(cached && Date.now() - cached.ts < CACHE_TTL);
  });

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const cached = adminCache[user.id];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setIsAdmin(cached.value);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const result = !error && !!data;
      adminCache[user.id] = { value: result, ts: Date.now() };
      setIsAdmin(result);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isAdmin, loading };
}
