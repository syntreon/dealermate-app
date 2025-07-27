# Backend Integration

This document explains how the audit logging system is integrated with the application's backend code through the `AuditService`.

## AuditService Overview

The `AuditService` provides a TypeScript interface for interacting with the audit logging system. It's implemented in `src/services/auditService.ts` and offers methods for creating and retrieving audit logs.

## Service Role Authentication

The audit service uses a special Supabase client with service role privileges to bypass Row Level Security (RLS) policies when creating audit logs:

```typescript
// Get Supabase URL and service role key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Create an admin client with the service role key if available
let adminSupabase: any = null;
if (SUPABASE_SERVICE_ROLE_KEY) {
  adminSupabase = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-admin'
        }
      }
    }
  );
}
```

**Key Features:**

1. **Service Role Key**: Uses the `VITE_SUPABASE_SERVICE_ROLE_KEY` environment variable to create a privileged client
2. **No Token Refresh**: Disables token auto-refresh and session persistence for security
3. **Client Identification**: Adds a custom header to identify admin client requests
4. **Fallback Handling**: Gracefully handles missing service role key scenarios

## Core Methods

### 1. logAuditEvent

This method creates new audit log entries:

```typescript
logAuditEvent: async (
  userId: string | null,
  action: AuditAction,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  clientId?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: string
): Promise<AuditLog>
```

**Parameters:**

- `userId`: ID of the user performing the action (null for system actions)
- `action`: Type of action (INSERT, UPDATE, DELETE, etc.)
- `tableName`: Name of the table being modified
- `recordId`: ID of the record being modified (optional)
- `oldValues`: Previous state of the record (for UPDATE/DELETE)
- `newValues`: New state of the record (for INSERT/UPDATE)
- `clientId`: ID of the client context (optional)
- `ipAddress`: User's IP address (optional)
- `userAgent`: User's browser agent (optional)
- `details`: Additional context (stored in new_values if provided)

**Implementation Details:**

1. **Service Role Check**: Verifies if the service role key is available
2. **Data Preparation**: Formats audit data according to the database schema
3. **Admin Client Usage**: Uses the admin client to bypass RLS policies
4. **Error Handling**: Returns a minimal audit log object if logging fails
5. **No Regular Client Fallback**: Doesn't attempt to use the regular client due to RLS restrictions

### 2. getAuditLogs

This method retrieves audit logs with filtering and pagination:

```typescript
getAuditLogs: async (
  filters?: AuditFilters,
  pagination?: PaginationOptions,
  useOptimizedQuery: boolean = true
): Promise<PaginatedResponse<AuditLog>>
```

**Parameters:**

- `filters`: Optional filters for user_id, client_id, action, table_name, etc.
- `pagination`: Optional pagination options (page, pageSize)
- `useOptimizedQuery`: Whether to use optimized query settings for large datasets

**Implementation Details:**

1. **Joins**: Includes user and client data in the results
2. **Filtering**: Applies filters based on provided criteria
3. **Pagination**: Implements offset-based pagination
4. **Sorting**: Orders results by created_at timestamp (newest first)
5. **Transformation**: Converts database rows to AuditLog objects with summaries

## Type Definitions

The service defines several types to work with audit logs:

```typescript
// Define a type for audit log rows since it's not in the generated types
type AuditLogRow = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};
```

**Note:** The `audit_logs` table might not be included in the generated Supabase types, requiring type assertions (`as any`) in queries.

## Helper Functions

### transformAuditLog

Converts database rows to AuditLog objects:

```typescript
const transformAuditLog = (row: AuditLogRow): AuditLog => {
  return {
    id: row.id,
    user_id: row.user_id,
    client_id: row.client_id,
    action: row.action as AuditAction,
    table_name: row.table_name,
    record_id: row.record_id,
    old_values: row.old_values as Record<string, any> | null,
    new_values: row.new_values as Record<string, any> | null,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    created_at: new Date(row.created_at),
  };
};
```

### generateAuditSummary

Creates human-readable summaries for audit logs:

```typescript
const generateAuditSummary = (log: AuditLog): string => {
  const actionMap: Record<AuditAction, string> = {
    'create': 'created',
    'update': 'updated',
    'delete': 'deleted',
    'login': 'logged in',
    'logout': 'logged out',
    'password_change': 'changed password',
    'role_change': 'changed role',
    'permission_change': 'changed permissions',
    'agent_status_change': 'changed agent status',
    'system_message_create': 'created system message',
    'bulk_operation': 'performed bulk operation',
    'data_export': 'exported data',
    'data_import': 'imported data'
  };

  const actionText = actionMap[log.action] || log.action;
  const tableName = log.table_name.replace('_', ' ');
  
  if (log.record_id) {
    return `User ${actionText} ${tableName} record ${log.record_id}`;
  } else {
    return `User ${actionText} ${tableName}`;
  }
};
```

## Error Handling

The service includes robust error handling:

```typescript
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('Audit Database error:', error);
  
  const dbError = new Error(error.message || 'Audit operation failed') as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  
  return dbError;
};
```

## Integration Points

### 1. Manual Audit Logging

For operations not covered by database triggers, you can manually log audit events:

```typescript
// Example: Log a user login event
await AuditService.logAuditEvent(
  user.id,
  'login',
  'users',
  user.id,
  null,
  { login_time: new Date().toISOString() },
  user.client_id,
  requestIp,
  userAgent
);
```

### 2. Admin Panel Integration

The audit logs are displayed in the admin panel through the `AdminAudit` component:

```typescript
// Example: Fetch audit logs for display
const { data: auditLogs, loading, error } = useQuery(
  async () => {
    return AuditService.getAuditLogs(
      filters,
      { page, pageSize: 25 }
    );
  },
  { refreshInterval: 0 }
);
```

## Security Considerations

1. **Service Role Key**: The service role key should be kept secure and only available in server environments
2. **RLS Bypass**: The admin client bypasses RLS, so use it only when necessary
3. **Error Handling**: Audit logging failures are logged but don't throw exceptions to prevent breaking core functionality
4. **Type Safety**: Type assertions (`as any`) are used due to missing generated types

## Best Practices

1. **Use Database Triggers**: Prefer database triggers for standard CRUD operations
2. **Manual Logging**: Use manual logging for application-specific events not tied to database changes
3. **Include Context**: Always provide as much context as possible (user, client, record IDs)
4. **Handle Failures**: Treat audit logging as non-critical to prevent it from breaking core functionality
5. **Regenerate Types**: Consider regenerating Supabase types to include the `audit_logs` table
