# User and Admin View Implementation Guide

This document provides a comprehensive overview of how user and admin views are implemented in the DealerMate application, explaining the architecture, authentication flow, and access control mechanisms.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Role-Based Access Control](#role-based-access-control)
3. [View Architecture](#view-architecture)
4. [Routing Implementation](#routing-implementation)
5. [Layout Components](#layout-components)
6. [Access Control Flow](#access-control-flow)
7. [Theme Implementation](#theme-implementation)

## Authentication System

### Overview

The application uses Supabase for authentication, with a custom implementation that integrates with a separate user profile system. Authentication is managed through the `AuthContext` and `useAuthSession` hook.

### User Roles

The system supports five distinct user roles:

- **owner**: Super admin with full system access
- **admin**: Administrative user with access to admin panel
- **user**: Regular staff user with limited access
- **client_admin**: Client administrator with enhanced client-specific access
- **client_user**: Basic client user with minimal access

### Authentication Flow

1. User logs in via Supabase auth (`signInWithPassword`)
2. On successful authentication, the system fetches the user profile from the `users` table
3. User role and permissions are determined from the profile data
4. Access to various views is controlled based on the user's role

## Role-Based Access Control

### Admin Access

Admin access is determined by checking:
```typescript
const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.is_admin;
```

This check is performed in the `AdminLayout` component to restrict access to admin views.

### Client-Specific Access

Client users (client_admin, client_user) are restricted to viewing data related to their specific client, controlled by:
```typescript
// Example from analytics components
const clientId = canViewSensitiveInfo ? selectedClientId : user?.client_id;
```

### Sensitive Information Access

The ability to view sensitive information (like all clients' data) is determined by:
```typescript
// This pattern is used throughout the application
export const canViewSensitiveInfo = (user: UserData | null) => 
  user?.role === 'admin' || user?.role === 'owner';
```

## View Architecture

The application implements a clear separation between regular user views and admin views:

### User Views

- Located in `/src/pages/` (e.g., Dashboard.tsx, Analytics.tsx)
- Use `AppLayout` as the parent layout component
- Accessible to all authenticated users (with role-based content filtering)

### Admin Views

- Located in `/src/pages/admin/` (e.g., AdminDashboard.tsx, ClientManagement.tsx)
- Use `AdminLayout` as the parent layout component
- Only accessible to users with admin privileges
- Include specialized components from `/src/components/admin/`

## Routing Implementation

The application uses React Router for navigation with a structured approach to routes:

### User Routes

```jsx
<Route element={<AppLayout />}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/call" element={<Call />} />
  <Route path="/logs" element={<Logs />} />
  <Route path="/leads" element={<Leads />} />
  <Route path="/analytics" element={<Analytics />} />
  <Route path="/agents" element={<Agents />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/manage-users" element={<ManageUsers />} />
</Route>
```

### Admin Routes

```jsx
<Route path="/admin" element={<AdminLayout />}>
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="clients" element={<ClientManagement />} />
  <Route path="clients/:id" element={<ClientDetails />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="audit" element={<AdminAudit />} />
  <Route path="system-status" element={<AdminSystemStatus />} />
  <Route path="system-health" element={<SystemHealthMonitoring />} />
  <Route path="settings" element={<AdminSettings />} />
  <Route index element={<AdminDashboard />} />
</Route>
```

## Layout Components

### AppLayout (User View)

- Located at `/src/components/AppLayout.tsx`
- Includes authentication check and redirect to login if not authenticated
- Renders the `AppSidebar` component for navigation
- Conditionally renders `TopBar` on non-mobile views
- Implements theme support via `ThemeProvider`

### AdminLayout (Admin View)

- Located at `/src/layouts/AdminLayout.tsx`
- Includes authentication check and admin role verification
- Shows access denied message for non-admin users
- Renders the `AdminSidebar` component for admin navigation
- Conditionally renders `TopBar` on non-mobile views
- Implements theme support via `ThemeProvider`

## Access Control Flow

1. **Authentication Check**: Both layouts first verify if the user is authenticated
2. **Role Check**: AdminLayout performs additional role verification
3. **Content Filtering**: Components filter content based on user role and client_id
4. **UI Adaptation**: UI elements are conditionally rendered based on permissions

### Example: Client Data Access

```typescript
// In analytics components
const fetchData = async () => {
  try {
    // Admin users can see all clients or filter by specific client
    // Regular users can only see their own client's data
    const clientId = canViewSensitiveInfo(user) ? selectedClientId : user?.client_id;
    const data = await AnalyticsService.getData(startDate, endDate, clientId);
    setAnalyticsData(data);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    setError("Failed to load analytics data");
  } finally {
    setLoading(false);
  }
};
```

## Theme Implementation

Both user and admin views implement theme support using the `next-themes` package:

```jsx
<ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
  {/* Layout content */}
</ThemeProvider>
```

User preferences for theme are stored in the user profile:

```typescript
preferences?: {
  displaySettings: {
    theme: 'light' | 'dark' | 'system';
    // other settings
  };
  // other preferences
}
```

The `useThemeInit` hook initializes the theme based on user preferences when the application loads.

## Best Practices for Extending the System

1. **New User Views**: Add new user-facing pages to `/src/pages/` and include them in the user routes
2. **New Admin Views**: Add new admin pages to `/src/pages/admin/` and include them in the admin routes
3. **Access Control**: Always implement role checks for sensitive operations and data access
4. **Client Data Isolation**: Use the client_id filtering pattern for all client-specific data
5. **Theme Awareness**: Use semantic color tokens for all UI components to ensure proper theme support
