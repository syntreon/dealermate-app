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
│   ├── analytics/         # Components for the Analytics pages.
│   │   └── SimpleAIAnalytics.tsx # AI model performance dashboard using real data.
│   ├── calls/             # Components related to call details and evaluation.
│   ├── common/            # Generic, shared components (buttons, inputs, etc.).
│   └── ui/                # Base UI elements from shadcn/ui.
│       └── themed-chart-tooltip.tsx # Theme-aware chart tooltip components.
├──
├── context/               # React Context providers for global state management.
│   ├── AuthProvider.tsx   # Manages user authentication state.
│   ├── ThemeContext.tsx   # Performance-optimized theme context with memoization.
│   └── ThemeInitProvider.tsx # Single theme initialization provider to prevent conflicts.
├──
├── hooks/                 # Custom React hooks for shared logic.
│   ├── useAuthSession.ts  # Hook for accessing user session and profile.
│   ├── use-theme-init.tsx # Enhanced theme initialization with error recovery.
│   └── useOptimizedTheme.ts # Performance-optimized theme utilities and calculations.
├──
├── layouts/               # Components that define the structure of pages.
│   └── DashboardLayout.tsx # The main layout with sidebar and header.
├──
├── pages/                 # Top-level components for each application route/page.
│   ├── Admin.tsx          # The main Admin Dashboard page.
│   ├── Analytics.tsx      # The main Analytics page.
│   ├── Login.tsx          # The user login page.
│   └── Settings.tsx       # User settings and preferences page.
├──
├── services/              # Handles business logic and API interactions.
│   ├── adminService.ts    # Fetches data for the Admin Dashboard.
│   ├── analyticsService.ts# Fetches data for the Analytics pages.
│   ├── simpleAIAnalyticsService.ts # AI model performance analytics using real database data.
│   ├── supabaseService.ts # Generic Supabase client and helper functions.
│   └── themeService.ts    # Centralized theme management with caching and synchronization.
├──
├── types/                 # TypeScript type definitions and interfaces.
│   └── supabase.ts        # Auto-generated types from the Supabase schema.
└──
    └── utils/                 # Utility functions used across the application.
        ├── formatters.ts    # Functions for formatting dates, currency, etc.
        ├── themeRecovery.ts # Theme error recovery and fallback mechanisms.
        ├── themeValidation.ts # Theme validation and sanitization utilities.
        ├── themePerformance.ts # Performance monitoring for theme operations.
        ├── themeTransitions.ts # Smooth theme transition management.
        └── themeBackgroundSync.ts # Background synchronization for theme preferences.
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
