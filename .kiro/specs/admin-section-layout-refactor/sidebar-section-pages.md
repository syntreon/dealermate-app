Sidebar features
================

This is a sidebar feature. It is used to display a sidebar on the left side of the page.
3 states: collapsed, expanded, and expand on hover. 
use sidebar ui on the bottom footer to toggle between states.
    when clciked on this icon, a small popup will appear with the following options:
    "sidebar Control"
    - expanded
    - expand on click
    - collapsed

on collapsed the sidebar icosn  will only be shown
on expanded icons and text will be shown
on expand on hover icons and then text will be shown when hoverd with smooth transitions

All pages inside the sidebar has its own layout

## side bar menu (the main sidebar with 3 states)
Any layout containing its own subside bar cannot be collapsed, only the main one.

1. back to main app button will be on the top of the sidebar with chevron left icon (icon only in collapsed state)
2. Dashboard 
    only one page so no layout needed. reuse /admin/dashboard.tsx

3. Management => new layout src/layouts/admin/ManagementLayout.tsx
    ManagementLayout with its own sidebar
    1. Users /admin/user-management.tsx
    2. Clients /admin/clientManagement.tsx -tab section with /admin/clientDetails.tsx
    3. Business (empty page saying coming soon)
    4. Roles & Permissions ( new empty page saying coming soon)

4. Analytics
    AnalyticsLayout with its own sidebar => reuse layout src/layouts/admin/AnalyticsLayout.tsx
    1. Financials src/pages/admin/analytics/financials.tsx
    2. Users src/pages/admin/analytics/users.tsx
    3. Clients src/pages/admin/analytics/clients.tsx
    4. Platform src/pages/admin/analytics/platform.tsx
    5. System & Ops src/pages/admin/analytics/system-ops.tsx

5. Logs (audit)
    LogsLayout with its own sidebar => new layout src/layouts/admin/AuditLayout.tsx
    1. All Logs src/pages/admin/audit/admin-audit.tsx move to /admin/audit/admin-audit.tsx and adminAudit.tsx compare which one is better and add comment for unused file
    2. User Logs src/pages/admin/audit/user-logs.tsx (new empty page saying coming soon)   
    3. Client Logs src/pages/admin/audit/client-logs.tsx (new empty page saying coming soon)
    4. System Logs src/pages/admin/audit/system-logs.tsx (new empty page saying coming soon)

6. Settings
    SettingsLayout with its own sidebar use: src/layouts/admin/SettingsLayout.tsx
    1. General => reuse src/pages/admin/AdminSettings.tsx move to /admin/settings/AdminSettings.tsx
    2. Agent $ Status => reuse src/pages/admin/settings/AgentStatusSettings.tsx
    
* remove logout button from the sidebar
* remove name and access info from footer
7. Add the extend/collapse clickable icon only on the bottom footer. should be lowest on the footer.
## How the page should work
If the layout or page has its own sub sidebar:
* All subsidebars have no states. basically they are always expanded inside its parent layout.
    1. When main sidebar is extended the layout or page(including sub sidebar) should be fluid responsive to fit to the full width inside the screen/viewport minus the main sidebar width
    2. When main sidebar is collapsed the layout or page(including sub sidebar) should be fluid responsive to fit inside the screen/viewport minus the main sidebar collapsed width 
If the layout or page has no sub sidebar: (dashboard)
* The page should be fluid responsive to fit to the full width inside the screen/viewport minus the main sidebar width (collapes or extended.)

### Extend on Hover
* When the main sidebar is in extend on hover state, the layout or page should not resize. The main sidebar should be extended on hover on top of the layout or page.


existing files
D:\AI\NewApp\src\config\adminNav.ts
D:\AI\NewApp\src\config\settingsNav.ts
D:\AI\NewApp\src\utils\routeCodeSplitting.ts
