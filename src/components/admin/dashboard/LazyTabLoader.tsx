import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorFallback';

// Performance monitoring for lazy loading
interface LazyLoadingMetrics {
  tabId: string;
  loadStartTime: number;
  loadEndTime?: number;
  loadDuration?: number;
  preloaded: boolean;
  error?: string;
}

// Lazy load all tab components with proper error handling
const FinancialTab = lazy(() => 
  import('./tabs/FinancialTab').then(module => ({ 
    default: module.FinancialTab 
  })).catch(error => {
    console.error('Failed to load FinancialTab:', error);
    throw error;
  })
);

const ClientsTab = lazy(() => 
  import('./tabs/ClientsTab').then(module => ({ 
    default: module.ClientsTab 
  })).catch(error => {
    console.error('Failed to load ClientsTab:', error);
    throw error;
  })
);

const UsersTab = lazy(() => 
  import('./tabs/UsersTab').then(module => ({ 
    default: module.UsersTab 
  })).catch(error => {
    console.error('Failed to load UsersTab:', error);
    throw error;
  })
);

const SystemTab = lazy(() => 
  import('./tabs/SystemTab').then(module => ({ 
    default: module.SystemTab 
  })).catch(error => {
    console.error('Failed to load SystemTab:', error);
    throw error;
  })
);

const OperationsTab = lazy(() => 
  import('./tabs/OperationsTab').then(module => ({ 
    default: module.OperationsTab 
  })).catch(error => {
    console.error('Failed to load OperationsTab:', error);
    throw error;
  })
);

// Tab component mapping
const TAB_COMPONENTS = {
  financial: FinancialTab,
  clients: ClientsTab,
  users: UsersTab,
  system: SystemTab,
  operations: OperationsTab,
} as const;

// Tab priority for preloading (higher priority loads first)
const TAB_PRIORITY = {
  financial: 1, // Highest priority - most commonly used
  clients: 2,
  users: 3,
  system: 4,
  operations: 5, // Lowest priority
} as const;

