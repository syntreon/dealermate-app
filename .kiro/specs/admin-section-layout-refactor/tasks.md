# Implementation Plan

- [x] 1. Create navigation configuration files for new sections





  - Create `src/config/managementNav.ts` with Users, Clients, Business, and Roles & Permissions navigation items
  - Create `src/config/auditNav.ts` with All Logs, User Logs, Client Logs, and System Logs navigation items
  - Update existing navigation configs to match new structure
  - _Requirements: 3.2, 4.2, 5.2_

- [x] 2. Create new section layout components





  - Create `src/layouts/admin/ManagementLayout.tsx` with sub-sidebar navigation for management functions
  - Create `src/layouts/admin/AuditLayout.tsx` with sub-sidebar navigation for audit logs
  - Ensure layouts follow the established pattern with header, sidebar, and outlet structure, reference existing layouts => /layouts/admin/AnalyticsLayout.tsx for design idea
  - _Requirements: 3.1, 5.1_

- [x] 3. Refactor main AdminSidebar component for 3-state functionality





  - Remove dual-sidebar logic and simplify to single main sidebar
  - Implement 3-state system: expanded, collapsed, expand-on-hover
  - Add footer control with popup menu for state selection
  - Remove logout button and user info from sidebar footer
  - Implement smooth transitions and width calculations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Update main admin navigation configuration





  - Simplify `src/config/adminNav.ts` to show only top-level sections
  - Remove sub-sidebar configuration from main nav
  - Update navigation items to match new structure: Dashboard, Management, Analytics, Logs, Settings
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 5. Move and reorganize existing functional admin pages





  - Move existing `src/pages/admin/AdminSettings.tsx` to `src/pages/admin/settings/AdminSettings.tsx`
  - Reuse existing `src/pages/admin/user-management.tsx` (keep in place, update routing)
  - Reuse existing `src/pages/admin/ClientManagement.tsx` (keep in place, update routing)
  - Reuse existing `src/pages/admin/ClientDetails.tsx` for client tab section
  - Compare existing `src/pages/admin/admin-audit.tsx` and `src/pages/admin/AdminAudit.tsx`, keep the better one and add comment for unused file
  - Move existing `src/pages/admin/AgentStatusSettings.tsx` to `src/pages/admin/settings/AgentStatusSettings.tsx`
  - _Requirements: 3.3, 3.4, 5.3, 6.3, 6.4_

- [x] 6. Create only the new placeholder pages that don't exist yet





  - Create `src/pages/admin/management/business.tsx` with "coming soon" message (new)
  - Create `src/pages/admin/management/roles.tsx` with "coming soon" message (new)
  - Create `src/pages/admin/audit/user-logs.tsx` with "coming soon" message (new)
  - Create `src/pages/admin/audit/client-logs.tsx` with "coming soon" message (new)
  - Create `src/pages/admin/audit/system-logs.tsx` with "coming soon" message (new)
  - _Requirements: 3.5, 3.6, 5.4, 5.5, 5.6_

- [x] 7. Reuse all existing analytics pages (already exist!)





  - Reuse existing `src/pages/admin/analytics/financials.tsx` (already exists)
  - Reuse existing `src/pages/admin/analytics/users.tsx` (already exists)
  - Reuse existing `src/pages/admin/analytics/clients.tsx` (already exists)
  - Reuse existing `src/pages/admin/analytics/platform.tsx` (already exists)
  - Reuse existing `src/pages/admin/analytics/system-ops.tsx` (already exists!)
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Update routing configuration in App.tsx to use existing pages





  - Remove old dual-sidebar routing structure
  - Implement new nested routing for Management section with ManagementLayout pointing to existing pages
  - Implement new nested routing for Audit section with AuditLayout pointing to existing audit page
  - Update Analytics routing to use existing AnalyticsLayout with existing analytics pages
  - Update Settings routing to use existing SettingsLayout with existing settings pages
  - Add index route redirects for each section
  - _Requirements: 3.1, 4.1, 5.1, 6.1_

- [x] 9. Update route code splitting configuration









  - Add new layouts to `src/utils/routeCodeSplitting.ts`
  - Register ManagementLayout and AuditLayout for lazy loading
  - Update existing layout registrations as needed
  - Ensure all new pages are properly configured for code splitting
  - Fix missing/not visible sub links in Analytics laytout (maybe using the old layout (dual sidebar) with no updates to match the new layout with sidebar)
  - _Requirements: Performance optimization_

- [x] 10. Implement responsive layout system





  - Update AdminLayout to respond to sidebar state changes
  - Implement fluid responsive behavior for section layouts
  - Ensure sub-sidebars remain always expanded within their parent layouts
  - Handle expand-on-hover overlay behavior without layout resize
  - Fix any state error currenlty expand on hover, not working properly, it should be collaped by default oand on hover should expand as overlay, not just the text inside it
  - Collpased button should be at the bottom of the screen change icon to a sidepanel
  - fix subsidebar links visual (partially cutting out onthe right side)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Add error boundaries and loading states





  - Implement error boundaries for each section layout
  - Add loading states for lazy-loaded components
  - Create fallback UI components for error scenarios
  - Implement error recovery mechanisms
  - _Requirements: Error handling and user experience_

- [ ] 12. Update mobile navigation system
  - Modify mobile drawer to work with new simplified navigation structure
  - Remove dual-sidebar mobile logic
  - Ensure touch gestures work properly with new layout system
  - Test responsive behavior across all screen sizes
  - _Requirements: Mobile responsiveness_

- [ ] 13. Implement sidebar state persistence
  - Add localStorage integration for sidebar state
  - Implement state recovery on page reload
  - Add error handling for localStorage failures
  - Ensure state persistence works across browser sessions
  - _Requirements: 1.1, User experience_

- [ ] 14. Test and validate implementation
  - Test all three sidebar states and transitions
  - Verify navigation works correctly between all sections
  - Test responsive behavior on mobile, tablet, and desktop
  - Validate role-based access control still functions
  - Test error scenarios and recovery mechanisms
  - _Requirements: All requirements validation_

- [ ] 15. Clean up unused code and files
  - Remove old dual-sidebar components and logic
  - Clean up unused navigation configurations
  - Remove any orphaned files from the refactor
  - Update imports and references throughout the codebase
  - Add comments to any files that are kept for reference
  - _Requirements: Code maintenance and cleanup_