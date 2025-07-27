/**
 * Cached wrapper for DashboardService
 * Implements caching strategies for frequently accessed dashboard data
 */

import { DashboardService } from './dashboardService';
import { 
  dashboardCache, 
  CacheKeys, 
  CacheInvalidation 
} from '@/utils/cache';
import type { 
  DashboardMetrics, 
  CallDistribution, 
  AnalyticsData,
  AgentStatus,
  SystemMessage 
} from './dashboardService';

export const CachedDashboardService = {
  /**
   * Get dashboard metrics with caching
   */
  getDashboardMetrics: async (clientId?: string | null): Promise<DashboardMetrics> => {
    const cacheKey = CacheKeys.dashboardMetrics(clientId);
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getDashboardMetrics(clientId),
      2 * 60 * 1000 // 2 minutes TTL
    );
  },

  /**
   * Get admin platform metrics with caching
   */
  getAdminPlatformMetrics: async () => {
    const cacheKey = CacheKeys.adminPlatformMetrics();
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getAdminPlatformMetrics(),
      3 * 60 * 1000 // 3 minutes TTL for admin data
    );
  },

  /**
   * Get client distribution metrics with caching
   */
  getClientDistributionMetrics: async () => {
    const cacheKey = CacheKeys.clientDistribution();
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getClientDistributionMetrics(),
      5 * 60 * 1000 // 5 minutes TTL
    );
  },

  /**
   * Get user analytics with caching
   */
  getUserAnalytics: async () => {
    const cacheKey = CacheKeys.userAnalytics();
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getUserAnalytics(),
      5 * 60 * 1000 // 5 minutes TTL
    );
  },

  /**
   * Get agent status with caching
   */
  getAgentStatus: async (clientId?: string | null): Promise<AgentStatus> => {
    const cacheKey = CacheKeys.agentStatus(clientId);
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getAgentStatus(clientId),
      30 * 1000 // 30 seconds TTL for real-time data
    );
  },

  /**
   * Get system messages with caching
   */
  getSystemMessages: async (clientId?: string | null): Promise<SystemMessage[]> => {
    const cacheKey = CacheKeys.systemMessages(clientId);
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getSystemMessages(clientId),
      1 * 60 * 1000 // 1 minute TTL
    );
  },

  /**
   * Get call distribution with caching
   */
  getCallDistribution: async (
    clientId?: string | null, 
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<CallDistribution> => {
    const cacheKey = CacheKeys.callDistribution(clientId, timeframe);
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getCallDistribution(clientId, timeframe),
      3 * 60 * 1000 // 3 minutes TTL
    );
  },

  /**
   * Get analytics data with caching
   */
  getAnalyticsData: async (
    clientId?: string | null, 
    timeframe: 'day' | 'week' | 'month' = 'month'
  ): Promise<AnalyticsData> => {
    const cacheKey = CacheKeys.analyticsData(clientId, timeframe);
    
    return dashboardCache.getOrSet(
      cacheKey,
      () => DashboardService.getAnalyticsData(clientId, timeframe),
      5 * 60 * 1000 // 5 minutes TTL
    );
  },

  /**
   * Invalidate dashboard cache for a specific client
   */
  invalidateCache: (clientId?: string | null) => {
    CacheInvalidation.invalidateDashboard(clientId);
  },

  /**
   * Force refresh dashboard metrics (bypass cache)
   */
  refreshDashboardMetrics: async (clientId?: string | null): Promise<DashboardMetrics> => {
    const cacheKey = CacheKeys.dashboardMetrics(clientId);
    dashboardCache.delete(cacheKey);
    return CachedDashboardService.getDashboardMetrics(clientId);
  },

  /**
   * Preload dashboard data for better performance
   */
  preloadDashboardData: async (clientId?: string | null) => {
    // Preload key dashboard data in parallel
    const promises = [
      CachedDashboardService.getDashboardMetrics(clientId),
      CachedDashboardService.getAgentStatus(clientId),
      CachedDashboardService.getSystemMessages(clientId),
      CachedDashboardService.getCallDistribution(clientId, 'week')
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload some dashboard data:', error);
    }
  }
};

// Export the original service as well for direct access when needed
export { DashboardService };