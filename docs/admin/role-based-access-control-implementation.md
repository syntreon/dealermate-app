# Role-Based Access Control Implementation Guide

This document provides a comprehensive guide for developers on the role-based access control (RBAC) system implemented in the DealerMate application.

## Table of Contents

1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Core Files and Components](#core-files-and-components)
4. [Access Control Logic](#access-control-logic)
5. [Implementation Details](#implementation-details)
6. [Usage Examples](#usage-examples)
7. [Adding New Features](#adding-new-features)
8. [Testing and Debugging](#testing-and-debugging)

## Overview

The DealerMate application implements a hierarchical role-based access control system that provides different levels of access to users based on their roles. The system is designed to be:

- **Hierarchical**: Higher roles inherit permissions from lower roles
- **Flexible**: Easy to extend with new roles and permissions
- **Secure**: Default-deny approach with explicit permission checks
- **Maintainable**: Centralized access control logic

## Role Hierarchy

> **Note:** Role display names have been updated for clarity. The new labels are:
> - `client_admin` → **Business Manager**
> - `user` → **Account Manager**
> - `client_user` → **User**
> - `admin` and `owner` remain unchanged

The system supports five user roles with hierarchical permissions:

```
owner (Level 5)
  ↓
admin (Level 4)
  ↓
user (Level 3)
  ↓
client_admin (Level 2)
  ↓
client_user (Level 1)
```

### Role Definitions

| Role | Level | Description | Access Scope |
|------|-------|-------------|--------------|
| `owner` | 5 | Super admin with full system access | System-wide |
| `admin` | 4 | Administrative user with access to admin panel | System-wide |
| `user` | 3 | **Account Manager** (internal staff, system-wide access to multiple clients) | System-wide |
| `client_admin` | 2 | **Business Manager** (enhanced client-specific access) | Client-specific |
| `client_user` | 1 | **User** (basic client user with minimal access) | Client-specific |

### Access Patterns

- **System-wide access**: `owner`, `admin`, `user` (can view all clients)
- **Client-specific access**: `client_admin`, `client_user` (restricted to their client)
- **Admin panel access**: `owner`, `admin` only
- **Client admin features**: `client_admin` and all system-wide roles
- **User management**: Higher roles can manage lower roles within their scope

## Core Files and Components

### 1. Access Control Utilities

**File**: `src/utils/clientDataIsolation.ts`

This is the core file containing all access control logic and utilities.

#### Key Functions:

```typescript
// Role hierarchy and level checking
getRoleLevel(role: UserRole): number
hasSystemWideAccess(user: AuthUser): boolean
hasClientAdminAccess(user: AuthUser): boolean

// Admin panel access
canAccessAdminPanel(user: AuthUser): boolean

// Data filtering
shouldFilterByClient(user: AuthUser): boolean
getClientIdFilter(user: AuthUser): string | null
canAccessClientData(user: AuthUser, clientId: string): boolean

// User management
canManageUsers(user: AuthUser, targetUser?: AuthUser): boolean

// Sensitive information
canViewSensitiveInfo(user: AuthUser): boolean

// Data filtering helpers
filterItemsByClientAccess<T>(items: T[], user: AuthUser): T[]
```

#### Complete Permission Reference

For detailed permission tables covering every page, component, and feature in the application, see the [Complete Access Control Matrix](./access-control-matrix.md). This comprehensive reference includes:

- **Page-level permissions** for all routes and views
- **Component-level access** for UI elements and features  
- **Mobile restrictions** and device-specific behaviors
- **Feature-specific permissions** for business management, agent settings, and system administration
- **Data access patterns** and filtering rules

### 2. Type Definitions

**File**: `src/types/user.ts`

```typescript
export type UserRole = 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  client_id: string | null;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  preferences?: Record<string, any>;
}
```

### 3. Layout Components

#### AdminLayout
**File**: `src/layouts/AdminLayout.tsx`

- Controls access to the admin interface
- Accepts both admin and client_admin users
- Shows different content based on role

```typescript
// Access control logic
const canAccessAdmin = canAccessAdminPanel(user);
const hasClientAdmin = hasClientAdminAccess(user);
const canAccessInterface = canAccessAdmin || hasClientAdmin;
```

### 4. Navigation and Routing Components

#### AdminIndex
**File**: `src/pages/admin/AdminIndex.tsx`

- Handles routing logic for admin panel root
- Directs users to appropriate landing page based on role

#### ProtectedAdminRoute
**File**: `src/components/admin/ProtectedAdminRoute.tsx`

- Protects admin routes based on user permissions
- Redirects unauthorized users or shows access denied messages

#### AdminSidebar
**File**: `src/components/admin/AdminSidebar.tsx`

- Dynamically filters navigation items based on user role
- Shows different menu items for different access levels

```typescript
// Navigation filtering logic
const getFilteredNavItems = (user: any) => {
  const hasSystemAdmin = canAccessAdminPanel(user);
  
  return allAdminNavItems.filter(item => {
    if (item.requiredAccess === 'system_admin') {
      return hasSystemAdmin;
    }
    if (item.requiredAccess === 'client_admin') {
      return hasSystemWide || user?.role === 'client_admin';
    }
    return true;
  });
};
```

#### AppSidebar
**File**: `src/components/AppSidebar.tsx`

- Main application sidebar with role-based admin access
- Single "Administration" button that adapts based on role

### 5. Business and Agent Management Components

#### BusinessSettings
**File**: `src/components/settings/BusinessSettings.tsx`

- Allows client_admin users to edit business information
- Includes form validation, database updates, and audit logging
- Role-based edit permissions with appropriate user feedback

#### AgentSettings
**File**: `src/components/settings/AgentSettings.tsx`

- Provides agent configuration management for client_admin users
- Implements both role-based and mobile device restrictions
- Shows different messages based on user permissions and device type

#### Agents Page
**File**: `src/pages/Agents.tsx`

- Agent management interface with role-based controls
- Mobile restrictions for edit functionality
- Permission checks for agent toggle operations

### 6. Authentication Context

**File**: `src/context/AuthContext.tsx`
**File**: `src/hooks/useAuthSession.ts`

- Manages user authentication state
- Provides user data throughout the application

## Access Control Logic

### 1. Role Hierarchy Implementation

```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'owner': 5,
  'admin': 4,
  'user': 3,
  'client_admin': 2,
  'client_user': 1
};

export function getRoleLevel(role: UserRole | null | undefined): number {
  if (!role) return 0;
  return ROLE_HIERARCHY[role] || 0;
}
```

### 2. System-Wide vs Client-Specific Access

```typescript
export function hasSystemWideAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  
  // Owner, admin, and internal staff (user role) have system-wide access
  return user.is_admin || 
         user.role === 'owner' || 
         user.role === 'admin' || 
         user.role === 'user';
}
```

### 3. Data Filtering Logic

```typescript
export function shouldFilterByClient(user: AuthUser | null): boolean {
    if (!user) return true;
    
    // Users with system-wide access can see all data
    return !hasSystemWideAccess(user);
}

export function getClientIdFilter(user: AuthUser | null): string | null {
    if (!user) return null;

    if (shouldFilterByClient(user)) {
        return user.client_id || null;
    }

    return null; // System-wide users don't need filtering
}
```

## Implementation Details

### 1. Admin Panel Routing and Navigation

#### Smart Routing with AdminIndex
The admin panel uses intelligent routing to direct users to appropriate landing pages:

```typescript
// AdminIndex component handles role-based routing
const AdminIndex: React.FC = () => {
  const { user } = useAuth();
  const hasSystemAccess = hasSystemWideAccess(user);
  
  if (hasSystemAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/admin/users" replace />;
  }
};
```

#### Route Protection
System admin routes are protected using the ProtectedAdminRoute component:

```typescript
<Route path="dashboard" element={
  <ProtectedAdminRoute requireSystemAccess={true}>
    <AdminDashboard />
  </ProtectedAdminRoute>
} />
```

#### Dynamic Navigation
The admin sidebar dynamically shows different navigation items based on user role:

```typescript
const allAdminNavItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Admin Dashboard', 
    path: '/admin/dashboard',
    requiredAccess: 'system_admin' // Only for system admins
  },
  { 
    icon: Users, 
    label: 'User Management', 
    path: '/admin/users',
    requiredAccess: 'client_admin' // Available to client_admin and above
  },
  // ... more items
];
```

### 2. Component Access Control

Components use access control utilities to show/hide features:

```typescript
// Example in a component
const { user } = useAuth();
const canViewAllClients = hasSystemWideAccess(user);
const canManageThisUser = canManageUsers(user, targetUser);

return (
  <div>
    {canViewAllClients && <ClientSelector />}
    {canManageThisUser && <EditUserButton />}
  </div>
);
```

### 3. Business Information Management

Client admins can edit their business information with full audit logging:

```typescript
// BusinessSettings component with role-based editing
const canEditBusiness = isAdmin || hasClientAdminAccess(user);

const handleFormSubmit = async (values: BusinessFormValues) => {
  // Update business information
  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', businessData.id);

  // Log audit event
  await AuditService.logClientAction(
    user.id,
    'update',
    businessData.id,
    oldValues,
    updateData
  );
};
```

### 4. Agent Settings with Mobile Restrictions

Agent settings implement both role-based and device-based access control:

```typescript
// AgentSettings component with mobile restrictions
const canEditAgents = hasClientAdminAccess(user);
const showEditControls = canEditAgents && !isMobile;

// Permission and mobile checks
{showEditControls && (
  <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
)}

// User feedback for restrictions
{!canEditAgents && <PermissionMessage />}
{canEditAgents && isMobile && <MobileRestrictionMessage />}
```

### 5. Data Service Integration

Services use access control to filter data:

```typescript
// Example in a service
const fetchUsers = async (user: AuthUser) => {
  const clientId = getClientIdFilter(user);
  
  let query = supabase.from('users').select('*');
  
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  
  return query;
};
```

## Usage Examples

### 1. Checking User Permissions

```typescript
import { hasSystemWideAccess, canManageUsers } from '@/utils/clientDataIsolation';

const MyComponent = () => {
  const { user } = useAuth();
  
  // Check if user can see all clients
  if (hasSystemWideAccess(user)) {
    // Show client selector
  }
  
  // Check if user can manage another user
  if (canManageUsers(user, targetUser)) {
    // Show edit/delete buttons
  }
};
```

### 2. Filtering Data by Client

```typescript
import { getClientIdFilter, filterItemsByClientAccess } from '@/utils/clientDataIsolation';

const DataComponent = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const clientId = getClientIdFilter(user);
      const result = await dataService.getData(clientId);
      setData(result);
    };
    
    fetchData();
  }, [user]);
  
  // Or filter client-side
  const filteredData = filterItemsByClientAccess(allData, user);
};
```

### 3. Role-Based UI Rendering

```typescript
import { canAccessAdminPanel, hasClientAdminAccess } from '@/utils/clientDataIsolation';

const Navigation = () => {
  const { user } = useAuth();
  
  return (
    <nav>
      {/* Regular navigation items */}
      
      {(canAccessAdminPanel(user) || hasClientAdminAccess(user)) && (
        <NavLink to="/admin/dashboard">
          {canAccessAdminPanel(user) ? "Admin Panel" : "Administration"}
        </NavLink>
      )}
    </nav>
  );
};
```

### 4. Business Information Editing with Audit Logging

```typescript
import { hasClientAdminAccess } from '@/utils/clientDataIsolation';
import { AuditService } from '@/services/auditService';

const BusinessSettings = ({ clientId }) => {
  const { user } = useAuth();
  const canEditBusiness = hasClientAdminAccess(user);
  
  const handleSubmit = async (values) => {
    if (!canEditBusiness) return;
    
    const oldValues = { /* current business data */ };
    
    // Update business information
    await supabase
      .from('clients')
      .update(values)
      .eq('id', clientId);
    
    // Log the change for audit trail
    await AuditService.logClientAction(
      user.id,
      'update',
      clientId,
      oldValues,
      values
    );
  };
  
  return (
    <div>
      {canEditBusiness && (
        <Button onClick={handleSubmit}>Save Changes</Button>
      )}
    </div>
  );
};
```

### 5. Mobile-Aware Agent Settings

```typescript
import { hasClientAdminAccess } from '@/utils/clientDataIsolation';
import { useIsMobile } from '@/hooks/use-mobile';

const AgentSettings = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const canEditAgents = hasClientAdminAccess(user);
  const showEditControls = canEditAgents && !isMobile;
  
  return (
    <div>
      {/* Agent configuration display */}
      
      {showEditControls && (
        <Button onClick={() => setIsEditing(true)}>
          Edit Settings
        </Button>
      )}
      
      {/* Permission message */}
      {!canEditAgents && (
        <Alert>You need client admin privileges to edit agent settings.</Alert>
      )}
      
      {/* Mobile restriction message */}
      {canEditAgents && isMobile && (
        <Alert>Agent settings can only be edited on desktop devices.</Alert>
      )}
    </div>
  );
};
```

## Adding New Features

### 1. Adding a New Role

1. Update the `UserRole` type in `src/types/user.ts`:
```typescript
export type UserRole = 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user' | 'new_role';
```

2. Update the role hierarchy in `src/utils/clientDataIsolation.ts`:
```typescript
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'owner': 5,
  'admin': 4,
  'user': 3,
  'new_role': 2.5, // Insert at appropriate level
  'client_admin': 2,
  'client_user': 1
};
```

3. Add any specific access control functions if needed.

### 2. Adding a New Admin Page

1. Create the page component in `src/pages/admin/`
2. Add the route to `src/App.tsx`
3. Add navigation item to `src/components/admin/AdminSidebar.tsx`:

```typescript
{
  icon: NewIcon,
  label: 'New Feature',
  path: '/admin/new-feature',
  requiredAccess: 'client_admin' // Set appropriate access level
}
```

### 3. Adding Role-Based Features to Existing Pages

1. Import access control utilities:
```typescript
import { hasSystemWideAccess, canManageUsers } from '@/utils/clientDataIsolation';
```

2. Use in component logic:
```typescript
const { user } = useAuth();
const canAccessFeature = hasSystemWideAccess(user);

return (
  <div>
    {canAccessFeature && <NewFeatureComponent />}
  </div>
);
```

## Testing and Debugging

### 1. Testing Access Control

Create test users with different roles and verify:

- Navigation items appear/disappear correctly
- Data is filtered appropriately
- Actions are allowed/denied based on role
- Error messages are shown for unauthorized access

### 2. Debugging Tips

1. **Check user object**: Ensure `user.role` and `user.client_id` are set correctly
2. **Verify access control functions**: Use console.log to check function returns
3. **Test role hierarchy**: Ensure higher roles can access lower-level features
4. **Check client isolation**: Verify client-specific users can't see other clients' data

### 3. Common Issues

1. **User role not set**: Check authentication flow and user profile creation
2. **Client ID missing**: Ensure client_id is properly assigned during user creation
3. **Access denied unexpectedly**: Check if access control functions are imported correctly
4. **Data not filtered**: Verify getClientIdFilter is used in data services

## Security Considerations

1. **Server-side validation**: Always validate permissions on the server side
2. **Default deny**: Use explicit permission checks rather than role exclusions
3. **Client isolation**: Ensure client-specific users cannot access other clients' data
4. **Audit logging**: Log access control decisions for security auditing
5. **Regular reviews**: Periodically review and update access control rules

## Migration and Deployment

When deploying access control changes:

1. **Database migrations**: Update user roles in the database if needed
2. **Gradual rollout**: Test with a subset of users first
3. **Fallback plan**: Have a way to quickly revert changes if issues arise
4. **User communication**: Inform users about changes to their access levels

---

This implementation provides a robust, scalable, and maintainable role-based access control system that can grow with the application's needs while maintaining security and usability.