/**
 * React hook for cache management
 * Provides utilities for cache invalidation and preloading
 */

import { useCallback, useEffect } from 'react';
import { 
  CacheInvalidation,
  dashboardCache,
  analyticsCache,
  callsCache,
  leadsCache,
  adminCache
} from '@/utils/cache';
import { CachedDashboardService } from '@/services/cachedDashboardService';
import { CachedAnalyticsService } from '@/services/cachedAnalyticsService';
import { CachedCallsService } from '@/services/cachedCallsService';
import { CachedAdminService } from '@/services/cachedAdminService';

export interface CacheStats {
  dashboard: { size: number; maxSize: number };
  analytics: { size: number; maxSize: number };
  calls: { size: number; maxSize: number };
  leads: { size: number; maxSize: number };
  admin: { size: number; maxSize: number };
}

export const useCache = (clientId?: string | null) => {
  /**
   * Invalidate all caches for the current client
   */
  const invalidateAll = useCallback(() => {
    CacheInvalidation.invalidateAll();
  }, []);

  /**
   * Invalidate dashboard cache
   */
  const invalidateDashboard = useCallback(() => {
    CacheInvalidation.invalidateDashboard(clientId);
  }, [clientId]);

  /**
   * Invalidate analytics cache
   */
  const invalidateAnalytics = useCallback(() => {
    CacheInvalidation.invalidateAnalytics(clientId);
  }, [clientId]);

  /**
   * Invalidate calls cache
   */
  const invalidateCalls = useCallback(() => {
    CacheInvalidation.invalidateCalls(clientId);
  }, [clientId]);

  /**
   * Invalidate leads cache
   */
  const invalidateLeads = useCallback(() => {
    CacheInvalidation.invalidateLeads(clientId);
  }, [clientId]);

  /**
   * Invalidate admin cache
   */
  const invalidateAdmin = useCallback(() => {
    CacheInvalidation.invalidateAdmin();
  }, []);

  /**
   * Preload dashboard data
   */
  const preloadDashboard = useCallback(async () => {
    try {
      await CachedDashboardService.preloadDashboardData(clientId);
    } catch (error) {
      console.warn('Failed to preload dashboard data:', error);
    }
  }, [clientId]);

  /**
   * Preload analytics data
   */
  const preloadAnalytics = useCallback(async () => {
    try {
      await CachedAnalyticsService.preloadAnalyticsData(clientId);
    } catch (error) {
      console.warn('Failed to preload analytics data:', error);
    }
  }, [clientId]);

  /**
   * Preload calls data
   */
  const preloadCalls = useCallback(async () => {
    try {
      await CachedCallsService.preloadCallsData(clientId);
    } catch (error) {
      console.warn('Failed to preload calls data:', error);
    }
  }, [clientId]);

  /**
   * Preload admin data
   */
  const preloadAdmin = useCallback(async () => {
    try {
      await CachedAdminService.preloadAdminData();
    } catch (error) {
      console.warn('Failed to preload admin data:', error);
    }
  }, []);

  /**
   * Preload all data for the current client
   */
  const preloadAll = useCallback(async () => {
    const promises = [
      preloadDashboard(),
      preloadAnalytics(),
      preloadCalls()
    ];

    // Add admin preload if no specific client (admin view)
    if (!clientId) {
      promises.push(preloadAdmin());
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload some data:', error);
    }
  }, [clientId, preloadDashboard, preloadAnalytics, preloadCalls, preloadAdmin]);

  /**
   * Warm up caches with common queries
   */
  const warmUpCaches = useCallback(async () => {
    const promises = [
      CachedCallsService.warmUpCache(clientId)
    ];

    // Add admin cache warm up if no specific client
    if (!clientId) {
      promises.push(CachedAdminService.warmUpCache());
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to warm up some caches:', error);
    }
  }, [clientId]);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback((): CacheStats => {
    return {
      dashboard: dashboardCache.getStats(),
      analytics: analyticsCache.getStats(),
      calls: callsCache.getStats(),
      leads: leadsCache.getStats(),
      admin: adminCache.getStats()
    };
  }, []);

  /**
   * Clear all caches
   */
  const clearAllCaches = useCallback(() => {
    dashboardCache.clear();
    analyticsCache.clear();
    callsCache.clear();
    leadsCache.clear();
    adminCache.clear();
  }, []);

  /**
   * Refresh specific data by invalidating cache and reloading
   */
  const refreshDashboard = useCallback(async () => {
    invalidateDashboard();
    await preloadDashboard();
  }, [invalidateDashboard, preloadDashboard]);

  const refreshAnalytics = useCallback(async () => {
    invalidateAnalytics();
    await preloadAnalytics();
  }, [invalidateAnalytics, preloadAnalytics]);

  const refreshCalls = useCallback(async () => {
    invalidateCalls();
    await preloadCalls();
  }, [invalidateCalls, preloadCalls]);

  const refreshAdmin = useCallback(async () => {
    invalidateAdmin();
    await preloadAdmin();
  }, [invalidateAdmin, preloadAdmin]);

  /**
   * Auto-preload data on mount
   */
  useEffect(() => {
    // Preload data when component mounts or clientId changes
    preloadAll();
  }, [preloadAll]);

  /**
   * Auto-warm up caches on mount
   */
  useEffect(() => {
    // Warm up caches after a short delay to avoid blocking initial render
    const timer = setTimeout(() => {
      warmUpCaches();
    }, 1000);

    return () => clearTimeout(timer);
  }, [warmUpCaches]);

  return {
    // Invalidation methods
    invalidateAll,
    invalidateDashboard,
    invalidateAnalytics,
    invalidateCalls,
    invalidateLeads,
    invalidateAdmin,

    // Preloading methods
    preloadAll,
    preloadDashboard,
    preloadAnalytics,
    preloadCalls,
    preloadAdmin,

    // Cache management
    warmUpCaches,
    getCacheStats,
    clearAllCaches,

    // Refresh methods
    refreshDashboard,
    refreshAnalytics,
    refreshCalls,
    refreshAdmin
  };
};

/**
 * Hook for global cache management (admin users)
 */
export const useGlobalCache = () => {
  return useCache(null);
};

/**
 * Hook for client-specific cache management
 */
export const useClientCache = (clientId: string) => {
  return useCache(clientId);
};