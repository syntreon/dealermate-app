import React, { memo, useMemo, useCallback } from 'react';
import { FinancialTab } from '@/components/admin/dashboard/tabs/FinancialTab';

interface MemoizedFinancialTabProps {
  // No props needed - component fetches its own data
}

/**
 * Memoized version of FinancialTab that prevents unnecessary re-renders.
 * Since FinancialTab manages its own state and data fetching, we primarily
 * memoize to prevent re-mounting when parent components re-render.
 */
const MemoizedFinancialTab: React.FC<MemoizedFinancialTabProps> = memo(() => {
  return <FinancialTab />;
}, () => {
  // Since this component has no props and manages its own state,
  // we can always return true to prevent unnecessary re-renders
  // unless the component itself needs to update its internal state
  return true;
});

MemoizedFinancialTab.displayName = 'MemoizedFinancialTab';

export default MemoizedFinancialTab;