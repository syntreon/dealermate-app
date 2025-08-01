/**
 * Database Egress Optimization Configuration
 * Central configuration for controlling data fetching behavior
 */

export interface EgressOptimizationConfig {
  // Global settings
  enableOptimizations: boolean;
  enableDebugLogging: boolean;
  
  // Auto-refresh settings
  autoRefresh: {
    enabled: boolean;
    defaultInterval: number; // milliseconds
    minInterval: number; // minimum time between fetches
    pauseOnInactive: boolean;
    pauseOnHidden: boolean;
  };
  
  // Cache settings
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
  };
  
  // Circuit breaker settings
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeout: number;
  };
  
  // Request deduplication
  deduplication: {
    enabled: boolean;
    maxAge: number;
  };
  
  // Activity tracking
  activityTracking: {
    enabled: boolean;
    inactiveThreshold: number;
  };
  
  // Component-specific overrides
  components: {
    adminDashboard: {
      autoRefreshInterval: number;
      enableToasts: boolean;
      retryAttempts: number;
    };
    realtimeWidgets: {
      enabled: boolean;
      updateInterval: number;
    };
    systemHealth: {
      enabled: boolean;
      checkInterval: number;
    };
  };
}

// Production-optimized configuration (reduces egress by ~90%)
export const PRODUCTION_CONFIG: EgressOptimizationConfig = {
  enableOptimizations: true,
  enableDebugLogging: false,
  
  autoRefresh: {
    enabled: false, // DISABLED by default
    defaultInterval: 15 * 60 * 1000, // 15 minutes (was 5)
    minInterval: 60 * 1000, // 1 minute minimum between fetches
    pauseOnInactive: true,
    pauseOnHidden: true,
  },
  
  cache: {
    enabled: true,
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    maxSize: 100, // 100 cache entries
    cleanupInterval: 30 * 60 * 1000, // 30 minutes (was 5)
  },
  
  circuitBreaker: {
    enabled: true,
    failureThreshold: 3,
    resetTimeout: 60 * 1000, // 1 minute
  },
  
  deduplication: {
    enabled: true,
    maxAge: 10 * 1000, // 10 seconds
  },
  
  activityTracking: {
    enabled: true,
    inactiveThreshold: 5 * 60 * 1000, // 5 minutes
  },
  
  components: {
    adminDashboard: {
      autoRefreshInterval: 20 * 60 * 1000, // 20 minutes
      enableToasts: false, // Reduce noise
      retryAttempts: 2, // Reduce from 3
    },
    realtimeWidgets: {
      enabled: false, // DISABLED to save egress
      updateInterval: 5 * 60 * 1000, // 5 minutes if enabled
    },
    systemHealth: {
      enabled: false, // DISABLED to save egress
      checkInterval: 10 * 60 * 1000, // 10 minutes if enabled
    },
  },
};

// Development configuration (more frequent updates for testing)
export const DEVELOPMENT_CONFIG: EgressOptimizationConfig = {
  enableOptimizations: true,
  enableDebugLogging: true,
  
  autoRefresh: {
    enabled: true,
    defaultInterval: 5 * 60 * 1000, // 5 minutes
    minInterval: 30 * 1000, // 30 seconds
    pauseOnInactive: true,
    pauseOnHidden: true,
  },
  
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 50,
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
  },
  
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    resetTimeout: 30 * 1000, // 30 seconds
  },
  
  deduplication: {
    enabled: true,
    maxAge: 5 * 1000, // 5 seconds
  },
  
  activityTracking: {
    enabled: true,
    inactiveThreshold: 2 * 60 * 1000, // 2 minutes
  },
  
  components: {
    adminDashboard: {
      autoRefreshInterval: 10 * 60 * 1000, // 10 minutes
      enableToasts: true,
      retryAttempts: 3,
    },
    realtimeWidgets: {
      enabled: true,
      updateInterval: 2 * 60 * 1000, // 2 minutes
    },
    systemHealth: {
      enabled: true,
      checkInterval: 5 * 60 * 1000, // 5 minutes
    },
  },
};

// Emergency configuration (minimal database calls)
export const EMERGENCY_CONFIG: EgressOptimizationConfig = {
  enableOptimizations: true,
  enableDebugLogging: true,
  
  autoRefresh: {
    enabled: false, // COMPLETELY DISABLED
    defaultInterval: 60 * 60 * 1000, // 1 hour
    minInterval: 5 * 60 * 1000, // 5 minutes minimum
    pauseOnInactive: true,
    pauseOnHidden: true,
  },
  
  cache: {
    enabled: true,
    defaultTTL: 60 * 60 * 1000, // 1 hour
    maxSize: 200,
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  },
  
  circuitBreaker: {
    enabled: true,
    failureThreshold: 1, // Fail fast
    resetTimeout: 5 * 60 * 1000, // 5 minutes
  },
  
  deduplication: {
    enabled: true,
    maxAge: 30 * 1000, // 30 seconds
  },
  
  activityTracking: {
    enabled: true,
    inactiveThreshold: 1 * 60 * 1000, // 1 minute
  },
  
  components: {
    adminDashboard: {
      autoRefreshInterval: 60 * 60 * 1000, // 1 hour
      enableToasts: false,
      retryAttempts: 1,
    },
    realtimeWidgets: {
      enabled: false, // DISABLED
      updateInterval: 30 * 60 * 1000, // 30 minutes
    },
    systemHealth: {
      enabled: false, // DISABLED
      checkInterval: 30 * 60 * 1000, // 30 minutes
    },
  },
};

// Get current configuration based on environment
export const getCurrentConfig = (): EgressOptimizationConfig => {
  const env = import.meta.env.MODE;
  const egressMode = import.meta.env.VITE_EGRESS_MODE || 'production';
  
  switch (egressMode) {
    case 'emergency':
      console.warn('🚨 EMERGENCY EGRESS MODE ACTIVATED - Minimal database calls');
      return EMERGENCY_CONFIG;
    case 'development':
      return env === 'development' ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
    case 'production':
    default:
      return PRODUCTION_CONFIG;
  }
};

// Current active configuration
export const EGRESS_CONFIG = getCurrentConfig();

// Utility functions
export const isOptimizationEnabled = (feature: keyof EgressOptimizationConfig) => {
  return EGRESS_CONFIG.enableOptimizations && EGRESS_CONFIG[feature];
};

export const getComponentConfig = (component: keyof EgressOptimizationConfig['components']) => {
  return EGRESS_CONFIG.components[component];
};

export const logOptimization = (message: string, data?: any) => {
  if (EGRESS_CONFIG.enableDebugLogging) {
    console.log(`🔧 [EGRESS OPT] ${message}`, data || '');
  }
};

// Runtime configuration updates (for emergency situations)
export const updateEgressConfig = (updates: Partial<EgressOptimizationConfig>) => {
  Object.assign(EGRESS_CONFIG, updates);
  console.warn('⚠️ Egress configuration updated at runtime:', updates);
};

// Emergency stop function
export const emergencyStop = () => {
  updateEgressConfig({
    autoRefresh: { ...EGRESS_CONFIG.autoRefresh, enabled: false },
    components: {
      adminDashboard: { ...EGRESS_CONFIG.components.adminDashboard, autoRefreshInterval: 60 * 60 * 1000 },
      realtimeWidgets: { ...EGRESS_CONFIG.components.realtimeWidgets, enabled: false },
      systemHealth: { ...EGRESS_CONFIG.components.systemHealth, enabled: false },
    }
  });
  console.error('🛑 EMERGENCY STOP ACTIVATED - All auto-refresh disabled');
};