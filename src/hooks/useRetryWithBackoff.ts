import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // in milliseconds
  maxDelay?: number; // in milliseconds
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  nextRetryIn: number; // seconds until next retry
}

export const useRetryWithBackoff = (options: RetryOptions = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onRetry,
    onMaxRetriesReached
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryIn: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate delay with exponential backoff
  const calculateDelay = useCallback((attempt: number): number => {
    const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt), maxDelay);
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }, [initialDelay, backoffFactor, maxDelay]);

  // Clear any existing timeouts
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Start countdown display
  const startCountdown = useCallback((delayMs: number) => {
    let remainingSeconds = Math.ceil(delayMs / 1000);
    setRetryState(prev => ({ ...prev, nextRetryIn: remainingSeconds }));

    countdownRef.current = setInterval(() => {
      remainingSeconds -= 1;
      setRetryState(prev => ({ ...prev, nextRetryIn: remainingSeconds }));
      
      if (remainingSeconds <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
      }
    }, 1000);
  }, []);

  // Execute operation with retry logic
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    currentAttempt = 0
  ): Promise<T> => {
    try {
      const result = await operation();
      
      // Success - reset retry state
      setRetryState({
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        nextRetryIn: 0
      });
      clearTimeouts();
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      setRetryState(prev => ({
        ...prev,
        lastError: err,
        retryCount: currentAttempt + 1
      }));

      // Check if we should retry
      if (currentAttempt < maxRetries) {
        const delay = calculateDelay(currentAttempt);
        
        setRetryState(prev => ({ ...prev, isRetrying: true }));
        startCountdown(delay);
        
        if (onRetry) {
          onRetry(currentAttempt + 1, err);
        }

        // Schedule retry
        return new Promise<T>((resolve, reject) => {
          timeoutRef.current = setTimeout(async () => {
            try {
              const result = await executeWithRetry(operation, currentAttempt + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
        });
      } else {
        // Max retries reached
        setRetryState(prev => ({ ...prev, isRetrying: false }));
        clearTimeouts();
        
        if (onMaxRetriesReached) {
          onMaxRetriesReached(err);
        }
        
        throw err;
      }
    }
  }, [maxRetries, calculateDelay, startCountdown, clearTimeouts, onRetry, onMaxRetriesReached]);

  // Manual retry function
  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    clearTimeouts();
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: 0
    });
    return executeWithRetry(operation);
  }, [executeWithRetry, clearTimeouts]);

  // Cancel any pending retries
  const cancelRetry = useCallback(() => {
    clearTimeouts();
    setRetryState(prev => ({ ...prev, isRetrying: false, nextRetryIn: 0 }));
  }, [clearTimeouts]);

  // Reset retry state
  const reset = useCallback(() => {
    clearTimeouts();
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: 0
    });
  }, [clearTimeouts]);

  return {
    ...retryState,
    executeWithRetry,
    retry,
    cancelRetry,
    reset
  };
};

export default useRetryWithBackoff;