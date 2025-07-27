# Admin Panel Documentation

This directory contains documentation for the DealerMate admin panel and access control system.

## Key Documents

### 🔐 [Role-Based Access Control Implementation](./role-based-access-control-implementation.md)
**Primary developer guide** - Comprehensive documentation of the RBAC system including:
- Role hierarchy and permissions (owner > admin > user > client_admin > client_user)
- Core files and components with smart routing and protection
- Admin panel routing with role-based landing pages
- Business information editing with audit logging
- Agent settings with mobile device restrictions
- Implementation details and usage examples
- How to add new features and roles
- Testing and debugging guide

### 📊 [User and Admin Views Guide](./user-admin-views-guide.md)
Overview of the user interface architecture and view separation between regular users and admin users.

### 🔐 [Complete Access Control Matrix](./access-control-matrix.md)
**Comprehensive permission reference** - Detailed access control tables covering:
- All application pages, components, and features
- Role-based permissions for every part of the system
- Mobile-specific restrictions and behaviors
- Business management and agent configuration access
- Analytics, reporting, and system administration permissions

### ⚙️ [Admin Panel Implementation](./admin-panel-implementation.md)
Technical details about the admin panel components and functionality.

### 🔗 [Make Operations Integration](./make-operations-integration.md)
Documentation for Make.com integration and operations management.

## Quick Start for New Developers

1. **Start with**: [Role-Based Access Control Implementation](./role-based-access-control-implementation.md)
2. **Understand the role hierarchy**: owner > admin > user > client_admin > client_user
3. **Key file to know**: `src/utils/clientDataIsolation.ts` - Contains all access control logic
4. **Main components**: 
   - `AdminLayout.tsx` - Controls admin interface access
   - `AdminSidebar.tsx` - Role-based navigation
   - `AppSidebar.tsx` - Main app navigation with admin access

## Access Control Summary

- **System-wide access**: `owner`, `admin`, `user` (can view all clients)
- **Client-specific access**: `client_admin`, `client_user` (restricted to their client)
- **Admin panel access**: `owner`, `admin` only
- **Client admin features**: `client_admin` + all system-wide roles
- **Call details access**: `owner`, `admin`, `user`, `client_admin` (can view call details and tool calls)
- **Call evaluation access**: `owner`, `admin`, `user`, `client_admin` (can view evaluation data, but not prompt adherence)
- **KPI metrics access**: `owner`, `admin`, `user`, `client_admin` (can view advanced KPI cards like agents available, lines available, calls in queue, calls transferred)
- **Analytics access**: `owner`, `admin`, `user`, `client_admin` (can access analytics page, `client_user` cannot)

## Common Tasks

- **Adding a new admin page**: See "Adding New Features" section in the main guide
- **Checking user permissions**: Use utilities from `clientDataIsolation.ts`
- **Filtering data by client**: Use `getClientIdFilter()` and related functions
- **Role-based UI**: Use access control functions in component render logic
- **Implementing mobile restrictions**: Use `useIsMobile()` hook with permission checks
- **Adding audit logging**: Use `AuditService` for tracking changes
- **Protecting admin routes**: Use `ProtectedAdminRoute` component wrapper
- **Call details access**: Use `canViewCallDetails()` for tool calls and detailed call information
- **Call evaluation access**: Use `canViewCallEvaluation()` for evaluation data (excludes prompt adherence for client_admin)
- **KPI metrics access**: Use `canViewKPIMetrics()` for advanced dashboard metrics
- **Analytics access**: Use `canAccessAnalytics()` to control analytics page access (excludes client_user)

For detailed implementation guidance, refer to the [Role-Based Access Control Implementation Guide](./role-based-access-control-implementation.md).