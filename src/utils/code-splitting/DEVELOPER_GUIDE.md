# Code Splitting Developer Guide

## Quick Start

### For New Developers

**Instant Onboarding**: This guide provides complete understanding of the code splitting system in one document.

**What is Code Splitting?**
Code splitting breaks your application into smaller chunks that load on-demand, improving initial load times and user experience.

### System Architecture

```
App.tsx (Entry Point)
├── RouteGroups (Lazy Components)
│   ├── auth (Login, Callback, etc.)
│   ├── main (Dashboard, Analytics, etc.)
│   ├── admin (Admin pages)
│   └── layouts (AppLayout, AdminLayout)
├── Suspense Boundaries (Loading States)
├── Bundle Analyzer (Performance Monitoring)
└── Preloading System (Intelligent Loading)
```

## Core Concepts

### 1. Lazy Loading
Components are loaded only when needed:

```typescript
// ❌ Traditional import (loads immediately)
import Dashboard from './pages/Dashboard';

// ✅ Lazy import (loads when needed)
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 2. Route Groups
Components are organized by feature:

```typescript
export const RouteGroups = {
  main: {
    Dashboard: createLazyRoute(() => import('../pages/Dashboard')),
    Analytics: createLazyRoute(() => import('../pages/Analytics')),
  },
  admin: {
    AdminDashboard: createLazyRoute(() => import('../pages/admin/AdminDashboard')),
  }
};
```

### 3. Suspense Boundaries
Loading states while components load:

```typescript
<Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
  <RouteGroups.main.Dashboard />
</Suspense>
```

## Development Workflow

### Adding a New Route

1. **Create the component** (standard React component)
2. **Add to RouteGroups** in `routeCodeSplitting.ts`
3. **Add route definition** in `App.tsx`
4. **Test loading behavior**

**Example**:
```typescript
// 1. Create component: src/pages/NewFeature.tsx
const NewFeature = () => <div>New Feature</div>;

// 2. Add to RouteGroups
main: {
  NewFeature: createLazyRoute(() => import('../pages/NewFeature')),
}

// 3. Add route in App.tsx
<Route path="/new-feature" element={
  <Suspense fallback={<LoadingSpinner text="Loading new feature..." />}>
    <RouteGroups.main.NewFeature />
  </Suspense>
} />
```

### Optimizing Performance

**Enable Preloading** for frequently accessed routes:
```typescript
Dashboard: createLazyRoute(() => import('../pages/Dashboard'), { preload: true }),
```

**Group Related Components** in Vite config:
```typescript
manualChunks: {
  'feature-group': [
    './src/pages/FeatureA',
    './src/pages/FeatureB',
  ],
}
```

## Best Practices

### ✅ Do's

1. **Use descriptive loading text**:
   ```typescript
   <LoadingSpinner text="Loading user management..." />
   ```

2. **Group related routes**:
   ```typescript
   'admin-pages': [
     './src/pages/admin/AdminDashboard',
     './src/pages/admin/UserManagement',
   ]
   ```

3. **Preload critical routes**:
   ```typescript
   Dashboard: createLazyRoute(() => import('../pages/Dashboard'), { preload: true }),
   ```

4. **Monitor bundle size**:
   ```typescript
   // Check console for bundle analyzer recommendations
   const recommendations = bundleAnalyzer.getOptimizationRecommendations();
   ```

### ❌ Don'ts

1. **Don't preload everything** (defeats the purpose)
2. **Don't create too many small chunks** (increases HTTP requests)
3. **Don't ignore loading states** (poor UX)
4. **Don't skip error handling** (components can fail to load)

## Debugging Guide

### Common Issues

**1. Component Not Loading**
```typescript
// Check browser network tab for failed requests
// Verify import path is correct
// Check for JavaScript errors in console
```

**2. Slow Loading**
```typescript
// Use bundle analyzer recommendations
const recommendations = bundleAnalyzer.getOptimizationRecommendations();
console.log(recommendations);
```

**3. Large Bundle Size**
```typescript
// Check Vite build output for chunk sizes
npm run build

// Look for chunks > 500KB and split them further
```

### Debug Commands

```bash
# Build and analyze bundle
npm run build
npm run preview

# Check bundle composition
npx vite-bundle-analyzer dist

