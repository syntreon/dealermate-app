# System Status Management Documentation

## Overview

The System Status Management feature provides real-time agent status tracking and system messaging capabilities for a multi-client dashboard application. It supports both platform-wide and client-specific status updates with full audit trails.

## Database Schema

### Tables Created

#### `system_messages`
- **Purpose**: Store system notifications and messages
- **Scope**: Platform-wide (client_id = NULL) or client-specific
- **Audit**: Tracks who created/updated messages and when

```sql
CREATE TABLE system_messages (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id), -- NULL for platform-wide
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `agent_status`
- **Purpose**: Track system/agent operational status
- **Scope**: Platform-wide (client_id = NULL) or client-specific
- **Constraint**: One status record per client (UNIQUE on client_id)

```sql
CREATE TABLE agent_status (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id), -- NULL for platform-wide
    status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')),
    message TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id)
);
```

## User Roles & Data Access

### Admin/Owner Users (`client_id = NULL` AND `role = 'admin'|'owner'`)
- **View**: All messages and statuses across all clients
- **Manage**: Can create/update platform-wide and client-specific messages/status
- **Dashboard**: Shows aggregated metrics from all clients

### Regular Client Users (specific `client_id`)
- **View**: Their client's messages + platform-wide messages
- **Manage**: Cannot update system status (read-only)
- **Dashboard**: Shows only their client's metrics

## API Service Usage

### SystemStatusService Methods

#### System Messages

```typescript
// Get messages for a specific client (includes platform-wide)
const messages = await SystemStatusService.getSystemMessages(clientId);

// Get all messages (admin only)
const allMessages = await SystemStatusService.getSystemMessages(null);

// Create platform-wide message
await SystemStatusService.createSystemMessage({
  type: 'info',
  message: 'Platform maintenance tonight 2-4 AM EST',
  expiresAt: new Date('2024-01-15T06:00:00Z')
}, null, adminUserId);

// Create client-specific message
await SystemStatusService.createSystemMessage({
  type: 'warning',
  message: 'Approaching monthly call limit',
  expiresAt: null
}, clientId, adminUserId);

// Update message
await SystemStatusService.updateSystemMessage(messageId, {
  message: 'Updated maintenance window: 1-3 AM EST'
});

// Delete message
await SystemStatusService.deleteSystemMessage(messageId);
```

#### Agent Status

```typescript
// Get status for specific client (fallback to platform-wide)
const status = await SystemStatusService.getAgentStatus(clientId);

// Get platform-wide status (admin)
const globalStatus = await SystemStatusService.getAgentStatus(null);

// Update platform-wide status
await SystemStatusService.updateAgentStatus({
  status: 'maintenance',
  message: 'Scheduled maintenance in progress'
}, null, adminUserId);

// Update client-specific status
await SystemStatusService.updateAgentStatus({
  status: 'inactive',
  message: 'Client systems temporarily unavailable'
}, clientId, adminUserId);
```

#### Real-time Subscriptions

```typescript
// Subscribe to system message changes
const unsubscribeMessages = SystemStatusService.subscribeToSystemMessages(
  (messages) => {
    console.log('Messages updated:', messages);
    setSystemMessages(messages);
  }
);

// Subscribe to agent status changes
const unsubscribeStatus = SystemStatusService.subscribeToAgentStatus(
  (status) => {
    console.log('Status updated:', status);
    setAgentStatus(status);
  }
);

// Cleanup subscriptions
useEffect(() => {
  return () => {
    unsubscribeMessages();
    unsubscribeStatus();
  };
}, []);
```

## Component Usage

### Dashboard Integration

```typescript
// In your dashboard component
import useDashboardMetrics from '@/hooks/useDashboardMetrics';

