# Complete Access Control Matrix

This document provides a comprehensive overview of access permissions across the entire DealerMate application, organized by pages, components, and features.

## 📋 **Role Definitions**

> **Note:** Role display names have been updated for clarity. The new labels are:
> - `client_admin` → **Business Manager**
> - `user` → **Account Manager**
> - `client_user` → **User**
> - `admin` and `owner` remain unchanged

| Role | Level | Description | Scope |
|------|-------|-------------|-------|
| `owner` | 5 | Super admin with full system access | System-wide |
| `admin` | 4 | Administrative user with access to admin panel | System-wide |
| `user` | 3 | **Account Manager** (internal staff, system-wide access to multiple clients) | System-wide |
| `client_admin` | 2 | **Business Manager** (enhanced client-specific access) | Client-specific |
| `client_user` | 1 | **User** (basic client user with minimal access) | Client-specific |

**Legend**: ✅ Full Access | 🔒 Limited Access | ❌ No Access | 📱 Desktop Only

---

## 🏠 **Main Application Pages**

### Core Pages

| Page | Route | client_user | client_admin | user | admin | owner | Notes |
|------|-------|-------------|--------------|------|-------|-------|-------|
| **Dashboard** | `/dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data for client roles |
| **Call Details** | `/call` | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Logs** | `/logs` | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Leads** | `/leads` | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Analytics** | `/analytics` | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Agents** | `/agents` | ✅ | 🔒 | ✅ | ✅ | ✅ | Edit controls: client_admin+ only |
| **Settings** | `/settings` | ✅ | ✅ | ✅ | ✅ | ✅ | Different tabs based on role |

### Admin Panel Pages

| Page | Route | client_user | client_admin | user | admin | owner | Notes |
|------|-------|-------------|--------------|------|-------|-------|-------|
| **Admin Index** | `/admin` | ❌ | 🔒 | ✅ | ✅ | ✅ | Redirects client_admin to /admin/users |
| **Admin Dashboard** | `/admin/dashboard` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **User Management** | `/admin/users` | ❌ | 🔒 | ✅ | ✅ | ✅ | Client-filtered for client_admin |
| **Client Management** | `/admin/clients` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Admin Analytics** | `/admin/analytics` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Audit Logs** | `/admin/audit` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **System Status** | `/admin/system-status` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **System Health** | `/admin/system-health` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Admin Settings** | `/admin/settings` | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |

---

## 🧩 **Components and Features**

### Navigation Components

| Component | client_user | client_admin | user | admin | owner | Notes |
|-----------|-------------|--------------|------|-------|-------|-------|
| **AppSidebar** | ✅ | ✅ | ✅ | ✅ | ✅ | All users see main navigation |
| **Admin Panel Button** | ❌ | ✅ | ✅ | ✅ | ✅ | Shows "Administration" for client_admin |
| **AdminSidebar** | ❌ | 🔒 | ✅ | ✅ | ✅ | Filtered navigation for client_admin |
| **Client Selector** | ❌ | ❌ | ✅ | ✅ | ✅ | System-wide users only |

### Dashboard Components

| Component | client_user | client_admin | user | admin | owner | Notes |
|-----------|-------------|--------------|------|-------|-------|-------|
| **Metrics Summary Cards** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Call Activity Timeline** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Recent Calls List** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Quick Actions** | ✅ | ✅ | ✅ | ✅ | ✅ | Role-based action availability |

### Settings Components

| Component | client_user | client_admin | user | admin | owner | Mobile | Notes |
|-----------|-------------|--------------|------|-------|-------|--------|-------|
| **User Preferences** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Personal settings |
| **Business Settings** | ✅ | 🔒 | ✅ | ✅ | ✅ | ✅ | Edit: client_admin+ only |
| **Agent Settings** | ✅ | 📱 | 📱 | 📱 | 📱 | ❌ | Edit: Desktop only, client_admin+ |
| **Notification Preferences** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Personal settings |
| **Add User Form** | ❌ | 🔒 | ✅ | ✅ | ✅ | ✅ | Role restrictions apply |

### Agent Management

| Feature | client_user | client_admin | user | admin | owner | Mobile | Notes |
|---------|-------------|--------------|------|-------|-------|--------|-------|
| **View Agent Status** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | All users can view |
| **Agent Toggle Switches** | ❌ | 📱 | 📱 | 📱 | 📱 | ❌ | Desktop only, client_admin+ |
| **Agent Details Dialog** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | View only for client_user |
| **Turn On Agent Button** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | client_admin+ only |
| **Agent Configuration** | ✅ | 📱 | 📱 | 📱 | 📱 | ❌ | Edit: Desktop only, client_admin+ |

### User Management (Admin Panel)

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **View Users List** | ❌ | 🔒 | ✅ | ✅ | ✅ | Client-filtered for client_admin |
| **User Filters** | ❌ | 🔒 | ✅ | ✅ | ✅ | No client selector for client_admin |
| **Add New User** | ❌ | 🔒 | ✅ | ✅ | ✅ | Role restrictions apply |
| **Edit User** | ❌ | 🔒 | ✅ | ✅ | ✅ | Hierarchy rules apply |
| **Delete User** | ❌ | 🔒 | ✅ | ✅ | ✅ | Hierarchy rules apply |
| **Role Assignment** | ❌ | 🔒 | ✅ | ✅ | ✅ | Limited roles for client_admin |

### Business Information Management

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **View Business Info** | ✅ | ✅ | ✅ | ✅ | ✅ | All users can view |
| **Edit Business Name** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |
| **Edit Contact Info** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |
| **Edit Address** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |
| **View Edit History** | ❌ | ✅ | ✅ | ✅ | ✅ | Audit logs available |

---

## 📊 **Analytics and Reporting**

### Analytics Pages

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **Call Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Performance Metrics** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **AI Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Export Reports** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |
| **Custom Date Ranges** | ✅ | ✅ | ✅ | ✅ | ✅ | All users |

### Admin Analytics

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **System-wide Analytics** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Client Comparison** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Revenue Analytics** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **User Activity Analytics** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |

---

## 📞 **Call Management**

### Call Features

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **View Call History** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Call Details** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Call Transcripts** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Call Recordings** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Call Evaluation** | ✅ | ✅ | ✅ | ✅ | ✅ | View only for client_user |
| **Export Call Data** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |

### Call Configuration

| Feature | client_user | client_admin | user | admin | owner | Mobile | Notes |
|---------|-------------|--------------|------|-------|-------|--------|-------|
| **View Call Settings** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | All users can view |
| **Modify Call Settings** | ❌ | 📱 | 📱 | 📱 | 📱 | ❌ | Desktop only, client_admin+ |
| **Call Routing Rules** | ❌ | 📱 | 📱 | 📱 | 📱 | ❌ | Desktop only, client_admin+ |
| **Business Hours Config** | ❌ | 📱 | 📱 | 📱 | 📱 | ❌ | Desktop only, client_admin+ |

---

## 👥 **Lead Management**

### Lead Features

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **View Leads List** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Lead Details** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |
| **Lead Status Updates** | ✅ | ✅ | ✅ | ✅ | ✅ | All users can update |
| **Lead Assignment** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |
| **Export Leads** | ❌ | ✅ | ✅ | ✅ | ✅ | client_admin+ only |
| **Lead Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ | Client-filtered data |

---

## 🔧 **System Administration**

### System Features (Admin Panel Only)

| Feature | client_user | client_admin | user | admin | owner | Notes |
|---------|-------------|--------------|------|-------|-------|-------|
| **System Health Monitoring** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **System Status Management** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Audit Log Viewing** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Client Management** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **System Configuration** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |
| **Database Management** | ❌ | ❌ | ❌ | ✅ | ✅ | admin+ only |

---

## 📱 **Mobile-Specific Restrictions**

### Features Restricted on Mobile (All Roles)

| Feature | Reason | Alternative |
|---------|--------|-------------|
| **Agent Settings Editing** | Complex form interface | View-only with desktop message |
| **Agent Toggle Controls** | Accidental activation prevention | View-only status |
| **Business Settings Editing** | Form complexity | View-only with desktop message |
| **User Management Forms** | Complex validation and selection | View-only lists |
| **System Configuration** | Critical system changes | Desktop-only access |

### Mobile-Optimized Features

| Feature | Mobile Experience |
|---------|-------------------|
| **Dashboard Viewing** | Responsive cards and metrics |
| **Call History** | Touch-friendly list interface |
| **Lead Management** | Swipe actions and mobile forms |
| **Analytics Viewing** | Responsive charts and graphs |
| **Settings Viewing** | Collapsible sections |

---

## 🔐 **Security and Audit**

### Audit Logging

| Action | client_user | client_admin | user | admin | owner | Logged Data |
|--------|-------------|--------------|------|-------|-------|-------------|
| **Business Info Changes** | ❌ | ✅ | ✅ | ✅ | ✅ | Old/new values, user, timestamp |
| **User Management** | ❌ | ✅ | ✅ | ✅ | ✅ | User changes, role modifications |
| **Agent Configuration** | ❌ | ✅ | ✅ | ✅ | ✅ | Configuration changes |
| **System Changes** | ❌ | ❌ | ✅ | ✅ | ✅ | System modifications |
| **Login/Logout** | ✅ | ✅ | ✅ | ✅ | ✅ | Authentication events |

### Data Access Patterns

| Data Type | client_user | client_admin | user | admin | owner | Filtering |
|-----------|-------------|--------------|------|-------|-------|-----------|
| **Call Data** | ✅ | ✅ | ✅ | ✅ | ✅ | By client_id for client roles |
| **Lead Data** | ✅ | ✅ | ✅ | ✅ | ✅ | By client_id for client roles |
| **User Data** | ❌ | 🔒 | ✅ | ✅ | ✅ | Client-filtered for client_admin |
| **Business Data** | ✅ | ✅ | ✅ | ✅ | ✅ | Own client only for client roles |
| **System Data** | ❌ | ❌ | ✅ | ✅ | ✅ | System admins only |

---

## 🚀 **Implementation Notes**

### Key Access Control Functions

```typescript
// Core permission checking functions
hasSystemWideAccess(user)     // owner, admin, user
hasClientAdminAccess(user)    // client_admin + system-wide
canAccessAdminPanel(user)     // owner, admin only
canManageUsers(user, target)  // Hierarchy-based management
canViewSensitiveInfo(user)    // System-wide access users
```

### Mobile Detection

```typescript
// Mobile restriction pattern
const canEditAgents = hasClientAdminAccess(user);
const showEditControls = canEditAgents && !isMobile;
```

### Data Filtering Pattern

```typescript
// Client data isolation
const clientId = getClientIdFilter(user);
const filteredData = filterItemsByClientAccess(data, user);
```

---

## 📋 **Quick Reference**

### Role Capabilities Summary

- **client_user**: View-only access to client-specific data
- **client_admin**: Edit client data, manage client users, desktop editing only
- **user**: Full system access, can manage multiple clients
- **admin**: Full system access + admin panel + database management
- **owner**: Complete system control

### Common Permission Patterns

1. **View Access**: Most features visible to all roles (client-filtered)
2. **Edit Access**: Requires client_admin+ privileges
3. **System Access**: Requires user+ privileges (system-wide roles)
4. **Admin Access**: Requires admin+ privileges
5. **Mobile Restrictions**: Edit features disabled on mobile for all roles

This matrix serves as the definitive reference for access control throughout the DealerMate application.