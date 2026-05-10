import { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore, useUIStore } from '@/shared/stores';
import { DbResourceRow } from '@/shared/types';

const isResourceVisibleToClients = (row: DbResourceRow, clientIds: string[]) => {
  const targetClientIds = row.client_ids ?? (row.client_id ? [row.client_id] : []);
  if (targetClientIds.length === 0) return true;
  return targetClientIds.some((clientId) => clientIds.includes(clientId));
};

export function useHasNewResources(): boolean {
  const [hasNew, setHasNew] = useState(false);
  const clientId = useAuthStore((state) => state.clientInfo?.id ?? null);
  const sharedClientIds = useAuthStore((state) => state.clientIds);
  const lastSeenResourcesAt = useUIStore((state) => state.lastSeenResourcesAt);

  useEffect(() => {
    const check = async () => {
      const accessibleClientIds = Array.from(new Set([
        ...(clientId ? [clientId] : []),
        ...sharedClientIds,
      ]));

      const { data } = await supabase
        .from('resources')
        .select('created_at, client_id, client_ids')
        .order('created_at', { ascending: false });

      const visibleRows = ((data ?? []) as DbResourceRow[]).filter((row) => isResourceVisibleToClients(row, accessibleClientIds));
      if (visibleRows.length === 0) {
        setHasNew(false);
        return;
      }

      const latestCreatedAt = visibleRows[0].created_at;
      if (!latestCreatedAt) {
        setHasNew(false);
        return;
      }

      if (!lastSeenResourcesAt) {
        setHasNew(true);
        return;
      }

      setHasNew(latestCreatedAt > lastSeenResourcesAt);
    };

    check();
  }, [clientId, sharedClientIds, lastSeenResourcesAt]);

  return hasNew;
}
