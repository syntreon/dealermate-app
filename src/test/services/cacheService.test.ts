import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { adminDashboardCache, CACHE_KEYS, CACHE_TAGS, CacheInvalidation, useCache } from '@/services/cacheService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    adminDashboardCache.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    adminDashboardCache.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test' };
      
      adminDashboardCache.set('test-key', testData);
      const retrieved = adminDashboardCache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = adminDashboardCache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete specific keys', () => {
      adminDashboardCache.set('test-key', { data: 'test' });
      expect(adminDashboardCache.has('test-key')).toBe(true);
      
      const deleted = adminDashboardCache.delete('test-key');
      expect(deleted).toBe(true);
      expect(adminDashboardCache.has('test-key')).toBe(false);
    });

    it('should clear all cache', () => {
      adminDashboardCache.set('key1', 'data1');
      adminDashboardCache.set('key2', 'data2');
      
      expect(adminDashboardCache.getKeys()).toHaveLength(2);
      
      adminDashboardCache.clear();
      expect(adminDashboardCache.getKeys()).toHaveLength(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire data after TTL', () => {
      const testData = { id: 1, name: 'Test' };
      
      adminDashboardCache.set('test-key', testData, { ttl: 1000 }); // 1 second TTL
      expect(adminDashboardCache.get('test-key')).toEqual(testData);
      
      // Fast forward past TTL
      act(() => {
        vi.advanceTimersByTime(1001);
      });
      
      expect(adminDashboardCache.get('test-key')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const testData = { id: 1, name: 'Test' };
      
      adminDashboardCache.set('test-key', testData);
      expect(adminDashboardCache.get('test-key')).toEqual(testData);
      
      // Fast forward past default TTL (5 minutes)
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      });
      
      expect(adminDashboardCache.get('test-key')).toBeNull();
    });

    it('should not expire data before TTL', () => {
      const testData = { id: 1, name: 'Test' };
      
      adminDashboardCache.set('test-key', testData, { ttl: 2000 }); // 2 seconds TTL
      
      // Fast forward to just before TTL
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      
      expect(adminDashboardCache.get('test-key')).toEqual(testData);
    });
  });

  describe('Tag-based Operations', () => {
    it('should store data with tags', () => {
      const testData = { id: 1, name: 'Test' };
      
      adminDashboardCache.set('test-key', testData, { 
        tags: ['financial', 'metrics'] 
      });
      
      const retrieved = adminDashboardCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should clear data by tags', () => {
      adminDashboardCache.set('key1', 'data1', { tags: ['financial'] });
      adminDashboardCache.set('key2', 'data2', { tags: ['clients'] });
      adminDashboardCache.set('key3', 'data3', { tags: ['financial', 'metrics'] });
      
      const cleared = adminDashboardCache.clearByTags(['financial']);
      
      expect(cleared).toBe(2); // key1 and key3 should be cleared
      expect(adminDashboardCache.get('key1')).toBeNull();
      expect(adminDashboardCache.get('key2')).toEqual('data2');
      expect(adminDashboardCache.get('key3')).toBeNull();
    });

    it('should get data by tag', () => {
      adminDashboardCache.set('key1', 'data1', { tags: ['financial'] });
      adminDashboardCache.set('key2', 'data2', { tags: ['clients'] });
      adminDashboardCache.set('key3', 'data3', { tags: ['financial'] });
      
      const financialData = adminDashboardCache.getByTag('financial');
      
      expect(financialData).toHaveLength(2);
      expect(financialData.map(item => item.data)).toEqual(['data1', 'data3']);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses', () => {
      adminDashboardCache.set('test-key', 'test-data');
      
      // Hit
      adminDashboardCache.get('test-key');
      
      // Miss
      adminDashboardCache.get('non-existent');
      
      const stats = adminDashboardCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('should track cache size', () => {
      expect(adminDashboardCache.getStats().size).toBe(0);
      
      adminDashboardCache.set('key1', 'data1');
      adminDashboardCache.set('key2', 'data2');
      
      expect(adminDashboardCache.getStats().size).toBe(2);
    });

    it('should estimate memory usage', () => {
      const initialStats = adminDashboardCache.getStats();
      expect(initialStats.memoryUsage).toBe(0);
      
      adminDashboardCache.set('test-key', { large: 'data'.repeat(100) });
      
      const updatedStats = adminDashboardCache.getStats();
      expect(updatedStats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used items when cache is full', () => {
      // Set cache size to 2 for testing
      const smallCache = new (adminDashboardCache.constructor as any)({
        maxSize: 2,
        defaultTTL: 60000
      });
      
      smallCache.set('key1', 'data1');
      smallCache.set('key2', 'data2');
      
      // Access key1 to make it more recently used
      smallCache.get('key1');
      
      // Add key3, should evict key2 (least recently used)
      smallCache.set('key3', 'data3');
      
      expect(smallCache.get('key1')).toBe('data1');
      expect(smallCache.get('key2')).toBeNull();
      expect(smallCache.get('key3')).toBe('data3');
    });
  });

  describe('Persistence', () => {
    it('should persist data to localStorage', () => {
      adminDashboardCache.set('test-key', 'test-data', { persist: true });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin_dashboard_test-key',
        expect.stringContaining('test-data')
      );
    });

    it('should not persist data when persist is false', () => {
      adminDashboardCache.set('test-key', 'test-data', { persist: false });
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should remove persistent data when deleting', () => {
      adminDashboardCache.set('test-key', 'test-data', { persist: true });
      adminDashboardCache.delete('test-key');
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_dashboard_test-key');
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired entries automatically', () => {
      adminDashboardCache.set('key1', 'data1', { ttl: 1000 });
      adminDashboardCache.set('key2', 'data2', { ttl: 5000 });
      
      expect(adminDashboardCache.getStats().size).toBe(2);
      
      // Fast forward past first TTL but not second
      act(() => {
        vi.advanceTimersByTime(1001);
      });
      
      // Trigger cleanup (normally done by interval)
      act(() => {
        vi.advanceTimersByTime(60000); // Cleanup interval
      });
      
      expect(adminDashboardCache.get('key1')).toBeNull();
      expect(adminDashboardCache.get('key2')).toBe('data2');
    });
  });
});

