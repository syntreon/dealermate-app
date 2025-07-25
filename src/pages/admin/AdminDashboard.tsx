import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Import new modular components
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';
import { BusinessMetrics } from '@/components/admin/dashboard/BusinessMetrics';
import { TabLoadingSkeleton } from '@/components/admin/dashboard/TabLoadingSkeleton';
import TabErrorBoundary from '@/components/admin/dashboard/TabErrorBoundary';
import ErrorFallback from '@/components/admin/dashboard/ErrorFallback';
import PartialDataProvider from '@/components/admin/dashboard/PartialDataProvider';

// Lazy load tab components for better performance
const FinancialTab = React.lazy(() => import('@/components/admin/dashboard/tabs/FinancialTab').then(m => ({ default: m.FinancialTab })));
const ClientsTab = React.lazy(() => import('@/components/admin/dashboard/tabs/ClientsTab').then(m => ({ default: m.ClientsTab })));
const UsersTab = React.lazy(() => import('@/components/admin/dashboard/tabs/UsersTab').then(m => ({ default: m.UsersTab })));
const SystemTab = React.lazy(() => import('@/components/admin/dashboard/tabs/SystemTab').then(m => ({ default: m.SystemTab })));
const OperationsTab = React.lazy(() => import('@/components/admin/dashboard/tabs/OperationsTab').then(m => ({ default: m.OperationsTab })));

// Import existing services (will be extended in later tasks)
import { AdminService } from '@/services/adminService';
import { AgentStatusService } from '@/services/agentStatusService';
import { SystemMessageService } from '@/services/systemMessageService';
import { MetricsCalculationService } from '@/services/metricsCalculationService';
import { Client, User, SystemMessage, AgentStatus } from '@/types/admin';
import { formatNumber, formatCurrency } from '@/utils/formatting';

interface DashboardMetrics {
  // Basic counts
  totalClients: number;
  activeClients: number;
  totalUsers: number;
  totalCalls: number;
  totalLeads: number;

  // Financial metrics
  totalRevenue: number;
  totalAiCosts: number;
  totalMiscCosts: number;
  totalProfit: number;
  avgProfitMargin: number;

  // Operational metrics
  avgCallDuration: number;
  conversionRate: number;
  systemHealth: 'healthy' | 'degraded' | 'down';

  // Cost breakdown
  costBreakdown: {
    aiCosts: number;
    miscCosts: number;
    partnerSplits: number;
    findersFees: number;
  };