const Dashboard = () => {
  const { user } = useAuth();
  const clientId = user?.client_id || undefined;
  const { metrics } = useDashboardMetrics(clientId);

  // metrics.agentStatus and metrics.systemMessages are automatically populated
  // Admin users see aggregated data, regular users see client-specific data
};
```

### TopBar Integration

```typescript
// TopBar automatically shows agent status and system messages
import AgentStatusIndicator from '@/components/dashboard/AgentStatusIndicator';
import SystemMessages from '@/components/dashboard/SystemMessages';

const TopBar = () => {
  const { metrics } = useDashboardMetrics(clientId);
  
  return (
    <div className="topbar">
      {metrics?.agentStatus && (
        <AgentStatusIndicator agentStatus={metrics.agentStatus} />
      )}
      {metrics?.systemMessages && (
        <SystemMessages messages={metrics.systemMessages} />
      )}
    </div>
  );
};
```

### Admin Interface (Task 7.5)

```typescript
// Admin page for managing system status
import SystemMessageManager from '@/components/admin/SystemMessageManager';
import AgentStatusControl from '@/components/admin/AgentStatusControl';

const AdminSystemStatus = () => {
  // Full CRUD interface for system messages and agent status
  // Real-time updates across all connected users
};
```

## Real-World Usage Scenarios

### 1. Platform-Wide Maintenance

```typescript
// Before maintenance
await SystemStatusService.updateAgentStatus({
  status: 'maintenance',
  message: 'Scheduled maintenance 2:00-4:00 AM EST'
}, null, adminUserId);

await SystemStatusService.createSystemMessage({
  type: 'warning',
  message: 'Platform will be unavailable during maintenance window',
  expiresAt: new Date('2024-01-15T06:00:00Z')
}, null, adminUserId);

// After maintenance
await SystemStatusService.updateAgentStatus({
  status: 'active',
  message: 'All systems operational'
}, null, adminUserId);
```

### 2. Client-Specific Issue

```typescript
// Client ABC having issues
await SystemStatusService.updateAgentStatus({
  status: 'inactive',
  message: 'Temporary service disruption - investigating'
}, 'client-abc-uuid', adminUserId);

await SystemStatusService.createSystemMessage({
  type: 'error',
  message: 'We are aware of the service disruption and working to resolve it',
  expiresAt: null
}, 'client-abc-uuid', adminUserId);
```

### 3. Automated Health Monitoring

```typescript
// Set up automated monitoring
StatusMonitor.startMonitoring();

// The monitor will automatically:
// - Check database connectivity every 30 seconds
// - Update status to 'inactive' if critical services fail
// - Restore to 'active' when services recover
// - Respect manual 'maintenance' status (won't override)
```

### 4. Scheduled Status Changes

```typescript
// Schedule maintenance mode
const maintenanceTime = new Date('2024-01-15T02:00:00Z');
const maintenanceEnd = new Date('2024-01-15T04:00:00Z');

setTimeout(async () => {
  await SystemStatusService.updateAgentStatus({
    status: 'maintenance',
    message: 'Scheduled maintenance in progress'
  }, null, 'system-scheduler');
}, maintenanceTime.getTime() - Date.now());

setTimeout(async () => {
  await SystemStatusService.updateAgentStatus({
    status: 'active',
    message: 'Maintenance completed - all systems operational'
  }, null, 'system-scheduler');
}, maintenanceEnd.getTime() - Date.now());
```

## Integration with CI/CD

### Deployment Status Updates

```typescript
// In your deployment pipeline
// Before deployment
await SystemStatusService.createSystemMessage({
  type: 'info',
  message: 'New features being deployed - brief service interruption possible',
  expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
}, null, 'ci-cd-system');

// After successful deployment
await SystemStatusService.createSystemMessage({
  type: 'success',
  message: 'New features successfully deployed and available',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
}, null, 'ci-cd-system');
```

## Monitoring Integration

### External Monitoring Tools

```typescript
// Webhook endpoint for external monitoring
app.post('/api/status-webhook', async (req, res) => {
  const { status, message, clientId } = req.body;
  
  await SystemStatusService.updateAgentStatus({
    status: status,
    message: message
  }, clientId, 'monitoring-system');
  
  res.json({ success: true });
});
```

## Security & Permissions

### Row Level Security (RLS) Policies

```sql
-- System Messages
CREATE POLICY "Anyone can view system messages" ON system_messages
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage system messages" ON system_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