describe('Cache Constants', () => {
  it('should have correct cache keys', () => {
    expect(CACHE_KEYS.DASHBOARD_METRICS).toBe('dashboard_metrics');
    expect(CACHE_KEYS.PLATFORM_METRICS).toBe('platform_metrics');
    expect(CACHE_KEYS.FINANCIAL_METRICS).toBe('financial_metrics');
    expect(CACHE_KEYS.CLIENTS).toBe('clients');
    expect(CACHE_KEYS.USERS).toBe('users');
  });

  it('should have correct cache tags', () => {
    expect(CACHE_TAGS.FINANCIAL).toBe('financial');
    expect(CACHE_TAGS.CLIENTS).toBe('clients');
    expect(CACHE_TAGS.USERS).toBe('users');
    expect(CACHE_TAGS.SYSTEM).toBe('system');
    expect(CACHE_TAGS.METRICS).toBe('metrics');
  });
});

describe('CacheInvalidation', () => {
  beforeEach(() => {
    adminDashboardCache.clear();
    
    // Set up test data with different tags
    adminDashboardCache.set('financial-data', 'data', { tags: [CACHE_TAGS.FINANCIAL] });
    adminDashboardCache.set('client-data', 'data', { tags: [CACHE_TAGS.CLIENTS] });
    adminDashboardCache.set('user-data', 'data', { tags: [CACHE_TAGS.USERS] });
    adminDashboardCache.set('system-data', 'data', { tags: [CACHE_TAGS.SYSTEM] });
    adminDashboardCache.set('metrics-data', 'data', { tags: [CACHE_TAGS.METRICS] });
  });

  it('should invalidate financial data', () => {
    CacheInvalidation.invalidateFinancialData();
    
    expect(adminDashboardCache.get('financial-data')).toBeNull();
    expect(adminDashboardCache.get('metrics-data')).toBeNull();
    expect(adminDashboardCache.get('client-data')).toBe('data');
  });

  it('should invalidate client data', () => {
    CacheInvalidation.invalidateClientData();
    
    expect(adminDashboardCache.get('client-data')).toBeNull();
    expect(adminDashboardCache.get('financial-data')).toBe('data');
  });

  it('should invalidate user data', () => {
    CacheInvalidation.invalidateUserData();
    
    expect(adminDashboardCache.get('user-data')).toBeNull();
    expect(adminDashboardCache.get('client-data')).toBe('data');
  });

  it('should invalidate system data', () => {
    CacheInvalidation.invalidateSystemData();
    
    expect(adminDashboardCache.get('system-data')).toBeNull();
    expect(adminDashboardCache.get('client-data')).toBe('data');
  });

  it('should smart invalidate based on data type', () => {
    CacheInvalidation.smartInvalidate('client');
    
    expect(adminDashboardCache.get('client-data')).toBeNull();
    expect(adminDashboardCache.get('financial-data')).toBeNull(); // Client changes affect financial
    expect(adminDashboardCache.get('user-data')).toBe('data');
  });

  it('should clear all cache when invalidating all', () => {
    CacheInvalidation.smartInvalidate('all');
    
    expect(adminDashboardCache.getStats().size).toBe(0);
  });
});

describe('useCache Hook', () => {
  it('should provide cache operations', () => {
    const { result } = renderHook(() => useCache());
    
    expect(typeof result.current.get).toBe('function');
    expect(typeof result.current.set).toBe('function');
    expect(typeof result.current.remove).toBe('function');
    expect(typeof result.current.clear).toBe('function');
    expect(typeof result.current.has).toBe('function');
  });

  it('should update stats when cache operations are performed', () => {
    const { result } = renderHook(() => useCache());
    
    expect(result.current.stats.size).toBe(0);
    
    act(() => {
      result.current.set('test-key', 'test-data');
    });
    
    expect(result.current.stats.size).toBe(1);
    
    act(() => {
      result.current.remove('test-key');
    });
    
    expect(result.current.stats.size).toBe(0);
  });

  it('should provide cache statistics', () => {
    const { result } = renderHook(() => useCache());
    
    act(() => {
      result.current.set('test-key', 'test-data');
      result.current.get('test-key'); // Hit
      result.current.get('non-existent'); // Miss
    });
    
    expect(result.current.stats.hits).toBe(1);
    expect(result.current.stats.misses).toBe(1);
    expect(result.current.stats.hitRate).toBe(50);
  });

  it('should clear cache by tags', () => {
    const { result } = renderHook(() => useCache());
    
    act(() => {
      result.current.set('key1', 'data1', { tags: ['tag1'] });
      result.current.set('key2', 'data2', { tags: ['tag2'] });
      result.current.clearByTags(['tag1']);
    });
    
    expect(result.current.get('key1')).toBeNull();
    expect(result.current.get('key2')).toBe('data2');
  });
});