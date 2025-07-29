import { lazy, ComponentType } from 'react';

/**
 * Utility for creating lazy-loaded route components with better error handling
 * and preloading capabilities for improved performance
 */

interface LazyRouteOptions {
  fallback?: ComponentType;
  preload?: boolean;
  retryCount?: number;
}

/**
 * Creates a lazy-loaded component with enhanced error handling and retry logic
 */
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options: LazyRouteOptions = {}
) => {
  const { retryCount = 3 } = options;
  
  const retryImport = async (attempt = 1): Promise<{ default: ComponentType<any> }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < retryCount) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return retryImport(attempt + 1);
      }
      throw error;
    }
  };

  const LazyComponent = lazy(() => retryImport());
  
  // Add preloading capability
  if (options.preload) {
    // Preload the component after a short delay
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail preloading
      });
    }, 100);
  }

  return LazyComponent;
};

/**
 * Route groups for better code splitting organization
 */
export const RouteGroups = {
  // Authentication related routes
  auth: {
    Login: createLazyRoute(() => import('../pages/Login')),
    AuthCallback: createLazyRoute(() => import('../pages/auth/AuthCallback')),
    ResetPassword: createLazyRoute(() => import('../pages/auth/ResetPassword')),
  },

  // Main application routes
  main: {
    Dashboard: createLazyRoute(() => import('../pages/Dashboard'), { preload: true }),
    Analytics: createLazyRoute(() => import('../pages/Analytics')),
    Logs: createLazyRoute(() => import('../pages/Logs')),
    Leads: createLazyRoute(() => import('../pages/Leads')),
    Agents: createLazyRoute(() => import('../pages/Agents')),
    Settings: createLazyRoute(() => import('../pages/Settings')),
    Call: createLazyRoute(() => import('../pages/Call')),
    ManageUsers: createLazyRoute(() => import('../pages/ManageUsers')),
  },

  // Admin panel routes
  admin: {
    AdminDashboard: createLazyRoute(() => import('../pages/admin/AdminDashboard')),
    Dashboard: createLazyRoute(() => import('../pages/admin/dashboard')),
    ClientManagement: createLazyRoute(() => import('../pages/admin/ClientManagement')),
    ClientDetails: createLazyRoute(() => import('../pages/admin/ClientDetails')),
    UserManagement: createLazyRoute(() => import('../pages/admin/user-management')),
    AdminSettings: createLazyRoute(() => import('../pages/admin/AdminSettings')),
    SystemHealthMonitoring: createLazyRoute(() => import('../pages/admin/SystemHealthMonitoring')),
    AdminAnalytics: createLazyRoute(() => import('../pages/admin/AdminAnalytics')),
    AdminAudit: createLazyRoute(() => import('../pages/admin/AdminAudit')),
    AdminIndex: createLazyRoute(() => import('../pages/admin/AdminIndex')),
    AdminSystemStatus: createLazyRoute(() => import('../pages/AdminSystemStatus')),
    // Analytics section pages
    AnalyticsFinancials: createLazyRoute(() => import('../pages/admin/analytics/financials')),
    AnalyticsClients: createLazyRoute(() => import('../pages/admin/analytics/clients')),
    AnalyticsUsers: createLazyRoute(() => import('../pages/admin/analytics/users')),
    AnalyticsPlatform: createLazyRoute(() => import('../pages/admin/analytics/platform')),
    AnalyticsSystemOps: createLazyRoute(() => import('../pages/admin/analytics/system-ops')),
  },

  // Layout components
  layouts: {
    AppLayout: createLazyRoute(() => import('../components/AppLayout'), { preload: true }),
    AdminLayout: createLazyRoute(() => import('../layouts/AdminLayout')),
  },

  // Utility components
  common: {
    NotFound: createLazyRoute(() => import('../pages/NotFound')),
    ProtectedAdminRoute: createLazyRoute(() => import('../components/admin/ProtectedAdminRoute')),
  },

  // Test components (only in development)
  test: {
    AuthTest: createLazyRoute(() => import('../test/AuthTest')),
  },
};

/**
 * Preload critical routes that are likely to be accessed soon
 */
export const preloadCriticalRoutes = () => {
  // Preload dashboard and layout components as they're most commonly accessed
  const criticalRoutes = [
    () => import('../pages/Dashboard'),
    () => import('../components/AppLayout'),
  ];

  criticalRoutes.forEach(importFn => {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail preloading
      });
    }, 2000);
  });
};

/**
 * Bundle size optimization utilities
 */
export const BundleOptimization = {
  /**
   * Dynamically import heavy dependencies only when needed
   */
  loadChartLibrary: () => import('recharts'),
  loadDateLibrary: () => import('date-fns'),
  loadExportLibrary: async () => {
    // Note: Add xlsx to dependencies if export functionality is needed
    console.warn('Export library not configured. Install xlsx if needed.');
    return null;
  },
  
  /**
   * Preload components based on user navigation patterns
   */
  preloadBasedOnRoute: (currentRoute: string) => {
    const preloadMap: Record<string, (() => Promise<any>)[]> = {
      '/dashboard': [
        () => import('../pages/Analytics'),
        () => import('../pages/Logs'),
      ],
      '/analytics': [
        () => import('../pages/Logs'),
        () => import('../pages/Leads'),
      ],
      '/logs': [
        () => import('../pages/Leads'),
        () => import('../pages/Analytics'),
      ],
      '/admin': [
        () => import('../pages/admin/dashboard'),
        () => import('../pages/admin/user-management'),
      ],
      '/admin/dashboard': [
        () => import('../pages/admin/analytics/financials'),
        () => import('../pages/admin/analytics/clients'),
      ],
      '/admin/analytics/financials': [
        () => import('../pages/admin/analytics/clients'),
        () => import('../pages/admin/analytics/users'),
      ],
    };

    const routesToPreload = preloadMap[currentRoute];
    if (routesToPreload) {
      routesToPreload.forEach(importFn => {
        setTimeout(() => {
          importFn().catch(() => {
            // Silently fail preloading
          });
        }, 1000);
      });
    }
  },
};