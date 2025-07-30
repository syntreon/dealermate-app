# Admin Section Layout Pattern

## Overview
This document describes the enterprise-grade pattern for implementing scalable, modular admin section layouts (with their own sidebars/sub-navigation) in this codebase. It is the required reference for all new developers.

## Why This Pattern?
- **Scalable:** Easily supports new sections and many sub-pages.
- **Consistent:** Every admin section (Settings, Analytics, etc.) works the same way.
- **Maintainable:** Navigation, layout, and routing are modular and easy to update.

---

## 1. Directory & File Structure
```
src/
  layouts/
    admin/
      SettingsLayout.tsx
      AnalyticsLayout.tsx
  config/
    settingsNav.ts
    analyticsNav.ts
  components/
    admin/
      AdminSidebar.tsx
  pages/
    admin/
      settings/
        AdminSettings.tsx
        AgentStatusSettings.tsx
      analytics/
        Financials.tsx
        Clients.tsx
        Users.tsx
  utils/
    routeCodeSplitting.ts
  App.tsx
```

---

## 2. Step-by-Step Implementation

### A. Create a Navigation Config
**File:** `src/config/analyticsNav.ts`
```ts
import { BarChart, Users, DollarSign } from 'lucide-react';
export const analyticsNavItems = [
  { title: 'Financials', href: '/admin/analytics/financials', icon: DollarSign },
  { title: 'Clients', href: '/admin/analytics/clients', icon: Users },
  { title: 'Users', href: '/admin/analytics/users', icon: BarChart },
];
```

### B. Create the Section Layout
**File:** `src/layouts/admin/AnalyticsLayout.tsx`
```tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { analyticsNavItems } from '@/config/analyticsNav';
import { cn } from '@/lib/utils';

const AnalyticsLayout: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
      <p className="text-muted-foreground">View analytics and reports.</p>
    </div>
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <aside className="-mx-4 lg:w-1/5">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {analyticsNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center rounded-md text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'px-4 py-2',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
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
export default AnalyticsLayout;
```

### C. Register the Layout for Lazy Loading
**File:** `src/utils/routeCodeSplitting.ts`
```ts
layouts: {
  ...,
  AnalyticsLayout: createLazyRoute(() => import('../layouts/admin/AnalyticsLayout')),
}
```

### D. Update Routing
**File:** `src/App.tsx`
```tsx
<Route path="analytics" element={
  <Suspense fallback={<LoadingSpinner text="Loading analytics..." />}>
    <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
      <RouteGroups.layouts.AnalyticsLayout />
    </RouteGroups.common.ProtectedAdminRoute>
  </Suspense>
}>
  <Route index element={...} />
  <Route path="financials" element={...} />
  <Route path="clients" element={...} />
  <Route path="users" element={...} />
</Route>
```

### E. Add New Pages
- Create the page in `src/pages/admin/analytics/`
- Add a link to `analyticsNav.ts`
- Add a route in `App.tsx`

---

## 3. What to Update & Where
| What                | Where                              | How                         |
|---------------------|------------------------------------|-----------------------------|
| Sidebar links       | `src/config/analyticsNav.ts`       | Add/edit/remove items       |
| Layout component    | `src/layouts/admin/AnalyticsLayout.tsx` | Edit sidebar/header, etc.   |
| Register layout     | `src/utils/routeCodeSplitting.ts`  | Add to `layouts` export     |
| Routing             | `src/App.tsx`                      | Add nested routes           |
| New pages           | `src/pages/admin/analytics/`        | Create new TSX files        |

---

## 4. Example Files
- [`src/layouts/admin/SettingsLayout.tsx`](../../src/layouts/admin/SettingsLayout.tsx)
- [`src/layouts/admin/AnalyticsLayout.tsx`](../../src/layouts/admin/AnalyticsLayout.tsx)
- [`src/config/settingsNav.ts`](../../src/config/settingsNav.ts)
- [`src/config/analyticsNav.ts`](../../src/config/analyticsNav.ts)
- [`src/utils/routeCodeSplitting.ts`](../../src/utils/routeCodeSplitting.ts)
- [`src/App.tsx`](../../src/App.tsx)
- [`src/pages/admin/analytics/Financials.tsx`](../../src/pages/admin/analytics/Financials.tsx)

---

## 5. New Developer Checklist
1. To add a new section (e.g., Billing):
    - Copy the pattern (nav config, layout, routing)
2. To add a new page to a section:
    - Add to nav config
    - Add a route in `App.tsx`
    - Create the page file

---

## 6. FAQ
- **Q: Should each admin section have its own sidebar in the layout?**
  - **A:** Yes, for sections with multiple sub-pages. This is the enterprise pattern.
- **Q: Should navigation logic be in the layout or page?**
  - **A:** In the layout. Never duplicate sidebar logic in pages.
- **Q: What about single-page sections?**
  - **A:** Minimal layout is fine, but use the pattern if the section might grow.

---

## 7. See Also
- [admin-sidebar-refactor/design.md](../../.kiro/specs/admin-sidebar-refactor/design.md)
- [admin-sidebar-refactor/tasks.md](../../.kiro/specs/admin-sidebar-refactor/tasks.md)

---

**Follow this doc for all new admin section and layout work.**
