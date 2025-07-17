/**
 * Custom hook for interacting with Google Sheets data
 * Provides loading state, error handling, and data fetching capabilities
 */
import { useState, useEffect, useCallback } from 'react';
import { sheetsService, CallLog } from '@/integrations/google/sheets-service';

interface UseGoogleSheetsReturn {
  callLogs: CallLog[];
  loading: boolean;
  error: string | null;
}

/**
 * Enhanced custom hook for fetching call logs from Google Sheets
 * Features:
 * - Uses caching for better performance
 * - Supports manual refresh
 * - Provides loading and error states
 * - Handles network errors gracefully
 */
export function useGoogleSheets() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Function to fetch logs with optional force refresh
  const fetchLogs = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const sheetsService = GoogleSheetsService.getInstance();
      const data = await sheetsService.getCallLogs(forceRefresh);

      setLogs(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error in useGoogleSheets hook:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching call logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchLogs(false); // Use cache if available on initial load
  }, [fetchLogs]);

  // Force refresh function that bypasses cache
  const forceRefresh = useCallback(() => {
    return fetchLogs(true);
  }, [fetchLogs]);

  return { 
    logs, 
    loading, 
    error, 
    refetch: fetchLogs,
    forceRefresh,
    lastRefreshed
    refreshData
  };
};
