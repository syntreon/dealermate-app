# Admin Layout Error Boundaries and Loading States

This directory contains comprehensive error handling and loading state components for the admin section layout refactor.

## Overview

The error boundary and loading state system provides:

- **Graceful error handling** with contextual recovery options
- **Intelligent loading states** with section-specific skeletons
- **Automatic error recovery** mechanisms
- **Comprehensive error reporting** and analytics
- **User-friendly fallback interfaces**

## Components

### Core Components

#### `SectionErrorBoundary.tsx`
Main error boundary component for admin section layouts.

**Features:**
- Catches JavaScript errors in section layouts
- Provides contextual error messages
- Offers multiple recovery strategies
- Shows technical details in development mode
- Integrates with external error tracking services

**Usage:**
```tsx
<SectionErrorBoundary sectionName="Management">
  <YourComponent />
</SectionErrorBoundary>
```

#### `SectionLoadingFallback.tsx`
Loading fallback components for lazy-loaded sections.

**Features:**
- Section-specific loading messages and icons
- Skeleton layouts that match actual content structure
- Minimal and full loading variants
- Theme-aware styling

**Usage:**
```tsx
<Suspense fallback={<SectionLoadingFallback sectionName="Analytics" />}>
  <LazyComponent />
</Suspense>
```

#### `withSectionErrorBoundary.tsx`
Higher-order component for wrapping components with error boundaries and loading states.

**Features:**
- Combines error boundary and suspense in one wrapper
- Pre-configured wrappers for each admin section
- Customizable options for different use cases

**Usage:**
```tsx
const ProtectedComponent = withManagementErrorBoundary(MyComponent, {
  loadingMessage: "Loading management data...",
  showSkeleton: true
});
```

#### `ErrorFallbackComponents.tsx`
Specialized error fallback components for different error types.

**Features:**
- Network error fallback with connection diagnostics
- Database error fallback with session refresh options
- Permission error fallback with role-based messaging
- Generic application error fallback with debugging tools

### Services

#### `errorRecoveryService.ts`
Centralized error handling and recovery service.

**Features:**
- Error classification and severity assessment
- Automatic recovery strategy selection
- Error history and analytics
- Integration with external error tracking
- Retry mechanisms with exponential backoff

#### `useErrorRecovery.ts`
React hook for error recovery functionality.

**Features:**
- Component-level error reporting
- Automatic recovery attempts
- Error state management
- Global error handling capabilities

## Implementation Details

### Error Boundary Integration

All admin section layouts now include error boundaries:

```tsx
// ManagementLayout.tsx
<SectionErrorBoundary sectionName="Management">
  <div className="space-y-6">
    {/* Layout content */}
    <div className="flex-1 min-w-0">
      <Suspense fallback={<MinimalSectionLoading sectionName="Management Page" />}>
        <Outlet />
      </Suspense>
    </div>
  </div>
</SectionErrorBoundary>
```

### Loading State Integration

Each layout includes suspense boundaries for lazy-loaded components:

```tsx
<Suspense fallback={<MinimalSectionLoading sectionName="Page Name" />}>
  <Outlet />
</Suspense>
```

### Error Recovery Strategies

The system provides multiple recovery strategies based on error type:

1. **Network Errors:**
   - Retry failed requests
   - Check internet connection
   - Switch to offline mode

2. **Database Errors:**
   - Refresh authentication session
   - Clear local cache
   - Retry with exponential backoff

3. **Permission Errors:**
   - Refresh user permissions
   - Redirect to appropriate page
   - Show access request form

4. **Generic Errors:**
   - Reload component
   - Navigate back
   - Reload entire page

## Usage Examples

### Basic Error Boundary

```tsx
import SectionErrorBoundary from '@/components/admin/layout/SectionErrorBoundary';

const MySection = () => (
  <SectionErrorBoundary sectionName="Custom Section">
    <MyComponent />
  </SectionErrorBoundary>
);
```

### Custom Error Fallback

```tsx
import { NetworkErrorFallback } from '@/components/admin/layout/ErrorFallbackComponents';

const MyErrorBoundary = () => (
  <SectionErrorBoundary 
    sectionName="API Section"
    fallback={NetworkErrorFallback}
  >
    <APIComponent />
  </SectionErrorBoundary>
);
```

### Using Error Recovery Hook

```tsx
import { useErrorRecovery } from '@/hooks/useErrorRecovery';

const MyComponent = () => {
  const { reportError, attemptRecovery, isRecovering } = useErrorRecovery({
    section: 'Management',
    component: 'UserList',
    autoRecover: true,
  });

  const handleError = (error: Error) => {
    reportError(error, { userId: currentUser.id });
  };

  return (
    <div>
      {isRecovering && <div>Attempting to recover...</div>}
      {/* Component content */}
    </div>
  );
};
```

### Loading States

```tsx
import SectionLoadingFallback, { MinimalSectionLoading } from '@/components/admin/layout/SectionLoadingFallback';

// Full skeleton loading
<SectionLoadingFallback 
  sectionName="Analytics" 
  showSkeleton={true}
  message="Loading analytics data..."
/>

// Minimal loading
<MinimalSectionLoading sectionName="Settings" />
```

