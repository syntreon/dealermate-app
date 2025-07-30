import { useCallback, useEffect, useState } from 'react';
import { errorRecoveryService, ErrorContext, ErrorReport, RecoveryStrategy } from '@/services/errorRecoveryService';

interface UseErrorRecoveryOptions {
  section: string;
  component: string;
  autoRecover?: boolean;
  onError?: (error: Error, report: ErrorReport) => void;
  onRecovery?: (success: boolean, strategy?: RecoveryStrategy) => void;
}

interface UseErrorRecoveryReturn {
  reportError: (error: Error, additionalContext?: Partial<ErrorContext>) => ErrorReport;
  attemptRecovery: (error: Error, additionalContext?: Partial<ErrorContext>) => Promise<boolean>;
  getRecoveryStrategies: (error: Error, additionalContext?: Partial<ErrorContext>) => RecoveryStrategy[];
  errorHistory: ErrorReport[];
  isRecovering: boolean;
  lastError: Error | null;
  clearError: () => void;
}

/**
 * Hook for error recovery functionality in React components
 */
export const useErrorRecovery = (options: UseErrorRecoveryOptions): UseErrorRecoveryReturn => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [errorHistory, setErrorHistory] = useState<ErrorReport[]>([]);

  const baseContext: Partial<ErrorContext> = {
    section: options.section,
    component: options.component,
  };

  const reportError = useCallback((
    error: Error, 
    additionalContext?: Partial<ErrorContext>
  ): ErrorReport => {
    const context = { ...baseContext, ...additionalContext };
    const report = errorRecoveryService.reportError(error, context);
    
    setLastError(error);
    setErrorHistory(prev => [...prev, report]);
    
    if (options.onError) {
      options.onError(error, report);
    }

    // Attempt auto-recovery if enabled
    if (options.autoRecover && report.recoverable) {
      attemptRecovery(error, additionalContext);
    }

    return report;
  }, [baseContext, options.onError, options.autoRecover]);

  const attemptRecovery = useCallback(async (
    error: Error,
    additionalContext?: Partial<ErrorContext>
  ): Promise<boolean> => {
    setIsRecovering(true);
    
    try {
      const context = { ...baseContext, ...additionalContext } as ErrorContext;
      const success = await errorRecoveryService.attemptRecovery(error, context);
      
      if (success) {
        setLastError(null);
      }
      
      if (options.onRecovery) {
        options.onRecovery(success);
      }
      
      return success;
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    } finally {
      setIsRecovering(false);
    }
  }, [baseContext, options.onRecovery]);

  const getRecoveryStrategies = useCallback((
    error: Error,
    additionalContext?: Partial<ErrorContext>
  ): RecoveryStrategy[] => {
    const context = { ...baseContext, ...additionalContext } as ErrorContext;
    return errorRecoveryService.getRecoveryStrategies(error, context);
  }, [baseContext]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Update error history when the service history changes
  useEffect(() => {
    const stats = errorRecoveryService.getErrorStatistics();
    setErrorHistory(stats.recentErrors);
  }, [lastError]);

  return {
    reportError,
    attemptRecovery,
    getRecoveryStrategies,
    errorHistory,
    isRecovering,
    lastError,
    clearError,
  };
};

/**
 * Hook for global error handling across the application
 */
export const useGlobalErrorHandler = () => {
  const [globalErrors, setGlobalErrors] = useState<ErrorReport[]>([]);

  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = event.error?.stack;
      
      const report = errorRecoveryService.reportError(error, {
        section: 'Global',
        component: 'Window',
      });
      
      setGlobalErrors(prev => [...prev, report]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      const report = errorRecoveryService.reportError(error, {
        section: 'Global',
        component: 'Promise',
      });
      
      setGlobalErrors(prev => [...prev, report]);
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const clearGlobalErrors = useCallback(() => {
    setGlobalErrors([]);
    errorRecoveryService.clearErrorHistory();
  }, []);

  return {
    globalErrors,
    clearGlobalErrors,
    errorStats: errorRecoveryService.getErrorStatistics(),
  };
};

export default useErrorRecovery;