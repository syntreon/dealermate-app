/**
 * Cache utility for storing and retrieving frequently accessed data
 * Implements in-memory caching with TTL (Time To Live) support
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class Cache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100; // 100 entries default
  }

  /**
   * Set a value in the cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set pattern - if key exists return it, otherwise compute and cache
   */
  async getOrSet<R = T>(
    key: string, 
    computeFn: () => Promise<R>, 
    ttl?: number
  ): Promise<R> {
    const cached = this.get(key) as R;
    if (cached !== null) {
      return cached;
    }

    const result = await computeFn();
    this.set(key, result as any, ttl);
    return result;
  }
}

/**
 * Global cache instances for different data types
 */
export const dashboardCache = new Cache({
  ttl: 2 * 60 * 1000, // 2 minutes for dashboard data
  maxSize: 50
});

export const analyticsCache = new Cache({
  ttl: 5 * 60 * 1000, // 5 minutes for analytics data
  maxSize: 100
});

export const callsCache = new Cache({
  ttl: 1 * 60 * 1000, // 1 minute for calls data
  maxSize: 200
});

export const leadsCache = new Cache({
  ttl: 1 * 60 * 1000, // 1 minute for leads data
  maxSize: 200
});

export const adminCache = new Cache({
  ttl: 3 * 60 * 1000, // 3 minutes for admin data
  maxSize: 150
});

/**
 * Cache key generators for consistent key naming
 */
export const CacheKeys = {
  dashboardMetrics: (clientId?: string | null) => 
    `dashboard:metrics:${clientId || 'platform'}`,
  
  callDistribution: (clientId?: string | null, timeframe?: string) => 
    `dashboard:call-distribution:${clientId || 'platform'}:${timeframe || 'week'}`,
  
  analyticsData: (clientId?: string | null, timeframe?: string) => 
    `analytics:data:${clientId || 'platform'}:${timeframe || 'month'}`,
  
  callPerformance: (clientId?: string | null) => 
    `analytics:call-performance:${clientId || 'platform'}`,
  
  leadConversion: (clientId?: string | null) => 
    `analytics:lead-conversion:${clientId || 'platform'}`,
  
  calls: (filters?: any) => 
    `calls:list:${JSON.stringify(filters || {})}`,
  
  callStats: (clientId?: string) => 
    `calls:stats:${clientId || 'platform'}`,
  
  recentCalls: (limit?: number, clientId?: string) => 
    `calls:recent:${limit || 5}:${clientId || 'platform'}`,
  
  adminClients: (filters?: any, pagination?: any) => 
    `admin:clients:${JSON.stringify({ filters, pagination })}`,
  
  adminUsers: (filters?: any, pagination?: any) => 
    `admin:users:${JSON.stringify({ filters, pagination })}`,
  
  adminPlatformMetrics: () => 'admin:platform-metrics',
  
  clientDistribution: () => 'admin:client-distribution',
  
  userAnalytics: () => 'admin:user-analytics',
  
  systemHealth: (clientId?: string | null) => 
    `system:health:${clientId || 'platform'}`,
  
  agentStatus: (clientId?: string | null) => 
    `agent:status:${clientId || 'platform'}`,
  
  systemMessages: (clientId?: string | null) => 
    `system:messages:${clientId || 'platform'}`
};

/**
 * Cache invalidation utilities
 */
export const CacheInvalidation = {
  /**
   * Invalidate all dashboard-related cache entries
   */
  invalidateDashboard: (clientId?: string | null) => {
    const patterns = [
      CacheKeys.dashboardMetrics(clientId),
      CacheKeys.callDistribution(clientId),
      CacheKeys.agentStatus(clientId),
      CacheKeys.systemMessages(clientId)
    ];
    
    patterns.forEach(key => {
      dashboardCache.delete(key);
    });
  },

  /**
   * Invalidate all analytics-related cache entries
   */
  invalidateAnalytics: (clientId?: string | null) => {
    const patterns = [
      CacheKeys.analyticsData(clientId),
      CacheKeys.callPerformance(clientId),
      CacheKeys.leadConversion(clientId)
    ];
    
    patterns.forEach(key => {
      analyticsCache.delete(key);
    });
  },

  /**
   * Invalidate all calls-related cache entries
   */
  invalidateCalls: (clientId?: string) => {
    // Clear all calls cache since filters can vary
    callsCache.clear();
    
    // Also invalidate related dashboard and analytics data
    CacheInvalidation.invalidateDashboard(clientId);
    CacheInvalidation.invalidateAnalytics(clientId);
  },

  /**
   * Invalidate all leads-related cache entries
   */
  invalidateLeads: (clientId?: string) => {
    // Clear all leads cache
    leadsCache.clear();
    
    // Also invalidate related dashboard and analytics data
    CacheInvalidation.invalidateDashboard(clientId);
    CacheInvalidation.invalidateAnalytics(clientId);
  },

  /**
   * Invalidate all admin-related cache entries
   */
  invalidateAdmin: () => {
    adminCache.clear();
  },

  /**
   * Invalidate all cache entries
   */
  invalidateAll: () => {
    dashboardCache.clear();
    analyticsCache.clear();
    callsCache.clear();
    leadsCache.clear();
    adminCache.clear();
  }
};

/**
 * DISABLED: Automatic cache cleanup to reduce overhead and database egress costs
 * Cache cleanup now happens on-demand when cache size limits are reached
 */
// setInterval(() => {
//   dashboardCache.cleanup();
//   analyticsCache.cleanup();
//   callsCache.cleanup();
//   leadsCache.cleanup();
//   adminCache.cleanup();
// }, 5 * 60 * 1000);