# Code Splitting Debug Cheatsheet

## Quick Diagnostics

### 🚨 Emergency Commands

```bash
# Check bundle size immediately
npm run build && ls -la dist/assets/

# Analyze bundle composition
npx vite-bundle-analyzer dist

# Test loading performance
npm run preview
```

### 🔍 Browser DevTools

**Network Tab**:
```
Filter: JS
Look for: Failed requests (red), large files (>500KB), slow loading (>2s)
```

**Console Commands**:
```javascript
// Get bundle metrics
bundleAnalyzer.getMetrics()

// Get optimization recommendations
bundleAnalyzer.getOptimizationRecommendations()

// Check specific chunk size
performance.getEntriesByType('resource').filter(r => r.name.includes('Dashboard'))
```

**Performance Tab**:
```
1. Start recording
2. Navigate to route
3. Stop recording
4. Look for: Long tasks, chunk loading times, cache misses
```

## Common Issues & Solutions

### ❌ Component Not Loading

**Symptoms**: Infinite loading spinner, blank page, console errors

**Debug Steps**:
```javascript
// 1. Check import path
console.log('Testing import:', () => import('../pages/Dashboard'));

// 2. Check network requests
// Open Network tab, reload page, look for 404s

// 3. Test direct import
import('../pages/Dashboard').then(console.log).catch(console.error);
```

**Solutions**:
```typescript
// Fix import path
createLazyRoute(() => import('../pages/Dashboard')) // ✅
createLazyRoute(() => import('./pages/Dashboard'))  // ❌

// Add error boundary
<ErrorBoundary fallback={<div>Failed to load</div>}>
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

### ❌ Bundle Too Large

**Symptoms**: Slow initial load, large network requests, build warnings

**Debug Steps**:
```bash
# Check bundle sizes
npm run build
# Look for files > 500KB in dist/assets/

# Analyze composition
npx webpack-bundle-analyzer dist
```

**Solutions**:
```typescript
// Split large chunks in vite.config.ts
manualChunks: {
  'large-feature': ['./src/pages/LargeFeature'],
  'heavy-vendor': ['recharts', 'date-fns'],
}

// Use dynamic imports
const loadHeavyLibrary = () => import('heavy-library');
```

### ❌ Slow Route Loading

**Symptoms**: Long loading times between routes, poor UX

**Debug Steps**:
```javascript
// Measure loading time
const start = performance.now();
import('../pages/Dashboard').then(() => {
  console.log('Load time:', performance.now() - start);
});

// Check preloading
console.log('Preloaded routes:', Object.keys(window.__PRELOADED_ROUTES__ || {}));
```

**Solutions**:
```typescript
// Enable preloading
Dashboard: createLazyRoute(() => import('../pages/Dashboard'), { preload: true }),

// Preload on hover
<Link 
  to="/dashboard" 
  onMouseEnter={() => import('../pages/Dashboard')}
>
  Dashboard
</Link>
```

### ❌ Cache Issues

**Symptoms**: Components reload unnecessarily, poor cache hit rate

**Debug Steps**:
```javascript
// Check cache hit rate
const metrics = bundleAnalyzer.getMetrics();
console.log('Cache hit rate:', metrics.cacheHitRate);

// Check cache headers
fetch('/assets/Dashboard-abc123.js').then(r => console.log(r.headers));
```

**Solutions**:
```typescript
// Optimize chunk naming in vite.config.ts
chunkFileNames: 'js/[name]-[hash].js',

