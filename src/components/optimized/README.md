# Optimized Components

This directory contains performance-optimized versions of components designed to handle large datasets and prevent unnecessary re-renders.

## Components

### Memoized Components

These components use `React.memo` with custom comparison functions to prevent unnecessary re-renders:

- **MemoizedCallLogsTable**: Optimized version of CallLogsTable with intelligent prop comparison
- **MemoizedLeadsTable**: Optimized version of LeadsTable with efficient lead comparison
- **MemoizedMetricsSummaryCards**: Optimized dashboard metrics with granular change detection
- **MemoizedFinancialTab**: Optimized financial tab that prevents unnecessary re-mounting
- **MemoizedClientsTab**: Optimized clients tab with stable rendering

### Virtualized Components

These components use `react-window` for efficient rendering of large datasets:

- **VirtualizedCallLogsTable**: Handles thousands of call logs efficiently
- **VirtualizedLeadsTable**: Manages large lead datasets with smooth scrolling

## Usage Examples

### Basic Memoized Component Usage

```tsx
import MemoizedCallLogsTable from '@/components/optimized/MemoizedCallLogsTable';

function CallsPage() {
  const [callLogs, setCallLogs] = useState<ExtendedCallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [leadCallIds, setLeadCallIds] = useState<Set<string>>(new Set());

  const handleRefresh = useCallback(() => {
    // Refresh logic
  }, []);

  return (
    <MemoizedCallLogsTable
      callLogs={callLogs}
      loading={loading}
      onRefresh={handleRefresh}
      leadCallIds={leadCallIds}
    />
  );
}
```

### Virtualized Component Usage

```tsx
import VirtualizedCallLogsTable from '@/components/optimized/VirtualizedCallLogsTable';

function LargeCallsPage() {
  const [callLogs, setCallLogs] = useState<ExtendedCallLog[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <VirtualizedCallLogsTable
      callLogs={callLogs}
      loading={loading}
      onRefresh={handleRefresh}
      height={600} // Container height
      itemHeight={80} // Height of each row
    />
  );
}
```

### Performance Monitoring

```tsx
import { useRenderPerformance, PerformanceMonitor } from '@/utils/performanceOptimization';

function MyComponent() {
  const { markRenderStart, markRenderEnd } = useRenderPerformance('MyComponent');

  useEffect(() => {
    markRenderStart();
    return markRenderEnd;
  });

  const expensiveCalculation = useMemo(() => {
    return PerformanceMonitor.time('expensive-calc', () => {
      // Expensive computation here
      return result;
    });
  }, [dependencies]);

  return <div>{/* Component content */}</div>;
}
```

## Performance Guidelines

### When to Use Memoized Components

1. **Large datasets**: Components rendering 100+ items
2. **Frequent updates**: Components that receive frequent prop changes
3. **Complex calculations**: Components with expensive render logic
4. **Parent re-renders**: Child components that don't need to update when parent re-renders

### When to Use Virtualized Components

1. **Very large datasets**: 1000+ items
2. **Smooth scrolling**: When scroll performance is critical
3. **Memory constraints**: When rendering all items would use too much memory
4. **Mobile devices**: When targeting devices with limited resources

### Performance Best Practices

1. **Stable references**: Use `useCallback` and `useMemo` for stable prop references
2. **Shallow comparison**: Prefer shallow comparison over deep comparison when possible
3. **Key props**: Always provide stable, unique keys for list items
4. **Lazy loading**: Use intersection observer for lazy loading off-screen content
5. **Debouncing**: Debounce search inputs and filters to prevent excessive re-renders

## Optimization Checklist

- [ ] Component uses `React.memo` with appropriate comparison function
- [ ] Callback props are memoized with `useCallback`
- [ ] Complex calculations are memoized with `useMemo`
- [ ] List items have stable, unique keys
- [ ] Large datasets use virtualization
- [ ] Search/filter inputs are debounced
- [ ] Performance monitoring is in place for critical components

## Performance Metrics

### Target Performance Goals

- **Initial render**: < 100ms for components with < 1000 items
- **Re-render**: < 16ms for smooth 60fps updates
- **Memory usage**: < 50MB for large dataset components
- **Scroll performance**: Maintain 60fps during scrolling

### Monitoring Tools

1. **React DevTools Profiler**: Identify slow components
2. **Browser DevTools Performance**: Monitor frame rates and memory
3. **Custom performance hooks**: Track render times and counts
4. **Performance API**: Measure specific operations

## Common Pitfalls

1. **Over-memoization**: Don't memoize everything - it has overhead
2. **Unstable dependencies**: Ensure memoization dependencies are stable
3. **Deep comparison**: Avoid deep object comparison in memo functions
4. **Missing keys**: Always provide keys for dynamic lists
5. **Inline objects**: Avoid creating objects in render functions

## Migration Guide

### From Regular to Memoized Components

1. Import the memoized version
2. Ensure all callback props are memoized
3. Test for performance improvements
4. Monitor for any behavioral changes

### From Regular to Virtualized Components

1. Determine appropriate container height and item height
2. Replace the regular component with virtualized version
3. Test scrolling behavior thoroughly
4. Adjust height values as needed for optimal performance

## Testing Performance Optimizations

```tsx
// Performance test example
import { render, screen } from '@testing-library/react';
import { performance } from 'perf_hooks';

test('component renders efficiently with large dataset', () => {
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    // ... other properties
  }));

  const startTime = performance.now();
  
  render(<MemoizedComponent data={largeDataset} />);
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  expect(renderTime).toBeLessThan(100); // Should render in < 100ms
  expect(screen.getByText('Item 0')).toBeInTheDocument();
});
```

## Browser Support

- **React Window**: Supports all modern browsers
- **Intersection Observer**: IE11+ with polyfill
- **Performance API**: All modern browsers
- **React.memo**: React 16.6+

## Dependencies

- `react-window`: For virtualization
- `@types/react-window`: TypeScript definitions
- React 16.6+ for memo support