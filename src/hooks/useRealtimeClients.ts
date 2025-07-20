import { useState, useEffect, useCallback, useRef } from 'react';
import { Client, ClientFilters, PaginationOptions, PaginatedResponse } from '@/types/admin';
import { simpleRealtimeService as realtimeService, ConnectionStatus, Subscription } from '@/services/simpleRealtimeService';
import { AdminService } from '@/services/adminService';
import { toast } from 'sonner';

interface UseRealtimeClientsOptions {
  filters?: ClientFilters;
  pagination?: PaginationOptions;
  enableNotifications?: boolean;
  onClientChange?: (client: Client, action: 'create' | 'update' | 'delete') => void;
  enableOptimisticUpdates?: boolean;
}

interface UseRealtimeClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  refresh: () => Promise<void>;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  updateClientOptimistically: (clientId: string, updates: Partial<Client>) => void;
  revertOptimisticUpdate: (clientId: string) => void;
}

export const useRealtimeClients = (
  options: UseRealtimeClientsOptions = {}
): UseRealtimeClientsReturn => {
  const { 
    filters, 
    pagination, 
    enableNotifications = true, 
    onClientChange,
    enableOptimisticUpdates = true
  } = options;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);

  const subscriptionRef = useRef<Subscription | null>(null);
  const connectionSubscriptionRef = useRef<Subscription | null>(null);
  const optimisticUpdatesRef = useRef<Map<string, Client>>(new Map());
  const lastFiltersRef = useRef<ClientFilters | undefined>(filters);
  const lastPaginationRef = useRef<PaginationOptions | undefined>(pagination);

  // Load clients data
  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await AdminService.getClientsPaginated(filters, pagination);
      
      setClients(result.data);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
      
      // Clear optimistic updates when fresh data is loaded
      optimisticUpdatesRef.current.clear();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMessage);
      console.error('Error loading clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination]);

  // Refresh clients data
  const refresh = useCallback(async () => {
    await loadClients();
  }, [loadClients]);

  // Update client optimistically (for immediate UI feedback)
  const updateClientOptimistically = useCallback((clientId: string, updates: Partial<Client>) => {
    if (!enableOptimisticUpdates) return;

    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;

      const updatedClients = [...prevClients];
      const originalClient = updatedClients[clientIndex];
      
      // Store original for potential revert
      optimisticUpdatesRef.current.set(clientId, originalClient);
      
      // Apply optimistic update
      updatedClients[clientIndex] = { ...originalClient, ...updates };
      
      return updatedClients;
    });
  }, [enableOptimisticUpdates]);

  // Revert optimistic update
  const revertOptimisticUpdate = useCallback((clientId: string) => {
    const originalClient = optimisticUpdatesRef.current.get(clientId);
    if (!originalClient) return;

    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;

      const updatedClients = [...prevClients];
      updatedClients[clientIndex] = originalClient;
      
      optimisticUpdatesRef.current.delete(clientId);
      
      return updatedClients;
    });
  }, []);

  // Handle real-time client updates
  const handleClientUpdate = useCallback((updatedClient: Client) => {
    console.log('Received real-time client update:', updatedClient);
    
    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === updatedClient.id);
      
      if (clientIndex === -1) {
        // New client - add to list if it matches current filters
        // For simplicity, we'll refresh the data to ensure proper filtering
        setTimeout(() => refresh(), 100);
        return prevClients;
      }

      // Update existing client
      const updatedClients = [...prevClients];
      const oldClient = updatedClients[clientIndex];
      updatedClients[clientIndex] = updatedClient;

      // Clear any optimistic update for this client
      optimisticUpdatesRef.current.delete(updatedClient.id);

      // Show notification for significant changes
      if (enableNotifications && oldClient.status !== updatedClient.status) {
        toast.info(`Client "${updatedClient.name}" status changed to ${updatedClient.status}`);
      }

      // Call external callback if provided
      if (onClientChange) {
        onClientChange(updatedClient, 'update');
      }

      return updatedClients;
    });
  }, [enableNotifications, onClientChange, refresh]);

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

  // Setup subscriptions
  useEffect(() => {
    // Load initial data
    loadClients();

    // Subscribe to real-time client updates
    subscriptionRef.current = realtimeService.subscribeToClientUpdates(
      handleClientUpdate
    );

    // Subscribe to connection status changes
    connectionSubscriptionRef.current = realtimeService.onConnectionChange(
      handleConnectionChange
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
  }, [loadClients, handleClientUpdate, handleConnectionChange]);

  // Handle filter/pagination changes
  useEffect(() => {
    const filtersChanged = JSON.stringify(lastFiltersRef.current) !== JSON.stringify(filters);
    const paginationChanged = JSON.stringify(lastPaginationRef.current) !== JSON.stringify(pagination);
    
    if (filtersChanged || paginationChanged) {
      lastFiltersRef.current = filters;
      lastPaginationRef.current = pagination;
      loadClients();
    }
  }, [filters, pagination, loadClients]);

  // Handle connection recovery
  useEffect(() => {
    if (connectionStatus.status === 'connected' && clients.length === 0 && !isLoading) {
      // Refresh data when connection is restored
      refresh();
    }
  }, [connectionStatus.status, clients.length, isLoading, refresh]);

  return {
    clients,
    isLoading,
    error,
    connectionStatus,
    refresh,
    totalCount,
    totalPages,
    currentPage,
    updateClientOptimistically,
    revertOptimisticUpdate
  };
};