import { AdminDashboardData } from '@/hooks/useAdminDashboardData';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh data
}

// Cache entry structure
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  accessCount: number;
  lastAccessed: number;
  isStale: boolean;
}

// Cache invalidation strategies
type InvalidationStrategy = 
  | 'time-based' // Invalidate after TTL
  | 'dependency-based' // Invalidate when dependencies change
  | 'manual' // Manual invalidation only
  | 'lru'; // Least Recently Used

// Cache key generator
export class CacheKeyGenerator {
  static dashboardMetrics(clientId?: string): string {
    return `dashboard:metrics:${clientId || 'all'}`;
  }
  
  static platformMetrics(): string {
    return 'dashboard:platform:metrics';
  }
  
  static financialMetrics(timeframe: string = 'current_month'): string {
    return `dashboard:financial:${timeframe}`;
  }
  
  static costBreakdown(startDate: string, endDate: string): string {
    return `dashboard:costs:${startDate}:${endDate}`;
  }
  
  static clientProfitability(timeframe: string = 'current_month'): string {
    return `dashboard:profitability:${timeframe}`;
  }
  
  static growthTrends(): string {
    return 'dashboard:growth:trends';
  }
  
  static clients(filters?: any): string {
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    return `dashboard:clients:${filterKey}`;
  }
  
  static users(filters?: any): string {
    const filterKey = filters ? JSON.stringify(filters) : 'all';
    return `dashboard:users:${filterKey}`;
  }
  
  static clientDistribution(): string {
    return 'dashboard:client:distribution';
  }
  
  static userAnalytics(): string {
    return 'dashboard:user:analytics';
  }
}

// Advanced caching service with multiple strategies
export class DashboardCacheService {
  private cache = new Map<string, CacheEntry>();
  private dependencies = new Map<string, Set<string>>();
  private invalidationCallbacks = new Map<string, Array<() => void>>();
  
  // Default cache configurations for different data types
  private static readonly DEFAULT_CONFIGS: Record<string, CacheConfig> = {
    'dashboard:metrics': {
      ttl: 2 * 60 * 1000, // 2 minutes
      maxSize: 50,
      staleWhileRevalidate: true
    },
    'dashboard:platform': {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 10,
      staleWhileRevalidate: true
    },
    'dashboard:financial': {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 20,
      staleWhileRevalidate: true
    },
    'dashboard:costs': {
      ttl: 15 * 60 * 1000, // 15 minutes
      maxSize: 30,
      staleWhileRevalidate: true
    },
    'dashboard:profitability': {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 20,
      staleWhileRevalidate: true
    },
    'dashboard:growth': {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 5,
      staleWhileRevalidate: true
    },
    'dashboard:clients': {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 20,
      staleWhileRevalidate: true
    },
    'dashboard:users': {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 20,
      staleWhileRevalidate: true
    },
    'dashboard:client:distribution': {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 5,
      staleWhileRevalidate: true
    },
    'dashboard:user:analytics': {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 5,
      staleWhileRevalidate: true
    }
  };
  
  private getConfig(key: string): CacheConfig {
    // Find matching config by prefix
    for (const [prefix, config] of Object.entries(DashboardCacheService.DEFAULT_CONFIGS)) {
      if (key.startsWith(prefix)) {
        return config;
      }
    }
    
    // Default config
    return {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      staleWhileRevalidate: true
    };
  }
  
  // Get data from cache
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Check if entry is stale
    const now = Date.now();
    entry.isStale = (now - entry.timestamp) > entry.ttl;
    
