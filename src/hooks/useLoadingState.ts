import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onError?: (error: Error) => void;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const { initialLoading = false, onError } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    isRefreshing: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setState(prev => ({ ...prev, isRefreshing: refreshing }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Wrapper for async operations with loading state management
  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    isRefresh = false
  ): Promise<T | null> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      clearError();

      const result = await operation();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setLoading, setRefreshing, clearError, onError]);

  // Reset all loading states
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isRefreshing: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    setLoading,
    setRefreshing,
    setError,
    clearError,
    withLoading,
    reset,
  };
};

export default useLoadingState;