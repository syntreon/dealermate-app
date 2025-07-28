# Admin Dashboard Debug Cheat Sheet

Quick reference for debugging common issues in the admin dashboard.

## 🚀 Quick Debug Commands

### Performance Debugging
```tsx
// Check lazy loading status
const { preloadedTabs, isPreloading, getMetrics } = useTabPreloading();
console.log('Preloaded:', Array.from(preloadedTabs));
console.log('Metrics:', getMetrics());

// Check cache performance
const stats = adminDashboardCache.getStats();
console.log('Cache hit rate:', stats.hitRate + '%');
console.log('Cache size:', stats.size);
console.log('Memory usage:', (stats.memoryUsage / 1024).toFixed(2) + 'KB');

// Check bundle info
const bundleInfo = getBundleInfo();
console.log('Bundle size:', (bundleInfo.totalJSSize / 1024).toFixed(2) + 'KB');
```

### Data Flow Debugging
```tsx
// Check dashboard state
const { data, isLoading, errors, loadingStates } = useCachedAdminDashboardData();
console.log('Loading sections:', Object.entries(loadingStates).filter(([_, loading]) => loading));
console.log('Error sections:', Object.entries(errors).filter(([_, error]) => error));
console.log('Has data:', Object.values(data).some(v => v !== null));

// Check specific section
const financialState = getSectionState('financialMetrics');
console.log('Financial section:', financialState);
```

### Cache Debugging
```tsx
// View cache contents
console.log('Cache keys:', adminDashboardCache.getKeys());
console.log('Financial cache:', adminDashboardCache.getByTag('financial'));

// Clear specific cache
CacheInvalidation.invalidateFinancialData();
CacheInvalidation.smartInvalidate('all');

// Force refresh without cache
refresh(true); // invalidateCache = true
```

## 🔍 Common Issues & Quick Fixes

### Issue: Dashboard Won't Load
```tsx
// Quick checks
console.log('Auth status:', user?.role);
console.log('Loading state:', isLoading);
console.log('Global error:', error?.message);

// Quick fix
if (error) {
  console.log('Retrying...');
  refresh(true);
}
```

### Issue: Slow Performance
```tsx
// Check performance
const metrics = getMetrics();
const slowTabs = metrics.filter(m => m.loadDuration > 1000);
console.log('Slow tabs:', slowTabs);

// Quick fix - clear cache
adminDashboardCache.clear();
window.location.reload();
```

### Issue: Data Not Updating
```tsx
// Check cache age
const cacheKeys = adminDashboardCache.getKeys();
cacheKeys.forEach(key => {
  const entry = adminDashboardCache.get(key);
  const age = Date.now() - entry?.timestamp;
  console.log(`${key}: ${(age / 1000).toFixed(0)}s old`);
});

// Quick fix
CacheInvalidation.smartInvalidate('all');
refresh(true);
```

### Issue: Memory Leak
```tsx
// Check memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
    total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
    limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
  });
}

// Quick fix
adminDashboardCache.clear();
if (window.gc) window.gc(); // Force garbage collection in dev
```

## 🛠️ Debug Tools

### Enable Debug Mode
```tsx
// Add to .env.local
REACT_APP_DEBUG_PERFORMANCE=true
REACT_APP_DEBUG_CACHE=true
REACT_APP_DEBUG_QUERIES=true

// Or set in console
localStorage.setItem('debug_performance', 'true');
localStorage.setItem('debug_cache', 'true');
```

### Performance Monitor
```tsx
// Add to component in development
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 z-50 bg-card border p-2 text-xs">
    <div>Cache: {stats.hitRate.toFixed(1)}% hit rate</div>
    <div>Memory: {(stats.memoryUsage / 1024).toFixed(1)}KB</div>
    <div>Loading: {Object.values(loadingStates).filter(Boolean).length}</div>
  </div>
)}
```

### Cache Inspector
```tsx
// Add cache inspector
const CacheInspector = () => (
  <details className="fixed top-4 right-4 z-50 bg-card border p-2 text-xs">
    <summary>Cache Inspector</summary>
    <div>Hit Rate: {stats.hitRate.toFixed(1)}%</div>
    <div>Size: {stats.size} entries</div>
    <div>Memory: {(stats.memoryUsage / 1024).toFixed(1)}KB</div>
    <button onClick={() => adminDashboardCache.clear()}>Clear Cache</button>
  </details>
);
```

## 📊 Performance Benchmarks

### Expected Performance
```tsx
const PERFORMANCE_BENCHMARKS = {
  initialLoad: 2000,      // < 2 seconds
  tabSwitch: 500,         // < 500ms
  dataRefresh: 1000,      // < 1 second
  cacheHitRate: 70,       // > 70%
  memoryUsage: 50 * 1024, // < 50KB cache
  bundleSize: 500 * 1024  // < 500KB per tab
};

// Check against benchmarks
const checkPerformance = () => {
  const current = {
    cacheHitRate: stats.hitRate,
    memoryUsage: stats.memoryUsage,
    bundleSize: getBundleInfo().totalJSSize
  };
  
  Object.entries(PERFORMANCE_BENCHMARKS).forEach(([metric, benchmark]) => {
    const value = current[metric];
    const status = value <= benchmark ? '✅' : '❌';
    console.log(`${status} ${metric}: ${value} (benchmark: ${benchmark})`);
  });
};
```

