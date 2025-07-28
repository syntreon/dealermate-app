# Admin Dashboard Loading States

This document provides a comprehensive guide to the loading states and skeleton components implemented for the admin dashboard refactor.

## Overview

The admin dashboard implements a sophisticated loading state system that provides:

- **Theme-aware loading skeletons** for all components
- **Progressive loading** with multiple stages
- **Real-time refresh indicators** with progress tracking
- **Error handling** with retry functionality
- **Smart loading wrappers** for automatic state management
- **Full-screen overlays** for complex loading operations

## Components

### 1. LoadingSkeletons.tsx

The main skeleton components file containing all loading state variations.

#### Key Components:

- `CardSkeleton` - Generic card skeleton
- `FinancialTabSkeleton` - Financial tab specific skeleton
- `ClientsTabSkeleton` - Clients tab specific skeleton
- `UsersTabSkeleton` - Users tab specific skeleton
- `SystemTabSkeleton` - System tab specific skeleton
- `OperationsTabSkeleton` - Operations tab specific skeleton
- `ProgressiveLoadingSkeleton` - Multi-stage loading skeleton
- `RefreshLoadingIndicator` - Basic refresh indicator
- `EnhancedRefreshIndicator` - Advanced refresh with stages
- `SectionLoadingIndicator` - Individual section loading
- `ShimmerSkeleton` - Shimmer effect skeleton
- `MetricCardSkeleton` - Metric card skeleton
- `TableLoadingSkeleton` - Table structure skeleton
- `ChartLoadingSkeleton` - Chart placeholder skeleton

#### Usage:

```tsx
import { FinancialTabSkeleton, RefreshLoadingIndicator } from './LoadingSkeletons';

// Basic usage
<FinancialTabSkeleton />

// With refresh indicator
<RefreshLoadingIndicator isVisible={isRefreshing} />

// Progressive loading
<ProgressiveLoadingSkeleton 
  stage="partial"
  tabType="financial"
  loadedSections={['metrics']}
  totalSections={3}
/>
```

### 2. TabLoadingSkeleton.tsx

Enhanced tab-specific loading skeletons with progressive states.

#### Features:

- Tab-specific skeleton layouts
- Progressive loading stages (initial, partial, complete)
- Progress indicators
- Theme-aware styling

#### Usage:

```tsx
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

<TabLoadingSkeleton 
  tabType="financial"
  stage="partial"
  showProgress={true}
  progress={65}
/>
```

### 3. LoadingOverlay.tsx

Full-screen loading overlay with detailed progress tracking.

#### Features:

- Full-screen backdrop
- Section-by-section progress
- Error handling with retry buttons
- Cancellation support
- Detailed status information

#### Usage:

```tsx
import LoadingOverlay from './LoadingOverlay';

<LoadingOverlay
  loadingState={loadingState}
  showDetails={true}
  onRetry={(sectionId) => retrySection(sectionId)}
  onCancel={() => cancelLoading()}
/>
```

### 4. LoadingStatesProvider.tsx

Context provider for managing loading states across the dashboard.

#### Features:

- Centralized loading state management
- Section-based loading tracking
- Error handling with toast notifications
- Automatic progress calculation
- Retry functionality

#### Usage:

```tsx
import LoadingStatesProvider, { useSectionLoading } from './LoadingStatesProvider';

// Provider setup
<LoadingStatesProvider 
  sections={[
    { id: 'financial-metrics', name: 'Financial Metrics' },
    { id: 'client-data', name: 'Client Data' }
  ]}
  showToasts={true}
>
  <DashboardContent />
</LoadingStatesProvider>

// In component
const { isLoading, error, loadSection } = useSectionLoading('financial-metrics');
```

### 5. SmartLoadingWrapper.tsx

Intelligent loading wrapper that automatically handles loading states.

#### Features:

- Automatic loading state detection
- Error boundaries
- Retry functionality
- Suspense integration
- Tab-specific fallbacks

#### Usage:

```tsx
import SmartLoadingWrapper from './SmartLoadingWrapper';

<SmartLoadingWrapper
  sectionId="financial-metrics"
  tabType="financial"
  showInlineLoading={true}
  onRetry={async () => await fetchData()}
>
  <FinancialMetricsComponent />
</SmartLoadingWrapper>

// Or as HOC
const WrappedComponent = withSmartLoading(MyComponent, {
  sectionId: 'my-section',
  tabType: 'financial'
});
```

## Hooks

### useLoadingStates.ts

Comprehensive hook for managing loading states with advanced features.

#### Features:

