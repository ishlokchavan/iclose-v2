import { useCallback, useState } from 'react';
import { useExperience } from '@/store/experience';

/** Pull-to-refresh state wired to the experience store's listings refetch. */
export function usePullRefresh(extra?: () => void | Promise<void>) {
  const { refresh } = useExperience();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), Promise.resolve(extra?.())]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, extra]);
  return { refreshing, onRefresh };
}
