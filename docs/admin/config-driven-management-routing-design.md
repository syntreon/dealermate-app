# Design: Config-Driven Admin Routing & Access

## 1. Route Config Structure (Generalized)
```typescript
// src/config/adminRoutes.ts
export interface AdminRoute {
  path: string;
  component?: React.ComponentType;
  roles: ('system_admin' | 'client_admin')[];
  loadingText?: string;
  layout?: React.ComponentType; // Optional layout wrapper
  navLabel?: string; // For sidebar/tabs
  icon?: React.ReactNode; // For sidebar
  children?: AdminRoute[]; // For nested routes
}

export const adminRoutes: AdminRoute[] = [
  {
    path: '',
    layout: AdminLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        roles: ['system_admin', 'client_admin'],
        loadingText: 'Loading dashboard...',
        navLabel: 'Dashboard',
        icon: <DashboardIcon />,
      },
      {
        path: 'analytics',
        layout: AnalyticsLayout,
        navLabel: 'Analytics',
        icon: <AnalyticsIcon />,
        children: [
          {
            path: '',
            component: AnalyticsHome,
            roles: ['system_admin', 'client_admin'],
            loadingText: 'Loading analytics...',
          },
          {
            path: 'call',
            component: CallAnalytics,
            roles: ['system_admin', 'client_admin'],
            loadingText: 'Loading call analytics...',
          },
          // ...more analytics subpages
        ],
      },
      {
        path: 'management',
        layout: ManagementLayout,
        navLabel: 'Management',
        icon: <ManagementIcon />,
        children: [
          // ...management subpages (user-management, business, etc.)
        ],
      },
      {
        path: 'settings',
        component: Settings,
        roles: ['system_admin'],
        loadingText: 'Loading settings...',
        navLabel: 'Settings',
        icon: <SettingsIcon />,
      },
      // ...other admin sections
    ],
  },
];
```

## 2. Router Integration
- In `App.tsx`, import `adminRoutes`.
- Recursively map over `adminRoutes` to generate `<Route>`s, supporting nested routes and layouts.
- Each route uses `<ProtectedAdminRoute allowedRoles={roles}>`.
- `ProtectedAdminRoute` is updated to accept `allowedRoles` (array of roles), not just `requireSystemAccess`.
- Layouts are applied by wrapping children routes/components as specified in the config.

## 3. Access Guard Logic
- `ProtectedAdminRoute` checks if the current user’s role is in `allowedRoles`.
- If not, redirect to a default fallback (e.g., `/admin/management/user-management`).
- Minimal change: preserve all current fallback/redirect logic.

## 4. Navigation Consistency
- Navigation configs (`managementNav.ts`, `managementTabs.ts`) can import or reference `managementRoutes` for path consistency.

## 5. Extensibility
- To add a new management page: add an entry to `managementRoutes`.
- To change access: update the `roles` array.
- To update navigation: reference the same config.

## 6. Type Safety
- Use TypeScript interfaces and enums for roles and routes.