# Performance testing
# Open DevTools > Performance > Record page load
```

### Performance Monitoring

**Development Console Output**:
```javascript
// Bundle analyzer automatically logs:
// - Large chunk warnings
// - Slow loading resources  
// - Cache hit rate issues
// - Optimization recommendations
```

**Manual Analysis**:
```typescript
// Get current metrics
const metrics = bundleAnalyzer.getMetrics();
console.log('Bundle metrics:', metrics);

// Check specific chunk
console.log('Dashboard chunk size:', metrics.chunkSizes['Dashboard']);
```

## Advanced Techniques

### Dynamic Imports for Heavy Libraries

```typescript
// Instead of importing heavy libraries at the top
const loadCharts = async () => {
  const { default: Chart } = await import('recharts');
  return Chart;
};

// Use in component
const MyComponent = () => {
  const [Chart, setChart] = useState(null);
  
  useEffect(() => {
    loadCharts().then(setChart);
  }, []);
  
  return Chart ? <Chart data={data} /> : <LoadingSpinner />;
};
```

### Intelligent Preloading

```typescript
// Preload based on user behavior
const useSmartPreloading = () => {
  const location = useLocation();
  
  useEffect(() => {
    // If user is on dashboard, preload analytics
    if (location.pathname === '/dashboard') {
      import('../pages/Analytics');
    }
  }, [location]);
};
```

### Custom Loading States

```typescript
// Create feature-specific loading components
const DashboardLoading = () => (
  <div className="dashboard-skeleton">
    <div className="skeleton-card" />
    <div className="skeleton-chart" />
  </div>
);

// Use in Suspense
<Suspense fallback={<DashboardLoading />}>
  <Dashboard />
</Suspense>
```

## Troubleshooting Flowchart

```
Component not loading?
├── Check network tab for 404s
├── Verify import path
├── Check for JS errors
└── Test retry logic

Bundle too large?
├── Check manual chunks config
├── Split large components
├── Use dynamic imports
└── Remove unused dependencies

Slow loading?
├── Enable preloading
├── Check network conditions
├── Optimize chunk sizes
└── Use CDN for static assets

Cache issues?
├── Check cache headers
├── Verify chunk naming
├── Clear browser cache
└── Test in incognito mode
```

## Performance Targets

### Bundle Size Goals
- **Initial bundle**: < 500KB gzipped
- **Route chunks**: < 200KB each
- **Vendor chunks**: < 300KB each
- **Total app**: < 2MB uncompressed

### Loading Time Goals
- **Initial load**: < 2 seconds
- **Route transitions**: < 500ms
- **Cache hit rate**: > 80%
- **Failed imports**: < 1%

## Testing Strategy

### Manual Testing
1. **Network throttling**: Test on slow connections
2. **Cache behavior**: Test with/without cache
3. **Error scenarios**: Simulate network failures
4. **Mobile performance**: Test on mobile devices

### Automated Testing
```typescript
// Performance tests
describe('Code Splitting', () => {
  it('should load routes within performance budget', async () => {
    const startTime = performance.now();
    await import('../pages/Dashboard');
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(1000);
  });
});
```

## Emergency Procedures

### Critical Issues

**1. App Won't Load**
```typescript
// Check for failed chunk loading
// Fallback: Disable code splitting temporarily
// Quick fix: Add error boundaries
```

**2. Performance Degradation**
```typescript
// Check bundle analyzer warnings
// Identify large chunks causing issues
// Implement emergency preloading
```

**3. High Error Rate**
```typescript
// Check network connectivity
// Verify CDN status
// Implement retry logic
```

### Quick Fixes

```typescript
// Disable code splitting for critical route
const Dashboard = lazy(() => import('./pages/Dashboard'));
// becomes
import Dashboard from './pages/Dashboard';

// Add error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

## Configuration Reference

### Environment Variables
```env
# Bundle analysis
VITE_ENABLE_BUNDLE_ANALYSIS=true
VITE_BUNDLE_SIZE_LIMIT=500000

# Preloading
VITE_PRELOAD_CRITICAL_ROUTES=true
VITE_PRELOAD_DELAY=2000

# Performance
VITE_PERFORMANCE_MONITORING=true
VITE_CACHE_STRATEGY=aggressive
```

### Vite Configuration
```typescript
// Key settings for code splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          // Feature chunks
          'admin-pages': ['./src/pages/admin/*'],
        },
      },
    },
    // Performance settings
    target: 'esnext',
    minify: 'terser',
    sourcemap: false, // Disable in production
  },
});
```

This guide provides everything needed to work effectively with the code splitting system, from basic concepts to advanced optimization techniques.