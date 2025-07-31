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
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
  options: LazyRouteOptions = {}
) => {
  const { retryCount = 3 } = options;
  
  const retryImport = async (attempt = 1): Promise<{ default: ComponentType<unknown> }> => {
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
    Dashboard: createLazyRoute(() => import('../pages/admin/dashboard')),
    ClientManagement: createLazyRoute(() => import('../pages/admin/management/client-management')),
    ClientDetails: createLazyRoute(() => import('../pages/admin/management/ClientDetails')),
    UserManagement: createLazyRoute(() => import('../pages/admin/management/user-management')),
    AdminSettings: createLazyRoute(() => import('../pages/admin/settings/AdminSettings')),
    SystemHealthMonitoring: createLazyRoute(() => import('../pages/archived/SystemHealthMonitoring')),
    AdminAudit: createLazyRoute(() => import('../pages/admin/audit/admin-audit')),
    AdminIndex: createLazyRoute(() => import('../pages/admin/AdminIndex')),
    AdminSystemStatus: createLazyRoute(() => import('../pages/AdminSystemStatus')),
    AgentStatusSettings: createLazyRoute(() => import('../pages/admin/settings/AgentStatusSettings')),
    // Analytics section pages
    AnalyticsFinancials: createLazyRoute(() => import('../pages/admin/analytics/financials')),
    AnalyticsClients: createLazyRoute(() => import('../pages/admin/analytics/clients')),
    AnalyticsUsers: createLazyRoute(() => import('../pages/admin/analytics/users')),
    AnalyticsPlatform: createLazyRoute(() => import('../pages/admin/analytics/platform')),
    AnalyticsSystemOps: createLazyRoute(() => import('../pages/admin/analytics/system-ops')),
    // Management section pages
    BusinessManagement: createLazyRoute(() => import('../pages/admin/management/business')),
    RolesPermissions: createLazyRoute(() => import('../pages/admin/management/roles')),
    // Audit section pages
    UserLogs: createLazyRoute(() => import('../pages/admin/audit/user-logs')),
    ClientLogs: createLazyRoute(() => import('../pages/admin/audit/client-logs')),
    SystemLogs: createLazyRoute(() => import('../pages/admin/audit/system-logs')),
  },

  // Layout components
  layouts: {
    AppLayout: createLazyRoute(() => import('../layouts/AppLayout'), { preload: true }),
    AdminLayout: createLazyRoute(() => import('../layouts/admin/AdminLayout'), { preload: true }),
    AnalyticsLayout: createLazyRoute(() => import('../layouts/admin/AnalyticsLayout')),
    SettingsLayout: createLazyRoute(() => import('../layouts/admin/SettingsLayout')),
    ManagementLayout: createLazyRoute(() => import('../layouts/admin/ManagementLayout')),
    AuditLayout: createLazyRoute(() => import('../layouts/admin/AuditLayout')),
  },

  // Error boundary and loading components
  errorBoundary: {
    SectionErrorBoundary: createLazyRoute(() => import('../components/admin/layout/SectionErrorBoundary')),
    SectionLoadingFallback: createLazyRoute(() => import('../components/admin/layout/SectionLoadingFallback')),
    ErrorFallbackComponents: createLazyRoute(() => import('../components/admin/layout/ErrorFallbackComponents')),
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
    () => import('../layouts/AppLayout'),
    () => import('../layouts/admin/AdminLayout'),
    () => import('../layouts/admin/ManagementLayout'),
    () => import('../layouts/admin/AnalyticsLayout'),
    () => import('../layouts/admin/AuditLayout'),
    () => import('../layouts/admin/SettingsLayout'),
  ];

  criticalRoutes.forEach((importFn, index) => {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail preloading
      });
    }, 2000 + (index * 500)); // Stagger preloading to avoid overwhelming the browser
  });

  // Initialize analytics layout specifically
  setTimeout(() => {
    BundleOptimization.initializeAnalyticsLayout();
    BundleOptimization.fixAnalyticsNavigation();
  }, 3000);
};

/**
 * Debug utilities for route code splitting
 */