// Hook for tab preloading functionality
export const useTabPreloading = () => {
  const [preloadedTabs, setPreloadedTabs] = useState<Set<string>>(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const metricsRef = useRef<LazyLoadingMetrics[]>([]);

  // Preload high priority tabs
  const preloadHighPriorityTabs = useCallback(async () => {
    setIsPreloading(true);
    
    try {
      // Sort tabs by priority
      const sortedTabs = Object.entries(TAB_PRIORITY)
        .sort(([, a], [, b]) => a - b)
        .map(([tabId]) => tabId);

      // Preload top 2 priority tabs
      const highPriorityTabs = sortedTabs.slice(0, 2);
      
      for (const tabId of highPriorityTabs) {
        if (!preloadedTabs.has(tabId)) {
          const startTime = performance.now();
          
          try {
            // Preload the component
            await TAB_COMPONENTS[tabId as keyof typeof TAB_COMPONENTS];
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Record metrics
            metricsRef.current.push({
              tabId,
              loadStartTime: startTime,
              loadEndTime: endTime,
              loadDuration: duration,
              preloaded: true
            });
            
            setPreloadedTabs(prev => new Set([...prev, tabId]));
            
            console.log(`Preloaded ${tabId} tab in ${duration.toFixed(2)}ms`);
          } catch (error) {
            console.error(`Failed to preload ${tabId} tab:`, error);
            
            metricsRef.current.push({
              tabId,
              loadStartTime: startTime,
              loadEndTime: performance.now(),
              preloaded: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    } finally {
      setIsPreloading(false);
    }
  }, [preloadedTabs]);

  // Preload tab on hover with debouncing
  const preloadOnHover = useCallback((tabId: string) => {
    if (preloadedTabs.has(tabId)) return;

    // Clear existing timeout for this tab
    const existingTimeout = preloadTimeoutRef.current.get(tabId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for preloading
    const timeout = setTimeout(async () => {
      const startTime = performance.now();
      
      try {
        await TAB_COMPONENTS[tabId as keyof typeof TAB_COMPONENTS];
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        metricsRef.current.push({
          tabId,
          loadStartTime: startTime,
          loadEndTime: endTime,
          loadDuration: duration,
          preloaded: true
        });
        
        setPreloadedTabs(prev => new Set([...prev, tabId]));
        console.log(`Hover-preloaded ${tabId} tab in ${duration.toFixed(2)}ms`);
      } catch (error) {
        console.error(`Failed to hover-preload ${tabId} tab:`, error);
        
        metricsRef.current.push({
          tabId,
          loadStartTime: startTime,
          loadEndTime: performance.now(),
          preloaded: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      preloadTimeoutRef.current.delete(tabId);
    }, 200); // 200ms delay to avoid unnecessary preloading

    preloadTimeoutRef.current.set(tabId, timeout);
  }, [preloadedTabs]);

  // Cancel preload on mouse leave
  const cancelPreload = useCallback((tabId: string) => {
    const timeout = preloadTimeoutRef.current.get(tabId);
    if (timeout) {
      clearTimeout(timeout);
      preloadTimeoutRef.current.delete(tabId);
    }
  }, []);

  // Get loading metrics
  const getMetrics = useCallback(() => {
    return [...metricsRef.current];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      preloadTimeoutRef.current.clear();
    };
  }, []);

  return {
    preloadHighPriorityTabs,
    preloadOnHover,
    cancelPreload,
    isPreloading,
    preloadedTabs,
    getMetrics
  };
};

// Wrapper component for lazy-loaded tabs
interface LazyTabWrapperProps {
  tabId: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoadStart?: (tabId: string) => void;
  onLoadEnd?: (tabId: string, duration: number) => void;
  onError?: (tabId: string, error: Error) => void;
}

export const LazyTabWrapper: React.FC<LazyTabWrapperProps> = ({
  tabId,
  children,
  fallback,
  onLoadStart,
  onLoadEnd,
  onError
}) => {
  const [loadStartTime] = useState(() => performance.now());

  useEffect(() => {
    onLoadStart?.(tabId);
    
    return () => {
      const duration = performance.now() - loadStartTime;
      onLoadEnd?.(tabId, duration);
    };
  }, [tabId, loadStartTime, onLoadStart, onLoadEnd]);

  const handleError = useCallback((error: Error, errorInfo: any) => {
    console.error(`Error in ${tabId} tab:`, error, errorInfo);
    onError?.(tabId, error);
  }, [tabId, onError]);

  const defaultFallback = fallback || (
    <TabLoadingSkeleton 
      tabType={tabId as any}
      stage="initial"
      showProgress={true}
    />
  );

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          componentName={`${tabId} Tab`}
        />
      )}
      onError={handleError}
    >
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Individual lazy tab components with proper error boundaries
export const LazyFinancialTab: React.FC = () => (
  <LazyTabWrapper tabId="financial">
    <FinancialTab />
  </LazyTabWrapper>
);

export const LazyClientsTab: React.FC = () => (
  <LazyTabWrapper tabId="clients">
    <ClientsTab />
  </LazyTabWrapper>
);

export const LazyUsersTab: React.FC = () => (
  <LazyTabWrapper tabId="users">
    <UsersTab />
  </LazyTabWrapper>
);

export const LazySystemTab: React.FC = () => (
  <LazyTabWrapper tabId="system">
    <SystemTab />
  </LazyTabWrapper>
);

export const LazyOperationsTab: React.FC = () => (
  <LazyTabWrapper tabId="operations">
    <OperationsTab />
  </LazyTabWrapper>
);

// Performance monitoring component
interface LazyLoadingPerformanceMonitorProps {
  metrics: LazyLoadingMetrics[];
  onMetricsUpdate?: (metrics: LazyLoadingMetrics[]) => void;
}

export const LazyLoadingPerformanceMonitor: React.FC<LazyLoadingPerformanceMonitorProps> = ({
  metrics,
  onMetricsUpdate
}) => {
  useEffect(() => {
    if (metrics.length > 0) {
      const avgLoadTime = metrics
        .filter(m => m.loadDuration)
        .reduce((sum, m) => sum + (m.loadDuration || 0), 0) / metrics.length;
      
      const preloadedCount = metrics.filter(m => m.preloaded).length;
      const errorCount = metrics.filter(m => m.error).length;
      
      console.group('Lazy Loading Performance Metrics');
      console.log(`Average load time: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`Preloaded tabs: ${preloadedCount}`);
      console.log(`Failed loads: ${errorCount}`);
      console.log('Detailed metrics:', metrics);
      console.groupEnd();
      
      onMetricsUpdate?.(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // This component doesn't render anything visible
  return null;
};

// Bundle splitting optimization utilities
export const getBundleInfo = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    return {
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
      jsResourceCount: jsResources.length,
      totalJSSize: jsResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
      largestJSResource: jsResources.reduce((largest, resource) => 
        (resource.transferSize || 0) > (largest.transferSize || 0) ? resource : largest
      , jsResources[0])
    };
  }
  
  return null;
};

export default {
  LazyTabWrapper,
  useTabPreloading,
  LazyLoadingPerformanceMonitor,
  LazyFinancialTab,
  LazyClientsTab,
  LazyUsersTab,
  LazySystemTab,
  LazyOperationsTab,
  getBundleInfo
};