-- Agent Status
CREATE POLICY "Anyone can view agent status" ON agent_status
    FOR SELECT USING (true);

CREATE POLICY "Only admins can update agent status" ON agent_status
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );
```

## Performance Considerations

### Indexes Created
- `idx_system_messages_timestamp` - Fast message ordering
- `idx_system_messages_client_id` - Efficient client-specific message filtering
- `idx_agent_status_client_id` - Efficient client-specific status lookup

### Automatic Cleanup
```sql
-- Function to clean expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM system_messages 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Schedule cleanup (if pg_cron is available)
SELECT cron.schedule('cleanup-expired-messages', '0 * * * *', 'SELECT cleanup_expired_messages();');
```

## Implementation Guide

### 1. Service Layer Implementation

#### SystemStatusService

The `SystemStatusService` is the central service for all system status and messaging operations. It provides methods for:

1. **Agent Status Management**:
   - Retrieving agent status (global or client-specific)
   - Updating agent status with audit logging
   - Real-time subscription to status changes

2. **System Message Management**:
   - Creating, updating, and deleting system messages
   - Retrieving messages (filtered by client)
   - Real-time subscription to message changes

```typescript
// src/services/systemStatusService.ts
import { createClient } from '@supabase/supabase-js';
import { AgentStatus, SystemMessage } from '@/types/dashboard';
import { AuditService } from './AuditService';

export class SystemStatusService {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Agent Status Methods
  static async getAgentStatus(clientId?: string | null): Promise<AgentStatus | null> {
    // Implementation details...
  }

  static async updateAgentStatus(
    statusData: Partial<AgentStatus>,
    clientId: string | null,
    userId: string
  ): Promise<AgentStatus | null> {
    // Implementation with audit logging...
  }

  // System Message Methods
  static async getSystemMessages(clientId?: string | null): Promise<SystemMessage[]> {
    // Implementation details...
  }

  static async createSystemMessage(
    messageData: Partial<SystemMessage>,
    clientId: string | null,
    userId: string
  ): Promise<SystemMessage | null> {
    // Implementation with audit logging...
  }

  static async updateSystemMessage(
    id: string,
    messageData: Partial<SystemMessage>,
    userId: string
  ): Promise<SystemMessage | null> {
    // Implementation with audit logging...
  }

  static async deleteSystemMessage(id: string, userId: string): Promise<boolean> {
    // Implementation with audit logging...
  }
}
```

#### SystemMessageService (Legacy Integration)

The `SystemMessageService` has been refactored to delegate to `SystemStatusService` for all operations while maintaining backward compatibility:

```typescript
// src/services/systemMessageService.ts
import { SystemMessage } from '@/types/admin';
import { AuditService } from './AuditService';

export class SystemMessageService {
  static async getSystemMessages(): Promise<SystemMessage[]> {
    // Dynamically import to avoid circular dependencies
    const { SystemStatusService } = await import('./systemStatusService');
    const messages = await SystemStatusService.getSystemMessages();
    // Map dashboard SystemMessage to admin SystemMessage format
    return messages.map(this.mapToAdminSystemMessage);
  }

  // Other methods with dynamic imports and mapping...

  // Helper to map between different SystemMessage interfaces
  private static mapToAdminSystemMessage(dashboardMessage: any): SystemMessage {
    return {
      id: dashboardMessage.id,
      message: dashboardMessage.message,
      type: dashboardMessage.type,
      client_id: dashboardMessage.clientId,
      // Map other fields...
    };
  }
}
```

### 2. React Hook Implementation

#### useSystemStatus Hook

This custom hook provides real-time system status and messages to React components:

```typescript
// src/hooks/use-system-status.ts
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AgentStatus, SystemMessage } from '@/types/dashboard';