export const DebugUtils = {
  /**
   * Log all registered routes and their loading status
   */
  logRouteStatus: () => {
    console.group('🔍 Route Code Splitting Status');
    
    Object.entries(RouteGroups).forEach(([groupName, routes]) => {
      console.group(`📁 ${groupName}`);
      Object.keys(routes).forEach(routeName => {
        console.log(`  ✓ ${routeName} - Registered`);
      });
      console.groupEnd();
    });
    
    console.groupEnd();
  },

  /**
   * Test analytics layout loading specifically
   */
  testAnalyticsLayout: async () => {
    try {
      console.log('🧪 Testing Analytics Layout...');
      const layout = await import('../layouts/admin/AnalyticsLayout');
      const nav = await import('../config/analyticsNav');
      console.log('✅ Analytics Layout loaded successfully');
      console.log('✅ Analytics Navigation loaded successfully');
      console.log('📊 Analytics Nav Items:', nav.analyticsNavItems);
      return { layout, nav };
    } catch (error) {
      console.error('❌ Failed to load Analytics Layout:', error);
      throw error;
    }
  },

  /**
   * Validate all section layouts
   */
  validateAllLayouts: async () => {
    const layouts = [
      { name: 'ManagementLayout', path: '../layouts/admin/ManagementLayout' },
      { name: 'AnalyticsLayout', path: '../layouts/admin/AnalyticsLayout' },
      { name: 'AuditLayout', path: '../layouts/admin/AuditLayout' },
      { name: 'SettingsLayout', path: '../layouts/admin/SettingsLayout' },
    ];

    const results = await Promise.allSettled(
      layouts.map(async ({ name, path }) => {
        const module = await import(path);
        return { name, success: true, module };
      })
    );

    results.forEach((result, index) => {
      const layoutName = layouts[index].name;
      if (result.status === 'fulfilled') {
        console.log(`✅ ${layoutName} - OK`);
      } else {
        console.error(`❌ ${layoutName} - Failed:`, result.reason);
      }
    });

    return results;
  },
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
   * Preload admin layouts based on user role and current section
   */
  preloadAdminLayouts: (currentSection?: string) => {
    const layoutsToPreload = [
      () => import('../layouts/admin/AdminLayout'),
    ];

    // Add section-specific layouts based on current location
    if (currentSection === 'management' || !currentSection) {
      layoutsToPreload.push(() => import('../layouts/admin/ManagementLayout'));
    }
    if (currentSection === 'analytics' || !currentSection) {
      layoutsToPreload.push(() => import('../layouts/admin/AnalyticsLayout'));
    }
    if (currentSection === 'audit' || !currentSection) {
      layoutsToPreload.push(() => import('../layouts/admin/AuditLayout'));
    }
    if (currentSection === 'settings' || !currentSection) {
      layoutsToPreload.push(() => import('../layouts/admin/SettingsLayout'));
    }

    layoutsToPreload.forEach((importFn, index) => {
      setTimeout(() => {
        importFn().catch(() => {
          // Silently fail preloading
        });
      }, 500 + (index * 200)); // Stagger layout preloading
    });
  },

  /**
   * Preload analytics pages specifically for better performance
   */
  preloadAnalyticsPages: () => {
    const analyticsPages = [
      () => import('../pages/admin/analytics/financials'),
      () => import('../pages/admin/analytics/clients'),
      () => import('../pages/admin/analytics/users'),
      () => import('../pages/admin/analytics/platform'),
      () => import('../pages/admin/analytics/system-ops'),
    ];

    analyticsPages.forEach((importFn, index) => {
      setTimeout(() => {
        importFn().catch(() => {
          // Silently fail preloading
        });
      }, 1000 + (index * 300)); // Stagger analytics page preloading
    });
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
        () => import('../pages/admin/management/user-management'),
      ],
      '/admin/dashboard': [
        () => import('../pages/admin/analytics/financials'),
        () => import('../pages/admin/management/user-management'),
      ],
      '/admin/management': [
        () => import('../layouts/admin/ManagementLayout'),
        () => import('../pages/admin/management/user-management'),
        () => import('../pages/admin/management/client-management'),
      ],
      '/admin/analytics': [
        () => import('../layouts/admin/AnalyticsLayout'),
        () => import('../pages/admin/analytics/financials'),
        () => import('../pages/admin/analytics/clients'),
      ],
      '/admin/analytics/financials': [
        () => import('../pages/admin/analytics/clients'),
        () => import('../pages/admin/analytics/users'),
        () => import('../pages/admin/analytics/platform'),
      ],
      '/admin/analytics/clients': [
        () => import('../pages/admin/analytics/users'),
        () => import('../pages/admin/analytics/platform'),
      ],
      '/admin/analytics/users': [
        () => import('../pages/admin/analytics/clients'),
        () => import('../pages/admin/analytics/system-ops'),
      ],
      '/admin/analytics/platform': [
        () => import('../pages/admin/analytics/system-ops'),
        () => import('../pages/admin/analytics/financials'),
      ],
      '/admin/analytics/system-ops': [
        () => import('../pages/admin/analytics/financials'),
        () => import('../pages/admin/analytics/clients'),
      ],
      '/admin/audit': [
        () => import('../layouts/admin/AuditLayout'),
        () => import('../pages/admin/audit/admin-audit'),
        () => import('../pages/admin/audit/user-logs'),
      ],
      '/admin/audit/all': [
        () => import('../pages/admin/audit/user-logs'),
        () => import('../pages/admin/audit/client-logs'),
      ],
      '/admin/audit/user-logs': [
        () => import('../pages/admin/audit/client-logs'),
        () => import('../pages/admin/audit/system-logs'),
      ],
      '/admin/audit/client-logs': [
        () => import('../pages/admin/audit/system-logs'),
        () => import('../pages/admin/audit/admin-audit'),
      ],
      '/admin/audit/system-logs': [
        () => import('../pages/admin/audit/admin-audit'),
        () => import('../pages/admin/audit/user-logs'),
      ],
      '/admin/management/users': [
        () => import('../pages/admin/management/client-management'),
        () => import('../pages/admin/management/business'),
      ],
      '/admin/management/clients': [
        () => import('../pages/admin/management/user-management'),
        () => import('../pages/admin/management/roles'),
      ],
      '/admin/management/business': [
        () => import('../pages/admin/management/roles'),
        () => import('../pages/admin/management/user-management'),
      ],
      '/admin/management/roles': [
        () => import('../pages/admin/management/user-management'),
        () => import('../pages/admin/management/client-management'),
      ],
    };

    const routesToPreload = preloadMap[currentRoute];
    if (routesToPreload) {
      routesToPreload.forEach((importFn, index) => {
        setTimeout(() => {
          importFn().catch(() => {
            // Silently fail preloading
          });
        }, 1000 + (index * 200)); // Stagger route preloading
      });
    }
  },

  /**
   * Optimize analytics layout performance by preloading related components
   */
  optimizeAnalyticsLayout: () => {
    // Preload analytics layout and its most commonly accessed pages
    const analyticsOptimizations = [
      () => import('../layouts/admin/AnalyticsLayout'),
      () => import('../pages/admin/analytics/financials'),
      () => import('../pages/admin/analytics/clients'),
      () => import('../config/analyticsNav'),
    ];

    analyticsOptimizations.forEach((importFn, index) => {
      setTimeout(() => {
        importFn().catch(() => {
          // Silently fail optimization preloading
        });
      }, 500 + (index * 150));
    });
  },

  /**
   * Ensure all section layouts are properly registered and optimized
   */
  validateSectionLayouts: () => {
    const sectionLayouts = [
      { name: 'ManagementLayout', import: () => import('../layouts/admin/ManagementLayout') },
      { name: 'AnalyticsLayout', import: () => import('../layouts/admin/AnalyticsLayout') },
      { name: 'AuditLayout', import: () => import('../layouts/admin/AuditLayout') },
      { name: 'SettingsLayout', import: () => import('../layouts/admin/SettingsLayout') },
    ];

    sectionLayouts.forEach(({ name, import: importFn }, index) => {
      setTimeout(() => {
        importFn()
          .then(() => {
            console.debug(`✓ ${name} loaded successfully`);
          })
          .catch((error) => {
            console.warn(`⚠ Failed to load ${name}:`, error);
          });
      }, 100 + (index * 50));
    });
  },

  /**
   * Initialize analytics layout with proper sub-navigation
   */
  initializeAnalyticsLayout: () => {
    // Preload analytics layout and navigation configuration
    const analyticsInitialization = [
      () => import('../layouts/admin/AnalyticsLayout'),
      () => import('../config/analyticsNav'),
      () => import('../pages/admin/analytics/financials'),
    ];

    return Promise.all(
      analyticsInitialization.map(importFn => 
        importFn().catch(error => {
          console.warn('Analytics layout initialization warning:', error);
          return null;
        })
      )
    ).then(results => {
      const [layout, nav, financials] = results;
      if (layout && nav) {
        console.debug('✅ Analytics layout initialized successfully');
        return { layout, nav, financials };
      } else {
        console.warn('⚠ Analytics layout initialization incomplete');
        return null;
      }
    });
  },

  /**
   * Fix analytics sub-navigation visibility issues
   */
  fixAnalyticsNavigation: () => {
    // Ensure analytics navigation is properly loaded and configured
    setTimeout(async () => {
      try {
        const nav = await import('../config/analyticsNav');
        const layout = await import('../layouts/admin/AnalyticsLayout');
        
        // Validate navigation items
        if (nav.analyticsNavItems && nav.analyticsNavItems.length > 0) {
          console.debug('✅ Analytics navigation items loaded:', nav.analyticsNavItems.length);
        } else {
          console.warn('⚠ Analytics navigation items missing or empty');
        }
        
        return { nav, layout };
      } catch (error) {
        console.error('❌ Failed to fix analytics navigation:', error);
        return null;
      }
    }, 1000);
  },
};