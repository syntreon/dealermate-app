import { useState, useEffect, useCallback } from 'react';
import { SystemStatusService, PaginatedMessages, EnhancedSystemMessage } from '@/services/systemStatusService';

interface UseSystemMessagesOptions {
  pageSize?: number;
  clientId?: string | null;
  autoLoad?: boolean;
}

interface UseSystemMessagesResult {
  // Data
  messages: EnhancedSystemMessage[];
  totalCount: number;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // State
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refresh: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

/**
 * Custom hook for managing system messages with pagination, caching, and CRUD operations
 * 
 * Features:
 * - Automatic caching with TTL
 * - Pagination with navigation helpers
 * - Manual refresh capability
 * - Delete functionality with cache invalidation
 * - Loading and error states
 * - Responsive pagination logic
 */
export const useSystemMessages = ({
  pageSize = 5,
  clientId,
  autoLoad = true
}: UseSystemMessagesOptions = {}): UseSystemMessagesResult => {
  
  // State management
  const [data, setData] = useState<PaginatedMessages | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch messages with error handling and loading states
  const fetchMessages = useCallback(async (page: number, forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await SystemStatusService.getSystemMessagesPaginated(
        page,
        pageSize,
        clientId,
        forceRefresh
      );
      
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching system messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, clientId]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchMessages(currentPage, true);
  }, [fetchMessages, currentPage]);

  // Navigation functions
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || (data && page > Math.ceil(data.totalCount / pageSize))) {
      return;
    }
    await fetchMessages(page);
  }, [fetchMessages, data, pageSize]);

  const nextPage = useCallback(async () => {
    if (data?.hasMore) {
      await goToPage(currentPage + 1);
    }
  }, [goToPage, currentPage, data?.hasMore]);

  const prevPage = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [goToPage, currentPage]);

  // Delete message with cache invalidation and UI updates
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await SystemStatusService.deleteSystemMessage(messageId);
      
      // Refresh current page to reflect deletion
      await fetchMessages(currentPage, true);
      
      // If current page is now empty and we're not on page 1, go to previous page
      if (data && data.messages.length === 1 && currentPage > 1) {
        await goToPage(currentPage - 1);
      }
    } catch (err) {
      console.error('Error deleting system message:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete message'));
      throw err; // Re-throw for component error handling
    } finally {
      setIsLoading(false);
    }
  }, [fetchMessages, currentPage, data, goToPage]);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      fetchMessages(1);
    }
  }, [fetchMessages, autoLoad]);

  // Computed values
  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const hasNextPage = data?.hasMore || false;
  const hasPrevPage = currentPage > 1;

  return {
    // Data
    messages: data?.messages || [],
    totalCount: data?.totalCount || 0,
    
    // Pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // State
    isLoading,
    error,
    
    // Actions
    refresh,
    goToPage,
    nextPage,
    prevPage,
    deleteMessage
  };
};
