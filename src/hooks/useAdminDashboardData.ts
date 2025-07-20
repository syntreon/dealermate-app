import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardMetrics } from '@/types/dashboard';
import { Client, User } from '@/types/admin';
import { useDashboardMetrics } from './useDashboardMetrics';
import { DashboardService } from '@/services/dashboardService';
import { AdminService } from '@/services/adminService';
import { MetricsCalculationService, FinancialMetrics, ClientProfitability, GrowthTrends, CostBreakdown } from '@/services/metricsCalculationService';

export interface AdminDashboardData extends DashboardMetrics {
  // Financial data (NEW)
  financial: FinancialMetrics | null;
  clientProfitability: ClientProfitability[];
  costBreakdown: CostBreakdown | null;
  growthTrends: GrowthTrends | null;
  
  // Platform metrics (NEW)
  platformMetrics: {
    totalClients: number;
    activeClients: number;
    totalUsers: number;
    totalRevenue: number;
    platformCallVolume: number;
    platformLeadVolume: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
  } | null;
  
  // Client/User data (EXTEND EXISTING AdminService)
  clients: Client[];
  users: User[];
  
  // Distribution metrics
  clientDistribution: {
    byStatus: Array<{ status: string; count: number }>;
    bySubscriptionPlan: Array<{ plan: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  } | null;
  
  userAnalytics: {
    byRole: Array<{ role: string; count: number }>;
    activeToday: number;
    activeThisWeek: number;
    newThisMonth: number;
    recentActivity: Array<{ id: string; email: string; lastLogin: Date | null; role: string }>;
  } | null;
}

interface UseAdminDashboardDataOptions {
  autoRefreshInterval?: number; // in milliseconds, default 5 minutes
  enableAutoRefresh?: boolean;
}

export const useAdminDashboardData = (options: UseAdminDashboardDataOptions = {}) => {
  const { 
    autoRefreshInterval = 5 * 60 * 1000, // 5 minutes
    enableAutoRefresh = true 
  } = options;

  // Use existing dashboard metrics hook for basic functionality
  const { metrics: basicMetrics, isLoading: basicLoading, error: basicError } = useDashboardMetrics();
  
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();

  const fetchAdminData = useCallback(async () => {
    // Only fetch admin data if user is admin/owner
    if (!user || user.client_id !== null || !['admin', 'owner'].includes(user.role)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Fetch all admin-specific data in parallel with error handling
      const results = await Promise.allSettled([
        // Platform metrics
        DashboardService.getAdminPlatformMetrics(),
        
        // Client and user data
        AdminService.getClients(),
        AdminService.getUsers(),
        
        // Distribution metrics
        DashboardService.getClientDistributionMetrics(),
        DashboardService.getUserAnalytics(),
        
        // Financial calculations
        MetricsCalculationService.getFinancialMetrics(),
        MetricsCalculationService.getCostBreakdown(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          new Date()
        ),
        MetricsCalculationService.getClientProfitability(),
        MetricsCalculationService.getGrowthTrends(),
      ]);

      // Extract results with error handling
      const [
        platformMetricsResult,
        clientsResult,
        usersResult,
        clientDistributionResult,
        userAnalyticsResult,
        financialResult,
        costBreakdownResult,
        clientProfitabilityResult,
        growthTrendsResult,
      ] = results;

      // Combine with existing basic metrics
      const newAdminData: AdminDashboardData = {
        // Extend existing basic metrics
        ...(basicMetrics || {
          totalCalls: 0,
          averageHandleTime: '0s',
          callsTransferred: 0,
          totalLeads: 0,
          callsGrowth: 0,
          timeGrowth: 0,
          transferGrowth: 0,
          leadsGrowth: 0,
          agentStatus: { status: 'active', lastUpdated: new Date(), message: 'System operational' },
          systemMessages: []
        }),
        
        // Add admin-specific data
        platformMetrics: platformMetricsResult.status === 'fulfilled' ? platformMetricsResult.value : null,
        clients: clientsResult.status === 'fulfilled' ? clientsResult.value : [],
        users: usersResult.status === 'fulfilled' ? usersResult.value : [],
        clientDistribution: clientDistributionResult.status === 'fulfilled' ? clientDistributionResult.value : null,
        userAnalytics: userAnalyticsResult.status === 'fulfilled' ? userAnalyticsResult.value : null,
        financial: financialResult.status === 'fulfilled' ? financialResult.value : null,
        costBreakdown: costBreakdownResult.status === 'fulfilled' ? costBreakdownResult.value : null,
        clientProfitability: clientProfitabilityResult.status === 'fulfilled' ? clientProfitabilityResult.value : [],
        growthTrends: growthTrendsResult.status === 'fulfilled' ? growthTrendsResult.value : null,
      };

      setAdminData(newAdminData);
      setLastUpdated(new Date());

      // Track errors for individual sections
      const newErrors: Record<string, string> = {};
      const sectionNames = [
        'platformMetrics',
        'clients', 
        'users',
        'clientDistribution',
        'userAnalytics',
        'financial',
        'costBreakdown',
        'clientProfitability',
        'growthTrends'
      ];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const sectionName = sectionNames[index];
          newErrors[sectionName] = result.reason?.message || 'Unknown error';
          console.error(`Error fetching ${sectionName}:`, result.reason);
        }
      });

      setErrors(newErrors);

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }, [user, basicMetrics]);

  // Initial data fetch
  useEffect(() => {
    if (user && !basicLoading) {
      fetchAdminData();
    }
  }, [user, basicLoading, fetchAdminData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enableAutoRefresh || !user || user.client_id !== null || !['admin', 'owner'].includes(user.role)) {
      return;
    }

    const interval = setInterval(() => {
      // Only auto-refresh if the page is visible to conserve resources
      if (!document.hidden) {
        fetchAdminData();
      }
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, autoRefreshInterval, user, fetchAdminData]);

  // Pause auto-refresh when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enableAutoRefresh) {
        // Resume with a fresh fetch when page becomes visible
        fetchAdminData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableAutoRefresh, fetchAdminData]);

  // Manual refresh function
  const refetch = useCallback(() => {
    return fetchAdminData();
  }, [fetchAdminData]);

  // Check if user has admin access
  const hasAdminAccess = user && user.client_id === null && ['admin', 'owner'].includes(user.role);

  return { 
    data: adminData, 
    loading: loading || basicLoading, 
    errors: { 
      ...errors, 
      basic: basicError?.message 
    }, 
    refetch,
    lastUpdated,
    hasAdminAccess
  };
};

export default useAdminDashboardData;