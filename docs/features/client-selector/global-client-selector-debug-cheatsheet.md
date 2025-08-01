# Global Client Selector - Debug Cheatsheet

## Quick Reference

| Issue | Command/Check | Solution |
|-------|--------------|----------|
| Context not available | `console.log(useClient())` | Wrap component with `ClientProvider` |
| Client list empty | Check Network tab | Verify API endpoint and permissions |
| Selector not visible | Check user permissions | User needs `canViewSensitiveInfo` |
| Data not filtering | Add `?debug=client` to URL | Logs client filtering process |
| Performance issues | React DevTools Profiler | Check for unnecessary re-renders |

## Common Error Messages

### "useClient must be used within a ClientProvider"

```
Error: useClient must be used within a ClientProvider
    at useClient (ClientContext.tsx:58)
    at GlobalClientSelector (GlobalClientSelector.tsx:14)
    at TopBar (TopBar.tsx:25)
```

**Solution:**
1. Check if `ClientProvider` is imported in `AdminLayout.tsx`
2. Verify `<ClientProvider>` wraps the application components
3. Ensure component using `useClient` is within the provider tree

### "Cannot read properties of undefined (reading 'id')"

```
TypeError: Cannot read properties of undefined (reading 'id')
    at ClientSelector (ClientSelector.tsx:35)
    at GlobalClientSelector (GlobalClientSelector.tsx:24)
```

**Solution:**
1. Add null checks when accessing client objects
2. Use optional chaining: `client?.id`
3. Add fallback for empty client lists

## Debugging Commands

### Check Client Context State

```tsx
// Add this to any component using useClient
const clientContext = useClient();
console.log('Client Context:', clientContext);
```

### Monitor Client Selection Changes

```tsx
// Add to component using selectedClientId
useEffect(() => {
  console.log('Selected Client ID changed:', selectedClientId);
}, [selectedClientId]);
```

### Debug Permission Issues

```tsx
// Add to GlobalClientSelector
console.log('User:', user);
console.log('Can view sensitive info:', canViewSensitiveInfo(user));
```

### Trace Data Refetching

```tsx
// Add to data fetching effect
useEffect(() => {
  console.log('Refetching data with client:', selectedClientId);
  refetch();
}, [selectedClientId, refetch]);
```

## Visual Debugging

### React DevTools

1. Open React DevTools
2. Find `ClientProvider` in component tree
3. Inspect `value` prop to see current context state
4. Check `selectedClientId` and `clients` values

### Network Monitoring

1. Open browser DevTools > Network tab
2. Filter by XHR/Fetch requests
3. Look for API calls when changing clients
4. Verify client ID is included in requests

## Performance Optimization

### Identify Re-render Issues

```tsx
// Add to component with performance concerns
console.log('Component rendered:', Date.now());
```

### Memoize Expensive Calculations

```tsx
// Replace this:
const filteredData = data.filter(item => item.clientId === selectedClientId);

// With this:
const filteredData = useMemo(() => {
  console.log('Filtering data by client');
  return data.filter(item => item.clientId === selectedClientId);
}, [data, selectedClientId]);
```

## Permission Debugging

### Check User Role and Permissions

```tsx
// Add to component with permission issues
console.log('User role:', user.role);
console.log('User permissions:', user.permissions);
console.log('Client access:', user.client_id || user.assigned_client_ids);
```

### Test Different User Types

1. Login as system admin (should see all clients)
2. Login as client admin (should see assigned clients)
3. Login as regular user (should not see selector)

## Data Flow Tracing

### Client Selection Flow

1. User selects client in GlobalClientSelector
2. setSelectedClientId updates ClientContext
3. Context triggers re-render of consuming components
4. useEffect hooks trigger data refetching
5. UI updates with new client-filtered data

### Add Debug Breakpoints

```tsx
// In ClientContext.tsx
const setSelectedClientId = (id) => {
  console.log('Setting client ID:', id);
  debugger; // Browser will pause execution here when DevTools is open
  _setSelectedClientId(id);
};
```

## Quick Fixes

### Force Client Context Reset

```tsx
// Add button for debugging
<button 
  onClick={() => {
    setSelectedClientId('all');
    window.location.reload();
  }}
  className="text-xs bg-red-500 text-white p-1 rounded"
>
  Reset Client Context
</button>
```

### Verify ClientProvider Mounting

```tsx
// Add to ClientProvider
useEffect(() => {
  console.log('ClientProvider mounted');
  return () => console.log('ClientProvider unmounted');
}, []);
```

## Testing Utilities

### Mock Client Context for Tests

```tsx
// In your test file
const mockClientContext = {
  selectedClientId: 'test-client-id',
  setSelectedClientId: jest.fn(),
  clients: [{ id: 'test-client-id', name: 'Test Client' }],
  loading: false,
  error: null
};

// Wrap component under test
<ClientContext.Provider value={mockClientContext}>
  <YourComponent />
</ClientContext.Provider>
```

## Emergency Recovery

If the client selector causes critical issues:

1. Temporarily disable by commenting out in TopBar.tsx:
   ```tsx
   {/* <GlobalClientSelector /> */}
   ```

2. Fall back to default client ID:
   ```tsx
   // In data fetching logic
   const clientId = selectedClientId || 'all';
   ```

3. Check browser console for React context errors
