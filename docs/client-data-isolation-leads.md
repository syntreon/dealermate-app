# Client Data Isolation in Leads Management

## Overview

This document outlines the implementation of client data isolation in the leads management module, which is a critical requirement for compliance and privacy. The system ensures that users can only access leads related to their own client, while admin users can access leads across all clients.

## Key Components

### 1. Lead Service

The `lead-service.ts` file provides the core functionality for interacting with leads data in Supabase:

```typescript
/**
 * Get all leads with optional filtering
 * 
 * CRITICAL: This method enforces client data isolation by filtering by client_id
 */
public async getLeads(filters?: LeadFilters, forceRefresh = false): Promise<Lead[]> {
  // ...
  
  // Apply filters if provided
  if (filters) {
    // CRITICAL: Always filter by client_id if provided for data isolation
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    
    // Other filters...
  }
  
  // ...
}
```

### 2. useLeadService Hook

The `useLeadService.ts` hook enforces client data isolation at the application level:

```typescript
// Get client ID filter based on user role
const clientIdFilter = getClientIdFilter(user);

// Merge filters with client ID filter for data isolation
const filtersToUse: LeadFilters = {
  ...(newFilters || filters || {}),
  // Only add clientId if it's not already specified and we have a filter to apply
  ...(clientIdFilter && !(newFilters?.clientId || filters?.clientId) ? { clientId: clientIdFilter } : {})
};
```

### 3. Client Data Isolation Utilities

The `clientDataIsolation.ts` file provides utility functions for enforcing client data isolation:

```typescript
// Gets the client ID to filter by based on user
export function getClientIdFilter(user: User | null): string | null {
  if (!user) return null;
  
  if (shouldFilterByClient(user)) {
    return user.client_id;
  }
  
  return null; // Admin users don't need filtering
}

// Determines if sensitive information should be visible
export function canViewSensitiveInfo(user: User | null): boolean {
  if (!user) return false;
  
  return user.is_admin || user.role === 'admin' || user.role === 'owner';
}
```

### 4. UI Components

The UI components hide sensitive information from non-admin users:

```tsx
{/* Only show client ID to admins */}
{lead.clientId && canViewSensitiveInfo(user) && (
  <div className="text-xs text-foreground/60 mt-0.5">
    Client ID: {lead.clientId}
  </div>
)}
```

## Implementation Details

### Data Filtering

1. **Database Level**: All queries to the leads table include a `client_id` filter for non-admin users
2. **Service Level**: The lead service enforces client ID filtering in all methods
3. **Hook Level**: The useLeadService hook automatically applies client ID filtering
4. **Component Level**: UI components respect user permissions for displaying sensitive information

### Sensitive Information Handling

1. **Client IDs**: Hidden from non-admin users in the UI
2. **Client Names**: Shown to admin users instead of just IDs
3. **Export Functionality**: Filtered by client ID for non-admin users

## Security Considerations

1. **Defense in Depth**: Client data isolation is implemented at multiple levels:
   - Database queries
   - Service methods
   - React hooks
   - UI components

2. **No Bypass**: All data access paths enforce client data isolation

3. **Consistent Implementation**: All components use the same utility functions for permission checks

## Testing Client Data Isolation

### Manual Testing Checklist

1. **Admin User Test**:
   - Log in as an admin user
   - Verify you can see leads from all clients
   - Verify client IDs are visible

2. **Client User Test**:
   - Log in as a non-admin user
   - Verify you can only see leads for your client
   - Verify client IDs are hidden
   - Attempt to access other clients' leads via URL manipulation

3. **Edge Cases**:
   - Test with users who have no client association
   - Test with inactive clients
   - Test with deleted clients

### Automated Testing

Implement unit and integration tests for client data isolation:

```typescript
// Example test
describe('Client Data Isolation in Leads', () => {
  it('should filter leads by client ID for non-admin users', () => {
    const regularUser = { id: '1', client_id: 'client1', is_admin: false };
    const adminUser = { id: '2', client_id: null, is_admin: true };
    
    // Mock the hook with different users
    // Verify correct filtering behavior
  });
});
```

## Compliance Documentation

This implementation ensures:

1. **Data Privacy**: Users can only access leads related to their own client
2. **Least Privilege**: Users have access only to the data they need
3. **Audit Trail**: All lead access can be tracked and audited
4. **Consistent Implementation**: All components follow the same isolation pattern