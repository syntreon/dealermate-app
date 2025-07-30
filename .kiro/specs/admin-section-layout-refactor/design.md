# Design Document

## Overview

This design implements an enterprise-grade admin section layout pattern with a sophisticated 3-state main sidebar system and modular section-specific layouts. The architecture replaces the current complex dual-sidebar approach with a cleaner, more maintainable system where each admin section operates independently with its own layout and navigation.

## Architecture

### Main Sidebar States

The main sidebar supports three distinct states controlled by a footer toggle:

1. **Expanded State** - Full width (256px) showing icons and text
2. **Collapsed State** - Minimal width (64px) showing icons only  
3. **Expand on Hover State** - Icons only, but expands to full width on hover with overlay behavior

### Section Layout System

Each admin section follows a consistent pattern:
- **Dashboard**: Single page, no sub-navigation
- **Management**: Dedicated layout with sub-sidebar for Users, Clients, Business, Roles & Permissions
- **Analytics**: Dedicated layout with sub-sidebar for Financials, Users, Clients, Platform, System & Ops
- **Logs (Audit)**: Dedicated layout with sub-sidebar for All Logs, User Logs, Client Logs, System Logs
- **Settings**: Dedicated layout with sub-sidebar for General, Agent & Status

## Components and Interfaces

### Core Components

#### 1. Enhanced AdminSidebar Component
**Location**: `src/components/admin/AdminSidebar.tsx`

The main sidebar component will be refactored to support the 3-state system:

```typescript
interface SidebarState {
  mode: 'expanded' | 'collapsed' | 'expand-on-hover';
  isHovered: boolean;
  width: number;
}

interface AdminSidebarProps {
  onStateChange?: (state: SidebarState) => void;
}
```

**Key Features**:
- Footer-based state control with popup menu
- Smooth transitions between states
- Width calculation and event broadcasting
- Removal of logout button and user info from sidebar
- Clean minimal design with only navigation elements

#### 2. Section Layout Components

**ManagementLayout** - `src/layouts/admin/ManagementLayout.tsx`
```typescript
const ManagementLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Management</h2>
        <p className="text-muted-foreground">Manage users, clients, and business settings.</p>
      </div>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {managementNavItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={navLinkStyles}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
```

**AuditLayout** - `src/layouts/admin/AuditLayout.tsx`
```typescript
const AuditLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h2>
        <p className="text-muted-foreground">Monitor system activities and user actions.</p>
      </div>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {auditNavItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={navLinkStyles}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
```

#### 3. Navigation Configuration Files

**ManagementNav** - `src/config/managementNav.ts`
```typescript
import { Users, Building2, Briefcase, Shield } from 'lucide-react';

export const managementNavItems = [
  { title: 'Users', href: '/admin/management/users', icon: Users },
  { title: 'Clients', href: '/admin/management/clients', icon: Building2 },
  { title: 'Business', href: '/admin/management/business', icon: Briefcase },
  { title: 'Roles & Permissions', href: '/admin/management/roles', icon: Shield },
];
```

**AuditNav** - `src/config/auditNav.ts`
```typescript
import { FileText, User, Building2, Server } from 'lucide-react';

export const auditNavItems = [
  { title: 'All Logs', href: '/admin/audit/all', icon: FileText },
  { title: 'User Logs', href: '/admin/audit/users', icon: User },
  { title: 'Client Logs', href: '/admin/audit/clients', icon: Building2 },
  { title: 'System Logs', href: '/admin/audit/system', icon: Server },
];
```

#### 4. Updated AdminNav Configuration

**Location**: `src/config/adminNav.ts`

The main navigation will be simplified to show only top-level sections:

```typescript
export const mainNavItems = [
  { 
    id: 'dashboard',
    title: 'Dashboard', 
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    requiredAccess: 'system_admin'
  },
  {
    id: 'management',
    title: 'Management',
    icon: Users,
    href: '/admin/management',
    requiredAccess: 'client_admin'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    requiredAccess: 'system_admin'
  },
  {
    id: 'audit',
    title: 'Logs',
    icon: Shield,
    href: '/admin/audit',
    requiredAccess: 'system_admin'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    requiredAccess: 'system_admin'
  }
];
```

## Data Models

