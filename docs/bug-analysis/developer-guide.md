# Developer Guide: Bug Prevention & Best Practices
## Dealermate Application

### 🎯 Purpose

This guide helps developers understand common pitfalls, implement best practices, and prevent bugs in the Dealermate application. It serves as both an onboarding resource for new developers and a reference for experienced team members.

---

## 🚨 Critical Bug Patterns to Avoid

### 1. Authentication & Session Management

#### ❌ Common Mistakes
```typescript
// DON'T: Direct role checking without utility functions
if (user.role === 'admin') { /* ... */ }

// DON'T: Assuming user data is always available
const clientId = user.client_id; // Can be null/undefined

// DON'T: Multiple theme initialization points
useEffect(() => {
  initializeTheme();
}, []);
useEffect(() => {
  setTheme(userTheme);
}, [userTheme]);
```

#### ✅ Best Practices
```typescript
// DO: Use centralized permission utilities
import { hasSystemWideAccess, canViewSensitiveInfo } from '@/utils/clientDataIsolation';

if (hasSystemWideAccess(user)) { /* ... */ }

// DO: Always validate user data
const clientId = user?.client_id || null;

// DO: Single theme initialization point
const { isInitialized } = useThemeInitContext();
if (!isInitialized) {
  // Handle uninitialized state
}
```

### 2. Data Fetching & State Management

#### ❌ Common Mistakes
```typescript
// DON'T: Unhandled promise rejections
const fetchData = async () => {
  const data = await apiCall(); // Can throw
  setState(data);
};

// DON'T: Memory leaks in useEffect
useEffect(() => {
  const interval = setInterval(fetchData, 1000);
  // Missing cleanup
}, []);

// DON'T: Storing sensitive data in localStorage
localStorage.setItem('user_data', JSON.stringify(user));
```

#### ✅ Best Practices
```typescript
// DO: Proper error handling
const fetchData = async () => {
  try {
    const data = await apiCall();
    setState(data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    setError(error.message);
  }
};

// DO: Cleanup in useEffect
useEffect(() => {
  const interval = setInterval(fetchData, 1000);
  return () => clearInterval(interval);
}, []);

// DO: Use secure storage for sensitive data
// Store only non-sensitive data in localStorage
// Use Supabase auth for sensitive data
```

### 3. Component Performance

#### ❌ Common Mistakes
```typescript
// DON'T: Inline object/array creation in dependencies
useEffect(() => {
  fetchData();
}, [{ filter: 'active' }]); // Creates new object every render

// DON'T: Missing memoization for expensive calculations
const expensiveValue = heavyCalculation(data);

// DON'T: Unnecessary re-renders
const Component = ({ data }) => {
  const processedData = data.map(item => ({ ...item, processed: true }));
  return <div>{/* ... */}</div>;
};
```

#### ✅ Best Practices
```typescript
// DO: Stable dependencies
const filter = useMemo(() => ({ filter: 'active' }), []);
useEffect(() => {
  fetchData();
}, [filter]);

// DO: Memoize expensive calculations
const expensiveValue = useMemo(() => heavyCalculation(data), [data]);

// DO: Memoize components and callbacks
const Component = React.memo(({ data }) => {
  const processedData = useMemo(
    () => data.map(item => ({ ...item, processed: true })),
    [data]
  );
  return <div>{/* ... */}</div>;
});
```

---

## 🔒 Security Best Practices

### 1. Role-Based Access Control (RBAC)

#### Implementation Checklist
- [ ] Use centralized permission utilities from `clientDataIsolation.ts`
- [ ] Validate permissions on both client and server side
- [ ] Never trust client-side role information alone
- [ ] Implement proper data isolation between clients
- [ ] Log all permission-related actions for audit

#### Example Implementation
```typescript
import { 
  hasSystemWideAccess, 
  canAccessClientData, 
  shouldFilterByClient 
} from '@/utils/clientDataIsolation';

const AdminComponent = () => {
  const { user } = useAuth();
  
  // Check permissions before rendering
  if (!hasSystemWideAccess(user)) {
    return <AccessDenied />;
  }
  
  // Filter data based on user permissions
  const filteredData = shouldFilterByClient(user) 
    ? data.filter(item => canAccessClientData(user, item.client_id))
    : data;
    
  return <AdminPanel data={filteredData} />;
};
```

### 2. Data Validation & Sanitization

#### Input Validation
```typescript
// Use Zod for schema validation
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'user', 'client_admin', 'client_user']),
  client_id: z.string().uuid().nullable()
});

// Validate before processing
const validateUserData = (data: unknown) => {
  try {
    return UserSchema.parse(data);
  } catch (error) {
    console.error('User data validation failed:', error);
    throw new Error('Invalid user data');
  }
};
```

---

## 🎨 UI/UX Best Practices

### 1. Theme System

#### Theme-Aware Components
```typescript
// DO: Use CSS variables for theme-aware styling
const Component = () => (
  <div className="bg-background text-foreground border-border">
    <button className="bg-primary text-primary-foreground hover:bg-primary/90">
      Click me
    </button>
  </div>
);

// DON'T: Hardcode colors
const Component = () => (
  <div className="bg-white text-black border-gray-300 dark:bg-gray-900 dark:text-white">
    {/* Complex theme handling */}
  </div>
);
```

#### Theme Utilities
```typescript
import { useOptimizedTheme } from '@/hooks/useOptimizedTheme';

const Component = () => {
  const { theme, isDark, getThemeAwareColor } = useOptimizedTheme();
  
  const chartColor = getThemeAwareColor('primary');
  
  return (
    <Chart 
      data={data} 
      color={chartColor}
      theme={isDark ? 'dark' : 'light'}
    />
  );
};
```

