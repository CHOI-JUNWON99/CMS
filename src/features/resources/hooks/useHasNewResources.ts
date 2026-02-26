import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore, useUIStore } from '@/shared/stores';

export function useHasNewResources(): boolean {
  const [hasNew, setHasNew] = useState(false);
  const clientId = useAuthStore((state) => state.clientInfo?.id ?? null);
  const lastSeenResourcesAt = useUIStore((state) => state.lastSeenResourcesAt);

  useEffect(() => {
    const check = async () => {
      let query = supabase
        .from('resources')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      } else {
        query = query.is('client_id', null);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        setHasNew(false);
        return;
      }

      const latestCreatedAt = data[0].created_at;

      if (!lastSeenResourcesAt) {
        setHasNew(true);
        return;
      }

      setHasNew(latestCreatedAt > lastSeenResourcesAt);
    };

    check();
  }, [clientId, lastSeenResourcesAt]);

  return hasNew;
}
