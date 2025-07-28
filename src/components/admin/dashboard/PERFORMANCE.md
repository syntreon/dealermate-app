# Admin Dashboard Performance Optimizations

This document outlines the comprehensive performance optimizations implemented for the admin dashboard, including lazy loading, caching, and query optimization.

## Overview

The admin dashboard implements multiple layers of performance optimization:

1. **Lazy Loading**: Tab components are loaded on-demand with intelligent preloading
2. **Data Caching**: Multi-level caching with TTL, tags, and persistence
3. **Query Optimization**: Optimized database queries with batch execution
4. **Auto-refresh**: Intelligent refresh with cache invalidation
5. **Bundle Splitting**: Optimized code splitting for faster initial loads

## 1. Lazy Loading System

### Components

- **LazyTabLoader.tsx**: Core lazy loading system with preloading capabilities
- **Individual Lazy Components**: LazyFinancialTab, LazyClientsTab, etc.
- **Performance Monitoring**: Real-time metrics and bundle analysis

### Features

#### Smart Preloading
```tsx
const { preloadHighPriorityTabs, preloadOnHover } = useTabPreloading();

// Preload high-priority tabs after initial load
useEffect(() => {
  const timer = setTimeout(preloadHighPriorityTabs, 1000);
  return () => clearTimeout(timer);
}, []);

// Preload on hover with debouncing
<TabsTrigger 
  onMouseEnter={() => preloadOnHover(tabId)}
  onMouseLeave={() => cancelPreload(tabId)}
>
```

#### Priority-Based Loading
```tsx
const TAB_PRIORITY = {
  financial: 1, // Highest priority - most commonly used
  clients: 2,
  users: 3,
  system: 4,
  operations: 5, // Lowest priority
};
```

#### Error Boundaries
Each lazy component is wrapped with error boundaries for graceful failure handling.

### Performance Metrics

The system tracks:
- Load times for each component
- Preload success/failure rates
- Bundle sizes and transfer times
- Cache hit/miss ratios

## 2. Data Caching System

### Components

- **cacheService.ts**: Comprehensive caching service with multiple strategies
- **useCachedAdminDashboardData.ts**: Cached version of the dashboard data hook

### Features

#### Multi-Level Caching
```tsx
interface CacheEntry {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}
```

#### TTL Configuration
```tsx
const CACHE_TTL = {
  DASHBOARD_METRICS: 2 * 60 * 1000,    // 2 minutes - frequently changing
  PLATFORM_METRICS: 5 * 60 * 1000,     // 5 minutes - moderately changing
  FINANCIAL_METRICS: 10 * 60 * 1000,   // 10 minutes - less frequently changing
  GROWTH_TRENDS: 30 * 60 * 1000,       // 30 minutes - rarely changing
};
```

#### Tag-Based Invalidation
```tsx
export const CACHE_TAGS = {
  FINANCIAL: 'financial',
  CLIENTS: 'clients',
  USERS: 'users',
  SYSTEM: 'system',
  OPERATIONS: 'operations',
  METRICS: 'metrics'
};

// Smart invalidation
CacheInvalidation.smartInvalidate('financial'); // Invalidates all financial data
```

#### Persistence
- localStorage persistence for cross-session caching
- Automatic cleanup of expired entries
- Memory usage monitoring and LRU eviction

### Usage

#### Basic Caching
```tsx
const { get, set, clearByTags } = useCache();

// Get from cache
const data = get<FinancialMetrics>('financial_metrics');

// Set with options
set('financial_metrics', data, {
  ttl: 10 * 60 * 1000,
  tags: ['financial', 'metrics'],
  persist: true
});

// Invalidate by tags
clearByTags(['financial']);
```

#### Cached Data Fetching
```tsx
const createCachedFetcher = <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number,
  tags: string[] = []
) => {
  return async (): Promise<T> => {
    const cached = adminDashboardCache.get<T>(cacheKey);
    if (cached !== null) return cached;
    
    const data = await fetcher();
    adminDashboardCache.set(cacheKey, data, { ttl, tags, persist: true });
    return data;
  };
};
```

## 3. Query Optimization

### Components

- **queryOptimizationService.ts**: Database query optimization utilities
- **Optimized Queries**: Pre-aggregated queries for common operations

### Features

#### Batch Query Execution
```tsx
const results = await QueryOptimizationService.executeBatch({
  metrics: () => getOptimizedDashboardMetrics(),
  profitability: () => getOptimizedClientProfitability(),
  costs: () => getOptimizedCostBreakdown()
});
```

#### Performance Monitoring
```tsx
const { result, duration } = await QueryOptimizationService.measureQueryPerformance(
  'dashboard_metrics',
  () => fetchDashboardMetrics()
);

// Logs slow queries (> 1 second)
// Tracks query performance over time
```

#### Optimized Queries
```sql
-- Single query with aggregations instead of multiple round trips
WITH call_stats AS (
  SELECT 
    COUNT(*) as total_calls,
    AVG(call_duration_seconds) as avg_duration,
    COUNT(CASE WHEN transfer_flag = true THEN 1 END) as transfers
  FROM calls
),
lead_stats AS (
  SELECT COUNT(*) as total_leads FROM leads
)
SELECT * FROM call_stats, lead_stats
```