// Check cache headers in server config
Cache-Control: public, max-age=31536000, immutable
```

## Performance Debugging

### 📊 Bundle Analysis

```bash
# Quick size check
du -sh dist/assets/*.js | sort -hr

# Detailed analysis
npx vite-bundle-analyzer dist

# Compare builds
npm run build -- --mode=production
npm run build -- --mode=development
```

### 📈 Runtime Performance

```javascript
// Monitor chunk loading
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.name.includes('.js')) {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });
});
observer.observe({ entryTypes: ['resource'] });

// Track route transitions
let routeStart = performance.now();
// After route change:
console.log('Route transition:', performance.now() - routeStart);
```

### 🎯 Memory Usage

```javascript
// Check memory usage
console.log('Memory:', performance.memory);

// Monitor for memory leaks
setInterval(() => {
  console.log('Heap used:', performance.memory.usedJSHeapSize);
}, 5000);
```

## Error Debugging

### 🐛 Import Failures

**Error**: `ChunkLoadError: Loading chunk X failed`

**Debug**:
```javascript
// Test chunk availability
fetch('/assets/chunk-name.js')
  .then(r => console.log('Chunk available:', r.ok))
  .catch(e => console.error('Chunk missing:', e));
```

**Fix**:
```typescript
// Add retry logic
const createLazyRoute = (importFn, options = {}) => {
  const { retryCount = 3 } = options;
  
  const retryImport = async (attempt = 1) => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return retryImport(attempt + 1);
      }
      throw error;
    }
  };

  return lazy(() => retryImport());
};
```

### 🐛 Suspense Issues

**Error**: `Error: A component suspended while responding to synchronous input`

**Debug**:
```javascript
// Check for synchronous imports in effects
useEffect(() => {
  // ❌ Don't do this
  import('../component').then(setComponent);
}, []);
```

**Fix**:
```typescript
// Use proper lazy loading
const LazyComponent = lazy(() => import('../component'));

// Or use dynamic imports properly
const [Component, setComponent] = useState(null);
useEffect(() => {
  import('../component').then(module => setComponent(module.default));
}, []);
```

## Monitoring Commands

### 📊 Real-time Monitoring

```javascript
// Bundle metrics dashboard
const showMetrics = () => {
  const metrics = bundleAnalyzer.getMetrics();
  console.table({
    'Total Size': `${(Object.values(metrics.chunkSizes).reduce((a, b) => a + b, 0) / 1024).toFixed(2)}KB`,
    'Cache Hit Rate': `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    'Avg Load Time': `${Object.values(metrics.loadTimes).reduce((a, b) => a + b, 0) / Object.values(metrics.loadTimes).length}ms`,
  });
};

// Run every 30 seconds
setInterval(showMetrics, 30000);
```

### 📈 Performance Tracking

```javascript
// Track Core Web Vitals
const trackWebVitals = () => {
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log(`${entry.name}: ${entry.value}`);
    });
  }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'cumulative-layout-shift'] });
};
```

## Quick Fixes

### 🚀 Emergency Performance Boost

```typescript
// 1. Disable code splitting for critical routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
// becomes:
import Dashboard from './pages/Dashboard';

// 2. Preload everything (temporary)
Object.values(RouteGroups).forEach(group => {
  Object.values(group).forEach(route => {
    setTimeout(() => route.preload?.(), 100);
  });
});

// 3. Reduce chunk size
// In vite.config.ts:
build: {
  rollupOptions: {
    output: {
      manualChunks: () => 'single-chunk', // Emergency: everything in one chunk
    },
  },
}
```

### 🔧 Quick Diagnostics

```bash
# One-liner bundle check
npm run build && find dist -name "*.js" -exec ls -lh {} \; | sort -k5 -hr

# Quick performance test
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8080"

# Memory usage check
node --inspect-brk=9229 node_modules/.bin/vite build
```

## Environment-Specific Issues

### 🏠 Development

```javascript
// Common dev issues
if (import.meta.env.DEV) {
  // HMR conflicts with lazy loading
  console.log('HMR enabled, some lazy loading may not work as expected');
  
  // Source maps may be large
  console.log('Source maps enabled, bundle size not representative');
}
```

### 🚀 Production

```javascript
// Production-specific checks
if (import.meta.env.PROD) {
  // Check for missing chunks
  window.addEventListener('error', (e) => {
    if (e.message.includes('Loading chunk')) {
      console.error('Chunk loading failed in production:', e);
      // Implement fallback or retry logic
    }
  });
}
```

### 📱 Mobile

```javascript
// Mobile-specific debugging
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  // Reduce preloading on mobile
  console.log('Mobile detected, adjusting preloading strategy');
}
```

## Automated Debugging

### 🤖 Bundle Size Monitoring

```javascript
// Add to CI/CD pipeline
const fs = require('fs');
const path = require('path');

const checkBundleSize = () => {
  const distPath = path.join(__dirname, 'dist/assets');
  const files = fs.readdirSync(distPath);
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const stats = fs.statSync(path.join(distPath, file));
      const sizeKB = stats.size / 1024;
      
      if (sizeKB > 500) {
        console.error(`❌ Large bundle detected: ${file} (${sizeKB.toFixed(2)}KB)`);
        process.exit(1);
      }
    }
  });
  
  console.log('✅ Bundle size check passed');
};
```

### 🔄 Performance Regression Detection

```javascript
// Store baseline metrics
const baselineMetrics = {
  initialLoadTime: 2000,
  chunkLoadTime: 500,
  cacheHitRate: 0.8,
};

// Compare current metrics
const checkPerformanceRegression = () => {
  const current = bundleAnalyzer.getMetrics();
  
  if (current.loadTimes.initial > baselineMetrics.initialLoadTime * 1.2) {
    console.warn('⚠️ Performance regression detected: Initial load time increased');
  }
  
  if (current.cacheHitRate < baselineMetrics.cacheHitRate * 0.9) {
    console.warn('⚠️ Performance regression detected: Cache hit rate decreased');
  }
};
```

This cheatsheet provides immediate solutions for the most common code splitting issues. Keep it handy for quick debugging sessions!