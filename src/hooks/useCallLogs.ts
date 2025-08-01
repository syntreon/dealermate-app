/**
 * Custom hook for interacting with call logs data
 * Provides loading state, error handling, and data fetching capabilities
 * 
 * CRITICAL: This hook enforces client data isolation for compliance and privacy
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { callLogsService, CallLog, CallLogFilters } from '@/integrations/supabase/call-logs-service';
import { useAuth } from '@/context/AuthContext';
import { getClientIdFilter, canViewSensitiveInfo } from '@/utils/clientDataIsolation';

interface UseCallLogsReturn {
  callLogs: CallLog[];
  loading: boolean;
  error: Error | null;
  refetch: (filters?: CallLogFilters) => Promise<void>;
  forceRefresh: () => Promise<void>;
  lastRefreshed: Date | null;
  createCallLog: (callLog: any) => Promise<CallLog>;
  updateCallLog: (id: string, callLog: any) => Promise<CallLog>;
  deleteCallLog: (id: string) => Promise<void>;
}

/**
 * Hook for fetching and managing call logs data
 * 
 * Features:
 * - Uses caching for better performance
 * - Supports manual refresh and filtering
 * - Provides loading and error states
 * - Handles network errors gracefully
 * - Includes CRUD operations for call logs
 * 
 * @param autoLoad Whether to automatically load data on mount
 * @param initialFilters Optional initial filters to apply
 * @returns Object containing call logs, loading state, error state, and functions
 */
export function useCallLogs(
  autoLoad = true,
  initialFilters?: CallLogFilters
): UseCallLogsReturn {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filters, setFilters] = useState<CallLogFilters | undefined>(initialFilters);

  // Memoize the client ID filter to prevent infinite render loops
  const clientIdFilter = useMemo(() => getClientIdFilter(user), [user]);
  
  // Memoize the admin permission check to prevent infinite render loops
  const isAdmin = useMemo(() => canViewSensitiveInfo(user), [user]);
  
  // Function to fetch logs with optional force refresh
  const fetchLogs = useCallback(async (newFilters?: CallLogFilters, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update filters if provided
      if (newFilters) {
        setFilters(newFilters);
      }
      
      // Merge filters with client ID filter for data isolation
      const filtersToUse: CallLogFilters = {
        ...(newFilters || filters || {}),
        // Only add clientId if it's not already specified and we have a filter to apply
        ...(clientIdFilter && !(newFilters?.clientId || filters?.clientId) ? { clientId: clientIdFilter } : {})
      };
      
      const data = await callLogsService.getCallLogs(filtersToUse, forceRefresh);
      
      setCallLogs(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error in useCallLogs hook:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching call logs'));
    } finally {
      setLoading(false);
    }
  }, [filters, clientIdFilter]);

  // Force refresh function that bypasses cache
  const forceRefresh = useCallback(() => {
    return fetchLogs(undefined, true);
  }, [fetchLogs]);

  // Refetch function is always stable
  const refetch = (filters?: CallLogFilters) => {
    return fetchLogs(filters);
  };
  
  // Create a new call log
  const createCallLog = useCallback(async (callLog: any) => {
    try {
      const newCallLog = await callLogsService.createCallLog(callLog);
      // Refresh the list after creating
      fetchLogs();
      return newCallLog;
    } catch (err) {
      console.error('Error creating call log:', err);
      throw err;
    }
  }, [fetchLogs]);
  
  // Update an existing call log
  const updateCallLog = useCallback(async (id: string, callLog: any) => {
    try {
      const updatedCallLog = await callLogsService.updateCallLog(id, callLog);
      // Refresh the list after updating
      fetchLogs();
      return updatedCallLog;
    } catch (err) {
      console.error('Error updating call log:', err);
      throw err;
    }
  }, [fetchLogs]);
  
  // Delete a call log
  const deleteCallLog = useCallback(async (id: string) => {
    try {
      await callLogsService.deleteCallLog(id);
      // Refresh the list after deleting
      fetchLogs();
    } catch (err) {
      console.error('Error deleting call log:', err);
      throw err;
    }
  }, [fetchLogs]);

  // Initial fetch on component mount
  useEffect(() => {
    if (autoLoad) {
      fetchLogs();
    }
  }, [autoLoad, fetchLogs]);

  return {
    callLogs,
    loading,
    error,
    refetch: fetchLogs,
    forceRefresh,
    lastRefreshed,
    createCallLog,
    updateCallLog,
    deleteCallLog
  };
}
