import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardMetrics } from '@/types/dashboard';
import { Client, User } from '@/types/admin';
import { DashboardService } from '@/services/dashboardService';
import { AdminService } from '@/services/adminService';
import { MetricsCalculationService, FinancialMetrics, CostBreakdown, ClientProfitability, GrowthTrends } from '@/services/metricsCalculationService';
import { useToast } from '@/hooks/use-toast';
import { adminDashboardCache, CACHE_KEYS, CACHE_TAGS, CacheInvalidation } from '@/services/cacheService';
import { AdminDashboardData, AdminDashboardState, UseAdminDashboardDataOptions } from './useAdminDashboardData';

// Cache TTL configurations for different data types
const CACHE_TTL = {
  DASHBOARD_METRICS: 2 * 60 * 1000,    // 2 minutes - frequently changing
  PLATFORM_METRICS: 5 * 60 * 1000,     // 5 minutes - moderately changing
  FINANCIAL_METRICS: 10 * 60 * 1000,   // 10 minutes - less frequently changing
  COST_BREAKDOWN: 10 * 60 * 1000,      // 10 minutes
  CLIENT_PROFITABILITY: 15 * 60 * 1000, // 15 minutes
  GROWTH_TRENDS: 30 * 60 * 1000,       // 30 minutes - rarely changing
  CLIENTS: 5 * 60 * 1000,              // 5 minutes
  USERS: 5 * 60 * 1000,                // 5 minutes
  CLIENT_DISTRIBUTION: 10 * 60 * 1000,  // 10 minutes
  USER_ANALYTICS: 10 * 60 * 1000,      // 10 minutes
} as const;

// Cache-aware data fetching functions
const createCachedFetcher = <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number,
  tags: string[] = []
) => {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = adminDashboardCache.get<T>(cacheKey);
    if (cached !== null) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    console.log(`Cache miss for ${cacheKey}, fetching...`);
    
    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache
    adminDashboardCache.set(cacheKey, data, {
      ttl,
      tags,
      persist: true
    });
    
    return data;
  };
};