### 2. Loading States & Error Handling

#### Consistent Loading Patterns
```typescript
const DataComponent = () => {
  const { data, isLoading, error } = useQuery('data', fetchData);
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return (
      <ErrorFallback 
        error={error} 
        onRetry={() => queryClient.invalidateQueries('data')}
      />
    );
  }
  
  return <DataDisplay data={data} />;
};
```

#### Error Boundaries
```typescript
// Wrap major sections with error boundaries
const App = () => (
  <ErrorBoundary fallback={<ErrorFallback />}>
    <Router>
      <Routes>
        <Route path="/admin" element={
          <ErrorBoundary fallback={<AdminErrorFallback />}>
            <AdminLayout />
          </ErrorBoundary>
        } />
      </Routes>
    </Router>
  </ErrorBoundary>
);
```

---

## 📊 Performance Optimization

### 1. Component Optimization

#### Memoization Strategy
```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data, onAction }) => {
  const processedData = useMemo(() => 
    data.map(item => heavyProcessing(item)), 
    [data]
  );
  
  const handleAction = useCallback((id) => {
    onAction(id);
  }, [onAction]);
  
  return <div>{/* Render processed data */}</div>;
});

// Use proper comparison for complex props
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((item, index) => 
      item.id === nextProps.data[index].id
    )
  );
};

export default React.memo(ExpensiveComponent, areEqual);
```

### 2. Data Fetching Optimization

#### Query Optimization
```typescript
// Use React Query for caching and background updates
const useOptimizedData = (clientId: string | null) => {
  return useQuery({
    queryKey: ['data', clientId],
    queryFn: () => fetchData(clientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3
  });
};

// Batch API calls when possible
const useBatchedData = (ids: string[]) => {
  return useQuery({
    queryKey: ['batch-data', ids],
    queryFn: () => fetchBatchData(ids),
    enabled: ids.length > 0
  });
};
```

---

## 🧪 Testing Guidelines

### 1. Unit Testing

#### Test Critical Functions
```typescript
// Test permission utilities
describe('clientDataIsolation', () => {
  test('hasSystemWideAccess returns true for admin users', () => {
    const adminUser = { role: 'admin', is_admin: true };
    expect(hasSystemWideAccess(adminUser)).toBe(true);
  });
  
  test('shouldFilterByClient returns true for client users', () => {
    const clientUser = { role: 'client_user', client_id: 'client-1' };
    expect(shouldFilterByClient(clientUser)).toBe(true);
  });
});

// Test data transformation
describe('data transformers', () => {
  test('transformClient handles missing data gracefully', () => {
    const incompleteData = { id: '1', name: 'Test' };
    const result = transformClient(incompleteData);
    expect(result.joined_at).toBeDefined();
    expect(result.monthly_billing_amount_cad).toBe(0);
  });
});
```

### 2. Integration Testing

#### Test User Workflows
```typescript
// Test authentication flow
describe('Authentication Flow', () => {
  test('user can login and access dashboard', async () => {
    render(<App />);
    
    // Navigate to login
    fireEvent.click(screen.getByText('Login'));
    
    // Fill login form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Sign In'));
    
    // Verify dashboard loads
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
```

---

## 🔍 Debugging Strategies

### 1. Common Debug Scenarios

#### Authentication Issues
```typescript
// Add debug logging for auth state
const useAuthSession = () => {
  // ... existing code ...
  
  useEffect(() => {
    console.log('[AUTH DEBUG]', {
      user: user?.id,
      role: user?.role,
      client_id: user?.client_id,
      isAuthenticated,
      isLoading
    });
  }, [user, isAuthenticated, isLoading]);
};
```

#### Permission Issues
```typescript
// Debug permission checks
const checkPermissions = (user, action) => {
  const hasAccess = hasSystemWideAccess(user);
  console.log('[PERMISSION DEBUG]', {
    user: user?.id,
    role: user?.role,
    action,
    hasAccess,
    client_id: user?.client_id
  });
  return hasAccess;
};
```

### 2. Performance Debugging

#### Component Re-render Tracking
```typescript
// Use React DevTools Profiler or custom hook
const useRenderCount = (componentName) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  console.log(`[RENDER] ${componentName}: ${renderCount.current}`);
  
  return renderCount.current;
};

const Component = () => {
  useRenderCount('MyComponent');
  // ... component logic
};
```

---

## 📚 Resources & Tools

### Development Tools
- **React DevTools**: Component debugging and profiling
- **Redux DevTools**: State management debugging (if using Redux)
- **React Query DevTools**: Query state and cache inspection
- **Chrome DevTools**: Performance profiling and network analysis

### Code Quality Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks for quality checks

### Testing Tools
- **Vitest**: Unit and integration testing
- **Testing Library**: Component testing utilities
- **MSW**: API mocking for tests
- **Playwright**: End-to-end testing (planned)

---

## 🤝 Code Review Checklist

### Security Review
- [ ] Permission checks implemented correctly
- [ ] Data isolation enforced
- [ ] Input validation in place
- [ ] No sensitive data in client-side storage
- [ ] Audit logging for sensitive operations

### Performance Review
- [ ] Unnecessary re-renders avoided
- [ ] Expensive calculations memoized
- [ ] Proper cleanup in useEffect
- [ ] Bundle size impact considered
- [ ] Database queries optimized

### Code Quality Review
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Accessibility considerations
- [ ] Theme system used correctly

---

*This guide is continuously updated based on lessons learned and new patterns discovered during development.*