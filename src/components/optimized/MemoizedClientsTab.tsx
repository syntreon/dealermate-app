import React, { memo, useMemo, useCallback } from 'react';
import { ClientsTab } from '@/components/admin/dashboard/tabs/ClientsTab';

interface MemoizedClientsTabProps {
  // No props needed - component fetches its own data
}

/**
 * Memoized version of ClientsTab that prevents unnecessary re-renders.
 * Since ClientsTab manages its own state and data fetching, we primarily
 * memoize to prevent re-mounting when parent components re-render.
 */
const MemoizedClientsTab: React.FC<MemoizedClientsTabProps> = memo(() => {
  return <ClientsTab />;
}, () => {
  // Since this component has no props and manages its own state,
  // we can always return true to prevent unnecessary re-renders
  // unless the component itself needs to update its internal state
  return true;
});

MemoizedClientsTab.displayName = 'MemoizedClientsTab';

export default MemoizedClientsTab;