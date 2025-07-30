# Developer Guide: Error Boundaries and Loading States

## Quick Start

### For New Developers

This guide helps you understand and work with the error boundary and loading state system in the admin section layouts.

### Instant Onboarding

1. **Understanding the System**
   - Error boundaries catch JavaScript errors in React components
   - Loading states provide feedback during lazy component loading
   - Recovery mechanisms automatically attempt to fix common issues
   - All admin sections are protected with these systems

2. **Key Files to Know**
   ```
   src/components/admin/layout/
   ├── SectionErrorBoundary.tsx      # Main error boundary
   ├── SectionLoadingFallback.tsx    # Loading states
   ├── withSectionErrorBoundary.tsx  # HOC wrapper
   ├── ErrorFallbackComponents.tsx   # Specialized error UIs
   └── README.md                     # Complete documentation
   
   src/services/
   └── errorRecoveryService.ts       # Error handling service
   
   src/hooks/
   └── useErrorRecovery.ts          # Error recovery hook
   ```

3. **Basic Usage Pattern**
   ```tsx
   // Every admin layout follows this pattern
   <SectionErrorBoundary sectionName="YourSection">
     <div className="space-y-6">
       {/* Section header */}
       <div className="flex-1 min-w-0">
         <Suspense fallback={<MinimalSectionLoading sectionName="Page" />}>
           <Outlet />
         </Suspense>
       </div>
     </div>
   </SectionErrorBoundary>
   ```

## Self-Service Debugging

### Common Issues and Solutions

#### 1. Error Boundary Not Catching Errors

**Problem:** Errors in event handlers or async operations aren't caught.

**Solution:** Use the error recovery hook:
```tsx
const { reportError } = useErrorRecovery({
  section: 'Management',
  component: 'UserForm'
});

const handleSubmit = async () => {
  try {
    await submitData();
  } catch (error) {
    reportError(error); // This will be handled properly
  }
};
```

#### 2. Loading States Not Appearing

**Problem:** Components load instantly without showing loading states.

**Diagnosis:**
```tsx
// Check if component is lazy-loaded
const MyComponent = lazy(() => import('./MyComponent'));

// Ensure Suspense boundary exists
<Suspense fallback={<LoadingFallback />}>
  <MyComponent />
</Suspense>
```

**Solution:**
```tsx
// Add artificial delay for testing (development only)
const MyComponent = lazy(() => 
  process.env.NODE_ENV === 'development' 
    ? new Promise(resolve => 
        setTimeout(() => resolve(import('./MyComponent')), 1000)
      )
    : import('./MyComponent')
);
```

#### 3. Recovery Strategies Not Working

**Problem:** Automatic recovery fails or doesn't trigger.

**Diagnosis:**
```tsx
// Check error classification
const { getRecoveryStrategies } = useErrorRecovery({
  section: 'Analytics',
  component: 'Chart'
});

const strategies = getRecoveryStrategies(error);
console.log('Available strategies:', strategies);
```

**Solution:**
```tsx
// Manual recovery attempt
const { attemptRecovery } = useErrorRecovery({
  section: 'Analytics',
  component: 'Chart',
  autoRecover: true // Enable automatic recovery
});

// Or trigger manually
await attemptRecovery(error);
```

#### 4. Error Details Not Showing in Development

**Problem:** Technical error details are hidden.

**Solution:**
```tsx
// Ensure development environment
console.log('Environment:', process.env.NODE_ENV);

// Force error details (temporary)
<SectionErrorBoundary 
  sectionName="Debug"
  fallback={({ error, resetError }) => (
    <div>
      <h3>Debug Error</h3>
      <pre>{error.stack}</pre>
      <button onClick={resetError}>Reset</button>
    </div>
  )}
>
  <YourComponent />
</SectionErrorBoundary>
```

### Debug Commands

#### Browser Console Commands

