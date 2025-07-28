import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BundleOptimization } from '@/utils/routeCodeSplitting';

/**
 * Hook to handle intelligent route preloading based on user navigation patterns
 */
export const useRoutePreloading = () => {
  const location = useLocation();

  useEffect(() => {
    // Preload likely next routes based on current route
    BundleOptimization.preloadBasedOnRoute(location.pathname);
  }, [location.pathname]);

  return {
    currentRoute: location.pathname,
    preloadRoute: (routePath: string) => {
      BundleOptimization.preloadBasedOnRoute(routePath);
    }
  };
};

/**
 * Hook for preloading heavy dependencies on demand
 */
export const useDynamicImports = () => {
  const loadCharts = async () => {
    try {
      return await BundleOptimization.loadChartLibrary();
    } catch (error) {
      console.warn('Failed to load chart library:', error);
      return null;
    }
  };

  const loadDateUtils = async () => {
    try {
      return await BundleOptimization.loadDateLibrary();
    } catch (error) {
      console.warn('Failed to load date library:', error);
      return null;
    }
  };

  const loadExportUtils = async () => {
    try {
      return await BundleOptimization.loadExportLibrary();
    } catch (error) {
      console.warn('Failed to load export library:', error);
      return null;
    }
  };

  return {
    loadCharts,
    loadDateUtils,
    loadExportUtils,
  };
};