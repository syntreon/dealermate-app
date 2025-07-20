import { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserFilters, PaginationOptions, PaginatedResponse } from '@/types/admin';
import { simpleRealtimeService as realtimeService, ConnectionStatus, Subscription } from '@/services/simpleRealtimeService';
import { AdminService } from '@/services/adminService';
import { toast } from 'sonner';

interface UseRealtimeUsersOptions {
  filters?: UserFilters;
  pagination?: PaginationOptions;
  enableNotifications?: boolean;
  onUserChange?: (user: User, action: 'create' | 'update' | 'delete') => void;
  enableOptimisticUpdates?: boolean;
}

interface UseRealtimeUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  refresh: () => Promise<void>;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  updateUserOptimistically: (userId: string, updates: Partial<User>) => void;
  revertOptimisticUpdate: (userId: string) => void;
}

export const useRealtimeUsers = (
  options: UseRealtimeUsersOptions = {}
): UseRealtimeUsersReturn => {
  const { 
    filters, 
    pagination, 
    enableNotifications = true, 
    onUserChange,
    enableOptimisticUpdates = true
  } = options;
  
  const [users, setUsers] = useState<User[]>([]);
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
  const optimisticUpdatesRef = useRef<Map<string, User>>(new Map());
  const lastFiltersRef = useRef<UserFilters | undefined>(filters);
  const lastPaginationRef = useRef<PaginationOptions | undefined>(pagination);

  // Load users data
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await AdminService.getUsersPaginated(filters, pagination);
      
      setUsers(result.data);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
      
      // Clear optimistic updates when fresh data is loaded
      optimisticUpdatesRef.current.clear();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination]);

  // Refresh users data
  const refresh = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  // Update user optimistically (for immediate UI feedback)
  const updateUserOptimistically = useCallback((userId: string, updates: Partial<User>) => {
    if (!enableOptimisticUpdates) return;

    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) return prevUsers;

      const updatedUsers = [...prevUsers];
      const originalUser = updatedUsers[userIndex];
      
      // Store original for potential revert
      optimisticUpdatesRef.current.set(userId, originalUser);
      
      // Apply optimistic update
      updatedUsers[userIndex] = { ...originalUser, ...updates };
      
      return updatedUsers;
    });
  }, [enableOptimisticUpdates]);

  // Revert optimistic update
  const revertOptimisticUpdate = useCallback((userId: string) => {
    const originalUser = optimisticUpdatesRef.current.get(userId);
    if (!originalUser) return;

    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === userId);
      if (userIndex === -1) return prevUsers;

      const updatedUsers = [...prevUsers];
      updatedUsers[userIndex] = originalUser;
      
      optimisticUpdatesRef.current.delete(userId);
      
      return updatedUsers;
    });
  }, []);

  // Handle real-time user updates
  const handleUserUpdate = useCallback((updatedUser: User) => {
    console.log('Received real-time user update:', updatedUser);
    
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === updatedUser.id);
      
      if (userIndex === -1) {
        // New user - add to list if it matches current filters
        // For simplicity, we'll refresh the data to ensure proper filtering
        setTimeout(() => refresh(), 100);
        return prevUsers;
      }

      // Update existing user
      const updatedUsers = [...prevUsers];
      const oldUser = updatedUsers[userIndex];
      updatedUsers[userIndex] = updatedUser;

      // Clear any optimistic update for this user
      optimisticUpdatesRef.current.delete(updatedUser.id);

      // Show notification for significant changes
      if (enableNotifications && oldUser.role !== updatedUser.role) {
        toast.info(`User "${updatedUser.full_name}" role changed to ${updatedUser.role}`);
      }

      // Call external callback if provided
      if (onUserChange) {
        onUserChange(updatedUser, 'update');
      }

      return updatedUsers;
    });
  }, [enableNotifications, onUserChange, refresh]);

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
    loadUsers();

    // Subscribe to real-time user updates
    subscriptionRef.current = realtimeService.subscribeToUserUpdates(
      handleUserUpdate
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
  }, [loadUsers, handleUserUpdate, handleConnectionChange]);

  // Handle filter/pagination changes
  useEffect(() => {
    const filtersChanged = JSON.stringify(lastFiltersRef.current) !== JSON.stringify(filters);
    const paginationChanged = JSON.stringify(lastPaginationRef.current) !== JSON.stringify(pagination);
    
    if (filtersChanged || paginationChanged) {
      lastFiltersRef.current = filters;
      lastPaginationRef.current = pagination;
      loadUsers();
    }
  }, [filters, pagination, loadUsers]);

  // Handle connection recovery
  useEffect(() => {
    if (connectionStatus.status === 'connected' && users.length === 0 && !isLoading) {
      // Refresh data when connection is restored
      refresh();
    }
  }, [connectionStatus.status, users.length, isLoading, refresh]);

  return {
    users,
    isLoading,
    error,
    connectionStatus,
    refresh,
    totalCount,
    totalPages,
    currentPage,
    updateUserOptimistically,
    revertOptimisticUpdate
  };
};