export function useSystemStatus(clientId?: string) {
  const [state, setState] = useState({
    status: 'active',
    statusMessage: null,
    broadcastMessage: null,
    isLoading: true,
    error: null
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Fetch initial status and set up real-time subscriptions
    const fetchCurrentStatus = async () => {
      // Implementation details...
    };

    fetchCurrentStatus();

    // Set up real-time subscriptions
    const statusSubscription = supabase
      .channel('agent-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_status' }, 
        fetchCurrentStatus
      )
      .subscribe();

    const messageSubscription = supabase
      .channel('system-message-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'system_messages' }, 
        fetchCurrentStatus
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(statusSubscription);
      supabase.removeChannel(messageSubscription);
    };
  }, [supabase, clientId]);

  return state;
}
```

### 3. UI Component Implementation

#### AgentStatusIndicator Component

This component displays the current agent status with a hover tooltip:

```typescript
// src/components/dashboard/AgentStatusIndicator.tsx
import { Tooltip } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { AgentStatus } from '@/types/dashboard';

interface AgentStatusIndicatorProps {
  agentStatus: AgentStatus;
}

export function AgentStatusIndicator({ agentStatus }: AgentStatusIndicatorProps) {
  // Implementation details...
  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={getVariantForStatus(agentStatus.status)}>
        {getStatusIcon(agentStatus.status)}
        <span className="ml-1">{getStatusLabel(agentStatus.status)}</span>
      </Badge>
    </Tooltip>
  );
}
```

#### TopBar Integration

The TopBar component integrates the agent status indicator and system messages:

```typescript
// src/components/TopBar.tsx
import { useSystemStatus } from '@/hooks/use-system-status';
import { AgentStatusIndicator } from '@/components/dashboard/AgentStatusIndicator';

export function TopBar() {
  const { status, statusMessage, broadcastMessage, isLoading } = useSystemStatus(clientId);
  
  // Implementation details...
  
  return (
    <>
      {/* System Status Banner */}
      {!isLoading && (status !== 'active' || broadcastMessage) && (
        <div className={`w-full px-4 py-2 border-b ${getStatusBackgroundColor()}`}>
          {/* Status message or broadcast message display */}
        </div>
      )}
      
      {/* TopBar content */}
      <div className="flex items-center justify-between p-4">
        {/* Logo and navigation */}
        
        {/* Agent status indicator */}
        {!isLoading && status && (
          <AgentStatusIndicator 
            agentStatus={{ 
              status, 
              message: statusMessage, 
              lastUpdated: new Date() 
            }} 
          />
        )}
        
        {/* User menu */}
      </div>
    </>
  );
}
```

#### SystemTab Component

The SystemTab component in the admin dashboard provides a UI for managing system status:

```typescript
// src/components/admin/dashboard/tabs/SystemTab.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