  // Client profitability
  clientProfitability: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    status: string;
  }>;

  // User analytics
  userAnalytics: {
    byRole: Record<string, number>;
    activeToday: number;
    newThisMonth: number;
    churnRate: number;
  };

  // System resources
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    storageUsage: number;
    apiCallsToday: number;
    apiLimitUtilization: number;
  };

  // Growth trends
  growthTrends: {
    clientGrowth: number;
    revenueGrowth: number;
    costGrowth: number;
    profitGrowth: number;
  };

  // Data collections
  recentClients: Client[];
  recentUsers: User[];
  systemMessages: SystemMessage[];
  agentStatuses: AgentStatus[];
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Tab options following Analytics page pattern
  const tabOptions = [
    { id: 'financial', label: 'Financial Analysis', shortLabel: 'Financial' },
    { id: 'clients', label: 'Client Analytics', shortLabel: 'Clients' },
    { id: 'users', label: 'User Analytics', shortLabel: 'Users' },
    { id: 'system', label: 'System Health', shortLabel: 'System' },
    { id: 'operations', label: 'Operations', shortLabel: 'Operations' }
  ];
  
  // Handle tab scrolling on mobile
  const scrollToTab = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    
    const scrollAmount = direction === 'left' ? -120 : 120;
    tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load all data in parallel
      const [
        clients,
        users,
        systemMessagesResponse,
        agentStatusSummary,
        systemHealth
      ] = await Promise.all([
        AdminService.getClients(),
        AdminService.getUsers(),
        SystemMessageService.getSystemMessages(),
        AgentStatusService.getAgentStatusSummary(),
        AdminService.getSystemHealth()
      ]);

      const agentStatuses = agentStatusSummary.statuses;
      const systemMessages = systemMessagesResponse.data;

      // Basic counts
      const totalClients = clients.length;
      const activeClients = clients.filter(c => c.status === 'active').length;
      const totalUsers = users.length;

      // Calculate call and lead totals from client metrics
      const totalCalls = clients.reduce((sum, client) => sum + (client.metrics?.totalCalls || 0), 0);
      const totalLeads = clients.reduce((sum, client) => sum + (client.metrics?.totalLeads || 0), 0);

      // Get real financial calculations from MetricsCalculationService
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const [financialMetrics, costBreakdown, clientProfitability] = await Promise.all([
        MetricsCalculationService.getFinancialMetrics('current_month'),
        MetricsCalculationService.getCostBreakdown(startDate, endDate),
        MetricsCalculationService.getClientProfitability()
      ]);

      const totalRevenue = financialMetrics.totalRevenue;
      const totalCosts = costBreakdown.totalCosts;
      const totalProfit = financialMetrics.netProfit;
      const avgProfitMargin = financialMetrics.profitMargin;

      // User analytics
      const usersByRole = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = users.filter(user =>
        user.last_login_at && new Date(user.last_login_at) >= today
      ).length;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const newThisMonth = users.filter(user =>
        new Date(user.created_at) >= thisMonth
      ).length;

      const userAnalytics = {
        byRole: usersByRole,
        activeToday,
        newThisMonth,
        churnRate: 0 // Would need historical data to calculate properly
      };

      // Mock system resources (in production, these would come from monitoring APIs)
      const systemResources = {
        cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
        memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
        storageUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
        apiCallsToday: totalCalls,
        apiLimitUtilization: Math.min((totalCalls / 10000) * 100, 100) // Assuming 10k daily limit
      };

      // Get real growth trends
      const growthTrends = await MetricsCalculationService.getGrowthTrends();

      // Calculate average call duration
      const callDurations = clients
        .map(c => c.metrics?.avgCallDuration || 0)
        .filter(d => d > 0);
      const avgCallDuration = callDurations.length > 0
        ? Math.round(callDurations.reduce((sum, d) => sum + d, 0) / callDurations.length)
        : 0;

      // Calculate conversion rate
      const conversionRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;

      // Get recent clients and users
      const recentClients = clients
        .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
        .slice(0, 5);

      const recentUsers = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setMetrics({
        totalClients,
        activeClients,
        totalUsers,
        totalCalls,
        totalLeads,
        totalRevenue,
        totalAiCosts: costBreakdown.aiCosts,
        totalMiscCosts: costBreakdown.toolCosts,
        totalProfit,
        avgProfitMargin,
        avgCallDuration,
        conversionRate,
        systemHealth: systemHealth.status,
        costBreakdown: {
          aiCosts: costBreakdown.aiCosts,
          miscCosts: costBreakdown.toolCosts,
          partnerSplits: costBreakdown.partnerSplits,
          findersFees: costBreakdown.findersFees
        },
        clientProfitability,
        userAnalytics,
        systemResources,
        growthTrends,
        recentClients,
        recentUsers,
        systemMessages: systemMessages.slice(0, 10),
        agentStatuses
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
    toast({
      title: "Dashboard Refreshed",
      description: "All metrics have been updated.",
    });
  };

  // Helper functions for admin operations with audit logging
  const AdminServiceWithAudit = {
    createClientWithAudit: (data: any) => AdminService.createClient(data),
    updateClientWithAudit: (id: string, data: any) => AdminService.updateClient(id, data),
    deleteClientWithAudit: (id: string) => AdminService.deleteClient(id),
    activateClientWithAudit: (id: string) => AdminService.activateClient(id),
    deactivateClientWithAudit: (id: string) => AdminService.deactivateClient(id),
  };

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Dashboard</h3>
          <p className="text-muted-foreground mb-4">There was an error loading the dashboard data.</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <PartialDataProvider staleThreshold={5}>
      <div className="space-y-6 pb-8">
      {/* Header Component */}
      <DashboardHeader 
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Financial Overview Component */}
      <FinancialOverview 
        metrics={{
          totalRevenue: metrics.totalRevenue,
          totalCosts: metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees,
          netProfit: metrics.totalProfit,
          profitMargin: metrics.avgProfitMargin,
          growthTrends: metrics.growthTrends
        }}
      />

      {/* Business Metrics Component */}
      <BusinessMetrics 
        metrics={{
          activeClients: metrics.activeClients,
          totalClients: metrics.totalClients,
          clientGrowth: metrics.growthTrends.clientGrowth,
          activeUsersToday: metrics.userAnalytics.activeToday,
          totalUsers: metrics.totalUsers,
          newUsersThisMonth: metrics.userAnalytics.newThisMonth,
          apiUtilization: metrics.systemResources.apiLimitUtilization,
          apiCallsToday: metrics.systemResources.apiCallsToday,
          systemHealth: metrics.systemHealth
        }}
      />

      {/* Dashboard Tabs - Following Analytics page pattern */}
      <Tabs defaultValue="financial" className="space-y-4">
        {/* Mobile-optimized tabs with horizontal scrolling */}
        {isMobile ? (
          <div className="relative mb-6">
            {/* Left scroll button */}
            <button 
              onClick={() => scrollToTab('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-card shadow-md border border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Scrollable tabs container */}
            <div 
              ref={tabsRef}
              className="overflow-x-auto scrollbar-hide py-2 px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <TabsList className="inline-flex w-auto space-x-2 rounded-full bg-muted/50 p-1">
                {tabOptions.map(tab => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap"
                  >
                    {tab.shortLabel}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {/* Right scroll button */}
            <button 
              onClick={() => scrollToTab('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-card shadow-md border border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Desktop tabs */
          <TabsList className="grid w-full grid-cols-5">
            {tabOptions.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="financial">
          <TabErrorBoundary tabName="Financial Analysis" fallback={ErrorFallback}>
            <Suspense fallback={<TabLoadingSkeleton />}>
              <FinancialTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="clients">
          <TabErrorBoundary tabName="Client Analytics" fallback={ErrorFallback}>
            <Suspense fallback={<TabLoadingSkeleton />}>
              <ClientsTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="users">
          <TabErrorBoundary tabName="User Analytics" fallback={ErrorFallback}>
            <Suspense fallback={<TabLoadingSkeleton />}>
              <UsersTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="system">
          <TabErrorBoundary tabName="System Health" fallback={ErrorFallback}>
            <Suspense fallback={<TabLoadingSkeleton />}>
              <SystemTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="operations">
          <TabErrorBoundary tabName="Operations" fallback={ErrorFallback}>
            <Suspense fallback={<TabLoadingSkeleton />}>
              <OperationsTab />
            </Suspense>
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
    </PartialDataProvider>
  );
};

export default AdminDashboard;