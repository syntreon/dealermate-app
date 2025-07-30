import React, { Suspense } from 'react';
import SectionErrorBoundary from './SectionErrorBoundary';
import SectionLoadingFallback from './SectionLoadingFallback';

interface WithSectionErrorBoundaryOptions {
  sectionName: string;
  loadingMessage?: string;
  showSkeleton?: boolean;
  showNavigation?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Higher-order component that wraps a component with error boundary and loading states
 * Specifically designed for admin section layouts
 */
export function withSectionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithSectionErrorBoundaryOptions
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <SectionErrorBoundary
        sectionName={options.sectionName}
        onError={options.onError}
        showNavigation={options.showNavigation}
      >
        <Suspense
          fallback={
            <SectionLoadingFallback
              sectionName={options.sectionName}
              message={options.loadingMessage}
              showSkeleton={options.showSkeleton}
            />
          }
        >
          <Component {...props} />
        </Suspense>
      </SectionErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withSectionErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Utility function to create section-specific HOCs
 */
export const createSectionWrapper = (sectionName: string) => {
  return <P extends object>(
    Component: React.ComponentType<P>,
    options?: Partial<Omit<WithSectionErrorBoundaryOptions, 'sectionName'>>
  ) => {
    return withSectionErrorBoundary(Component, {
      sectionName,
      showSkeleton: true,
      showNavigation: true,
      ...options,
    });
  };
};

// Pre-configured wrappers for each section
export const withManagementErrorBoundary = createSectionWrapper('Management');
export const withAnalyticsErrorBoundary = createSectionWrapper('Analytics');
export const withAuditErrorBoundary = createSectionWrapper('Audit');
export const withSettingsErrorBoundary = createSectionWrapper('Settings');
export const withDashboardErrorBoundary = createSectionWrapper('Dashboard');

/**
 * Hook for error recovery mechanisms
 */
export const useErrorRecovery = () => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const retry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
    setLastError(null);
  }, []);

  const reportError = React.useCallback((error: Error) => {
    setLastError(error);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Section error reported:', error);
    }

    // Report to external service if available
    if (typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.captureException(error, {
        tags: {
          component: 'SectionErrorBoundary',
          retryCount: retryCount.toString()
        }
      });
    }
  }, [retryCount]);

  const clearError = React.useCallback(() => {
    setLastError(null);
  }, []);

  return {
    retryCount,
    lastError,
    retry,
    reportError,
    clearError,
    hasError: lastError !== null,
  };
};

export default withSectionErrorBoundary;