export function SystemTab() {
  const { user } = useAuth();
  const [status, setStatus] = useState('active');
  const [message, setMessage] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  
  const handlePublish = async () => {
    try {
      // Dynamically import to avoid circular dependencies
      const { SystemStatusService } = await import('@/services/systemStatusService');
      
      await SystemStatusService.updateAgentStatus({
        status,
        message
      }, clientId, user.id);
      
      // Show success notification
    } catch (error) {
      // Show error notification
    }
  };
  
  // Implementation details...
  
  return (
    <div className="space-y-6">
      {/* System status management UI */}
    </div>
  );
}
```

### 4. Edge Function Implementation

#### set-system-status Edge Function

This Supabase Edge Function provides an API for updating system status with proper authentication:

```typescript
// supabase/functions/set-system-status/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify admin user
    const user = await getAdminUser(supabaseAdmin, req.headers.get('Authorization'));

    // Process request
    const { clientId, status, message, messageType } = await req.json();

    // Update agent status if provided
    if (status) {
      // Implementation details...
    }

    // Insert system message if provided
    if (message && messageType) {
      // Implementation details...
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. CORS Errors with Edge Function

**Problem**: Requests to the Edge Function fail with CORS errors from localhost development environment.

**Solution**:
- Ensure the Edge Function has proper CORS headers:
  ```typescript
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  ```
- Make sure OPTIONS requests are handled correctly:
  ```typescript
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  ```
- Add CORS headers to all responses:
  ```typescript
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
  ```

#### 2. Loading Loop in SystemTab Component

**Problem**: The SystemTab component enters an infinite loading loop when trying to update system status.

**Solution**:
- Use dynamic imports to avoid circular dependencies:
  ```typescript
  const handlePublish = async () => {
    const { SystemStatusService } = await import('@/services/systemStatusService');
    // Now use SystemStatusService...
  }
  ```
- Fix import path casing to match the actual file name:
  ```typescript
  // Incorrect
  import { SystemStatusService } from '@/services/SystemStatusService';
  
  // Correct
  import { SystemStatusService } from '@/services/systemStatusService';
  ```

#### 3. Audit Logging Errors

**Problem**: Audit logging calls fail with method not found errors.

**Solution**:
- Use the correct audit logging method:
  ```typescript
  // Incorrect
  await AuditService.logActivity(...);
  
  // Correct
  await AuditService.logAuditEvent(...);
  ```
- Ensure proper parameters are passed:
  ```typescript
  await AuditService.logAuditEvent({
    action: 'create',
    entityType: 'system_message',
    entityId: newMessage.id,
    userId: userId,
    details: {
      old: null,
      new: newMessage
    }
  });
  ```

#### 4. Interface Mapping Issues

**Problem**: Type errors when working with different SystemMessage interfaces.

**Solution**:
- Create mapping functions between dashboard and admin interfaces:
  ```typescript
  // Map from dashboard to admin format
  private static mapToAdminSystemMessage(dashboardMessage: DashboardSystemMessage): AdminSystemMessage {
    return {
      id: dashboardMessage.id,
      message: dashboardMessage.message,
      type: dashboardMessage.type,
      client_id: dashboardMessage.clientId,
      // Map other fields...
    };
  }
  
  // Map from admin to dashboard format
  private static mapToDashboardSystemMessage(adminMessage: AdminSystemMessage): DashboardSystemMessage {
    return {
      id: adminMessage.id,
      message: adminMessage.message,
      type: adminMessage.type,
      clientId: adminMessage.client_id,
      // Map other fields...
    };
  }
  ```

#### 5. Real-time Subscription Issues

**Problem**: Real-time updates not working for system status or messages.

**Solution**:
- Verify Supabase channel setup:
  ```typescript
  const statusSubscription = supabase
    .channel('agent-status-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'agent_status' }, 
      fetchCurrentStatus
    )
    .subscribe();
  ```
- Ensure proper cleanup on component unmount:
  ```typescript
  return () => {
    supabase.removeChannel(statusSubscription);
    supabase.removeChannel(messageSubscription);
  };
  ```
- Check that RLS policies allow access to the tables.

#### 6. Other Common Issues

1. **Messages not appearing for clients**
   - Check if `client_id` is correctly set
   - Verify RLS policies are applied
   - Ensure user has proper role permissions

2. **Status not updating**
   - Check `updated_by` field has valid user ID
   - Verify unique constraint on `client_id`
   - Ensure proper error handling in service calls

### Debug Queries

```sql
-- Check all system messages
SELECT sm.*, u.full_name as created_by_name, c.name as client_name
FROM system_messages sm
LEFT JOIN users u ON sm.created_by = u.id
LEFT JOIN clients c ON sm.client_id = c.id
ORDER BY sm.timestamp DESC;

-- Check agent status
SELECT as.*, u.full_name as updated_by_name, c.name as client_name
FROM agent_status as
LEFT JOIN users u ON as.updated_by = u.id
LEFT JOIN clients c ON as.client_id = c.id
ORDER BY as.last_updated DESC;

-- Check user permissions
SELECT id, full_name, role, client_id, 
       CASE 
         WHEN client_id IS NULL AND role IN ('admin', 'owner') THEN 'Platform Admin'
         WHEN client_id IS NOT NULL THEN 'Client User'
         ELSE 'Unknown'
       END as user_type
FROM users;
```

## Testing Procedure

### Manual Testing Checklist

1. **Agent Status Display**:
   - [ ] Verify TopBar shows correct agent status indicator
   - [ ] Confirm hover tooltip displays status details
   - [ ] Check that theme-aware styling works in both light and dark modes

2. **System Message Banner**:
   - [ ] Verify system messages appear in banner when active
   - [ ] Confirm expired messages don't display
   - [ ] Test that client-specific messages only show for correct client

3. **Real-time Updates**:
   - [ ] Update status in admin panel and verify it updates in real-time on other clients
   - [ ] Create a new system message and verify it appears immediately
   - [ ] Delete a message and confirm it disappears from all clients

4. **Admin Interface**:
   - [ ] Test creating global and client-specific status updates
   - [ ] Verify all CRUD operations for system messages
   - [ ] Confirm audit logs are created for all operations

5. **Edge Function**:
   - [ ] Test direct API calls to the Edge Function
   - [ ] Verify authentication and authorization checks
   - [ ] Confirm CORS headers work for cross-origin requests

### Automated Testing

```typescript
// Example Jest test for SystemStatusService
describe('SystemStatusService', () => {
  it('should get agent status for a client', async () => {
    // Test implementation...
  });
  
  it('should update agent status with audit logging', async () => {
    // Test implementation...
  });
  
  it('should create system messages', async () => {
    // Test implementation...
  });
});
```

## Deployment Checklist

1. **Database Migrations**:
   - [ ] Run migrations to create system_messages and agent_status tables
   - [ ] Verify indexes are created for performance
   - [ ] Confirm RLS policies are applied correctly

2. **Edge Function Deployment**:
   - [ ] Deploy set-system-status Edge Function
   - [ ] Set required environment variables
   - [ ] Test function with authentication

3. **Frontend Deployment**:
   - [ ] Build and deploy frontend with updated components
   - [ ] Verify real-time subscriptions work in production
   - [ ] Test admin interface functionality

4. **Monitoring**:
   - [ ] Set up alerts for system status changes
   - [ ] Monitor Edge Function performance and errors
   - [ ] Track real-time subscription usage

## Future Enhancements

### Planned Features
- Message templates for common scenarios
- Bulk message operations
- Message scheduling
- Status change notifications via email/SMS
- Advanced filtering and search
- Message analytics and reporting
- Integration with external monitoring tools
- Multi-language message support

### API Extensions
- REST API endpoints for external integrations
- GraphQL subscriptions for real-time updates
- Webhook notifications for status changes
- Bulk operations API
- Message template management API

---

## Quick Reference

### Status Types
- `active` - All systems operational
- `inactive` - System down or unavailable  
- `maintenance` - Scheduled maintenance in progress

### Message Types
- `info` - General information
- `warning` - Important notices
- `error` - System errors or issues
- `success` - Positive updates or completions

### Key Files
- Database: `supabase/migrations/20240101000000_create_system_status_tables.sql`
- Service: `src/services/systemStatusService.ts`
- Hook: `src/hooks/useDashboardMetrics.ts`
- Components: `src/components/dashboard/AgentStatusIndicator.tsx`, `src/components/dashboard/SystemMessages.tsx`
- Admin: `src/components/admin/SystemMessageManager.tsx`, `src/components/admin/AgentStatusControl.tsx`

This system provides a robust, scalable solution for managing system status and messaging in a multi-client environment with full audit trails and real-time updates.