## Error Reporting and Analytics

### Error Statistics

The error recovery service provides comprehensive error analytics:

```tsx
import { errorRecoveryService } from '@/services/errorRecoveryService';

const stats = errorRecoveryService.getErrorStatistics();
console.log('Total errors:', stats.totalErrors);
console.log('Errors by severity:', stats.errorsBySeverity);
console.log('Most common errors:', stats.mostCommonErrors);
```

### External Integration

The system integrates with external error tracking services:

```tsx
// Configure error tracking
window.errorTracker = {
  captureException: (error, context) => {
    // Send to Sentry, LogRocket, etc.
  }
};
```

## Best Practices

### 1. Section-Specific Error Boundaries
Always wrap section layouts with appropriate error boundaries:

```tsx
// ✅ Good
<SectionErrorBoundary sectionName="Management">
  <ManagementContent />
</SectionErrorBoundary>

// ❌ Avoid generic boundaries
<ErrorBoundary>
  <ManagementContent />
</ErrorBoundary>
```

### 2. Meaningful Loading States
Provide context-specific loading messages:

```tsx
// ✅ Good
<SectionLoadingFallback 
  sectionName="Analytics" 
  message="Loading financial data..."
/>

// ❌ Generic loading
<div>Loading...</div>
```

### 3. Error Context
Always provide relevant context when reporting errors:

```tsx
// ✅ Good
reportError(error, {
  userId: user.id,
  action: 'data-fetch',
  resource: 'user-list'
});

// ❌ Missing context
reportError(error);
```

### 4. Recovery Strategy Testing
Test recovery strategies in development:

```tsx
// Development helper
if (process.env.NODE_ENV === 'development') {
  window.testErrorRecovery = () => {
    throw new Error('Test error for recovery');
  };
}
```

## Testing

### Error Boundary Testing

```tsx
import { render, screen } from '@testing-library/react';
import SectionErrorBoundary from './SectionErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('displays error fallback when child throws', () => {
  render(
    <SectionErrorBoundary sectionName="Test">
      <ThrowError />
    </SectionErrorBoundary>
  );
  
  expect(screen.getByText(/Test Section Error/)).toBeInTheDocument();
});
```

### Loading State Testing

```tsx
import { render, screen } from '@testing-library/react';
import SectionLoadingFallback from './SectionLoadingFallback';

test('displays section-specific loading message', () => {
  render(<SectionLoadingFallback sectionName="Analytics" />);
  
  expect(screen.getByText(/Loading analytics/)).toBeInTheDocument();
});
```

## Performance Considerations

### 1. Error Boundary Placement
Place error boundaries at appropriate levels to prevent entire section failures:

```tsx
// ✅ Section-level boundary
<SectionErrorBoundary>
  <SectionLayout>
    <ComponentA />
    <ComponentB />
  </SectionLayout>
</SectionErrorBoundary>

// ✅ Component-level boundaries for critical components
<SectionErrorBoundary>
  <CriticalComponent />
</SectionErrorBoundary>
```

### 2. Loading State Optimization
Use appropriate loading states based on content complexity:

```tsx
// ✅ Skeleton for complex layouts
<SectionLoadingFallback showSkeleton={true} />

// ✅ Minimal loading for simple content
<MinimalSectionLoading />
```

### 3. Error History Management
The error service automatically manages history size to prevent memory leaks:

```tsx
// Automatic cleanup after 50 errors
// Manual cleanup if needed
errorRecoveryService.clearErrorHistory();
```

## Troubleshooting

### Common Issues

1. **Error boundaries not catching errors:**
   - Ensure errors are thrown during render, not in event handlers
   - Use the error recovery hook for event handler errors

2. **Loading states not showing:**
   - Verify Suspense boundaries are properly placed
   - Check that components are lazy-loaded

3. **Recovery strategies not working:**
   - Ensure error types are correctly classified
   - Check network connectivity for network-related recoveries

### Debug Mode

Enable debug mode in development:

```tsx
// Add to your app initialization
if (process.env.NODE_ENV === 'development') {
  window.debugErrorBoundaries = true;
}
```

## Migration Guide

### From Existing Error Handling

1. **Replace generic error boundaries:**
   ```tsx
   // Before
   <ErrorBoundary>
     <Component />
   </ErrorBoundary>
   
   // After
   <SectionErrorBoundary sectionName="SectionName">
     <Component />
   </SectionErrorBoundary>
   ```

2. **Update loading states:**
   ```tsx
   // Before
   <div>Loading...</div>
   
   // After
   <SectionLoadingFallback sectionName="SectionName" />
   ```

3. **Add error reporting:**
   ```tsx
   // Before
   console.error(error);
   
   // After
   const { reportError } = useErrorRecovery({
     section: 'SectionName',
     component: 'ComponentName'
   });
   reportError(error);
   ```

This comprehensive error handling system ensures robust, user-friendly error management across all admin section layouts.