```javascript
// Check error statistics
errorRecoveryService.getErrorStatistics()

// Clear error history
errorRecoveryService.clearErrorHistory()

// Test error boundary
window.testError = () => { throw new Error('Test error'); }

// Check route code splitting status
RouteGroups.debug?.logRouteStatus?.()

// Test recovery strategies
const strategies = errorRecoveryService.getRecoveryStrategies(
  new Error('Test'), 
  { section: 'Test', component: 'Test' }
);
console.log(strategies);
```

#### Development Helpers

```tsx
// Add to your component for debugging
if (process.env.NODE_ENV === 'development') {
  window.debugComponent = {
    throwError: () => { throw new Error('Debug error'); },
    reportError: (message) => reportError(new Error(message)),
    getErrorHistory: () => errorHistory,
    clearErrors: () => clearError()
  };
}
```

## Best Practices

### 1. Error Boundary Placement

```tsx
// ✅ Section-level (recommended)
<SectionErrorBoundary sectionName="Management">
  <ManagementLayout />
</SectionErrorBoundary>

// ✅ Component-level for critical components
<SectionErrorBoundary sectionName="CriticalFeature">
  <CriticalComponent />
</SectionErrorBoundary>

// ❌ Too granular (avoid)
<SectionErrorBoundary sectionName="Button">
  <Button />
</SectionErrorBoundary>
```

### 2. Loading State Selection

```tsx
// ✅ Full skeleton for complex layouts
<SectionLoadingFallback 
  sectionName="Analytics" 
  showSkeleton={true}
/>

// ✅ Minimal for simple content
<MinimalSectionLoading sectionName="Settings" />

// ✅ Custom for specific needs
<Suspense fallback={
  <div className="flex items-center justify-center h-64">
    <Loader2 className="animate-spin" />
    <span>Loading custom content...</span>
  </div>
}>
  <CustomComponent />
</Suspense>
```

### 3. Error Context

```tsx
// ✅ Rich context
reportError(error, {
  userId: user.id,
  action: 'data-fetch',
  resource: 'user-list',
  filters: JSON.stringify(currentFilters)
});

// ❌ Minimal context
reportError(error);
```

### 4. Recovery Strategy Implementation

```tsx
// ✅ Graceful degradation
const { reportError, attemptRecovery, isRecovering } = useErrorRecovery({
  section: 'Analytics',
  component: 'Chart',
  autoRecover: true,
  onRecovery: (success) => {
    if (success) {
      toast.success('Issue resolved automatically');
    } else {
      toast.error('Please refresh the page');
    }
  }
});
```

## Emergency Procedures

### Critical Error Scenarios

#### 1. Entire Section Failing

**Immediate Action:**
```tsx
// Temporarily bypass error boundary for debugging
const DebugWrapper = ({ children }) => {
  if (process.env.NODE_ENV === 'development' && window.bypassErrorBoundary) {
    return children;
  }
  return (
    <SectionErrorBoundary sectionName="Debug">
      {children}
    </SectionErrorBoundary>
  );
};

// In browser console
window.bypassErrorBoundary = true;
```

**Root Cause Analysis:**
```tsx
// Check error patterns
const stats = errorRecoveryService.getErrorStatistics();
console.log('Error patterns:', stats.mostCommonErrors);
console.log('Affected sections:', stats.errorsBySection);
```

#### 2. Infinite Error Loop

**Immediate Action:**
```tsx
// Clear all error state
errorRecoveryService.clearErrorHistory();
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

**Prevention:**
```tsx
// Add circuit breaker pattern
const CircuitBreakerErrorBoundary = ({ children, maxErrors = 5 }) => {
  const [errorCount, setErrorCount] = useState(0);
  
  if (errorCount >= maxErrors) {
    return <div>Too many errors. Please refresh the page.</div>;
  }
  
  return (
    <SectionErrorBoundary 
      onError={() => setErrorCount(prev => prev + 1)}
    >
      {children}
    </SectionErrorBoundary>
  );
};
```

#### 3. Performance Issues from Error Handling

**Diagnosis:**
```tsx
// Monitor error boundary performance
const PerformanceMonitor = ({ children }) => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('ErrorBoundary')) {
          console.log('Error boundary performance:', entry);
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);
  
  return children;
};
```

**Solution:**
```tsx
// Debounce error reporting
const useDebouncedErrorReporting = (delay = 1000) => {
  const { reportError } = useErrorRecovery();
  
  return useMemo(
    () => debounce(reportError, delay),
    [reportError, delay]
  );
};
```

## Performance Optimization

### 1. Error Boundary Optimization

```tsx
// Memoize error boundary to prevent unnecessary re-renders
const MemoizedSectionErrorBoundary = memo(SectionErrorBoundary);

