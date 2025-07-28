# Troubleshooting Flow: Visual Problem-Solving Guide
## Dealermate Application

### 🎯 Purpose

This document provides systematic, visual troubleshooting flows for common issues in the Dealermate application. Follow these decision trees to quickly identify and resolve problems.

---

## 🔐 Authentication Issues Flow

```mermaid
flowchart TD
    A[User reports login/auth issue] --> B{Can user access login page?}
    
    B -->|No| C[Check routing/network]
    B -->|Yes| D{Does login form submit?}
    
    D -->|No| E[Check form validation]
    D -->|Yes| F{Does API call succeed?}
    
    F -->|No| G[Check Supabase connection]
    F -->|Yes| H{Does user profile load?}
    
    H -->|No| I[Check user table/RLS]
    H -->|Yes| J{Correct permissions shown?}
    
    J -->|No| K[Check RBAC implementation]
    J -->|Yes| L[Issue resolved]
    
    C --> C1[Check network connectivity]
    C --> C2[Verify routing configuration]
    C --> C3[Check for JavaScript errors]
    
    E --> E1[Validate form schema]
    E --> E2[Check input validation]
    E --> E3[Verify form submission handler]
    
    G --> G1[Check API keys]
    G --> G2[Verify Supabase project status]
    G --> G3[Test database connection]
    
    I --> I1[Check user exists in database]
    I --> I2[Verify RLS policies]
    I --> I3[Check user profile structure]
    
    K --> K1[Verify role assignment]
    K --> K2[Check permission utilities]
    K --> K3[Validate client_id association]
```

### Authentication Debug Steps

#### 1. Login Page Issues
- **Check**: Network tab for failed resource loads
- **Verify**: React Router configuration
- **Test**: Direct URL navigation to `/login`

#### 2. Form Submission Issues
- **Check**: Browser console for validation errors
- **Verify**: Form schema with Zod validation
- **Test**: Manual form submission with valid data

#### 3. API Connection Issues
- **Check**: Supabase project status and API keys
- **Verify**: Environment variables are loaded
- **Test**: Direct API call in browser console

#### 4. User Profile Issues
- **Check**: User exists in `users` table
- **Verify**: RLS policies allow user access
- **Test**: Direct database query for user data

---

## 📊 Data Loading Issues Flow

```mermaid
flowchart TD
    A[Data not loading/displaying] --> B{Is component mounted?}
    
    B -->|No| C[Check routing/conditional rendering]
    B -->|Yes| D{Is query executing?}
    
    D -->|No| E[Check query key/enabled state]
    D -->|Yes| F{Does API call succeed?}
    
    F -->|No| G[Check API endpoint/permissions]
    F -->|Yes| H{Is data structure correct?}
    
    H -->|No| I[Check data transformation]
    H -->|Yes| J{Is component re-rendering?}
    
    J -->|No| K[Check dependencies/memoization]
    J -->|Yes| L[Issue resolved]
    
    C --> C1[Verify route configuration]
    C --> C2[Check conditional rendering logic]
    C --> C3[Validate component props]
    
    E --> E1[Check React Query key]
    E --> E2[Verify enabled condition]
    E --> E3[Check query dependencies]
    
    G --> G1[Test API endpoint directly]
    G --> G2[Verify user permissions]
    G --> G3[Check RLS policies]
    
    I --> I1[Validate data transformation functions]
    I --> I2[Check TypeScript types]
    I --> I3[Verify data mapping]
    
    K --> K1[Check useEffect dependencies]
    K --> K2[Verify memoization]
    K --> K3[Check for infinite loops]
```

### Data Loading Debug Steps

#### 1. Component Mounting Issues
```typescript
// Add debug logging
useEffect(() => {
  console.log('Component mounted:', componentName);
  return () => console.log('Component unmounted:', componentName);
}, []);
```

#### 2. Query Execution Issues
```typescript
// Debug React Query state
const { data, isLoading, error, isError, failureCount } = useQuery({
  queryKey: ['data', id],
  queryFn: fetchData,
  enabled: !!id, // Check this condition
});

console.log('Query debug:', { 
  data, isLoading, error, isError, failureCount,
  queryKey: ['data', id],
  enabled: !!id 
});
```

#### 3. API Call Issues
```typescript
// Test API call directly
const testApiCall = async () => {
  try {
    const result = await fetch('/api/endpoint');
    console.log('API test result:', result);
  } catch (error) {
    console.error('API test failed:', error);
  }
};
```

---

## 🎨 UI/Theme Issues Flow

```mermaid
flowchart TD
    A[UI/Theme issue reported] --> B{Is theme applying?}
    
    B -->|No| C[Check theme initialization]
    B -->|Yes| D{Are styles loading?}
    
    D -->|No| E[Check CSS/Tailwind compilation]
    D -->|Yes| F{Is layout responsive?}
    
    F -->|No| G[Check responsive classes]
    F -->|Yes| H{Are interactions working?}
    
    H -->|No| I[Check event handlers]
    H -->|Yes| J[Issue resolved]
    
    C --> C1[Check ThemeInitProvider]
    C --> C2[Verify user preferences]
    C --> C3[Check CSS variables]
    
    E --> E1[Verify Tailwind config]
    E --> E2[Check CSS compilation]
    E --> E3[Validate class names]
    
    G --> G1[Check breakpoint classes]
    G --> G2[Verify responsive design]
    G --> G3[Test on different screen sizes]
    
    I --> I1[Check onClick handlers]
    I --> I2[Verify event propagation]
    I --> I3[Check disabled states]
```

### UI/Theme Debug Steps

