# Admin Sidebar Refactor - Requirements Document

## Introduction

This feature refactors the existing admin interface from a tab-based AdminDashboard and overlapping AdminAnalytics into a hierarchical, sidebar-navigated interface similar to Supabase's admin panel. The goal is to eliminate redundant features, reduce complexity, and create a scalable pattern for future admin features while reusing existing components and services.

## Requirements

### Requirement 1: Dual Sidebar Structure

**User Story:** As a system administrator, I want an intuitive and space-efficient sidebar navigation system, so that I can quickly access different sections of the application without the navigation interfering with the main content.

#### Acceptance Criteria

1. WHEN the admin interface loads THEN it SHALL display two distinct vertical sidebars: a primary "Main Sidebar" and a secondary "Sub-Sidebar"
2. WHEN the Main Sidebar is displayed THEN it SHALL contain top-level navigation categories represented by icons
3. WHEN the Sub-Sidebar is displayed THEN it SHALL show the title of the active category and a list of page links within that category
4. WHEN I select a category in the Main Sidebar THEN the Sub-Sidebar content SHALL be determined by the active selection
5. WHEN I interact with the Sub-Sidebar THEN it SHALL NOT be collapsible or hideable independently

### Requirement 2: Main Sidebar - Expanded State (Default)

**User Story:** As an admin user, I want the Main Sidebar to be expanded by default with clear labels, so that I can easily identify and access different sections.

#### Acceptance Criteria

1. WHEN the admin interface loads THEN the Main Sidebar SHALL be in its "Expanded" state by default
2. WHEN the Main Sidebar is expanded THEN both the icon and text label for each navigation category SHALL be visible
3. WHEN the Main Sidebar is expanded THEN it SHALL push both the Sub-Sidebar and main content area to the right
4. WHEN the Main Sidebar is expanded THEN the main content area SHALL resize to fit the remaining space
5. WHEN the Main Sidebar is expanded THEN the layout SHALL maintain proper spacing and proportions

### Requirement 3: Main Sidebar - Collapsed State

**User Story:** As an admin user, I want to collapse the Main Sidebar to maximize content space, so that I can focus on the main content when needed.

#### Acceptance Criteria

1. WHEN I click the dedicated collapse/expand control THEN the Main Sidebar SHALL collapse to show only navigation icons
2. WHEN the Main Sidebar is collapsed THEN text labels SHALL be hidden and only icons SHALL be visible
3. WHEN the Main Sidebar is collapsed THEN the Sub-Sidebar and main content area SHALL shift to the left
4. WHEN the Main Sidebar is collapsed THEN the available space for main content SHALL increase
5. WHEN the Main Sidebar state changes THEN it SHALL be persistent across user sessions and page reloads

### Requirement 4: Main Sidebar - Hover Behavior (in Collapsed State)

**User Story:** As an admin user, I want to temporarily view the full Main Sidebar when collapsed, so that I can see section labels without permanently expanding the sidebar.

#### Acceptance Criteria

1. WHEN the Main Sidebar is collapsed AND I hover over it THEN it SHALL trigger a temporary "Hover" state
2. WHEN in the "Hover" state THEN the Main Sidebar SHALL expand to full width displaying both icons and text labels
3. WHEN in the "Hover" state THEN the expanded Main Sidebar SHALL overlay on top of the Sub-Sidebar without pushing content
4. WHEN in the "Hover" state THEN the Sub-Sidebar and main content area SHALL NOT shift or be pushed
5. WHEN I move the mouse cursor off the Main Sidebar THEN it SHALL automatically return to its "Collapsed" state

### Requirement 5: Page-Based Architecture and Component Reuse

**User Story:** As a developer, I want each admin section to be a separate page component that reuses existing services, so that the codebase is modular and maintainable.

#### Acceptance Criteria

1. WHEN I create a new admin section THEN it SHALL be a separate page component in its own file
2. WHEN pages are loaded THEN they SHALL reuse existing AdminService, MetricsCalculationService, and other established services
3. WHEN displaying data THEN they SHALL reuse existing components like FinancialOverview, BusinessMetrics, and chart components
4. WHEN components are created THEN they SHALL be no larger than 200 lines of code each
5. WHEN styling components THEN they SHALL use the established theme system with semantic color tokens

### Requirement 6: Elimination of Redundant Features

**User Story:** As an admin user, I want a streamlined interface without duplicate features, so that I can efficiently access the information I need without confusion.

#### Acceptance Criteria

1. WHEN the refactor is complete THEN there SHALL be no overlapping features between AdminDashboard and AdminAnalytics
2. WHEN I access analytics THEN all analytics features SHALL be consolidated into appropriate sections in the Sub-Sidebar
3. WHEN I view financial data THEN it SHALL be presented in a single, comprehensive location under Analytics > Financials
4. WHEN I manage users or clients THEN the functionality SHALL not be duplicated across multiple pages
5. WHEN I navigate the interface THEN each feature SHALL have a clear, single location

### Requirement 7: Navigation Configuration and Role-Based Access

**User Story:** As a developer, I want a centralized navigation configuration with role-based access control, so that I can easily manage admin sections and security.

#### Acceptance Criteria

1. WHEN I need to add a new admin section THEN I SHALL only need to update the navigation configuration file
2. WHEN navigation items are defined THEN they SHALL include proper role-based access control
3. WHEN sub-sections are created THEN they SHALL be properly nested in the configuration for the Sub-Sidebar
4. WHEN icons are used THEN they SHALL be consistently defined in the configuration
5. WHEN routes are generated THEN they SHALL automatically match the dual sidebar navigation structure

### Requirement 8: Mobile Responsiveness and Performance

**User Story:** As an admin user on various devices, I want the dual sidebar system to work efficiently on all screen sizes with optimal performance.

#### Acceptance Criteria

1. WHEN viewing on mobile THEN the dual sidebar SHALL transform into a single overlay/drawer navigation
2. WHEN on mobile THEN the navigation SHALL combine Main Sidebar categories with Sub-Sidebar links in a hierarchical structure
3. WHEN I navigate to a new page THEN it SHALL show appropriate loading states while data is fetched
4. WHEN pages load THEN they SHALL use lazy loading to improve initial load performance
5. WHEN the sidebar state changes THEN transitions SHALL be smooth and not impact main content performance

### Requirement 9: Backward Compatibility

**User Story:** As a system administrator, I want existing bookmarks and direct links to continue working, so that the refactor doesn't break existing workflows.

#### Acceptance Criteria

1. WHEN users have bookmarked /admin/dashboard THEN it SHALL redirect to the new dashboard page
2. WHEN direct links to admin sections exist THEN they SHALL be properly mapped to new routes
3. WHEN the refactor is deployed THEN existing user sessions SHALL continue to work
4. WHEN role-based access is checked THEN it SHALL use the same existing permission system
5. WHEN users access admin features THEN they SHALL see the same data and functionality as before