- Multi-section loading management
- Progress tracking
- Error handling with retry logic
- Timeout support
- Exponential backoff
- Parallel/sequential loading

#### Usage:

```tsx
import { useLoadingStates } from '@/hooks/useLoadingStates';

const {
  state,
  loadSection,
  loadAllSections,
  startLoading,
  completeLoading,
  setError,
  retrySection
} = useLoadingStates({
  sections: [
    { id: 'metrics', name: 'Metrics' },
    { id: 'charts', name: 'Charts' }
  ],
  onError: (sectionId, error) => console.error(error),
  onComplete: () => console.log('All sections loaded')
});

// Load single section
await loadSection('metrics', async () => {
  return await fetchMetrics();
});

// Load all sections in parallel
await loadAllSections({
  'metrics': fetchMetrics,
  'charts': fetchCharts
}, { parallel: true });
```

## Integration Examples

### Basic Tab Component Integration

```tsx
import React, { useEffect } from 'react';
import { useSectionLoading } from './LoadingStatesProvider';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export const MyTab: React.FC = () => {
  const { 
    isLoading, 
    error, 
    loadSection, 
    section 
  } = useSectionLoading('my-tab');

  useEffect(() => {
    loadSection(async () => {
      const data = await fetchTabData();
      return data;
    });
  }, []);

  if (isLoading && !section?.lastUpdated) {
    return <TabLoadingSkeleton tabType="financial" stage="initial" />;
  }

  if (error) {
    return <ErrorComponent error={error} onRetry={() => loadSection(fetchTabData)} />;
  }

  return <TabContent />;
};
```

### Advanced Loading with Progress

```tsx
import React, { useEffect } from 'react';
import { useLoadingStates } from '@/hooks/useLoadingStates';
import { EnhancedRefreshIndicator } from './LoadingSkeletons';

export const AdvancedComponent: React.FC = () => {
  const { state, loadAllSections } = useLoadingStates({
    sections: [
      { id: 'step1', name: 'Loading Data' },
      { id: 'step2', name: 'Processing' },
      { id: 'step3', name: 'Finalizing' }
    ]
  });

  const loadData = async () => {
    await loadAllSections({
      'step1': async () => {
        const data = await fetchData();
        return data;
      },
      'step2': async () => {
        const processed = await processData();
        return processed;
      },
      'step3': async () => {
        const final = await finalizeData();
        return final;
      }
    }, { parallel: false }); // Sequential loading
  };

  return (
    <div>
      <EnhancedRefreshIndicator
        isVisible={state.isInitialLoading}
        stage={state.stage === 'initial' ? 'fetching' : 'processing'}
        progress={state.overallProgress}
      />
      {/* Component content */}
    </div>
  );
};
```

## Theme Compliance

All loading components are fully theme-aware and use semantic color tokens:

- `bg-card` / `text-card-foreground` for card backgrounds
- `bg-muted` / `text-muted-foreground` for skeleton elements
- `border-border` for borders
- `bg-primary` / `text-primary-foreground` for progress indicators
- `text-destructive` for error states

## Performance Considerations

- **Lazy Loading**: Tab components are lazy-loaded with Suspense
- **Memoization**: Loading states are memoized to prevent unnecessary re-renders
- **Cleanup**: Timeouts and intervals are properly cleaned up
- **Progressive Enhancement**: Content loads progressively as data becomes available

## Testing

The `LoadingStatesDemo.tsx` component provides a comprehensive showcase of all loading states and can be used for:

- Visual testing of loading states
- Theme compatibility testing
- Performance testing
- Integration testing

## Best Practices

1. **Always provide fallbacks**: Use appropriate skeleton components for each content type
2. **Handle errors gracefully**: Provide retry functionality and clear error messages
3. **Show progress**: Use progress indicators for long-running operations
4. **Respect user preferences**: Support theme switching and reduced motion
5. **Test thoroughly**: Test loading states in both light and dark themes
6. **Keep it accessible**: Ensure loading states are screen reader friendly

## Migration Guide

To migrate existing components to use the new loading system:

1. Wrap your component with `LoadingStatesProvider`
2. Replace manual loading states with `useSectionLoading`
3. Replace custom skeletons with theme-aware skeleton components
4. Add error handling with retry functionality
5. Test in both themes and mobile layouts

## Future Enhancements

- **Real-time updates**: WebSocket integration for live data updates
- **Offline support**: Cache management and offline indicators
- **Performance monitoring**: Loading time analytics and optimization
- **A11y improvements**: Enhanced screen reader support and keyboard navigation