    return entry;
  }
  
  // Set data in cache
  set<T>(key: string, data: T, customTtl?: number): void {
    const config = this.getConfig(key);
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: customTtl || config.ttl,
      key,
      accessCount: 1,
      lastAccessed: now,
      isStale: false
    };
    
    // Enforce cache size limits using LRU eviction
    if (this.cache.size >= config.maxSize) {
      this.evictLRU(key, config.maxSize);
    }
    
    this.cache.set(key, entry);
  }
  
  // Check if data exists and is fresh
  has(key: string): boolean {
    const entry = this.get(key);
    return entry !== null && !entry.isStale;
  }
  
  // Check if data exists (including stale data)
  hasAny(key: string): boolean {
    return this.cache.has(key);
  }
  
  // Get fresh data or return stale data with revalidation flag
  getWithRevalidation<T>(key: string): {
    data: T | null;
    isStale: boolean;
    needsRevalidation: boolean;
  } {
    const entry = this.get<T>(key);
    
    if (!entry) {
      return {
        data: null,
        isStale: false,
        needsRevalidation: true
      };
    }
    
    const config = this.getConfig(key);
    
    return {
      data: entry.data,
      isStale: entry.isStale,
      needsRevalidation: entry.isStale && config.staleWhileRevalidate
    };
  }
  
  // Invalidate specific cache entry
  invalidate(key: string): void {
    this.cache.delete(key);
    
    // Trigger invalidation callbacks
    const callbacks = this.invalidationCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in cache invalidation callback:', error);
        }
      });
    }
    
    // Invalidate dependent entries
    const dependents = this.dependencies.get(key);
    if (dependents) {
      dependents.forEach(dependentKey => {
        this.invalidate(dependentKey);
      });
    }
  }
  
  // Invalidate by pattern
  invalidatePattern(pattern: RegExp): void {
    const keysToInvalidate = Array.from(this.cache.keys()).filter(key => 
      pattern.test(key)
    );
    
    keysToInvalidate.forEach(key => this.invalidate(key));
  }
  
  // Invalidate all cache entries
  clear(): void {
    this.cache.clear();
    this.dependencies.clear();
    this.invalidationCallbacks.clear();
  }
  
  // Set up cache dependencies
  addDependency(key: string, dependsOn: string): void {
    if (!this.dependencies.has(dependsOn)) {
      this.dependencies.set(dependsOn, new Set());
    }
    this.dependencies.get(dependsOn)!.add(key);
  }
  
  // Add invalidation callback
  onInvalidate(key: string, callback: () => void): () => void {
    if (!this.invalidationCallbacks.has(key)) {
      this.invalidationCallbacks.set(key, []);
    }
    
    this.invalidationCallbacks.get(key)!.push(callback);
    
    // Return cleanup function
    return () => {
      const callbacks = this.invalidationCallbacks.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  // LRU eviction
  private evictLRU(excludeKey: string, maxSize: number): void {
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => key !== excludeKey)
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
    
    // Remove oldest entries until we're under the limit
    const toRemove = Math.max(0, entries.length - maxSize + 1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i].key);
    }
  }
  
  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      freshEntries: entries.filter(entry => !entry.isStale).length,
      staleEntries: entries.filter(entry => entry.isStale).length,
      totalAccessCount: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length 
        : 0,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: this.calculateHitRate()
    };
  }
  
  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Overhead for entry metadata
    }
    return size;
  }
  
  private hitRate = 0;
  private hits = 0;
  private misses = 0;
  
  private calculateHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }
  
  // Track cache hits/misses for analytics
  recordHit(): void {
    this.hits++;
    this.updateHitRate();
  }
  
  recordMiss(): void {
    this.misses++;
    this.updateHitRate();
  }
  
  private updateHitRate(): void {
    this.hitRate = this.calculateHitRate();
  }
}

// Singleton instance
export const dashboardCache = new DashboardCacheService();

// Cache-aware data fetcher with automatic caching
export class CachedDataFetcher {
  constructor(private cache: DashboardCacheService = dashboardCache) {}
  
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number;
      forceRefresh?: boolean;
      staleWhileRevalidate?: boolean;
    }
  ): Promise<T> {
    const { ttl, forceRefresh = false, staleWhileRevalidate = true } = options || {};
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.getWithRevalidation<T>(key);
      
      if (cached.data !== null) {
        this.cache.recordHit();
        
        // Return fresh data immediately
        if (!cached.isStale) {
          return cached.data;
        }
        
        // For stale data, return it but trigger background refresh
        if (staleWhileRevalidate && cached.needsRevalidation) {
          // Background refresh (don't await)
          this.backgroundRefresh(key, fetcher, ttl);
          return cached.data;
        }
      }
    }
    
    // Cache miss or force refresh
    this.cache.recordMiss();
    
    try {
      const data = await fetcher();
      this.cache.set(key, data, ttl);
      return data;
    } catch (error) {
      // If we have stale data and the fetch fails, return stale data
      const staleData = this.cache.get<T>(key);
      if (staleData) {
        console.warn(`Fetch failed for ${key}, returning stale data:`, error);
        return staleData.data;
      }
      
      throw error;
    }
  }
  
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.cache.set(key, data, ttl);
    } catch (error) {
      console.warn(`Background refresh failed for ${key}:`, error);
    }
  }
}

