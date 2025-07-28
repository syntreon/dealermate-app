---
inclusion: always
---

# Project Structure

This document outlines the directory structure of the Dealermate application, providing a guide for developers to navigate the codebase.

## Root Directory

The root directory contains configuration files, documentation, and the main source code folder.

```
/
├── .kiro/             # Contains AI-generated documentation and steering files.
├── .vscode/           # VS Code editor settings.
├── dist/              # Build output directory.
├── docs/              # General project documentation.
│   ├── admin/         # Admin panel and access control documentation.
│   │   ├── access-control-matrix.md # Complete permission matrix for all features
│   │   ├── admin-panel-implementation.md
│   │   ├── make-operations-integration.md
│   │   ├── recent-updates-summary.md # Summary of recent RBAC enhancements
│   │   ├── role-based-access-control-implementation.md
│   │   └── user-admin-views-guide.md
│   ├── analytics/     # Analytics and reporting documentation.
│   └── status-messages/ # System status and messaging documentation.
├── node_modules/      # Project dependencies.
├── public/            # Static assets (images, fonts, etc.) served directly.
├── scripts/           # Standalone scripts for various tasks.
├── src/               # Main application source code.
├── supabase/          # Supabase configuration, migrations, and functions.
├── .env               # Local environment variables (DO NOT COMMIT).
├── .gitignore         # Files and directories to be ignored by Git.
├── package.json       # Lists project dependencies and defines scripts.
├── tailwind.config.ts # Tailwind CSS configuration file.
├── tsconfig.json      # TypeScript compiler configuration.
├── vite.config.ts     # Vite build tool configuration.
└── README.md          # General project information.
```

## `src` Directory: The Heart of the Application

The `src` directory contains all the React application code, organized by feature and function.

