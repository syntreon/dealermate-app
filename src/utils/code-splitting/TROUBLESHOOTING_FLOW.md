# Code Splitting Troubleshooting Flow

## Visual Problem-Solving Guide

### 🚨 Issue Identification Flow

```mermaid
flowchart TD
    A[Code Splitting Issue] --> B{What's the symptom?}
    
    B -->|Component won't load| C[Loading Issues]
    B -->|App is slow| D[Performance Issues]
    B -->|Bundle too large| E[Size Issues]
    B -->|Errors in console| F[Error Issues]
    
    C --> C1{Check Network Tab}
    C1 -->|404 errors| C2[Fix Import Paths]
    C1 -->|Timeout| C3[Add Retry Logic]
    C1 -->|No requests| C4[Check Route Config]
    
    D --> D1{Measure Performance}
    D1 -->|Slow initial load| D2[Enable Preloading]
    D1 -->|Slow transitions| D3[Optimize Chunks]
    D1 -->|Memory issues| D4[Check for Leaks]
    
    E --> E1{Analyze Bundle}
    E1 -->|Large vendor chunks| E2[Split Vendors]
    E1 -->|Large feature chunks| E3[Split Features]
    E1 -->|Duplicate code| E4[Optimize Imports]
    
    F --> F1{Error Type}
    F1 -->|ChunkLoadError| F2[Network/CDN Issue]
    F1 -->|SyntaxError| F3[Build Issue]
    F1 -->|TypeError| F4[Import Issue]
```

### 🔧 Diagnostic Decision Tree

```mermaid
flowchart TD
    Start([Start Debugging]) --> Check1{Is the app loading at all?}
    
    Check1 -->|No| Critical[Critical Issue]
    Check1 -->|Yes| Check2{Are routes loading?}
    
    Critical --> Crit1[Check console for errors]
    Critical --> Crit2[Verify build output]
    Critical --> Crit3[Test without code splitting]
    
    Check2 -->|No| Route[Route Loading Issue]
    Check2 -->|Slow| Perf[Performance Issue]
    Check2 -->|Yes| Check3{Is performance acceptable?}
    
    Route --> Route1[Check import paths]
    Route --> Route2[Verify Suspense boundaries]
    Route --> Route3[Test manual import]
    
    Perf --> Perf1[Measure load times]
    Perf --> Perf2[Check bundle sizes]
    Perf --> Perf3[Analyze network requests]
    
    Check3 -->|No| Optimize[Optimization Needed]
    Check3 -->|Yes| Monitor[Setup Monitoring]
    
    Optimize --> Opt1[Enable preloading]
    Optimize --> Opt2[Split large chunks]
    Optimize --> Opt3[Optimize dependencies]
    
    Monitor --> Mon1[Bundle analyzer]
    Monitor --> Mon2[Performance metrics]
    Monitor --> Mon3[Error tracking]
```

## Step-by-Step Troubleshooting

### 🎯 Phase 1: Initial Assessment

**Step 1: Quick Health Check**
```bash
# Run these commands first
npm run build
ls -la dist/assets/ | grep -E '\.(js|css)$'
npm run preview
```

**Step 2: Browser DevTools Check**
```javascript
// Open console and run:
console.log('Bundle analyzer metrics:', bundleAnalyzer.getMetrics());
console.log('Route groups loaded:', Object.keys(window.__ROUTE_GROUPS__ || {}));
```

**Step 3: Network Analysis**
- Open Network tab
- Reload page
- Look for: Failed requests (red), large files (>500KB), slow requests (>2s)

### 🔍 Phase 2: Specific Issue Diagnosis

#### Loading Issues

```mermaid
flowchart LR
    A[Component Not Loading] --> B{Check Console}
    B -->|ChunkLoadError| C[Network Issue]
    B -->|404 Error| D[Path Issue]
    B -->|No Error| E[Config Issue]
    
    C --> C1[Check CDN/Server]
    C --> C2[Add Retry Logic]
    
    D --> D1[Fix Import Path]
    D --> D2[Verify File Exists]
    
    E --> E1[Check Route Config]
    E --> E2[Verify Suspense]
```

**Diagnostic Commands:**
```javascript
// Test specific route import
import('../pages/Dashboard')
  .then(module => console.log('✅ Import successful:', module))
  .catch(error => console.error('❌ Import failed:', error));

// Check route configuration
console.log('Current route config:', RouteGroups);
```

#### Performance Issues

```mermaid
flowchart LR
    A[Slow Performance] --> B{Measure Timing}
    B -->|>3s initial| C[Bundle Too Large]
    B -->|>1s transitions| D[No Preloading]
    B -->|Memory growing| E[Memory Leak]
    
    C --> C1[Split Chunks]
    C --> C2[Remove Unused Code]
    
    D --> D1[Enable Preloading]
    D --> D2[Optimize Chunks]
    
    E --> E1[Check Component Cleanup]
    E --> E2[Monitor Memory Usage]
```

**Performance Measurement:**
```javascript
// Measure route transition time
const measureRouteTransition = (routeName) => {
  const start = performance.now();
  return import(`../pages/${routeName}`)
    .then(() => {
      const time = performance.now() - start;
      console.log(`${routeName} load time: ${time.toFixed(2)}ms`);
      return time;
    });
};

// Test all main routes
['Dashboard', 'Analytics', 'Logs', 'Leads'].forEach(measureRouteTransition);
```

#### Bundle Size Issues

