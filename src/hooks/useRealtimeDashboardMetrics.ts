import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardMetrics } from '@/types/dashboard';
import { simpleRealtimeService as realtimeService, ConnectionStatus, Subscription } from '@/services/simpleRealtimeService';
import { DashboardService } from '@/services/dashboardService';
import { toast } from 'sonner';

interface UseRealtimeDashboardMetricsOptions {
  clientId?: string | null;
  refreshInterval?: number; // in milliseconds
  enableNotifications?: boolean;
  onMetricsChange?: (metrics: DashboardMetrics) => void;
}

interface UseRealtimeDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export const useRealtimeDashboardMetrics = (
  options: UseRealtimeDashboardMetricsOptions = {}
): UseRealtimeDashboardMetricsReturn => {
  const { 
    clientId, 
    refreshInterval = 30000, // 30 seconds default
    enableNotifications = false, // Usually don't want notifications for metrics
    onMetricsChange
  } = options;
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const subscriptionRef = useRef<Subscription | null>(null);
  const connectionSubscriptionRef = useRef<Subscription | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMetricsRef = useRef<DashboardMetrics | null>(null);

  // Load dashboard metrics
  const loadMetrics = useCallback(async () => {
    try {
      setError(null);
      
      const newMetrics = await DashboardService.getDashboardMetrics(clientId);
      
      // Check for significant changes to show notifications
      if (enableNotifications && lastMetricsRef.current) {
        const oldMetrics = lastMetricsRef.current;
        
        // Notify about significant call volume changes
        if (newMetrics.totalCalls > oldMetrics.totalCalls) {
          const newCalls = newMetrics.totalCalls - oldMetrics.totalCalls;
          if (newCalls >= 5) { // Only notify for 5+ new calls
            toast.info(`${newCalls} new call${newCalls > 1 ? 's' : ''} received`);
          }
        }
        
        // Notify about new leads
        if (newMetrics.totalLeads > oldMetrics.totalLeads) {
          const newLeads = newMetrics.totalLeads - oldMetrics.totalLeads;
          toast.success(`${newLeads} new lead${newLeads > 1 ? 's' : ''} generated!`);
        }
        
        // Notify about agent status changes
        if (oldMetrics.agentStatus.status !== newMetrics.agentStatus.status) {
          toast.info(`Agent status changed to ${newMetrics.agentStatus.status}`);
        }
      }
      
      setMetrics(newMetrics);
      setLastUpdated(new Date());
      lastMetricsRef.current = newMetrics;

      // Call external callback if provided
      if (onMetricsChange) {
        onMetricsChange(newMetrics);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard metrics';
      setError(errorMessage);
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, enableNotifications, onMetricsChange]);

  // Refresh metrics data
  const refresh = useCallback(async () => {
    await loadMetrics();
  }, [loadMetrics]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    if (enableNotifications) {
      if (status.status === 'connected' && connectionStatus.status !== 'connected') {
        toast.success('Real-time connection established');
      } else if (status.status === 'disconnected' && connectionStatus.status === 'connected') {
        toast.warning('Real-time connection lost');
      } else if (status.status === 'error') {
        toast.error(`Connection error: ${status.error}`);
      }
    }
  }, [connectionStatus.status, enableNotifications]);

  // Handle real-time updates that affect metrics
  const handleDataUpdate = useCallback(() => {
    // When we receive real-time updates for calls, leads, etc., refresh metrics
    console.log('Data update detected, refreshing metrics...');
    refresh();
  }, [refresh]);

  // Setup subscriptions and intervals
  useEffect(() => {
    // Load initial data
    loadMetrics();

    // Subscribe to connection status changes
    connectionSubscriptionRef.current = realtimeService.onConnectionChange(
      handleConnectionChange
    );

    // Set up periodic refresh
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        if (connectionStatus.status === 'connected') {
          loadMetrics();
        }
      }, refreshInterval);
    }

    // Subscribe to real-time updates that might affect metrics
    // This is a simplified approach - in a full implementation, you'd subscribe to
    // specific tables like calls, leads, etc.
    subscriptionRef.current = realtimeService.subscribeToClientUpdates(
      handleDataUpdate,
      clientId || undefined
    );

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (connectionSubscriptionRef.current) {
        connectionSubscriptionRef.current.unsubscribe();
        connectionSubscriptionRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [clientId, refreshInterval, loadMetrics, handleConnectionChange, handleDataUpdate, connectionStatus.status]);

  // Handle connection recovery
  useEffect(() => {
    if (connectionStatus.status === 'connected' && !metrics && !isLoading) {
      // Refresh data when connection is restored
      refresh();
    }
  }, [connectionStatus.status, metrics, isLoading, refresh]);

  return {
    metrics,
    isLoading,
    error,
    connectionStatus,
    refresh,
    lastUpdated
  };
};