// Use callback refs for better performance
const errorBoundaryRef = useCallback((node) => {
  if (node) {
    // Setup performance monitoring
  }
}, []);
```

### 2. Loading State Optimization

```tsx
// Preload critical components
useEffect(() => {
  const preloadTimer = setTimeout(() => {
    import('./CriticalComponent').catch(() => {
      // Silently fail preloading
    });
  }, 2000);
  
  return () => clearTimeout(preloadTimer);
}, []);

// Use intersection observer for lazy loading
const useLazyLoad = (threshold = 0.1) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  
  return [ref, shouldLoad];
};
```

### 3. Error Recovery Optimization

```tsx
// Batch error reports
const useBatchedErrorReporting = () => {
  const [errorQueue, setErrorQueue] = useState([]);
  const { reportError } = useErrorRecovery();
  
  useEffect(() => {
    if (errorQueue.length === 0) return;
    
    const timer = setTimeout(() => {
      errorQueue.forEach(reportError);
      setErrorQueue([]);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [errorQueue, reportError]);
  
  return (error) => {
    setErrorQueue(prev => [...prev, error]);
  };
};
```

## Monitoring and Analytics

### 1. Error Tracking Setup

```tsx
// Initialize error tracking
useEffect(() => {
  if (typeof window !== 'undefined') {
    window.errorTracker = {
      captureException: (error, context) => {
        // Send to your error tracking service
        console.log('Error tracked:', { error, context });
      }
    };
  }
}, []);
```

### 2. Performance Monitoring

```tsx
// Monitor error boundary performance
const useErrorBoundaryMetrics = () => {
  const [metrics, setMetrics] = useState({
    errorCount: 0,
    recoverySuccessRate: 0,
    averageRecoveryTime: 0
  });
  
  useEffect(() => {
    const stats = errorRecoveryService.getErrorStatistics();
    setMetrics({
      errorCount: stats.totalErrors,
      // Calculate other metrics...
    });
  }, []);
  
  return metrics;
};
```

### 3. User Experience Monitoring

```tsx
// Track user interactions with error states
const useErrorUXTracking = () => {
  const trackErrorInteraction = useCallback((action, errorType) => {
    // Send to analytics
    console.log('Error UX interaction:', { action, errorType });
  }, []);
  
  return { trackErrorInteraction };
};
```

## Testing Strategies

### 1. Error Boundary Testing

```tsx
// Test error boundary behavior
describe('SectionErrorBoundary', () => {
  it('catches and displays errors', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    
    render(
      <SectionErrorBoundary sectionName="Test">
        <ThrowError />
      </SectionErrorBoundary>
    );
    
    expect(screen.getByText(/Test Section Error/)).toBeInTheDocument();
  });
  
  it('provides recovery options', () => {
    // Test recovery button functionality
  });
});
```

### 2. Loading State Testing

```tsx
// Test loading states
describe('SectionLoadingFallback', () => {
  it('shows section-specific loading message', () => {
    render(<SectionLoadingFallback sectionName="Analytics" />);
    expect(screen.getByText(/Loading analytics/)).toBeInTheDocument();
  });
});
```

### 3. Integration Testing

```tsx
// Test complete error handling flow
describe('Error Handling Integration', () => {
  it('handles error -> recovery -> success flow', async () => {
    // Mock error scenario
    // Trigger recovery
    // Verify success state
  });
});
```

This developer guide provides comprehensive coverage for working with the error boundary and loading state system. Use it as your primary reference for debugging, optimization, and best practices.