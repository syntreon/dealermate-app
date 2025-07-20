# Admin Dashboard Refactor - Requirements Document

## Introduction

This feature refactors the existing AdminDashboard component into smaller, modular, theme-aware components that use real data from the database instead of mock calculations. The refactored dashboard will follow the Analytics page pattern with tabbed components and implement proper theme support as outlined in the theme system analysis.

## Requirements

### Requirement 1: Component Architecture Refactor

**User Story:** As a developer, I want the AdminDashboard to be broken down into smaller, manageable components, so that the codebase is more maintainable and follows React best practices.

#### Acceptance Criteria

1. WHEN the AdminDashboard is loaded THEN it SHALL use a tabbed interface similar to the Analytics page
2. WHEN each tab is selected THEN it SHALL load its respective component independently
3. WHEN components are rendered THEN they SHALL be no larger than 200 lines of code each
4. WHEN the dashboard loads THEN it SHALL maintain the same mobile-responsive behavior with horizontal scrolling tabs
5. WHEN components are created THEN they SHALL follow the established folder structure pattern

### Requirement 2: Real Data Integration

**User Story:** As an admin, I want the dashboard to show accurate financial and operational metrics calculated from real database data, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN financial metrics are displayed THEN they SHALL be calculated from actual client billing data in the database
2. WHEN cost breakdowns are shown THEN they SHALL use real cost data from the calls table (vapi_call_cost_usd, openai_api_cost_usd, etc.)
3. WHEN client profitability is calculated THEN it SHALL use actual revenue minus actual costs from database records
4. WHEN user analytics are displayed THEN they SHALL be calculated from real user login and creation data
5. WHEN call metrics are shown THEN they SHALL be aggregated from the calls table with proper date filtering
6. WHEN lead conversion rates are calculated THEN they SHALL use actual call-to-lead ratios from the database
7. WHEN growth trends are displayed THEN they SHALL be calculated from historical data comparisons (month-over-month)

### Requirement 3: Theme System Compliance

**User Story:** As a user, I want the admin dashboard to properly support light and dark themes, so that I can use the interface in my preferred visual mode.

#### Acceptance Criteria

1. WHEN the dashboard is rendered THEN it SHALL use semantic color tokens (bg-background, text-foreground, etc.) instead of hardcoded colors
2. WHEN the theme is switched THEN all dashboard components SHALL transition smoothly between light and dark modes
3. WHEN cards are displayed THEN they SHALL use bg-card text-card-foreground border-border classes
4. WHEN progress bars and charts are shown THEN they SHALL adapt their colors to the current theme
5. WHEN badges and status indicators are used THEN they SHALL use the appropriate variant props instead of custom colors

### Requirement 4: Performance Optimization

**User Story:** As an admin, I want the dashboard to load quickly and efficiently, so that I can access critical business metrics without delays.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN it SHALL implement proper loading states for each component
2. WHEN data is fetched THEN it SHALL use parallel API calls where possible to minimize load time
3. WHEN components are not visible THEN they SHALL implement lazy loading to improve initial page load
4. WHEN data is refreshed THEN it SHALL only update the components that need new data
5. WHEN errors occur THEN they SHALL be handled gracefully with appropriate error boundaries

### Requirement 5: Data Service Layer

**User Story:** As a developer, I want dedicated service functions for dashboard metrics, so that data fetching logic is centralized and reusable.

#### Acceptance Criteria

1. WHEN dashboard data is needed THEN it SHALL be fetched through dedicated service functions
2. WHEN financial calculations are performed THEN they SHALL be done in service layer functions with proper error handling
3. WHEN metrics are aggregated THEN they SHALL use efficient database queries with appropriate indexes
4. WHEN date ranges are applied THEN they SHALL be handled consistently across all metric calculations
5. WHEN client-specific data is requested THEN it SHALL respect user permissions and client isolation

### Requirement 6: Mobile Responsiveness

**User Story:** As an admin using a mobile device, I want the dashboard to be fully functional and easy to navigate, so that I can monitor business metrics on the go.

#### Acceptance Criteria

1. WHEN the dashboard is viewed on mobile THEN it SHALL use horizontal scrolling tabs like the Analytics page
2. WHEN metric cards are displayed THEN they SHALL stack appropriately on smaller screens
3. WHEN charts and graphs are shown THEN they SHALL be readable and interactive on touch devices
4. WHEN tables are displayed THEN they SHALL be horizontally scrollable with sticky headers
5. WHEN the refresh button is used THEN it SHALL be easily accessible on mobile devices

### Requirement 7: Error Handling and Resilience

**User Story:** As an admin, I want the dashboard to handle errors gracefully and continue showing available data, so that temporary issues don't prevent me from accessing critical metrics.

#### Acceptance Criteria

1. WHEN a component fails to load data THEN it SHALL show an error state without breaking other components
2. WHEN network requests fail THEN they SHALL be retried automatically with exponential backoff
3. WHEN partial data is available THEN it SHALL be displayed with appropriate indicators for missing information
4. WHEN the database is unavailable THEN the dashboard SHALL show cached data if available
5. WHEN errors are logged THEN they SHALL include sufficient context for debugging

### Requirement 8: Real-time Updates

**User Story:** As an admin, I want the dashboard to show current data and update automatically, so that I always have the latest business metrics.

#### Acceptance Criteria

1. WHEN the dashboard is open THEN it SHALL refresh data automatically every 5 minutes
2. WHEN manual refresh is triggered THEN it SHALL update all visible components
3. WHEN new data is available THEN it SHALL be reflected in the UI without requiring a page reload
4. WHEN real-time events occur THEN they SHALL be reflected in relevant dashboard components
5. WHEN the user is inactive THEN automatic updates SHALL be paused to conserve resources