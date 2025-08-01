# Global Client Selector - Developer Guide

## Overview

The Global Client Selector is a centralized mechanism for filtering data by client across the entire application. This document explains how the feature works, how to implement it on new pages, and future enhancements to consider.

## Architecture

### Core Components

1. **ClientContext** (`src/context/ClientContext.tsx`)
   - React context that stores and provides client selection state
   - Exposes the `useClient` hook for consuming components
   - Manages client list fetching and loading states

2. **ClientProvider** (`src/context/ClientContext.tsx`)
   - Context provider component that wraps the application
   - Located in AdminLayout to cover all admin pages
   - Handles client data fetching and state management

3. **GlobalClientSelector** (`src/components/GlobalClientSelector.tsx`)
   - UI component that appears in the TopBar
   - Uses the ClientContext to display and update the selected client
   - Only visible to admin users with appropriate permissions

4. **ClientSelector** (`src/components/ClientSelector.tsx`)
   - Pure presentational dropdown component
   - Used by GlobalClientSelector to render the UI

## How It Works

1. The `ClientProvider` wraps the admin interface in `AdminLayout.tsx`
2. It fetches the list of available clients and maintains selection state
3. The `GlobalClientSelector` in the TopBar shows the current selection
4. Admin pages use the `useClient` hook to access the selected client ID
5. When the selected client changes, pages refetch their data

## Implementation Guide for New Pages

### Step 1: Import the useClient hook

```tsx
import { useClient } from '@/context/ClientContext';
```

### Step 2: Access the client context in your component

```tsx
const YourComponent = () => {
  const { selectedClientId, clients, loading } = useClient();
  
  // Rest of your component
};
```

### Step 3: Use the selected client ID for data fetching

```tsx
// Example with a data fetching hook
const { data, isLoading } = useQuery(
  ['your-data', selectedClientId],
  () => yourService.getData(selectedClientId),
  {
    enabled: !!selectedClientId || selectedClientId === 'all',
  }
);
```

### Step 4: Add a refetch effect when the selected client changes

```tsx
useEffect(() => {
  if (refetch) {
    refetch();
  }
}, [selectedClientId, refetch]);
```

### Step 5: Handle loading and empty states appropriately

```tsx
if (loading) {
  return <YourLoadingComponent />;
}

if (!selectedClientId) {
  return <div>Please select a client</div>;
}
```

### Step 6: Display client selection information (optional)

```tsx
const selectedClient = clients.find(c => c.id === selectedClientId);

return (
  <div>
    <h1>Your Page Title</h1>
    <p className="text-sm text-muted-foreground">
      {selectedClientId === 'all' 
        ? 'Showing data for all clients' 
        : `Showing data for ${selectedClient?.name || 'selected client'}`}
    </p>
    {/* Rest of your component */}
  </div>
);
```

## Permission Handling

The global client selector uses the `canViewSensitiveInfo` permission check to determine if a user can see and change the client selector:

```tsx
// In GlobalClientSelector.tsx
const canViewAllClients = canViewSensitiveInfo(user);
  
// If user is not an admin, don't render the component
if (!canViewAllClients) return null;
```

## Future Enhancements

### 1. Client Selection Persistence

**Implementation Plan:**
- Add localStorage persistence to remember the user's last selected client
- Update ClientContext to initialize with the stored value
- Add synchronization across browser tabs

```tsx
// Example implementation in ClientContext.tsx
const [selectedClientId, setSelectedClientId] = useState(() => {
  const saved = localStorage.getItem('selected-client-id');
  return saved || 'all';
});

// Save to localStorage when changed
useEffect(() => {
  localStorage.setItem('selected-client-id', selectedClientId);
}, [selectedClientId]);
```

### 2. User-Assigned Client Filtering

**Implementation Plan:**
- Enhance ClientContext to filter the client list based on user permissions
- Add a new field to the user profile to store assigned client IDs
- Update the client fetching logic to respect these assignments

```tsx
// Example implementation
const getAvailableClients = async (user) => {
  // For admins with system-wide access
  if (hasSystemWideAccess(user)) {
    return await ClientService.getAllClients();
  }
  
  // For managers with multiple assigned clients
  if (user.assigned_client_ids && user.assigned_client_ids.length > 0) {
    return await ClientService.getClientsByIds(user.assigned_client_ids);
  }
  
  // For users with a single client
  if (user.client_id) {
    const client = await ClientService.getClientById(user.client_id);
    return client ? [client] : [];
  }
  
  return [];
};
```

### 3. Enhanced Error Handling

**Implementation Plan:**
- Add more robust error handling in the ClientContext
- Implement retry mechanisms for client data fetching
- Add fallback UI components for error states

### 4. Performance Optimization

**Implementation Plan:**
- Memoize client list to prevent unnecessary re-renders
- Add pagination for large client lists
- Implement client data caching

### 5. Comprehensive Testing

**Test Plan:**
- Unit tests for ClientContext and hooks
- Integration tests for client selection and data filtering
- End-to-end tests for the complete client selection workflow
- Permission-based tests to verify proper access control

```tsx
// Example test
test('useClient hook returns filtered client list based on user permissions', () => {
  // Test implementation
});
```

## Troubleshooting

### Common Issues

1. **"useClient must be used within a ClientProvider" error**
   - Ensure the component is rendered within the AdminLayout
   - Check that ClientProvider is properly imported and used in AdminLayout

2. **Client selector not visible**
   - Verify the user has the necessary permissions (canViewSensitiveInfo)
   - Check that TopBar is rendering the GlobalClientSelector

3. **Data not filtering correctly**
   - Ensure the data fetching logic is using the selectedClientId
   - Add console logs to verify the selectedClientId is being passed correctly

## Best Practices

1. Always use the `useClient` hook for accessing client context
2. Add proper loading and error states for client-dependent components
3. Implement refetch logic when the selected client changes
4. Use client filtering consistently across all admin pages
5. Follow the permission model for client data access

## Migration Guide

When migrating existing pages to use the global client selector:

1. Remove local client selector state and UI components
2. Replace with the `useClient` hook
3. Update data fetching logic to use the selected client ID
4. Add refetch effects for client changes
5. Test thoroughly to ensure data filtering works correctly

## Conclusion

The global client selector provides a consistent way to filter data across the application while respecting user permissions. By following this guide, you can easily implement client filtering on new pages and contribute to the ongoing enhancements of this feature.
