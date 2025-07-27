/**
 * Cached wrapper for AnalyticsService
 * Implements caching strategies for analytics data
 */

import { AnalyticsService } from './analyticsService';
import { 
  analyticsCache, 
  CacheKeys, 
  CacheInvalidation 
} from '@/utils/cache';
import type { 
  AnalyticsMetrics, 
  AnalyticsFilters 
} from './analyticsService';

export const CachedAnalyticsService = {
  /**
   * Get analytics data with caching
   */
  getAnalyticsData: async (filters?: AnalyticsFilters): Promise<AnalyticsMetrics> => {
    const cacheKey = CacheKeys.analyticsData(filters?.clientId, filters?.timeframe);
    
    return analyticsCache.getOrSet(
      cacheKey,
      () => AnalyticsService.getAnalyticsData(filters),
      5 * 60 * 1000 // 5 minutes TTL
    );
  },

  /**
   * Get call performance metrics with caching
   */
  getCallPerformanceMetrics: async (clientId?: string): Promise<any> => {
    const cacheKey = CacheKeys.callPerformance(clientId);
    
    return analyticsCache.getOrSet(
      cacheKey,
      () => AnalyticsService.getCallPerformanceMetrics(clientId),
      3 * 60 * 1000 // 3 minutes TTL
    );
  },

  /**
   * Get lead conversion analytics with caching
   */
  getLeadConversionAnalytics: async (clientId?: string): Promise<any> => {
    const cacheKey = CacheKeys.leadConversion(clientId);
    
    return analyticsCache.getOrSet(
      cacheKey,
      () => AnalyticsService.getLeadConversionAnalytics(clientId),
      3 * 60 * 1000 // 3 minutes TTL
    );
  },

  /**
   * Get analytics data with custom cache TTL
   */
  getAnalyticsDataWithTTL: async (
    filters?: AnalyticsFilters, 
    ttl?: number
  ): Promise<AnalyticsMetrics> => {
    const cacheKey = CacheKeys.analyticsData(filters?.clientId, filters?.timeframe);
    
    return analyticsCache.getOrSet(
      cacheKey,
      () => AnalyticsService.getAnalyticsData(filters),
      ttl || 5 * 60 * 1000
    );
  },

  /**
   * Batch load analytics data for multiple timeframes
   */
  batchLoadAnalytics: async (
    clientId?: string,
    timeframes: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month']
  ): Promise<Record<string, AnalyticsMetrics>> => {
    const promises = timeframes.map(async (timeframe) => {
      const data = await CachedAnalyticsService.getAnalyticsData({
        clientId,
        timeframe
      });
      return [timeframe, data] as const;
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results);
  },

  /**
   * Invalidate analytics cache for a specific client
   */
  invalidateCache: (clientId?: string | null) => {
    CacheInvalidation.invalidateAnalytics(clientId);
  },

  /**
   * Force refresh analytics data (bypass cache)
   */
  refreshAnalyticsData: async (filters?: AnalyticsFilters): Promise<AnalyticsMetrics> => {
    const cacheKey = CacheKeys.analyticsData(filters?.clientId, filters?.timeframe);
    analyticsCache.delete(cacheKey);
    return CachedAnalyticsService.getAnalyticsData(filters);
  },

  /**
   * Preload analytics data for better performance
   */
  preloadAnalyticsData: async (clientId?: string | null) => {
    const timeframes: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];
    
    const promises = [
      // Load analytics for different timeframes
      ...timeframes.map(timeframe => 
        CachedAnalyticsService.getAnalyticsData({ clientId, timeframe })
      ),
      // Load performance metrics
      CachedAnalyticsService.getCallPerformanceMetrics(clientId),
      CachedAnalyticsService.getLeadConversionAnalytics(clientId)
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload some analytics data:', error);
    }
  },

  /**
   * Get cache statistics for analytics
   */
  getCacheStats: () => {
    return analyticsCache.getStats();
  },

  /**
   * Clear analytics cache
   */
  clearCache: () => {
    analyticsCache.clear();
  }
};

// Export the original service as well for direct access when needed
export { AnalyticsService };