### Sidebar State Management

```typescript
interface SidebarState {
  mode: 'expanded' | 'collapsed' | 'expand-on-hover';
  isHovered: boolean;
  width: number;
  isTransitioning: boolean;
}

interface SidebarConfig {
  persistState: boolean;
  defaultMode: SidebarState['mode'];
  transitionDuration: number;
  hoverDelay: number;
}
```

### Layout Responsive Behavior

```typescript
interface LayoutDimensions {
  mainSidebarWidth: number;
  subSidebarWidth: number;
  contentWidth: number;
  totalOffset: number;
}

interface ResponsiveConfig {
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  sidebarBehavior: {
    mobile: 'overlay' | 'push';
    tablet: 'overlay' | 'push';
    desktop: 'push';
  };
}
```

## File Structure Changes

### Files to Move

1. **Admin Settings Page**
   - **From**: `src/pages/admin/AdminSettings.tsx`
   - **To**: `src/pages/admin/settings/AdminSettings.tsx`

2. **Admin Audit Page**
   - **From**: `src/pages/admin/adminAudit.tsx` (if exists)
   - **To**: `src/pages/admin/audit/admin-audit.tsx`
   - **Note**: Compare with existing audit files and add comments for unused files

### New Files to Create

1. **Layout Components**
   - `src/layouts/admin/ManagementLayout.tsx`
   - `src/layouts/admin/AuditLayout.tsx`

2. **Navigation Configurations**
   - `src/config/managementNav.ts`
   - `src/config/auditNav.ts`

3. **New Pages**
   - `src/pages/admin/management/users.tsx` (move from `src/pages/admin/user-management.tsx`)
   - `src/pages/admin/management/clients.tsx` (move from `src/pages/admin/clientManagement.tsx`)
   - `src/pages/admin/management/business.tsx` (new - coming soon page)
   - `src/pages/admin/management/roles.tsx` (new - coming soon page)
   - `src/pages/admin/audit/user-logs.tsx` (new - coming soon page)
   - `src/pages/admin/audit/client-logs.tsx` (new - coming soon page)
   - `src/pages/admin/audit/system-logs.tsx` (new - coming soon page)
   - `src/pages/admin/analytics/system-ops.tsx` (new page)

4. **Route Code Splitting Updates**
   - Update `src/utils/routeCodeSplitting.ts` to include new layouts

## Routing Structure

### Updated App.tsx Routing

```typescript
// Admin Routes
<Route path="admin" element={<AdminLayout />}>
  {/* Dashboard - Single page, no layout needed */}
  <Route path="dashboard" element={<AdminDashboard />} />
  
  {/* Management Section */}
  <Route path="management" element={<ManagementLayout />}>
    <Route index element={<Navigate to="users" replace />} />
    <Route path="users" element={<UserManagement />} />
    <Route path="clients" element={<ClientManagement />} />
    <Route path="business" element={<ComingSoonPage title="Business Management" />} />
    <Route path="roles" element={<ComingSoonPage title="Roles & Permissions" />} />
  </Route>
  
  {/* Analytics Section */}
  <Route path="analytics" element={<AnalyticsLayout />}>
    <Route index element={<Navigate to="financials" replace />} />
    <Route path="financials" element={<FinancialsPage />} />
    <Route path="users" element={<UsersAnalyticsPage />} />
    <Route path="clients" element={<ClientsAnalyticsPage />} />
    <Route path="platform" element={<PlatformAnalyticsPage />} />
    <Route path="system-ops" element={<SystemOpsPage />} />
  </Route>
  
  {/* Audit Section */}
  <Route path="audit" element={<AuditLayout />}>
    <Route index element={<Navigate to="all" replace />} />
    <Route path="all" element={<AdminAuditPage />} />
    <Route path="users" element={<ComingSoonPage title="User Logs" />} />
    <Route path="clients" element={<ComingSoonPage title="Client Logs" />} />
    <Route path="system" element={<ComingSoonPage title="System Logs" />} />
  </Route>
  
  {/* Settings Section */}
  <Route path="settings" element={<SettingsLayout />}>
    <Route index element={<Navigate to="general" replace />} />
    <Route path="general" element={<AdminSettings />} />
    <Route path="agent-status" element={<AgentStatusSettings />} />
  </Route>
</Route>
```

