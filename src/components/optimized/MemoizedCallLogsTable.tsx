import React, { memo, useMemo, useCallback } from 'react';
import { ExtendedCallLog } from '@/components/CallLogsTable';
import CallLogsTable from '@/components/CallLogsTable';

interface MemoizedCallLogsTableProps {
  callLogs: ExtendedCallLog[];
  loading: boolean;
  onRefresh: () => void;
  leadCallIds?: Set<string>;
}

/**
 * Memoized version of CallLogsTable that prevents unnecessary re-renders
 * when props haven't changed. This is especially important for large datasets.
 */
const MemoizedCallLogsTable: React.FC<MemoizedCallLogsTableProps> = memo(({
  callLogs,
  loading,
  onRefresh,
  leadCallIds
}) => {
  // Memoize the leadCallIds set to prevent unnecessary re-renders
  const memoizedLeadCallIds = useMemo(() => {
    return leadCallIds || new Set<string>();
  }, [leadCallIds]);

  // Memoize the onRefresh callback to prevent child re-renders
  const memoizedOnRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <CallLogsTable
      callLogs={callLogs}
      loading={loading}
      onRefresh={memoizedOnRefresh}
      leadCallIds={memoizedLeadCallIds}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  if (prevProps.loading !== nextProps.loading) return false;
  if (prevProps.callLogs.length !== nextProps.callLogs.length) return false;
  
  // Compare leadCallIds sets
  const prevLeadIds = prevProps.leadCallIds || new Set();
  const nextLeadIds = nextProps.leadCallIds || new Set();
  if (prevLeadIds.size !== nextLeadIds.size) return false;
  
  // Deep comparison of call logs (only if lengths are the same)
  for (let i = 0; i < prevProps.callLogs.length; i++) {
    const prevCall = prevProps.callLogs[i];
    const nextCall = nextProps.callLogs[i];
    
    // Compare key fields that would affect rendering
    if (prevCall.id !== nextCall.id ||
        prevCall.caller_full_name !== nextCall.caller_full_name ||
        prevCall.call_start_time !== nextCall.call_start_time ||
        prevCall.call_type !== nextCall.call_type ||
        prevCall.client_name !== nextCall.client_name) {
      return false;
    }
  }
  
  return true;
});

MemoizedCallLogsTable.displayName = 'MemoizedCallLogsTable';

export default MemoizedCallLogsTable;