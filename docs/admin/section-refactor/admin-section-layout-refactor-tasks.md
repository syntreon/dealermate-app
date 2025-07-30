# Admin Section Layout Refactor - Implementation Plan

## Task Overview

This plan migrates the admin interface to a scalable, modular, dual-sidebar layout pattern for all admin sections. Each task builds incrementally, reusing components/services and enforcing consistency, maintainability, and enterprise scalability.

---

- [x] 1. Project Setup and Navigation Configuration
  - Move all layout files to `/src/layouts/admin/` for consistency
  - Split navigation config: keep `adminNav.ts` for main nav; create `analyticsNav.ts`, `settingsNav.ts` for section nav if needed
  - Ensure all TypeScript interfaces are defined for navigation items and links
  - Update project structure documentation
  - _Requirements: 1.1, 2.1, 2.2, 5.1, 5.2_

- [ ] 2. Sidebar Refactor and Section Layouts
  - [ ] 2.1 Refactor `MainSidebar.tsx` to only render top-level navigation (no sub-sidebar logic)
  - [ ] 2.2 Create/Refactor `SubSidebar.tsx` for section-specific navigation, using section nav config
  - [ ] 2.3 Update all section layouts (e.g., `AnalyticsLayout.tsx`, `SettingsLayout.tsx`) to render both sidebars and `<Outlet />`
  - [ ] 2.4 Ensure main content uses correct margin/width to account for both sidebars (see design doc best practice)
  - [ ] 2.5 Add mobile overlay/drawer support for both sidebars
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 6.1, 6.2_

- [ ] 3. Page Refactor and Migration
  - [ ] 3.1 Move all tab components to pages under `/pages/admin/[section]/`
  - [ ] 3.2 Update imports to use new page structure
  - [ ] 3.3 Ensure all data hooks/services are integrated with new pages
  - [ ] 3.4 Remove all deprecated tab-based pages/components
  - _Requirements: 2.3, 2.4, 4.1, 4.2, 5.3_

- [ ] 4. Routing and Code Splitting
  - [ ] 4.1 Register all layouts and pages in `routeCodeSplitting.ts` for lazy loading
  - [ ] 4.2 Update `App.tsx` to use nested routes for each admin section (e.g., `/admin/analytics/*` → `AnalyticsLayout`)
  - [ ] 4.3 Add redirects for backward compatibility (e.g., `/admin` → `/admin/dashboard`)
  - [ ] 4.4 Test all navigation and deep links
  - _Requirements: 2.5, 4.3, 4.4, 8.1, 8.2_

- [ ] 5. Component Integration and Reuse
  - [ ] 5.1 Integrate existing dashboard/analytics components into new pages
  - [ ] 5.2 Ensure all error boundaries, loading skeletons, and theme utilities are used in new structure
  - [ ] 5.3 Test all service/data integration (`AdminService`, `MetricsCalculationService`, etc.)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.3_

- [ ] 6. Performance Optimization
  - [ ] 6.1 Implement lazy loading for all section pages
  - [ ] 6.2 Optimize data loading and caching between pages
  - [ ] 6.3 Test navigation responsiveness and bundle splitting
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 7. Testing and Validation
  - [ ] 7.1 Unit tests for navigation components and layouts
  - [ ] 7.2 Integration tests for navigation flows, data loading, and role-based access
  - [ ] 7.3 E2E/manual testing for navigation, mobile, and backward compatibility
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 8.1_

- [ ] 8. Cleanup and Documentation
  - [ ] 8.1 Remove all deprecated files, components, and tab-based skeletons
  - [ ] 8.2 Update all imports, route references, and comments
  - [ ] 8.3 Update project structure doc and developer guide
  - [ ] 8.4 Prepare migration guide for future admin features
  - _Requirements: 2.1, 2.2, 8.5_

- [ ] 9. Final Validation and Deployment
  - [ ] 9.1 Comprehensive system validation (all admin features, roles, data)
  - [ ] 9.2 Code review and PR process
  - [ ] 9.3 Prepare deployment and rollback plan
  - _Requirements: All_

---

**Follow this checklist to migrate all admin sections to the new scalable, modular, dual-sidebar layout pattern.**