#### Connection Optimization
```tsx
// Optimize connection parameters
await QueryOptimizationService.optimizeConnection();

// Set timeouts and connection pooling
statement_timeout: '30s'
idle_in_transaction_session_timeout: '10s'
```

## 4. Auto-Refresh System

### Features

#### Intelligent Refresh
```tsx
const { refresh } = useCachedAdminDashboardData({
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
});

// Manual refresh with cache invalidation
refresh(true); // invalidateCache = true
```

#### Pause/Resume
- Automatically pauses when user is inactive
- Resumes when user returns to the dashboard
- Respects browser visibility API

#### Selective Refresh
```tsx
// Refresh only specific sections
await retrySection('financialMetrics');

// Smart invalidation based on data changes
CacheInvalidation.smartInvalidate('client'); // Also invalidates financial data
```

## 5. Bundle Optimization

### Code Splitting
```tsx
// Lazy load tab components
const FinancialTab = lazy(() => import('./tabs/FinancialTab'));
const ClientsTab = lazy(() => import('./tabs/ClientsTab'));

// Bundle analysis
const bundleInfo = getBundleInfo();
console.log('Bundle size:', bundleInfo.totalJSSize);
```

### Performance Monitoring
```tsx
// Real-time performance metrics in development
{process.env.NODE_ENV === 'development' && (
  <LazyLoadingPerformanceMonitor 
    metrics={getMetrics()} 
    onMetricsUpdate={handleMetricsUpdate}
  />
)}
```

## Performance Metrics

### Key Performance Indicators

1. **Initial Load Time**: Time to first meaningful paint
2. **Tab Switch Time**: Time to load a new tab
3. **Cache Hit Rate**: Percentage of requests served from cache
4. **Query Performance**: Average database query time
5. **Memory Usage**: Client-side memory consumption

### Monitoring

#### Development Metrics
```tsx
// Lazy loading metrics
const metrics = getMetrics();
console.log('Average load time:', metrics.avgLoadTime);
console.log('Cache hit rate:', cacheStats.hitRate);

// Query performance
console.log('Slow queries:', slowQueries.length);
```

#### Production Monitoring
```tsx
// Send metrics to analytics service
onMetricsUpdate={(metrics) => {
  analytics.track('dashboard_performance', {
    avgLoadTime: metrics.avgLoadTime,
    cacheHitRate: metrics.cacheHitRate,
    errorRate: metrics.errorRate
  });
}}
```

## Best Practices

### 1. Cache Strategy
- Use appropriate TTL values based on data volatility
- Implement tag-based invalidation for related data
- Monitor cache hit rates and adjust strategies accordingly

### 2. Lazy Loading
- Preload high-priority components
- Use hover preloading for better UX
- Implement proper error boundaries

### 3. Query Optimization
- Use batch queries for related data
- Implement proper indexing strategies
- Monitor query performance regularly

### 4. Memory Management
- Implement LRU eviction for cache
- Clean up timers and intervals
- Monitor memory usage in production

## Configuration

### Cache Configuration
```tsx
const cacheConfig = {
  defaultTTL: 5 * 60 * 1000,     // 5 minutes
  maxSize: 50,                   // 50 entries
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  enablePersistence: true,
  persistencePrefix: 'admin_dashboard_'
};
```

### Lazy Loading Configuration
```tsx
const lazyConfig = {
  preloadDelay: 200,        // 200ms hover delay
  highPriorityDelay: 1000,  // 1s after initial load
  retryAttempts: 3,
  retryDelay: 1000
};
```

### Query Optimization Configuration
```tsx
const queryConfig = {
  batchSize: 10,           // Max queries per batch
  timeout: 30000,          // 30s query timeout
  slowQueryThreshold: 1000, // 1s slow query threshold
  enableMonitoring: true
};
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Check cache size and implement proper eviction
2. **Slow Initial Load**: Verify lazy loading is working correctly
3. **Cache Misses**: Review TTL values and invalidation strategies
4. **Query Timeouts**: Optimize queries and check database performance

### Debug Tools

```tsx
// Cache debugging
console.log('Cache stats:', adminDashboardCache.getStats());
console.log('Cache keys:', adminDashboardCache.getKeys());

// Lazy loading debugging
console.log('Preloaded tabs:', preloadedTabs);
console.log('Loading metrics:', getMetrics());

// Query debugging
QueryOptimizationService.analyzeIndexUsage('calls');
```

## Future Enhancements

1. **Service Worker Caching**: Implement service worker for offline caching
2. **Real-time Updates**: WebSocket integration for live data updates
3. **Predictive Preloading**: ML-based preloading based on user behavior
4. **Edge Caching**: CDN-level caching for static resources
5. **Database Optimization**: Query plan analysis and index optimization

## Migration Guide

### From Basic Hook to Cached Hook
```tsx
// Before
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

// After
import { useCachedAdminDashboardData } from '@/hooks/useCachedAdminDashboardData';

// API remains the same, but with additional cache methods
const { data, refresh, getCacheStats, clearCache } = useCachedAdminDashboardData();
```

### Enabling Performance Monitoring
```tsx
// Add to your component
import { LazyLoadingPerformanceMonitor } from '@/components/admin/dashboard/LazyTabLoader';

// In development mode
{process.env.NODE_ENV === 'development' && (
  <LazyLoadingPerformanceMonitor 
    metrics={getMetrics()} 
    onMetricsUpdate={console.log}
  />
)}
```