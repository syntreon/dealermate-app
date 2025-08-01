import { useCallback, useRef, useState, useEffect } from 'react';

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

// Cache configuration
interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
  enablePersistence: boolean; // Enable localStorage persistence
  persistencePrefix: string; // Prefix for localStorage keys
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  memoryUsage: number; // Estimated memory usage in bytes
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  cleanupInterval: 60 * 1000, // 1 minute
  enablePersistence: true,
  persistencePrefix: 'admin_dashboard_cache_'
};

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    memoryUsage: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupTimer();
    this.loadFromPersistence();
  }

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    this.updateStats();
    
    return entry.data as T;
  }

  // Set data in cache
  set<T>(key: string, data: T, options: {
    ttl?: number;
    tags?: string[];
    persist?: boolean;
  } = {}): void {
    const {
      ttl = this.config.defaultTTL,
      tags = [],
      persist = this.config.enablePersistence
    } = options;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
      tags,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    
    // Persist to localStorage if enabled
    if (persist && this.config.enablePersistence) {
      this.persistEntry(key, entry);
    }

    this.updateStats();
  }

  // Delete specific key
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted && this.config.enablePersistence) {
      this.removePersistentEntry(key);
    }
    
    this.updateStats();
    return deleted;
  }

  // Clear cache by tags
  clearByTags(tags: string[]): number {
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        this.removePersistentEntry(key);
        cleared++;
      }
    }
    
    this.updateStats();
    return cleared;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.clearPersistence();
    this.updateStats();
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get all cache keys
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache entries by tag
  getByTag(tag: string): Array<{ key: string; data: any }> {
    const results: Array<{ key: string; data: any }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        results.push({ key, data: entry.data });
      }
    }
    
    return results;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Evict least recently used entry
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.removePersistentEntry(oldestKey);
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removePersistentEntry(key);
    });
    
    if (expiredKeys.length > 0) {
      this.updateStats();
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Stop cleanup timer
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Update cache statistics
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
    
    // Estimate memory usage (rough calculation)
    this.stats.memoryUsage = Array.from(this.cache.values()).reduce((total, entry) => {
      return total + JSON.stringify(entry).length * 2; // Rough estimate
    }, 0);
  }

  // Persist entry to localStorage
  private persistEntry(key: string, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;
    
    try {
      const persistKey = `${this.config.persistencePrefix}${key}`;
      localStorage.setItem(persistKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  // Remove persistent entry
  private removePersistentEntry(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const persistKey = `${this.config.persistencePrefix}${key}`;
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.warn('Failed to remove persistent cache entry:', error);
    }
  }

  // Load cache from localStorage
  private loadFromPersistence(): void {
    if (typeof window === 'undefined' || !this.config.enablePersistence) return;
    
    try {
      const prefix = this.config.persistencePrefix;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const cacheKey = key.substring(prefix.length);
          const entryData = localStorage.getItem(key);
          
          if (entryData) {
            const entry: CacheEntry = JSON.parse(entryData);
            
            // Check if entry is still valid
            if (Date.now() <= entry.timestamp + entry.ttl) {
              this.cache.set(cacheKey, entry);
            } else {
              // Remove expired persistent entry
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      this.updateStats();
    } catch (error) {
      console.warn('Failed to load cache from persistence:', error);
    }
  }

  // Clear all persistent cache
  private clearPersistence(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const prefix = this.config.persistencePrefix;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }
  }

  // Cleanup on destroy
  destroy(): void {
    this.stopCleanupTimer();
    this.cache.clear();
  }
}

// Create singleton cache instance
export const adminDashboardCache = new CacheService({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for dashboard data
  maxSize: 50,
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  enablePersistence: true,
  persistencePrefix: 'admin_dashboard_'
});

// Cache keys for different data types
export const CACHE_KEYS = {
  DASHBOARD_METRICS: 'dashboard_metrics',
  PLATFORM_METRICS: 'platform_metrics',
  FINANCIAL_METRICS: 'financial_metrics',
  COST_BREAKDOWN: 'cost_breakdown',
  CLIENT_PROFITABILITY: 'client_profitability',
  GROWTH_TRENDS: 'growth_trends',
  CLIENTS: 'clients',
  USERS: 'users',
  CLIENT_DISTRIBUTION: 'client_distribution',
  USER_ANALYTICS: 'user_analytics',
  SYSTEM_HEALTH: 'system_health'
} as const;

// Cache tags for invalidation
export const CACHE_TAGS = {
  FINANCIAL: 'financial',
  CLIENTS: 'clients',
  USERS: 'users',
  SYSTEM: 'system',
  OPERATIONS: 'operations',
  METRICS: 'metrics'
} as const;

// React hook for using cache
export const useCache = () => {
  const [stats, setStats] = useState<CacheStats>(adminDashboardCache.getStats());
  
  // DISABLED: Update stats periodically to reduce overhead
  useEffect(() => {
    // const interval = setInterval(() => {
    //   setStats(adminDashboardCache.getStats());
    // }, 1000);
    
    // return () => clearInterval(interval);
  }, []);

  const get = useCallback(<T>(key: string): T | null => {
    return adminDashboardCache.get<T>(key);
  }, []);

  const set = useCallback(<T>(
    key: string, 
    data: T, 
    options?: { ttl?: number; tags?: string[]; persist?: boolean }
  ) => {
    adminDashboardCache.set(key, data, options);
    setStats(adminDashboardCache.getStats());
  }, []);

  const remove = useCallback((key: string) => {
    adminDashboardCache.delete(key);
    setStats(adminDashboardCache.getStats());
  }, []);

  const clearByTags = useCallback((tags: string[]) => {
    adminDashboardCache.clearByTags(tags);
    setStats(adminDashboardCache.getStats());
  }, []);

  const clear = useCallback(() => {
    adminDashboardCache.clear();
    setStats(adminDashboardCache.getStats());
  }, []);

  const has = useCallback((key: string): boolean => {
    return adminDashboardCache.has(key);
  }, []);

  return {
    get,
    set,
    remove,
    clearByTags,
    clear,
    has,
    stats,
    getKeys: () => adminDashboardCache.getKeys(),
    getByTag: (tag: string) => adminDashboardCache.getByTag(tag)
  };
};

// Cache invalidation strategies
export const CacheInvalidation = {
  // Invalidate financial data
  invalidateFinancialData: () => {
    adminDashboardCache.clearByTags([CACHE_TAGS.FINANCIAL, CACHE_TAGS.METRICS]);
  },
  
  // Invalidate client data
  invalidateClientData: () => {
    adminDashboardCache.clearByTags([CACHE_TAGS.CLIENTS]);
  },
  
  // Invalidate user data
  invalidateUserData: () => {
    adminDashboardCache.clearByTags([CACHE_TAGS.USERS]);
  },
  
  // Invalidate system data
  invalidateSystemData: () => {
    adminDashboardCache.clearByTags([CACHE_TAGS.SYSTEM]);
  },
  
  // Invalidate all metrics
  invalidateAllMetrics: () => {
    adminDashboardCache.clearByTags([CACHE_TAGS.METRICS]);
  },
  
  // Smart invalidation based on data type
  smartInvalidate: (dataType: 'client' | 'user' | 'financial' | 'system' | 'all') => {
    switch (dataType) {
      case 'client':
        CacheInvalidation.invalidateClientData();
        CacheInvalidation.invalidateFinancialData(); // Client changes affect financial data
        break;
      case 'user':
        CacheInvalidation.invalidateUserData();
        break;
      case 'financial':
        CacheInvalidation.invalidateFinancialData();
        break;
      case 'system':
        CacheInvalidation.invalidateSystemData();
        break;
      case 'all':
        adminDashboardCache.clear();
        break;
    }
  }
};

export default adminDashboardCache;