#### 1. Theme Not Applying
```typescript
// Check theme state
console.log('Theme debug:', {
  documentTheme: document.documentElement.getAttribute('data-theme'),
  userTheme: user?.preferences?.displaySettings?.theme,
  systemTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
});

// Force theme application
document.documentElement.setAttribute('data-theme', 'light');
```

#### 2. Styles Not Loading
```bash
# Check Tailwind compilation
npm run build
# Look for CSS errors in output

# Verify class names exist
# Search in compiled CSS for specific classes
```

#### 3. Responsive Issues
```css
/* Add debug borders */
* {
  outline: 1px solid red !important;
}

/* Check specific breakpoints */
@media (max-width: 768px) {
  .debug-mobile {
    background: yellow !important;
  }
}
```

---

## ⚡ Performance Issues Flow

```mermaid
flowchart TD
    A[Performance issue reported] --> B{Is it rendering performance?}
    
    B -->|Yes| C[Check component re-renders]
    B -->|No| D{Is it data fetching?}
    
    D -->|Yes| E[Check query optimization]
    D -->|No| F{Is it bundle size?}
    
    F -->|Yes| G[Analyze bundle composition]
    F -->|No| H{Is it memory usage?}
    
    H -->|Yes| I[Check for memory leaks]
    H -->|No| J[Check network performance]
    
    C --> C1[Use React DevTools Profiler]
    C --> C2[Check unnecessary re-renders]
    C --> C3[Optimize with memoization]
    
    E --> E1[Check query caching]
    E --> E2[Optimize database queries]
    E --> E3[Implement pagination]
    
    G --> G1[Use bundle analyzer]
    G --> G2[Check for duplicate dependencies]
    G --> G3[Implement code splitting]
    
    I --> I1[Check useEffect cleanup]
    I --> I2[Monitor memory usage]
    I --> I3[Check for circular references]
    
    J --> J1[Check API response times]
    J --> J2[Optimize image loading]
    J --> J3[Implement caching]
```

### Performance Debug Steps

#### 1. Rendering Performance
```typescript
// Add render counting
const useRenderCount = (componentName) => {
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`${componentName} rendered ${renderCount.current} times`);
};

// Use React DevTools Profiler
// Record interaction and analyze flame graph
```

#### 2. Data Fetching Performance
```typescript
// Add timing to queries
const useTimedQuery = (key, fn) => {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      console.time(`Query: ${key}`);
      const result = await fn();
      console.timeEnd(`Query: ${key}`);
      return result;
    }
  });
};
```

#### 3. Bundle Size Analysis
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist

# Check for large dependencies
npm ls --depth=0 | grep -E '\d+\.\d+MB'
```

---

## 🔒 Permission/RBAC Issues Flow

```mermaid
flowchart TD
    A[Permission denied or incorrect access] --> B{Is user authenticated?}
    
    B -->|No| C[Redirect to login]
    B -->|Yes| D{Is user role correct?}
    
    D -->|No| E[Check role assignment in database]
    D -->|Yes| F{Is client_id correct?}
    
    F -->|No| G[Check client association]
    F -->|Yes| H{Are permission utils working?}
    
    H -->|No| I[Check permission utility functions]
    H -->|Yes| J{Are RLS policies correct?}
    
    J -->|No| K[Review database RLS policies]
    J -->|Yes| L[Issue resolved]
    
    E --> E1[Check users table]
    E --> E2[Verify role enum values]
    E --> E3[Check role assignment logic]
    
    G --> G1[Verify client_id in users table]
    G --> G2[Check client exists]
    G --> G3[Validate client association]
    
    I --> I1[Test permission functions]
    I --> I2[Check function parameters]
    I --> I3[Verify return values]
    
    K --> K1[Review RLS policy conditions]
    K --> K2[Test policies with different users]
    K --> K3[Check policy enable/disable status]
```

### Permission Debug Steps

#### 1. User Authentication Check
```typescript
// Debug auth state
console.log('Auth debug:', {
  user: user,
  isAuthenticated: isAuthenticated,
  session: session,
  loading: isLoading
});
```

#### 2. Role Assignment Check
```typescript
// Check user role in database
const checkUserRole = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, role, client_id')
    .eq('id', userId)
    .single();
    
  console.log('User role check:', { data, error });
};
```

#### 3. Permission Utility Check
```typescript
// Test permission functions
const debugPermissions = (user) => {
  console.log('Permission debug:', {
    hasSystemAccess: hasSystemWideAccess(user),
    canViewSensitive: canViewSensitiveInfo(user),
    shouldFilter: shouldFilterByClient(user),
    clientFilter: getClientIdFilter(user)
  });
};
```

---

## 🚨 Emergency Troubleshooting

### Critical System Failure
1. **Check browser console** for JavaScript errors
2. **Clear all storage** and refresh
3. **Test in incognito mode** to rule out extensions
4. **Check Supabase status** and API connectivity
5. **Revert to last known working commit**

### Database Connection Issues
1. **Test connection** with simple query
2. **Check API keys** and environment variables
3. **Verify Supabase project** status
4. **Review RLS policies** for access issues

### Authentication System Failure
1. **Clear auth tokens** from storage
2. **Test login flow** step by step
3. **Check user table** for data integrity
4. **Verify auth callbacks** and redirects

---

## 📊 Monitoring & Prevention

### Regular Health Checks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Analyze user feedback and support tickets
- **Quarterly**: Comprehensive security and performance audit

### Automated Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Track user session metrics
- Alert on critical failures

---

*Use this troubleshooting flow as a systematic approach to problem-solving. For specific technical details, refer to the [Debug Cheatsheet](./debug-cheatsheet.md) and [Developer Guide](./developer-guide.md).*