import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentStatus } from '@/types/admin';
import { simpleRealtimeService as realtimeService, ConnectionStatus, Subscription } from '@/services/simpleRealtimeService';
import { AgentStatusService } from '@/services/agentStatusService';
import { toast } from 'sonner';

interface UseRealtimeAgentStatusOptions {
  clientId?: string | null;
  enableNotifications?: boolean;
  onStatusChange?: (status: AgentStatus) => void;
}

interface UseRealtimeAgentStatusReturn {
  agentStatus: AgentStatus | null;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  updateStatus: (statusUpdate: { status: 'active' | 'inactive' | 'maintenance'; message?: string }) => Promise<void>;
  refresh: () => Promise<void>;
  isUpdating: boolean;
}

export const useRealtimeAgentStatus = (
  options: UseRealtimeAgentStatusOptions = {}
): UseRealtimeAgentStatusReturn => {
  const { clientId, enableNotifications = true, onStatusChange } = options;
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );

  const subscriptionRef = useRef<Subscription | null>(null);
  const connectionSubscriptionRef = useRef<Subscription | null>(null);
  const lastStatusRef = useRef<AgentStatus | null>(null);
  const handleStatusUpdateRef = useRef<(status: AgentStatus) => void>();
  const handleConnectionChangeRef = useRef<(status: ConnectionStatus) => void>();

  // Load initial agent status
  const loadAgentStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await AgentStatusService.getAgentStatus(clientId);
      setAgentStatus(status);
      lastStatusRef.current = status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agent status';
      setError(errorMessage);
      console.error('Error loading agent status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Update agent status
  const updateStatus = useCallback(async (statusUpdate: { 
    status: 'active' | 'inactive' | 'maintenance'; 
    message?: string 
  }) => {
    try {
      setIsUpdating(true);
      setError(null);

      const updatedStatus = await AgentStatusService.updateAgentStatus(
        clientId || null,
        statusUpdate
      );

      setAgentStatus(updatedStatus);
      lastStatusRef.current = updatedStatus;

      if (enableNotifications) {
        toast.success(`Agent status updated to ${statusUpdate.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent status';
      setError(errorMessage);
      
      if (enableNotifications) {
        toast.error(errorMessage);
      }
      
      console.error('Error updating agent status:', err);
      throw err; // Re-throw to allow component to handle
    } finally {
      setIsUpdating(false);
    }
  }, [clientId, enableNotifications]);

  // Refresh agent status
  const refresh = useCallback(async () => {
    await loadAgentStatus();
  }, [loadAgentStatus]);

  // Handle real-time status updates
  const handleStatusUpdate = useCallback((newStatus: AgentStatus) => {
    console.log('Received real-time agent status update:', newStatus);
    
    // Check if this is actually a new update
    const lastStatus = lastStatusRef.current;
    if (lastStatus && 
        lastStatus.status === newStatus.status && 
        lastStatus.message === newStatus.message &&
        lastStatus.last_updated.getTime() === newStatus.last_updated.getTime()) {
      return; // No actual change
    }

    setAgentStatus(newStatus);
    lastStatusRef.current = newStatus;

    // Show notification for status changes (but not for initial load)
    if (enableNotifications && lastStatus) {
      const statusLabels = {
        active: 'Active',
        inactive: 'Inactive',
        maintenance: 'Maintenance'
      };

      toast.info(`Agent status changed to ${statusLabels[newStatus.status]}`, {
        description: newStatus.message || undefined
      });
    }

    // Call external callback if provided
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  }, [enableNotifications, onStatusChange]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(prevStatus => {
      if (enableNotifications) {
        if (status.status === 'connected' && prevStatus.status !== 'connected') {
          toast.success('Real-time connection established');
        } else if (status.status === 'disconnected' && prevStatus.status === 'connected') {
          toast.warning('Real-time connection lost');
        } else if (status.status === 'error') {
          toast.error(`Connection error: ${status.error}`);
        }
      }
      return status;
    });
  }, [enableNotifications]);

  // Update refs when callbacks change
  useEffect(() => {
    handleStatusUpdateRef.current = handleStatusUpdate;
    handleConnectionChangeRef.current = handleConnectionChange;
  }, [handleStatusUpdate, handleConnectionChange]);

  // Setup subscriptions
  useEffect(() => {
    // Load initial data
    loadAgentStatus();

    // Subscribe to real-time updates with stable callback refs
    subscriptionRef.current = realtimeService.subscribeToAgentStatus(
      clientId || null,
      (status) => handleStatusUpdateRef.current?.(status)
    );

    // Subscribe to connection status changes with stable callback refs
    connectionSubscriptionRef.current = realtimeService.onConnectionChange(
      (status) => handleConnectionChangeRef.current?.(status)
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
    };
  }, [clientId, loadAgentStatus]); // Only depend on clientId and loadAgentStatus

  // Handle connection recovery
  useEffect(() => {
    if (connectionStatus.status === 'connected' && agentStatus === null && !isLoading) {
      // Refresh data when connection is restored
      refresh();
    }
  }, [connectionStatus.status, agentStatus, isLoading, refresh]);

  return {
    agentStatus,
    isLoading,
    error,
    connectionStatus,
    updateStatus,
    refresh,
    isUpdating
  };
};