# SystemStatusService Developer Guide

## Overview
The `SystemStatusService` is responsible for managing system messages and agent statuses in the Dealermate application. This service provides methods for creating, reading, updating, and deleting system messages, as well as managing agent statuses.

## Key Methods

### updateAgentStatus
Updates or creates an agent status record with proper user authentication.

**Parameters:**
- `status`: Omit<AgentStatus, 'lastUpdated'> - The status object to update/create
- `clientId?`: string | null - Optional client ID for client-specific statuses
- `updatedBy?`: string - Optional user ID of the person making the update

**Returns:** Promise<AgentStatus>

**Features:**
- Automatically retrieves current user ID if not provided
- Implements retry mechanism (3 attempts with 100ms delays) for user ID retrieval
- Throws error if user authentication fails
- Uses upsert operation to handle both updates and creates
- Properly sets the `updated_by` field to satisfy database constraints

### getAgentStatus
Retrieves the current agent status for a specific client or platform-wide.

**Parameters:**
- `clientId?`: string | null - Optional client ID

**Returns:** Promise<AgentStatus>

### getSystemMessagesPaginated
Retrieves system messages with pagination and caching.

**Parameters:**
- `page`: number - Page number (default: 1)
- `pageSize`: number - Number of messages per page (default: 5)
- `clientId?`: string | null - Optional client ID
- `forceRefresh?`: boolean - Bypass cache if true

**Returns:** Promise<PaginatedMessages>

## Error Handling
The service implements comprehensive error handling:
- User authentication errors throw descriptive error messages
- Database errors are propagated to calling functions
- Cache failures are handled gracefully

## Monitoring
The service includes system monitoring capabilities:
- `startMonitoring()` - Begins periodic health checks
- `stopMonitoring()` - Stops health checks
- Health checks run every 30 seconds
- Automatically updates agent status based on system health

## Usage Examples

```typescript
// Update agent status with current user
await SystemStatusService.updateAgentStatus({
  status: 'active',
  message: 'All systems operational'
});

// Update agent status for specific client
await SystemStatusService.updateAgentStatus({
  status: 'maintenance',
  message: 'Scheduled maintenance'
}, 'client-123');

// Update agent status with specific user
await SystemStatusService.updateAgentStatus({
  status: 'inactive',
  message: 'System issues detected'
}, null, 'user-456');
```

## Best Practices
1. Always ensure user authentication before calling update methods
2. Use the retry mechanism for handling temporary authentication issues
3. Leverage caching for improved performance
4. Handle errors appropriately in calling components
5. Use proper client ID filtering for multi-tenant scenarios
