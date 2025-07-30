# Debug Cheatsheet: Error Boundaries & Loading States

## Quick Debug Commands

### Browser Console Commands

```javascript
// 🔍 Check error statistics
errorRecoveryService.getErrorStatistics()

// 🧹 Clear error history
errorRecoveryService.clearErrorHistory()

// 🧪 Test error boundary
(() => { throw new Error('Test error boundary'); })()

// 📊 View error patterns
console.table(errorRecoveryService.getErrorStatistics().mostCommonErrors)

// 🔄 Test recovery strategies
errorRecoveryService.getRecoveryStrategies(
  new Error('Network error'), 
  { section: 'Analytics', component: 'Chart' }
)

// 🚀 Check route loading status
RouteGroups.debug?.logRouteStatus?.()
```

### Component Debug Helpers

```tsx
// Add to any component for instant debugging
if (process.env.NODE_ENV === 'development') {
  window.debugErrorBoundary = {
    // Throw test error
    throwError: () => { throw new Error('Debug test error'); },
    
    // Report custom error
    reportError: (msg) => reportError(new Error(msg)),
    
    // View component error history
    getHistory: () => errorHistory,
    
    // Clear component errors
    clearErrors: () => clearError(),
    
    // Test recovery
    testRecovery: () => attemptRecovery(new Error('Recovery test'))
  };
}
```

## Common Issues & Quick Fixes

### ❌ Error Boundary Not Catching

**Symptoms:**
- Errors crash the entire app
- No error fallback UI appears
- Console shows unhandled errors

**Quick Fix:**
```tsx
// ✅ Wrap with error boundary
<SectionErrorBoundary sectionName="YourSection">
  <YourComponent />
</SectionErrorBoundary>

// ✅ For event handlers, use hook
const { reportError } = useErrorRecovery({
  section: 'YourSection',
  component: 'YourComponent'
});

const handleClick = () => {
  try {
    riskyOperation();
  } catch (error) {
    reportError(error); // This will be handled
  }
};
```

### ❌ Loading States Not Showing

**Symptoms:**
- Components load instantly
- No loading feedback
- Suspense fallback never appears

**Quick Fix:**
```tsx
// ✅ Ensure component is lazy-loaded
const MyComponent = lazy(() => import('./MyComponent'));

// ✅ Add Suspense boundary
<Suspense fallback={<SectionLoadingFallback sectionName="MySection" />}>
  <MyComponent />
</Suspense>

// 🧪 Test with artificial delay (dev only)
const MyComponent = lazy(() => 
  process.env.NODE_ENV === 'development' 
    ? new Promise(resolve => setTimeout(() => resolve(import('./MyComponent')), 2000))
    : import('./MyComponent')
);
```

### ❌ Recovery Not Working

**Symptoms:**
- Errors persist after recovery attempts
- Recovery strategies don't trigger
- Manual recovery fails

**Quick Fix:**
```tsx
// ✅ Enable auto-recovery
const { reportError, attemptRecovery } = useErrorRecovery({
  section: 'YourSection',
  component: 'YourComponent',
  autoRecover: true // Enable this
});

// ✅ Check error type classification
const strategies = getRecoveryStrategies(error);
console.log('Available strategies:', strategies);

// ✅ Manual recovery with logging
const recover = async () => {
  console.log('Attempting recovery...');
  const success = await attemptRecovery(error);
  console.log('Recovery result:', success);
};
```

### ❌ Infinite Error Loop

**Symptoms:**
- Same error keeps occurring
- Error boundary resets repeatedly
- Browser becomes unresponsive

**Emergency Fix:**
```javascript
// 🚨 Emergency stop - run in console
errorRecoveryService.clearErrorHistory();
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

**Prevention:**
```tsx
// ✅ Add circuit breaker
const [errorCount, setErrorCount] = useState(0);
const MAX_ERRORS = 3;

if (errorCount >= MAX_ERRORS) {
  return <div>Too many errors. Please refresh the page.</div>;
}

// In error handler
setErrorCount(prev => prev + 1);
```

## Debug Modes

### 🔧 Development Mode Features

```tsx
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  window.debugMode = true;
  
  // Override error boundary to show stack traces
  window.showErrorDetails = true;
  
  // Bypass error boundaries for debugging
  window.bypassErrorBoundary = false; // Set to true to bypass
}
```

### 🧪 Testing Mode

```tsx
// Add test helpers to window
if (process.env.NODE_ENV === 'development') {
  window.testHelpers = {
    // Simulate network error
    networkError: () => {
      throw new Error('Network request failed');
    },
    
    // Simulate database error
    dbError: () => {
      throw new Error('Database connection failed');
    },
    
    // Simulate permission error
    permissionError: () => {
      throw new Error('Permission denied: unauthorized access');
    },
    
    // Test loading states
    testLoading: (delay = 3000) => {
      return new Promise(resolve => setTimeout(resolve, delay));
    }
  };
}
```

## Performance Debug

### 📊 Performance Monitoring

```javascript
// Monitor error boundary performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('ErrorBoundary')) {
      console.log('🐌 Error boundary performance:', entry.duration + 'ms');
    }
  });
});
observer.observe({ entryTypes: ['measure'] });

// Monitor component re-renders
let renderCount = 0;
console.log('🔄 Component renders:', ++renderCount);
```

### 🚀 Loading Performance

```javascript
// Check lazy loading performance
const checkLazyLoading = async () => {
  const start = performance.now();
  await import('./YourComponent');
  const end = performance.now();
  console.log('⚡ Lazy load time:', (end - start) + 'ms');
};

