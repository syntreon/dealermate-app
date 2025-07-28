# useAdminDashboardData Hook

A comprehensive React hook for managing admin dashboard data with advanced features including auto-refresh, error handling, retry logic, and granular loading states.

## Overview

The `useAdminDashboardData` hook extends the existing `useDashboardMetrics` hook to provide admin-specific functionality for the admin dashboard. It manages multiple data sources, handles loading states for each section independently, and provides robust error handling with retry mechanisms.

## Features

- **Comprehensive Data Management**: Fetches and manages 10 different data sections
- **Granular Loading States**: Individual loading states for each data section
- **Error Handling**: Section-specific error handling with retry functionality
- **Auto-refresh**: Configurable automatic data refresh with pause/resume
- **Retry Logic**: Exponential backoff retry mechanism for failed requests
- **Performance Optimized**: Parallel data fetching and request cancellation
- **Type Safe**: Full TypeScript support with comprehensive type definitions

## Installation

The hook is already integrated into the project. Simply import it:

```tsx
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
```

## Basic Usage

```tsx
import React from 'react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminDashboard: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    refresh,
    lastUpdated
  } = useAdminDashboardData();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Total Clients: {data.platformMetrics?.totalClients}</p>
      <p>Total Revenue: ${data.platformMetrics?.totalRevenue}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

## Advanced Usage

```tsx
import React from 'react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdvancedAdminDashboard: React.FC = () => {
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    loadingStates,
    errors,
    refresh,
    retrySection,
    hasAnyData,
    hasAnyErrors,
    isAnyLoading,
    getSectionState
  } = useAdminDashboardData({
    clientId: 'specific-client-id', // Optional: filter for specific client
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: true,
    retryAttempts: 3,
    retryDelay: 1000
  });

  // Get specific section state
  const financialState = getSectionState('financialMetrics');

  return (
    <div>
      {/* Global loading indicator */}
      {isRefreshing && <div>Refreshing data...</div>}
      
      {/* Section-specific loading */}
      {loadingStates.financialMetrics ? (
        <div>Loading financial data...</div>
      ) : errors.financialMetrics ? (
        <div>
          Error loading financial data: {errors.financialMetrics.message}
          <button onClick={() => retrySection('financialMetrics')}>
            Retry
          </button>
        </div>
      ) : (
        <div>
          Revenue: ${data.financialMetrics?.totalRevenue}
          Profit: ${data.financialMetrics?.netProfit}
        </div>
      )}
      
      {/* Global controls */}
      <div>
        <button onClick={refresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
        {lastUpdated && (
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
};
```

## Configuration Options

```tsx
interface UseAdminDashboardDataOptions {
  clientId?: string;           // Optional client ID filter
  autoRefresh?: boolean;       // Enable auto-refresh (default: true)
  refreshInterval?: number;    // Refresh interval in ms (default: 5 minutes)
  enableToasts?: boolean;      // Show toast notifications (default: true)
  retryAttempts?: number;      // Number of retry attempts (default: 3)
  retryDelay?: number;         // Base retry delay in ms (default: 1000)
}
```

## Data Structure

The hook returns comprehensive admin dashboard data:

```tsx
interface AdminDashboardData {
  // Basic dashboard metrics
  dashboardMetrics: DashboardMetrics | null;
  
  // Platform-wide metrics
  platformMetrics: {
    totalClients: number;
    activeClients: number;
    totalUsers: number;
    totalRevenue: number;
    platformCallVolume: number;
    platformLeadVolume: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
  } | null;
  
  // Financial data
  financialMetrics: FinancialMetrics | null;
  costBreakdown: CostBreakdown | null;
  clientProfitability: ClientProfitability[];
  growthTrends: GrowthTrends | null;
  
  // Client and user data
  clients: Client[];
  users: User[];
  
  // Distribution metrics
  clientDistribution: {
    byStatus: Array<{ status: string; count: number }>;
    bySubscriptionPlan: Array<{ plan: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  } | null;
  
  userAnalytics: {
    byRole: Array<{ role: string; count: number }>;
    activeToday: number;
    activeThisWeek: number;
    newThisMonth: number;
    recentActivity: Array<{ id: string; email: string; lastLogin: Date | null; role: string }>;
  } | null;
}
```

## Return Values

```tsx
interface AdminDashboardState {
  // Data
  data: AdminDashboardData;
  
  // Global states
  isLoading: boolean;          // Initial loading state
  isRefreshing: boolean;       // Refresh in progress
  error: Error | null;         // Global error
  lastUpdated: Date | null;    // Last successful update
  
  // Section-specific states
  loadingStates: {             // Loading state for each section
    dashboardMetrics: boolean;
    platformMetrics: boolean;
    financialMetrics: boolean;
    // ... other sections
  };
  
  errors: {                    // Error state for each section
    dashboardMetrics: Error | null;
    platformMetrics: Error | null;
    financialMetrics: Error | null;
    // ... other sections
  };
  
  // Actions
  refresh: () => void;                    // Manual refresh all data
  retrySection: (section: string) => Promise<void>; // Retry specific section
  
  // Computed values
  hasAnyData: boolean;         // True if any data is available
  hasAnyErrors: boolean;       // True if any section has errors
  isAnyLoading: boolean;       // True if any section is loading
  
  // Helpers
  getSectionState: (section: string) => {
    isLoading: boolean;
    error: Error | null;
    data: any;
    retry: () => Promise<void>;
  };
}
```

## Data Sections

The hook manages 10 independent data sections:

1. **dashboardMetrics**: Basic dashboard metrics (calls, leads, etc.)
2. **platformMetrics**: Platform-wide statistics
3. **financialMetrics**: Revenue, costs, profit calculations
4. **costBreakdown**: Detailed cost analysis
5. **clientProfitability**: Client-by-client profitability ranking
6. **growthTrends**: Growth metrics and trends
7. **clients**: Client list and details
8. **users**: User list and details
9. **clientDistribution**: Client distribution by status, plan, type
10. **userAnalytics**: User analytics and activity metrics

## Error Handling

The hook provides multiple levels of error handling:

### Global Error Handling
```tsx
const { error, hasAnyErrors } = useAdminDashboardData();

if (error) {
  // Handle global errors (authentication, permissions, etc.)
}

if (hasAnyErrors) {
  // Some sections have errors, but others may have loaded successfully
}
```

### Section-Specific Error Handling
```tsx
const { errors, retrySection } = useAdminDashboardData();

if (errors.financialMetrics) {
  // Handle financial metrics error specifically
  await retrySection('financialMetrics');
}
```

### Using getSectionState Helper
```tsx
const { getSectionState } = useAdminDashboardData();
const financialState = getSectionState('financialMetrics');

if (financialState.error) {
  // Handle error
  await financialState.retry();
}
```

## Loading States

### Global Loading States
```tsx
const { isLoading, isRefreshing, isAnyLoading } = useAdminDashboardData();

// Initial load
if (isLoading) return <InitialLoadingSpinner />;

// Refresh in progress
if (isRefreshing) return <RefreshIndicator />;

// Any section loading
if (isAnyLoading) return <PartialLoadingIndicator />;
```

### Section-Specific Loading States
```tsx
const { loadingStates } = useAdminDashboardData();

return (
  <div>
    {loadingStates.financialMetrics ? (
      <FinancialMetricsSkeleton />
    ) : (
      <FinancialMetricsContent />
    )}
    
    {loadingStates.clientProfitability ? (
      <ClientProfitabilitySkeleton />
    ) : (
      <ClientProfitabilityContent />
    )}
  </div>
);
```

## Auto-Refresh

The hook supports automatic data refresh:

```tsx
const { refresh } = useAdminDashboardData({
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000 // 5 minutes
});

// Manual refresh
const handleRefresh = () => {
  refresh();
};
```

Auto-refresh automatically pauses when:
- Initial loading is in progress
- No data has been loaded yet
- Component is unmounted

## Retry Logic

The hook implements exponential backoff retry logic:

```tsx
const { retrySection } = useAdminDashboardData({
  retryAttempts: 3,    // Retry up to 3 times
  retryDelay: 1000     // Start with 1 second delay
});

// Retry delays: 1s, 2s, 4s before giving up
```

Retry delays follow the pattern: `retryDelay * 2^(attempt - 1)`

## Performance Considerations

### Parallel Data Fetching
All data sections are fetched in parallel for optimal performance:

```tsx
// These all execute simultaneously
await Promise.allSettled([
  fetchDashboardMetrics(),
  fetchPlatformMetrics(),
  fetchFinancialData(),
  fetchClientsAndUsers(),
  fetchDistributionMetrics()
]);
```

### Request Cancellation
Ongoing requests are automatically cancelled when:
- Component unmounts
- New data fetch is initiated
- User navigates away

### Memory Management
The hook properly cleans up:
- Refresh intervals
- Retry timeouts
- Abort controllers
- Event listeners

## Integration with Loading States Provider

The hook can be used with the LoadingStatesProvider for enhanced loading management:

```tsx
import { LoadingStatesProvider } from '@/components/admin/dashboard/LoadingStatesProvider';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminDashboardWithProvider: React.FC = () => {
  return (
    <LoadingStatesProvider
      sections={[
        { id: 'financial-metrics', name: 'Financial Metrics' },
        { id: 'client-data', name: 'Client Data' },
        // ... other sections
      ]}
    >
      <AdminDashboardContent />
    </LoadingStatesProvider>
  );
};
```

## Best Practices

### 1. Handle Partial Data Gracefully
```tsx
const { data, hasAnyData } = useAdminDashboardData();

// Show available data even if some sections failed
if (hasAnyData) {
  return <DashboardWithPartialData data={data} />;
}
```

### 2. Use Section-Specific Loading States
```tsx
// Don't block entire UI for one section
{loadingStates.financialMetrics ? (
  <SkeletonLoader />
) : (
  <FinancialMetrics data={data.financialMetrics} />
)}
```

### 3. Provide Retry Options
```tsx
// Always provide retry options for failed sections
{errors.platformMetrics && (
  <ErrorMessage 
    error={errors.platformMetrics}
    onRetry={() => retrySection('platformMetrics')}
  />
)}
```

### 4. Show Loading Progress
```tsx
const { isAnyLoading, loadingStates } = useAdminDashboardData();

const loadingSections = Object.entries(loadingStates)
  .filter(([_, loading]) => loading)
  .map(([section]) => section);

return (
  <div>
    {isAnyLoading && (
      <div>Loading {loadingSections.length} sections...</div>
    )}
  </div>
);
```

### 5. Optimize Re-renders
```tsx
// Use specific data properties to avoid unnecessary re-renders
const { data: { platformMetrics } } = useAdminDashboardData();

// Instead of destructuring the entire data object
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure user has admin/owner role
2. **Network Timeouts**: Increase retry attempts or delay
3. **Memory Leaks**: Hook automatically cleans up resources
4. **Stale Data**: Check auto-refresh configuration

### Debug Information

The hook provides debug information through the state:

```tsx
const { loadingStates, errors, lastUpdated } = useAdminDashboardData();

console.log('Loading states:', loadingStates);
console.log('Errors:', errors);
console.log('Last updated:', lastUpdated);
```

## Migration from useDashboardMetrics

To migrate from the basic `useDashboardMetrics` hook:

```tsx
// Before
const { metrics, isLoading, error } = useDashboardMetrics(clientId);

// After
const { 
  data: { dashboardMetrics }, 
  isLoading, 
  error 
} = useAdminDashboardData({ clientId });

// dashboardMetrics contains the same data as the old metrics
```

## Future Enhancements

- Real-time updates via WebSocket
- Offline data caching
- Performance analytics
- Custom data transformations
- Conditional data fetching