```
src/
├── App.tsx                # Main application component, handles routing.
├── main.tsx               # Application entry point, renders the React app.
├── index.css              # Global CSS styles.
├──
├── components/            # Reusable UI components.
│   ├── admin/             # Components specific to the Admin Dashboard.
│   │   ├── dashboard/     # Admin dashboard specific components.
│   │   │   ├── LoadingSkeletons.tsx # Comprehensive theme-aware loading skeletons for all dashboard components.
│   │   │   ├── TabLoadingSkeleton.tsx # Enhanced tab-specific loading skeletons with progressive states.
│   │   │   ├── LoadingOverlay.tsx # Full-screen loading overlay with progress tracking.
│   │   │   ├── LoadingStatesProvider.tsx # Context provider for managing loading states across dashboard.
│   │   │   ├── SmartLoadingWrapper.tsx # Intelligent loading wrapper component with error handling.
│   │   │   ├── LoadingStatesDemo.tsx # Comprehensive demo of all loading states and skeletons.
│   │   │   ├── LazyTabLoader.tsx # Lazy loading system with preloading and performance monitoring.
│   │   │   ├── DashboardHeader.tsx # Dashboard header with refresh functionality.
│   │   │   ├── FinancialOverview.tsx # Financial metrics overview cards.
│   │   │   ├── BusinessMetrics.tsx # Business KPI cards.
│   │   │   ├── TabErrorBoundary.tsx # Error boundary for tab components.
│   │   │   ├── ErrorFallback.tsx # Error fallback UI component.
│   │   │   ├── PartialDataProvider.tsx # Provider for handling partial data loading.
│   │   │   └── tabs/       # Individual dashboard tab components.
│   │   │       ├── FinancialTab.tsx # Financial analysis tab with real-time data.
│   │   │       ├── ClientsTab.tsx # Client analytics tab.
│   │   │       ├── UsersTab.tsx # User analytics tab.
│   │   │       ├── SystemTab.tsx # System health monitoring tab.
│   │   │       └── OperationsTab.tsx # Operations metrics tab.
│   │   ├── AdminSidebar.tsx # Admin navigation with role-based filtering.
│   │   ├── ProtectedAdminRoute.tsx # Route protection based on user permissions.
│   │   └── ... # Other admin components
│   ├── optimized/         # Performance-optimized components for large datasets.
│   │   ├── MemoizedCallLogsTable.tsx # Memoized version of CallLogsTable with intelligent prop comparison.
│   │   ├── VirtualizedCallLogsTable.tsx # Virtualized table for handling thousands of call logs efficiently.
│   │   ├── MemoizedLeadsTable.tsx # Memoized version of LeadsTable with efficient lead comparison.
│   │   ├── VirtualizedLeadsTable.tsx # Virtualized table for managing large lead datasets.
│   │   ├── MemoizedMetricsSummaryCards.tsx # Optimized dashboard metrics with granular change detection.
│   │   ├── MemoizedFinancialTab.tsx # Optimized financial tab that prevents unnecessary re-mounting.
│   │   ├── MemoizedClientsTab.tsx # Optimized clients tab with stable rendering.
│   │   ├── OptimizedLogsPage.tsx # Example implementation showing both memoized and virtualized components.
│   │   ├── README.md # Comprehensive guide for using optimized components.
│   │   └── __tests__/     # Performance tests for optimized components.
│   │       └── performance.test.tsx # Comprehensive performance testing suite.
│   ├── analytics/         # Components for the Analytics pages.
│   │   └── SimpleAIAnalytics.tsx # AI model performance dashboard using real data.
│   ├── calls/             # Components related to call details and evaluation.
│   ├── common/            # Generic, shared components (buttons, inputs, etc.).
│   │   └── LoadingSpinner.tsx # Theme-aware loading spinner component for code splitting.
│   ├── leads/             # Components for lead management.
│   │   ├── LeadsTable.tsx # Mobile-responsive leads table with filtering and sorting.
│   │   ├── LeadDetailsView.tsx # Lead details modal/drawer component.
│   │   └── LeadExportDialog.tsx # Lead export functionality dialog.
│   ├── settings/          # Settings-related components.
│   │   ├── BusinessSettings.tsx # Business info editing with audit logging.
│   │   ├── AgentSettings.tsx # Agent configuration with mobile restrictions.
│   │   └── ... # Other settings components
│   ├── ui/                # Base UI elements from shadcn/ui.
│   │   └── themed-chart-tooltip.tsx # Theme-aware chart tooltip components.
│   ├── CallLogsTable.tsx  # Mobile-responsive call logs table with advanced filtering.
│   └── AppSidebar.tsx     # Main application sidebar with role-based navigation.
├──
├── context/               # React Context providers for global state management.
│   ├── AuthProvider.tsx   # Manages user authentication state.
│   ├── ThemeContext.tsx   # Performance-optimized theme context with memoization.
│   └── ThemeInitProvider.tsx # Single theme initialization provider to prevent conflicts.
├──
├── hooks/                 # Custom React hooks for shared logic.
│   ├── useAuthSession.ts  # Hook for accessing user session and profile.
│   ├── use-theme-init.tsx # Enhanced theme initialization with error recovery.
│   ├── useOptimizedTheme.ts # Performance-optimized theme utilities and calculations.
│   ├── useLoadingStates.ts # Comprehensive hook for managing loading states with progress tracking, error handling, and retry logic.
│   ├── useDashboardMetrics.ts # Basic dashboard metrics hook for client-specific data.
│   ├── useAdminDashboardData.ts # Extended admin dashboard hook with comprehensive data fetching, auto-refresh, and error handling.
│   ├── useCachedAdminDashboardData.ts # Cached version of admin dashboard hook with intelligent caching and query optimization.
│   └── useRoutePreloading.ts # Hook for intelligent route preloading based on user navigation patterns.
├──
├── layouts/               # Components that define the structure of pages.
│   └── AdminLayout.tsx    # Admin panel layout with role-based access control - Mobile responsive with overflow handling.
├──
├── pages/                 # Top-level components for each application route/page.
│   ├── admin/             # Admin panel pages with role-based access control.
│   │   ├── AdminDashboard.tsx # Main admin dashboard (system admins only) - Mobile responsive with scrollable tabs.
│   │   ├── AdminIndex.tsx # Admin panel routing logic based on user role.
│   │   ├── UserManagement.tsx # User management with role-based filtering.
│   │   ├── ClientManagement.tsx # Client management (system admins only).
│   │   ├── AdminAnalytics.tsx # Admin analytics (system admins only).
│   │   └── ... # Other admin pages
│   ├── Agents.tsx         # Agent management with role-based edit controls.
│   ├── Analytics.tsx      # The main Analytics page - Mobile responsive with horizontal scrolling tabs.
│   ├── Dashboard.tsx      # The main user dashboard page.
│   ├── Leads.tsx          # Lead management page - Mobile responsive with stacked button layout.
│   ├── Logs.tsx           # Call logs page - Mobile responsive with optimized table layout.
│   ├── Login.tsx          # The user login page.
│   └── Settings.tsx       # User settings and preferences page.
├──
├── services/              # Handles business logic and API interactions.
│   ├── adminService.ts    # Fetches data for the Admin Dashboard.
│   ├── analyticsService.ts# Fetches data for the Analytics pages.
│   ├── simpleAIAnalyticsService.ts # AI model performance analytics using real database data.
│   ├── supabaseService.ts # Generic Supabase client and helper functions.
│   ├── themeService.ts    # Centralized theme management with caching and synchronization.
│   ├── cacheService.ts    # Comprehensive caching system with TTL, tags, and persistence.
│   ├── queryOptimizationService.ts # Database query optimization and performance monitoring.
│   ├── metricsCalculationService.ts # Financial calculations and client profitability analysis.
│   ├── makeComAnalyticsService.ts # Make.com operations analytics and cost tracking.
│   └── makeOperationsService.ts # Make.com scenario-level operations monitoring.
├──
├── types/                 # TypeScript type definitions and interfaces.
│   └── supabase.ts        # Auto-generated types from the Supabase schema.
└──
    └── utils/                 # Utility functions used across the application.
        ├── formatters.ts    # Functions for formatting dates, currency, etc.
        ├── clientDataIsolation.ts # Role-based access control and data isolation utilities with client_admin support.
        ├── themeRecovery.ts # Theme error recovery and fallback mechanisms.
        ├── themeValidation.ts # Theme validation and sanitization utilities.
        ├── themePerformance.ts # Performance monitoring for theme operations.
        ├── themeTransitions.ts # Smooth theme transition management.
        ├── themeBackgroundSync.ts # Background synchronization for theme preferences.
        ├── performanceOptimization.ts # Performance optimization utilities and hooks for React components.
        ├── performanceTesting.ts # Performance testing utilities and benchmarking tools.
        ├── routeCodeSplitting.ts # Route-based code splitting utilities with intelligent preloading.
        ├── bundleAnalyzer.ts # Bundle size monitoring and optimization utilities.
        └── code-splitting/    # Code splitting implementation documentation and guides.
            ├── README.md      # Comprehensive code splitting implementation guide.
            ├── DEVELOPER_GUIDE.md # Developer guide for working with code splitting.
            ├── DEBUG_CHEATSHEET.md # Quick debugging reference for code splitting issues.
            └── TROUBLESHOOTING_FLOW.md # Visual problem-solving guide for code splitting.
```

### Key Directory Explanations

*   **`components/`**: This is where most of the UI code lives. Components are organized by feature (e.g., `admin`, `analytics`) to keep the codebase modular. Truly generic components are in `common/` or `ui/`.

*   **`pages/`**: Each file in this directory typically corresponds to a specific URL route in the application. These components compose layouts and feature-specific components from the `components/` directory.

*   **`services/`**: This directory abstracts away all data fetching and business logic from the UI components. It acts as a bridge between the frontend and the backend (Supabase). This separation makes the code easier to test and maintain.

*   **`hooks/`**: Custom hooks encapsulate reusable stateful logic. For example, `useAuthSession` provides a simple way for any component to get information about the currently logged-in user.

*   **`context/`**: Used for providing global state that needs to be accessible by many components at different levels of the component tree, such as authentication status.

## `supabase` Directory

This directory contains all the necessary files for managing the Supabase backend.

*   **`migrations/`**: Contains SQL files that define the database schema. Each file represents a change to the database, allowing for version control of the database structure.
*   **`functions/`**: If using Supabase Edge Functions, the code for those functions would reside here.
*   **`config.toml`**: The main configuration file for the Supabase project, defining project ID and other settings.