// Monitor bundle sizes
console.log('📦 Bundle info:', {
  totalSize: performance.getEntriesByType('navigation')[0]?.transferSize,
  loadTime: performance.getEntriesByType('navigation')[0]?.loadEventEnd
});
```

## Error Type Quick Reference

### 🌐 Network Errors
```javascript
// Identify network errors
const isNetworkError = (error) => {
  const msg = error.message.toLowerCase();
  return msg.includes('network') || 
         msg.includes('fetch') || 
         msg.includes('timeout');
};

// Test network error recovery
window.testNetworkError = () => {
  throw new Error('Network request failed');
};
```

### 🗄️ Database Errors
```javascript
// Identify database errors
const isDatabaseError = (error) => {
  const msg = error.message.toLowerCase();
  return msg.includes('database') || 
         msg.includes('sql') || 
         msg.includes('supabase');
};

// Test database error recovery
window.testDatabaseError = () => {
  throw new Error('Database connection failed');
};
```

### 🔒 Permission Errors
```javascript
// Identify permission errors
const isPermissionError = (error) => {
  const msg = error.message.toLowerCase();
  return msg.includes('permission') || 
         msg.includes('unauthorized') || 
         msg.includes('forbidden');
};

// Test permission error recovery
window.testPermissionError = () => {
  throw new Error('Permission denied: unauthorized access');
};
```

## Component State Debug

### 🔍 Error State Inspection

```tsx
// Add to component for state debugging
const DebugErrorState = () => {
  const { errorHistory, lastError, isRecovering } = useErrorRecovery({
    section: 'Debug',
    component: 'DebugComponent'
  });
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999 
    }}>
      <h4>🐛 Error Debug Info</h4>
      <p>Last Error: {lastError?.message || 'None'}</p>
      <p>Is Recovering: {isRecovering ? '✅' : '❌'}</p>
      <p>Error Count: {errorHistory.length}</p>
      <button onClick={() => window.debugErrorBoundary?.throwError?.()}>
        Test Error
      </button>
    </div>
  );
};
```

### 📱 Loading State Debug

```tsx
// Debug loading states
const DebugLoadingState = ({ isLoading, componentName }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      background: isLoading ? 'orange' : 'green',
      color: 'white',
      padding: '5px 10px',
      fontSize: '12px'
    }}>
      {componentName}: {isLoading ? '⏳ Loading' : '✅ Loaded'}
    </div>
  );
};
```

## Quick Test Scenarios

### 🧪 Error Boundary Tests

```javascript
// Run these in console to test error boundaries

// 1. Test section error boundary
(() => {
  const event = new CustomEvent('test-error', {
    detail: { section: 'Management', error: new Error('Test section error') }
  });
  window.dispatchEvent(event);
})();

// 2. Test network error handling
fetch('/non-existent-endpoint').catch(error => {
  console.log('Network error caught:', error);
});

// 3. Test permission error
window.testHelpers?.permissionError?.();

// 4. Test recovery mechanism
errorRecoveryService.attemptRecovery(
  new Error('Test recovery'), 
  { section: 'Test', component: 'Test' }
);
```

### ⚡ Loading State Tests

```javascript
// Test loading states
const testLoadingStates = async () => {
  console.log('🧪 Testing loading states...');
  
  // Test minimal loading
  console.log('Testing minimal loading...');
  await window.testHelpers?.testLoading?.(1000);
  
  // Test skeleton loading
  console.log('Testing skeleton loading...');
  await window.testHelpers?.testLoading?.(2000);
  
  console.log('✅ Loading tests complete');
};

testLoadingStates();
```

## Emergency Procedures

### 🚨 Critical Error Recovery

```javascript
// Emergency reset - copy and paste into console
(function emergencyReset() {
  console.log('🚨 Emergency reset initiated...');
  
  // Clear all error state
  try { errorRecoveryService.clearErrorHistory(); } catch(e) {}
  
  // Clear storage
  try { localStorage.clear(); } catch(e) {}
  try { sessionStorage.clear(); } catch(e) {}
  
  // Clear caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Reload page
  setTimeout(() => window.location.reload(), 1000);
  
  console.log('🔄 Page will reload in 1 second...');
})();
```

### 🛠️ Debug Mode Toggle

```javascript
// Toggle debug mode
window.toggleDebugMode = () => {
  window.debugMode = !window.debugMode;
  console.log('🔧 Debug mode:', window.debugMode ? 'ON' : 'OFF');
  
  if (window.debugMode) {
    // Enable verbose logging
    window.debugErrorBoundary = true;
    window.showErrorDetails = true;
    console.log('🔍 Verbose error logging enabled');
  } else {
    // Disable verbose logging
    window.debugErrorBoundary = false;
    window.showErrorDetails = false;
    console.log('🔇 Verbose error logging disabled');
  }
};

// Quick toggle
window.toggleDebugMode();
```

## Useful Bookmarklets

Create bookmarks with these JavaScript URLs for quick debugging:

### Error Stats
```javascript
javascript:(function(){console.log('📊 Error Statistics:',errorRecoveryService.getErrorStatistics());})();
```

### Clear Errors
```javascript
javascript:(function(){errorRecoveryService.clearErrorHistory();console.log('🧹 Error history cleared');})();
```

### Test Error
```javascript
javascript:(function(){try{throw new Error('Bookmarklet test error');}catch(e){console.log('🧪 Test error thrown:',e);}})();
```

### Toggle Debug
```javascript
javascript:(function(){window.debugMode=!window.debugMode;console.log('🔧 Debug mode:',window.debugMode?'ON':'OFF');})();
```

---

**💡 Pro Tip:** Bookmark this page and keep it open in a separate tab while developing for quick reference!