export const useCachedAdminDashboardData = (options: UseAdminDashboardDataOptions = {}) => {
  const {
    clientId,
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    enableToasts = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize state
  const [state, setState] = useState<AdminDashboardState>({
    data: {
      dashboardMetrics: null,
      platformMetrics: null,
      financialMetrics: null,
      costBreakdown: null,
      clientProfitability: [],
      growthTrends: null,
      clients: [],
      users: [],
      clientDistribution: null,
      userAnalytics: null,
    },
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
    loadingStates: {
      dashboardMetrics: false,
      platformMetrics: false,
      financialMetrics: false,
      costBreakdown: false,
      clientProfitability: false,
      growthTrends: false,
      clients: false,
      users: false,
      clientDistribution: false,
      userAnalytics: false,
    },
    errors: {
      dashboardMetrics: null,
      platformMetrics: null,
      financialMetrics: null,
      costBreakdown: null,
      clientProfitability: null,
      growthTrends: null,
      clients: null,
      users: null,
      clientDistribution: null,
      userAnalytics: null,
    }
  });

  // Helper function to update loading state for a specific section
  const setLoadingState = useCallback((section: keyof AdminDashboardState['loadingStates'], loading: boolean) => {
    setState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [section]: loading
      }
    }));
  }, []);

  // Helper function to update error state for a specific section
  const setErrorState = useCallback((section: keyof AdminDashboardState['errors'], error: Error | null) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [section]: error
      }
    }));
  }, []);

  // Helper function to update data for a specific section
  const updateSectionData = useCallback(<K extends keyof AdminDashboardData>(
    section: K,
    data: AdminDashboardData[K]
  ) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [section]: data
      }
    }));
  }, []);

  // Retry mechanism with exponential backoff
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    sectionName: string,
    attempt: number = 1
  ): Promise<any> => {
    try {
      return await operation();
    } catch (error) {
      if (attempt < retryAttempts) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(async () => {
            retryTimeoutsRef.current.delete(sectionName);
            try {
              const result = await retryWithBackoff(operation, sectionName, attempt + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
          
          retryTimeoutsRef.current.set(sectionName, timeoutId);
        });
      }
      throw error;
    }
  }, [retryAttempts, retryDelay]);

  // Create cached fetchers for each data type
  const cachedFetchers = {
    dashboardMetrics: useCallback(() => {
      const isAdminUser = user && (
        user.client_id === null && 
        (user.role === 'admin' || user.role === 'owner')
      );
      const effectiveClientId = isAdminUser ? clientId : (user?.client_id || null);
      
      return createCachedFetcher(
        `${CACHE_KEYS.DASHBOARD_METRICS}_${effectiveClientId || 'all'}`,
        () => DashboardService.getDashboardMetrics(effectiveClientId),
        CACHE_TTL.DASHBOARD_METRICS,
        [CACHE_TAGS.METRICS]
      )();
    }, [user, clientId]),

    platformMetrics: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.PLATFORM_METRICS,
        () => DashboardService.getAdminPlatformMetrics(),
        CACHE_TTL.PLATFORM_METRICS,
        [CACHE_TAGS.METRICS, CACHE_TAGS.SYSTEM]
      )();
    }, []),

    financialMetrics: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.FINANCIAL_METRICS,
        () => MetricsCalculationService.getFinancialMetrics('current_month'),
        CACHE_TTL.FINANCIAL_METRICS,
        [CACHE_TAGS.FINANCIAL, CACHE_TAGS.METRICS]
      )();
    }, []),

    costBreakdown: useCallback(() => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      return createCachedFetcher(
        `${CACHE_KEYS.COST_BREAKDOWN}_${startDate.getTime()}_${endDate.getTime()}`,
        () => MetricsCalculationService.getCostBreakdown(startDate, endDate),
        CACHE_TTL.COST_BREAKDOWN,
        [CACHE_TAGS.FINANCIAL, CACHE_TAGS.METRICS]
      )();
    }, []),

    clientProfitability: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.CLIENT_PROFITABILITY,
        () => MetricsCalculationService.getClientProfitability('current_month'),
        CACHE_TTL.CLIENT_PROFITABILITY,
        [CACHE_TAGS.FINANCIAL, CACHE_TAGS.CLIENTS, CACHE_TAGS.METRICS]
      )();
    }, []),

    growthTrends: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.GROWTH_TRENDS,
        () => MetricsCalculationService.getGrowthTrends(),
        CACHE_TTL.GROWTH_TRENDS,
        [CACHE_TAGS.METRICS]
      )();
    }, []),

    clients: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.CLIENTS,
        () => AdminService.getClients(),
        CACHE_TTL.CLIENTS,
        [CACHE_TAGS.CLIENTS]
      )();
    }, []),

    users: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.USERS,
        () => AdminService.getUsers(),
        CACHE_TTL.USERS,
        [CACHE_TAGS.USERS]
      )();
    }, []),

    clientDistribution: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.CLIENT_DISTRIBUTION,
        () => DashboardService.getClientDistributionMetrics(),
        CACHE_TTL.CLIENT_DISTRIBUTION,
        [CACHE_TAGS.CLIENTS, CACHE_TAGS.METRICS]
      )();
    }, []),

    userAnalytics: useCallback(() => {
      return createCachedFetcher(
        CACHE_KEYS.USER_ANALYTICS,
        () => DashboardService.getUserAnalytics(),
        CACHE_TTL.USER_ANALYTICS,
        [CACHE_TAGS.USERS, CACHE_TAGS.METRICS]
      )();
    }, [])
  };

  // Individual data fetching functions with caching
  const fetchDashboardMetrics = useCallback(async () => {
    setLoadingState('dashboardMetrics', true);
    setErrorState('dashboardMetrics', null);
    
    try {
      const metrics = await retryWithBackoff(
        cachedFetchers.dashboardMetrics,
        'dashboardMetrics'
      );
      
      updateSectionData('dashboardMetrics', metrics);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch dashboard metrics');
      setErrorState('dashboardMetrics', err);
      
      if (enableToasts) {
        toast({
          title: 'Error Loading Dashboard Metrics',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingState('dashboardMetrics', false);
    }
  }, [cachedFetchers.dashboardMetrics, retryWithBackoff, setLoadingState, setErrorState, updateSectionData, enableToasts, toast]);

  const fetchPlatformMetrics = useCallback(async () => {
    setLoadingState('platformMetrics', true);
    setErrorState('platformMetrics', null);
    
    try {
      const metrics = await retryWithBackoff(
        cachedFetchers.platformMetrics,
        'platformMetrics'
      );
      
      updateSectionData('platformMetrics', metrics);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to fetch platform metrics');
      setErrorState('platformMetrics', err);
      
      if (enableToasts) {
        toast({
          title: 'Error Loading Platform Metrics',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingState('platformMetrics', false);
    }
  }, [cachedFetchers.platformMetrics, retryWithBackoff, setLoadingState, setErrorState, updateSectionData, enableToasts, toast]);

  const fetchFinancialData = useCallback(async () => {
    // Fetch financial metrics, cost breakdown, client profitability, and growth trends in parallel
    const fetchFinancialMetrics = async () => {
      setLoadingState('financialMetrics', true);
      setErrorState('financialMetrics', null);
      
      try {
        const metrics = await retryWithBackoff(
          cachedFetchers.financialMetrics,
          'financialMetrics'
        );
        updateSectionData('financialMetrics', metrics);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch financial metrics');
        setErrorState('financialMetrics', err);
      } finally {
        setLoadingState('financialMetrics', false);
      }
    };

    const fetchCostBreakdown = async () => {
      setLoadingState('costBreakdown', true);
      setErrorState('costBreakdown', null);
      
      try {
        const breakdown = await retryWithBackoff(
          cachedFetchers.costBreakdown,
          'costBreakdown'
        );
        updateSectionData('costBreakdown', breakdown);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch cost breakdown');
        setErrorState('costBreakdown', err);
      } finally {
        setLoadingState('costBreakdown', false);
      }
    };

    const fetchClientProfitability = async () => {
      setLoadingState('clientProfitability', true);
      setErrorState('clientProfitability', null);
      
      try {
        const profitability = await retryWithBackoff(
          cachedFetchers.clientProfitability,
          'clientProfitability'
        );
        updateSectionData('clientProfitability', profitability);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch client profitability');
        setErrorState('clientProfitability', err);
      } finally {
        setLoadingState('clientProfitability', false);
      }
    };

    const fetchGrowthTrends = async () => {
      setLoadingState('growthTrends', true);
      setErrorState('growthTrends', null);
      
      try {
        const trends = await retryWithBackoff(
          cachedFetchers.growthTrends,
          'growthTrends'
        );
        updateSectionData('growthTrends', trends);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch growth trends');
        setErrorState('growthTrends', err);
      } finally {
        setLoadingState('growthTrends', false);
      }
    };

    // Execute all financial data fetching in parallel
    await Promise.allSettled([
      fetchFinancialMetrics(),
      fetchCostBreakdown(),
      fetchClientProfitability(),
      fetchGrowthTrends()
    ]);
  }, [
    cachedFetchers.financialMetrics,
    cachedFetchers.costBreakdown,
    cachedFetchers.clientProfitability,
    cachedFetchers.growthTrends,
    retryWithBackoff,
    setLoadingState,
    setErrorState,
    updateSectionData
  ]);

  const fetchClientsAndUsers = useCallback(async () => {
    const fetchClients = async () => {
      setLoadingState('clients', true);
      setErrorState('clients', null);
      
      try {
        const clients = await retryWithBackoff(
          cachedFetchers.clients,
          'clients'
        );
        updateSectionData('clients', clients);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch clients');
        setErrorState('clients', err);
      } finally {
        setLoadingState('clients', false);
      }
    };

    const fetchUsers = async () => {
      setLoadingState('users', true);
      setErrorState('users', null);
      
      try {
        const users = await retryWithBackoff(
          cachedFetchers.users,
          'users'
        );
        updateSectionData('users', users);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch users');
        setErrorState('users', err);
      } finally {
        setLoadingState('users', false);
      }
    };

    // Execute both in parallel
    await Promise.allSettled([fetchClients(), fetchUsers()]);
  }, [
    cachedFetchers.clients,
    cachedFetchers.users,
    retryWithBackoff,
    setLoadingState,
    setErrorState,
    updateSectionData
  ]);

  const fetchDistributionMetrics = useCallback(async () => {
    const fetchClientDistribution = async () => {
      setLoadingState('clientDistribution', true);
      setErrorState('clientDistribution', null);
      
      try {
        const distribution = await retryWithBackoff(
          cachedFetchers.clientDistribution,
          'clientDistribution'
        );
        updateSectionData('clientDistribution', distribution);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch client distribution');
        setErrorState('clientDistribution', err);
      } finally {
        setLoadingState('clientDistribution', false);
      }
    };

    const fetchUserAnalytics = async () => {
      setLoadingState('userAnalytics', true);
      setErrorState('userAnalytics', null);
      
      try {
        const analytics = await retryWithBackoff(
          cachedFetchers.userAnalytics,
          'userAnalytics'
        );
        updateSectionData('userAnalytics', analytics);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch user analytics');
        setErrorState('userAnalytics', err);
      } finally {
        setLoadingState('userAnalytics', false);
      }
    };

    // Execute both in parallel
    await Promise.allSettled([fetchClientDistribution(), fetchUserAnalytics()]);
  }, [
    cachedFetchers.clientDistribution,
    cachedFetchers.userAnalytics,
    retryWithBackoff,
    setLoadingState,
    setErrorState,
    updateSectionData
  ]);

  // Main data fetching function
  const fetchAllData = useCallback(async (isRefresh = false) => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: !isRefresh,
      isRefreshing: isRefresh,
      error: null
    }));

    try {
      // Check if user is admin/owner
      const isAdminUser = user && (
        user.client_id === null && 
        (user.role === 'admin' || user.role === 'owner')
      );

      if (!isAdminUser) {
        throw new Error('Insufficient permissions for admin dashboard');
      }

      // If refreshing, invalidate relevant cache entries
      if (isRefresh) {
        CacheInvalidation.smartInvalidate('all');
      }

      // Fetch all data sections in parallel for better performance
      await Promise.allSettled([
        fetchDashboardMetrics(),
        fetchPlatformMetrics(),
        fetchFinancialData(),
        fetchClientsAndUsers(),
        fetchDistributionMetrics()
      ]);

      setState(prev => ({
        ...prev,
        lastUpdated: new Date(),
        error: null
      }));

      if (enableToasts && isRefresh) {
        toast({
          title: 'Dashboard Refreshed',
          description: 'All data has been updated successfully.',
          variant: 'default',
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load admin dashboard data');
      setState(prev => ({
        ...prev,
        error: err
      }));

      if (enableToasts) {
        toast({
          title: 'Error Loading Dashboard',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false
      }));
    }
  }, [
    user,
    fetchDashboardMetrics,
    fetchPlatformMetrics,
    fetchFinancialData,
    fetchClientsAndUsers,
    fetchDistributionMetrics,
    enableToasts,
    toast
  ]);

  // Manual refresh function with cache invalidation
  const refresh = useCallback((invalidateCache = true) => {
    if (invalidateCache) {
      CacheInvalidation.smartInvalidate('all');
    }
    fetchAllData(true);
  }, [fetchAllData]);

  // Retry specific section with cache invalidation
  const retrySection = useCallback(async (section: keyof AdminDashboardState['loadingStates']) => {
    // Invalidate cache for the specific section
    switch (section) {
      case 'dashboardMetrics':
        adminDashboardCache.clearByTags([CACHE_TAGS.METRICS]);
        await fetchDashboardMetrics();
        break;
      case 'platformMetrics':
        adminDashboardCache.clearByTags([CACHE_TAGS.SYSTEM, CACHE_TAGS.METRICS]);
        await fetchPlatformMetrics();
        break;
      case 'financialMetrics':
      case 'costBreakdown':
      case 'clientProfitability':
      case 'growthTrends':
        adminDashboardCache.clearByTags([CACHE_TAGS.FINANCIAL, CACHE_TAGS.METRICS]);
        await fetchFinancialData();
        break;
      case 'clients':
      case 'users':
        adminDashboardCache.clearByTags([CACHE_TAGS.CLIENTS, CACHE_TAGS.USERS]);
        await fetchClientsAndUsers();
        break;
      case 'clientDistribution':
      case 'userAnalytics':
        adminDashboardCache.clearByTags([CACHE_TAGS.CLIENTS, CACHE_TAGS.USERS, CACHE_TAGS.METRICS]);
        await fetchDistributionMetrics();
        break;
    }
  }, [
    fetchDashboardMetrics,
    fetchPlatformMetrics,
    fetchFinancialData,
    fetchClientsAndUsers,
    fetchDistributionMetrics
  ]);

  // Initial data fetch
  useEffect(() => {
    if (!isAuthLoading && user && user.id && user.role) {
      fetchAllData();
    }
    
    if (!isAuthLoading && !user) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, clientId, isAuthLoading, fetchAllData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && !state.isLoading && state.lastUpdated) {
      refreshIntervalRef.current = setInterval(() => {
        fetchAllData(true);
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, state.isLoading, state.lastUpdated, fetchAllData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Clear retry timeouts
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current.clear();
      
      // Abort ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    retrySection,
    
    // Computed values
    hasAnyData: Object.values(state.data).some(value => 
      value !== null && (Array.isArray(value) ? value.length > 0 : true)
    ),
    hasAnyErrors: Object.values(state.errors).some(error => error !== null),
    isAnyLoading: Object.values(state.loadingStates).some(loading => loading),
    
    // Section-specific helpers
    getSectionState: (section: keyof AdminDashboardState['loadingStates']) => ({
      isLoading: state.loadingStates[section],
      error: state.errors[section],
      data: state.data[section as keyof AdminDashboardData],
      retry: () => retrySection(section)
    }),

    // Cache-specific methods
    getCacheStats: () => adminDashboardCache.getStats(),
    clearCache: () => adminDashboardCache.clear(),
    invalidateCache: (type: 'client' | 'user' | 'financial' | 'system' | 'all') => {
      CacheInvalidation.smartInvalidate(type);
    }
  };
};

export default useCachedAdminDashboardData;