## 🔧 Quick Fixes

### Reset Everything
```tsx
const resetDashboard = () => {
  // Clear all caches
  adminDashboardCache.clear();
  localStorage.clear();
  
  // Reset state
  window.location.reload();
};
```

### Force Refresh All Data
```tsx
const forceRefreshAll = async () => {
  // Clear cache
  CacheInvalidation.smartInvalidate('all');
  
  // Refresh with cache invalidation
  refresh(true);
  
  console.log('Force refresh initiated');
};
```

### Optimize Performance
```tsx
const optimizePerformance = () => {
  // Clear old cache entries
  adminDashboardCache.clear();
  
  // Preload high priority tabs
  preloadHighPriorityTabs();
  
  // Optimize connection
  QueryOptimizationService.optimizeConnection();
  
  console.log('Performance optimization applied');
};
```

## 📱 Mobile Debugging

### Check Mobile Performance
```tsx
const checkMobilePerformance = () => {
  const isMobile = window.innerWidth < 768;
  const touchDevice = 'ontouchstart' in window;
  
  console.log('Mobile debug:', {
    isMobile,
    touchDevice,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    connection: navigator.connection?.effectiveType
  });
};
```

### Mobile-Specific Issues
```tsx
// Check for mobile-specific problems
const mobileIssues = {
  memoryPressure: performance.memory?.usedJSHeapSize > 100 * 1024 * 1024, // 100MB
  slowConnection: navigator.connection?.effectiveType === 'slow-2g',
  lowBattery: navigator.getBattery?.()?.then(battery => battery.level < 0.2)
};

console.log('Mobile issues:', mobileIssues);
```

## 🚨 Emergency Commands

### Dashboard Completely Broken
```tsx
// Nuclear option - reset everything
const emergencyReset = () => {
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear cache
  adminDashboardCache.clear();
  
  // Clear service worker cache
  if ('serviceWorker' in navigator) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Reload page
  window.location.reload();
};
```

### Memory Emergency
```tsx
const memoryEmergency = () => {
  // Clear all caches
  adminDashboardCache.clear();
  
  // Force garbage collection
  if (window.gc) window.gc();
  
  // Reduce cache size
  adminDashboardCache.config.maxSize = 10;
  
  console.log('Memory emergency procedures executed');
};
```

### Network Emergency
```tsx
const networkEmergency = () => {
  // Switch to cached-only mode
  const originalFetch = window.fetch;
  window.fetch = async (url, options) => {
    const cached = adminDashboardCache.get(url);
    if (cached) return new Response(JSON.stringify(cached));
    throw new Error('Network unavailable, no cache available');
  };
  
  console.log('Network emergency mode activated');
  
  // Restore after 30 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log('Network emergency mode deactivated');
  }, 30000);
};
```

## 📋 Debug Checklist

### Before Reporting a Bug
- [ ] Check browser console for errors
- [ ] Verify cache hit rate > 50%
- [ ] Check memory usage < 100MB
- [ ] Verify network requests are completing
- [ ] Test in incognito mode
- [ ] Clear cache and retry
- [ ] Check mobile vs desktop behavior

### Performance Issues
- [ ] Measure initial load time
- [ ] Check bundle sizes
- [ ] Verify lazy loading is working
- [ ] Monitor memory usage over time
- [ ] Check cache efficiency
- [ ] Test with large datasets

### Data Issues
- [ ] Verify API endpoints are responding
- [ ] Check cache invalidation logic
- [ ] Test refresh functionality
- [ ] Verify error handling
- [ ] Check retry mechanisms
- [ ] Test offline behavior

## 🔗 Useful Browser Extensions

- **React Developer Tools**: Component debugging
- **Redux DevTools**: State management debugging (if using Redux)
- **Performance Monitor**: Real-time performance metrics
- **Memory Tab**: Memory leak detection
- **Network Tab**: API request debugging
- **Lighthouse**: Performance auditing

## 📞 Getting Help

If you're still stuck after trying these debugging steps:

1. **Check the full Developer Guide**: `docs/admin/DEVELOPER_GUIDE.md`
2. **Review component documentation**: `src/components/admin/dashboard/README.md`
3. **Check performance documentation**: `src/components/admin/dashboard/PERFORMANCE.md`
4. **Look at hook documentation**: `src/hooks/README-useAdminDashboardData.md`
5. **Contact the development team** with:
   - Browser console output
   - Performance metrics
   - Steps to reproduce
   - Expected vs actual behavior