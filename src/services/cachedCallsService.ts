/**
 * Cached wrapper for CallsService
 * Implements caching strategies for calls data
 */

import { CallsService } from './callsService';
import { 
  callsCache, 
  CacheKeys, 
  CacheInvalidation 
} from '@/utils/cache';
import type { 
  CallFilters, 
  CallStats 
} from './callsService';
import type { Call } from '@/context/CallsContext';

export const CachedCallsService = {
  /**
   * Get calls with caching
   */
  getCalls: async (filters?: CallFilters): Promise<Call[]> => {
    const cacheKey = CacheKeys.calls(filters);
    
    return callsCache.getOrSet(
      cacheKey,
      () => CallsService.getCalls(filters),
      1 * 60 * 1000 // 1 minute TTL for calls data
    );
  },

  /**
   * Get call statistics with caching
   */
  getCallStats: async (clientId?: string): Promise<CallStats> => {
    const cacheKey = CacheKeys.callStats(clientId);
    
    return callsCache.getOrSet(
      cacheKey,
      () => CallsService.getCallStats(clientId),
      2 * 60 * 1000 // 2 minutes TTL for stats
    );
  },

  /**
   * Get recent calls with caching
   */
  getRecentCalls: async (limit: number = 5, clientId?: string): Promise<Call[]> => {
    const cacheKey = CacheKeys.recentCalls(limit, clientId);
    
    return callsCache.getOrSet(
      cacheKey,
      () => CallsService.getRecentCalls(limit, clientId),
      30 * 1000 // 30 seconds TTL for recent calls
    );
  },

  /**
   * Get calls with custom cache TTL
   */
  getCallsWithTTL: async (filters?: CallFilters, ttl?: number): Promise<Call[]> => {
    const cacheKey = CacheKeys.calls(filters);
    
    return callsCache.getOrSet(
      cacheKey,
      () => CallsService.getCalls(filters),
      ttl || 1 * 60 * 1000
    );
  },

  /**
   * Batch load calls data for different filters
   */
  batchLoadCalls: async (
    clientId?: string,
    filterSets?: CallFilters[]
  ): Promise<Record<string, Call[]>> => {
    const defaultFilters: CallFilters[] = [
      { clientId }, // All calls
      { clientId, hasLead: true }, // Calls with leads
      { clientId, status: 'answered' }, // Answered calls
      { clientId, status: 'failed' } // Failed calls
    ];

    const filters = filterSets || defaultFilters;
    
    const promises = filters.map(async (filter, index) => {
      const data = await CachedCallsService.getCalls(filter);
      return [`filter_${index}`, data] as const;
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results);
  },

  /**
   * Get calls by date range with caching
   */
  getCallsByDateRange: async (
    startDate: string,
    endDate: string,
    clientId?: string
  ): Promise<Call[]> => {
    const filters: CallFilters = {
      startDate,
      endDate,
      clientId
    };

    return CachedCallsService.getCalls(filters);
  },

  /**
   * Get calls by status with caching
   */
  getCallsByStatus: async (
    status: string,
    clientId?: string
  ): Promise<Call[]> => {
    const filters: CallFilters = {
      status,
      clientId
    };

    return CachedCallsService.getCalls(filters);
  },

  /**
   * Invalidate calls cache for a specific client
   */
  invalidateCache: (clientId?: string) => {
    CacheInvalidation.invalidateCalls(clientId);
  },

  /**
   * Force refresh calls data (bypass cache)
   */
  refreshCalls: async (filters?: CallFilters): Promise<Call[]> => {
    const cacheKey = CacheKeys.calls(filters);
    callsCache.delete(cacheKey);
    return CachedCallsService.getCalls(filters);
  },

  /**
   * Force refresh call stats (bypass cache)
   */
  refreshCallStats: async (clientId?: string): Promise<CallStats> => {
    const cacheKey = CacheKeys.callStats(clientId);
    callsCache.delete(cacheKey);
    return CachedCallsService.getCallStats(clientId);
  },

  /**
   * Preload calls data for better performance
   */
  preloadCallsData: async (clientId?: string) => {
    const promises = [
      // Load recent calls
      CachedCallsService.getRecentCalls(10, clientId),
      // Load call stats
      CachedCallsService.getCallStats(clientId),
      // Load calls with different filters
      CachedCallsService.getCalls({ clientId }),
      CachedCallsService.getCalls({ clientId, hasLead: true }),
      CachedCallsService.getCalls({ clientId, status: 'answered' })
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload some calls data:', error);
    }
  },

  /**
   * Get cache statistics for calls
   */
  getCacheStats: () => {
    return callsCache.getStats();
  },

  /**
   * Clear calls cache
   */
  clearCache: () => {
    callsCache.clear();
  },

  /**
   * Warm up cache with common queries
   */
  warmUpCache: async (clientId?: string) => {
    // Common queries that are likely to be requested
    const commonQueries = [
      // Recent calls
      () => CachedCallsService.getRecentCalls(5, clientId),
      () => CachedCallsService.getRecentCalls(10, clientId),
      
      // Call stats
      () => CachedCallsService.getCallStats(clientId),
      
      // Common filters
      () => CachedCallsService.getCalls({ clientId }),
      () => CachedCallsService.getCalls({ clientId, hasLead: true }),
      () => CachedCallsService.getCalls({ clientId, status: 'answered' }),
      () => CachedCallsService.getCalls({ clientId, status: 'failed' }),
      
      // Date-based queries (last 7 days, last 30 days)
      () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return CachedCallsService.getCalls({
          clientId,
          startDate: sevenDaysAgo.toISOString(),
          endDate: now.toISOString()
        });
      },
      () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return CachedCallsService.getCalls({
          clientId,
          startDate: thirtyDaysAgo.toISOString(),
          endDate: now.toISOString()
        });
      }
    ];

    // Execute queries in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < commonQueries.length; i += batchSize) {
      const batch = commonQueries.slice(i, i + batchSize);
      try {
        await Promise.all(batch.map(query => query()));
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to warm up cache batch ${i / batchSize + 1}:`, error);
      }
    }
  }
};

// Export the original service as well for direct access when needed
export { CallsService };