// Query optimization utilities
export class QueryOptimizer {
  // Batch multiple queries together
  static async batchQueries<T>(
    queries: Array<{
      key: string;
      fetcher: () => Promise<T>;
      ttl?: number;
    }>,
    options?: {
      maxConcurrency?: number;
      failFast?: boolean;
    }
  ): Promise<Array<{ key: string; data: T | null; error: Error | null }>> {
    const { maxConcurrency = 5, failFast = false } = options || {};
    const fetcher = new CachedDataFetcher();
    
    // Process queries in batches to avoid overwhelming the system
    const results: Array<{ key: string; data: T | null; error: Error | null }> = [];
    
    for (let i = 0; i < queries.length; i += maxConcurrency) {
      const batch = queries.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async ({ key, fetcher: queryFetcher, ttl }) => {
        try {
          const data = await fetcher.fetchWithCache(key, queryFetcher, { ttl });
          return { key, data, error: null };
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          
          if (failFast) {
            throw err;
          }
          
          return { key, data: null, error: err };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  // Prefetch data based on usage patterns
  static async prefetchData(
    prefetchConfig: Array<{
      key: string;
      fetcher: () => Promise<any>;
      priority: 'high' | 'medium' | 'low';
      condition?: () => boolean;
    }>
  ): Promise<void> {
    const fetcher = new CachedDataFetcher();
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sortedConfig = prefetchConfig
      .filter(config => !config.condition || config.condition())
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Prefetch with delays between requests
    for (let i = 0; i < sortedConfig.length; i++) {
      const { key, fetcher: prefetchFetcher } = sortedConfig[i];
      
      try {
        // Check if already cached
        if (!dashboardCache.has(key)) {
          await fetcher.fetchWithCache(key, prefetchFetcher);
        }
        
        // Small delay between prefetches to avoid overwhelming
        if (i < sortedConfig.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`Prefetch failed for ${key}:`, error);
      }
    }
  }
}

// Cache warming strategies
export class CacheWarmer {
  private static readonly WARM_UP_STRATEGIES = {
    // Warm up based on user role and permissions
    adminDashboard: async () => {
      const fetcher = new CachedDataFetcher();
      
      // High priority data for admin dashboard
      const highPriorityKeys = [
        CacheKeyGenerator.platformMetrics(),
        CacheKeyGenerator.financialMetrics(),
        CacheKeyGenerator.clients(),
        CacheKeyGenerator.users()
      ];
      
      // Warm up high priority data first
      await Promise.allSettled(
        highPriorityKeys.map(async (key) => {
          // This would need actual fetcher functions
          // For now, just mark as warmed up
          console.log(`Warming up cache for ${key}`);
        })
      );
    },
    
    // Warm up based on time of day
    timeBasedWarmup: async () => {
      const hour = new Date().getHours();
      
      // Business hours (9 AM - 5 PM): warm up operational data
      if (hour >= 9 && hour <= 17) {
        await QueryOptimizer.prefetchData([
          {
            key: CacheKeyGenerator.dashboardMetrics(),
            fetcher: async () => ({}), // Placeholder
            priority: 'high'
          },
          {
            key: CacheKeyGenerator.clientDistribution(),
            fetcher: async () => ({}), // Placeholder
            priority: 'medium'
          }
        ]);
      }
    }
  };
  
  static async warmUp(strategy: keyof typeof CacheWarmer.WARM_UP_STRATEGIES): Promise<void> {
    try {
      await CacheWarmer.WARM_UP_STRATEGIES[strategy]();
    } catch (error) {
      console.error(`Cache warm-up failed for strategy ${strategy}:`, error);
    }
  }
}

// Export singleton instances
export const cachedDataFetcher = new CachedDataFetcher();

// Cache performance monitoring
export const CachePerformanceMonitor = {
  startMonitoring: () => {
    // Monitor cache performance every 30 seconds
    setInterval(() => {
      const stats = dashboardCache.getStats();
      
      // Log performance metrics
      console.log('Cache Performance:', {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        entries: stats.totalEntries,
        memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)} KB`,
        averageAge: `${(stats.averageAge / 1000).toFixed(2)}s`
      });
      
      // Report to analytics if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'cache_performance', {
          hit_rate: Math.round(stats.hitRate),
          total_entries: stats.totalEntries,
          memory_usage_kb: Math.round(stats.memoryUsage / 1024)
        });
      }
    }, 30000);
  },
  
  getDetailedStats: () => dashboardCache.getStats()
};

export default DashboardCacheService;