```mermaid
flowchart LR
    A[Large Bundle] --> B{Analyze Composition}
    B -->|Large Vendors| C[Split Vendors]
    B -->|Large Features| D[Split Features]
    B -->|Duplicates| E[Optimize Imports]
    
    C --> C1[Update Vite Config]
    D --> D1[Create Feature Chunks]
    E --> E1[Use Tree Shaking]
```

**Bundle Analysis:**
```bash
# Quick size check
npm run build
find dist/assets -name "*.js" -exec ls -lh {} \; | sort -k5 -hr

# Detailed analysis
npx vite-bundle-analyzer dist
```

### 🛠️ Phase 3: Solution Implementation

#### Quick Fixes

```typescript
// 1. Emergency: Disable code splitting for critical route
// Before:
const Dashboard = lazy(() => import('./pages/Dashboard'));
// After:
import Dashboard from './pages/Dashboard';

// 2. Add error boundary
<ErrorBoundary fallback={<div>Loading failed. Please refresh.</div>}>
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
</ErrorBoundary>

// 3. Add retry logic
const createRetryLazyRoute = (importFn, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attempt) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (attempt < retries) {
              setTimeout(() => attemptImport(attempt + 1), 1000 * attempt);
            } else {
              reject(error);
            }
          });
      };
      attemptImport(1);
    });
  });
};
```

#### Systematic Fixes

**1. Bundle Optimization**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split by usage frequency
          'critical': ['./src/pages/Dashboard', './src/pages/Login'],
          'frequent': ['./src/pages/Analytics', './src/pages/Logs'],
          'occasional': ['./src/pages/Settings', './src/pages/Agents'],
          
          // Split by size
          'heavy-vendor': ['recharts', 'date-fns', 'xlsx'],
          'light-vendor': ['lucide-react', 'clsx'],
        },
      },
    },
  },
});
```

**2. Preloading Strategy**
```typescript
// Intelligent preloading based on user behavior
const preloadingStrategy = {
  '/dashboard': ['Analytics', 'Logs'], // Users often go here next
  '/analytics': ['Logs', 'Leads'],     // Related features
  '/logs': ['Leads', 'Analytics'],     // Common workflow
};

const useIntelligentPreloading = () => {
  const location = useLocation();
  
  useEffect(() => {
    const routesToPreload = preloadingStrategy[location.pathname];
    if (routesToPreload) {
      routesToPreload.forEach(route => {
        setTimeout(() => {
          import(`../pages/${route}`).catch(() => {});
        }, 2000); // Preload after 2 seconds
      });
    }
  }, [location.pathname]);
};
```

### 📊 Phase 4: Monitoring & Validation

#### Automated Monitoring

```javascript
// Set up continuous monitoring
const setupMonitoring = () => {
  // Performance monitoring
  setInterval(() => {
    const metrics = bundleAnalyzer.getMetrics();
    
    // Alert on performance degradation
    if (metrics.cacheHitRate < 0.7) {
      console.warn('⚠️ Low cache hit rate:', metrics.cacheHitRate);
    }
    
    // Alert on large chunks
    Object.entries(metrics.chunkSizes).forEach(([chunk, size]) => {
      if (size > 500 * 1024) {
        console.warn(`⚠️ Large chunk: ${chunk} (${(size/1024).toFixed(2)}KB)`);
      }
    });
  }, 60000); // Check every minute
  
  // Error monitoring
  window.addEventListener('error', (event) => {
    if (event.message.includes('Loading chunk')) {
      console.error('🚨 Chunk loading failed:', event.error);
      // Implement fallback or retry logic
    }
  });
};
```

#### Validation Checklist

```markdown
## Post-Implementation Checklist

### ✅ Functionality
- [ ] All routes load correctly
- [ ] Loading states display properly
- [ ] Error boundaries work
- [ ] Retry logic functions

### ✅ Performance
- [ ] Initial load < 3 seconds
- [ ] Route transitions < 1 second
- [ ] Bundle size < 2MB total
- [ ] Cache hit rate > 80%

### ✅ User Experience
- [ ] Loading indicators are informative
- [ ] No blank screens during loading
- [ ] Graceful error handling
- [ ] Smooth transitions

### ✅ Monitoring
- [ ] Bundle analyzer running
- [ ] Performance metrics tracked
- [ ] Error logging active
- [ ] Alerts configured
```

## Emergency Procedures

### 🚨 Critical Failure Response

```mermaid
flowchart TD
    A[Critical Failure Detected] --> B{Can users access app?}
    
    B -->|No| C[Emergency Rollback]
    B -->|Partially| D[Identify Affected Routes]
    B -->|Yes, but slow| E[Performance Emergency]
    
    C --> C1[Disable code splitting]
    C --> C2[Deploy emergency build]
    C --> C3[Monitor recovery]
    
    D --> D1[Disable problematic routes]
    D --> D2[Implement fallbacks]
    D --> D3[Fix and redeploy]
    
    E --> E1[Enable aggressive preloading]
    E --> E2[Optimize critical chunks]
    E --> E3[Monitor performance]
```

### 🔧 Emergency Commands

```bash
# Emergency build without code splitting
VITE_DISABLE_CODE_SPLITTING=true npm run build

# Quick performance check
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8080"

# Emergency bundle analysis
npx vite-bundle-analyzer dist --no-open --json > bundle-analysis.json
```

### 📞 Escalation Path

1. **Level 1**: Developer fixes (< 30 minutes)
2. **Level 2**: Team lead involvement (< 1 hour)
3. **Level 3**: Architecture review (< 2 hours)
4. **Level 4**: Emergency rollback (immediate)

This troubleshooting flow provides a systematic approach to identifying and resolving code splitting issues quickly and effectively.