## Error Handling

### Layout Error Boundaries

Each section layout will include error boundaries to handle failures gracefully:

```typescript
const SectionErrorBoundary: React.FC<{ children: React.ReactNode; sectionName: string }> = ({ 
  children, 
  sectionName 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              Error loading {sectionName}
            </h3>
            <p className="text-muted-foreground mt-2">
              Please refresh the page or contact support if the issue persists.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Sidebar State Recovery

```typescript
const useSidebarStateRecovery = () => {
  const [state, setState] = useState<SidebarState>(() => {
    try {
      const saved = localStorage.getItem('admin-sidebar-state');
      return saved ? JSON.parse(saved) : defaultSidebarState;
    } catch {
      return defaultSidebarState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('admin-sidebar-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save sidebar state:', error);
    }
  }, [state]);

  return [state, setState] as const;
};
```

## Testing Strategy

### Component Testing

1. **Sidebar State Management**
   - Test all three states (expanded, collapsed, expand-on-hover)
   - Test smooth transitions between states
   - Test state persistence in localStorage
   - Test responsive behavior on different screen sizes

2. **Layout Components**
   - Test proper rendering of section layouts
   - Test navigation highlighting and active states
   - Test responsive behavior of sub-sidebars
   - Test error boundary functionality

3. **Routing Integration**
   - Test navigation between sections
   - Test default redirects for section index routes
   - Test role-based access control
   - Test deep linking to specific pages

### Integration Testing

1. **Sidebar-Layout Integration**
   - Test layout responsiveness to sidebar state changes
   - Test proper width calculations and content reflow
   - Test overlay behavior in expand-on-hover mode

2. **Navigation Flow**
   - Test complete user journeys through different sections
   - Test back navigation and browser history
   - Test mobile navigation drawer functionality

### Performance Testing

1. **Layout Rendering**
   - Test smooth transitions without layout thrashing
   - Test memory usage with frequent navigation
   - Test lazy loading of section components

2. **State Management**
   - Test sidebar state change performance
   - Test localStorage read/write performance
   - Test event listener cleanup

## Mobile Responsiveness

### Adaptive Navigation

The mobile experience will use a drawer-based navigation system:

1. **Main Navigation**: Hamburger menu triggering full-screen drawer on the right bottom corner
2. **Section Navigation**: Horizontal scrolling tabs or accordion-style navigation
3. **Touch Gestures**: Swipe to open/close navigation drawer
4. **Responsive Breakpoints**: 
   - Mobile: < 768px (drawer navigation)
   - Tablet: 768px - 1024px (collapsible sidebar)
   - Desktop: > 1024px (full sidebar functionality)

### Layout Adaptation

```typescript
const useResponsiveLayout = () => {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);
  
  return screenSize;
};
```

## Performance Optimizations

### Code Splitting

Each section layout and its pages will be lazy-loaded:

```typescript
// Route code splitting updates
const ManagementLayout = lazy(() => import('../layouts/admin/ManagementLayout'));
const AuditLayout = lazy(() => import('../layouts/admin/AuditLayout'));
const UserManagement = lazy(() => import('../pages/admin/management/users'));
const SystemOpsPage = lazy(() => import('../pages/admin/analytics/system-ops'));
```

### State Management Optimization

```typescript
// Memoized sidebar state to prevent unnecessary re-renders
const useMemoizedSidebarState = () => {
  const [state, setState] = useState<SidebarState>(defaultState);
  
  const memoizedState = useMemo(() => state, [
    state.mode,
    state.width,
    state.isHovered
  ]);
  
  const updateState = useCallback((newState: Partial<SidebarState>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);
  
  return [memoizedState, updateState] as const;
};
```

### Layout Calculation Optimization

```typescript
// Debounced layout calculations to improve performance
const useOptimizedLayoutCalculations = () => {
  const [dimensions, setDimensions] = useState<LayoutDimensions>(defaultDimensions);
  
  const updateDimensions = useMemo(
    () => debounce((newDimensions: LayoutDimensions) => {
      setDimensions(newDimensions);
    }, 16), // ~60fps
    []
  );
  
  return [dimensions, updateDimensions] as const;
};
```