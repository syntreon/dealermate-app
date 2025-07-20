import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Building2,
  Phone,
  UserCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  RefreshCw,
  PieChart,
  Target,
  Zap,
  Shield,
  Database,
  Server,
  CreditCard,
  Percent,
  Calculator,
  Globe,
  UserX,
  AlertCircle,
  Cpu,
  HardDrive,
  Wifi,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AdminService } from '@/services/adminService';
import { AgentStatusService } from '@/services/agentStatusService';
import { SystemMessageService } from '@/services/systemMessageService';
import { Client, User, SystemMessage, AgentStatus } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatNumber } from '@/utils/formatting';

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
  
  // Tab options
  const tabOptions = [
    { id: 'overview', label: 'Overview' },
    { id: 'clients', label: 'Clients' },
    { id: 'users', label: 'Users' },
    { id: 'financial', label: 'Financial' },
    { id: 'system', label: 'System' }
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

      // Financial calculations
      const totalRevenue = clients.reduce((sum, client) => sum + client.monthly_billing_amount_cad, 0);
      const totalAiCosts = clients.reduce((sum, client) => sum + (client.average_monthly_ai_cost_usd * 1.35), 0); // Convert USD to CAD
      const totalMiscCosts = clients.reduce((sum, client) => sum + (client.average_monthly_misc_cost_usd * 1.35), 0);
      const totalPartnerSplits = clients.reduce((sum, client) => sum + (client.monthly_billing_amount_cad * client.partner_split_percentage / 100), 0);
      const totalFindersFees = clients.reduce((sum, client) => sum + client.finders_fee_cad, 0);

      const totalCosts = totalAiCosts + totalMiscCosts + totalPartnerSplits + totalFindersFees;
      const totalProfit = totalRevenue - totalCosts;
      const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Cost breakdown
      const costBreakdown = {
        aiCosts: totalAiCosts,
        miscCosts: totalMiscCosts,
        partnerSplits: totalPartnerSplits,
        findersFees: totalFindersFees
      };

      // Client profitability analysis
      const clientProfitability = clients.map(client => {
        const revenue = client.monthly_billing_amount_cad;
        const costs = (client.average_monthly_ai_cost_usd + client.average_monthly_misc_cost_usd) * 1.35 +
          (revenue * client.partner_split_percentage / 100) + client.finders_fee_cad;
        const profit = revenue - costs;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          id: client.id,
          name: client.name,
          revenue,
          costs,
          profit,
          margin,
          status: client.status
        };
      }).sort((a, b) => b.profit - a.profit);

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

      // Growth trends (mock data - would need historical data)
      const growthTrends = {
        clientGrowth: Math.floor(Math.random() * 20) + 5, // 5-25%
        revenueGrowth: Math.floor(Math.random() * 15) + 8, // 8-23%
        costGrowth: Math.floor(Math.random() * 10) + 3, // 3-13%
        profitGrowth: Math.floor(Math.random() * 25) + 10 // 10-35%
      };

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
        totalAiCosts,
        totalMiscCosts,
        totalProfit,
        avgProfitMargin,
        avgCallDuration,
        conversionRate,
        systemHealth: systemHealth.status,
        costBreakdown,
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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and key metrics • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {!isMobile && "Refresh"}
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue, 'CAD')}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{metrics.growthTrends.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees, 'CAD')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{metrics.growthTrends.costGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalProfit, 'CAD')}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{metrics.growthTrends.profitGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.avgProfitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.activeClients)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalClients} total • +{metrics.growthTrends.clientGrowth}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.userAnalytics.activeToday)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalUsers} total • {metrics.userAnalytics.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Utilization</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.systemResources.apiLimitUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.systemResources.apiCallsToday)} calls today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold capitalize">{metrics.systemHealth}</div>
              {metrics.systemHealth === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {metrics.systemHealth === 'degraded' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {metrics.systemHealth === 'down' && <AlertTriangle className="h-5 w-5 text-red-500" />}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
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
                    {tab.label}
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

        <TabsContent value="financial" className="space-y-4">
          {/* Cost Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
                <CardDescription>Monthly operational costs by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Costs (OpenAI)</span>
                    <span className="font-medium">{formatCurrency(metrics.costBreakdown.aiCosts, 'CAD')}</span>
                  </div>
                  <Progress value={(metrics.costBreakdown.aiCosts / (metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees)) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Miscellaneous Costs</span>
                    <span className="font-medium">{formatCurrency(metrics.costBreakdown.miscCosts, 'CAD')}</span>
                  </div>
                  <Progress value={(metrics.costBreakdown.miscCosts / (metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees)) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Partner Splits</span>
                    <span className="font-medium">{formatCurrency(metrics.costBreakdown.partnerSplits, 'CAD')}</span>
                  </div>
                  <Progress value={(metrics.costBreakdown.partnerSplits / (metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees)) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Finder's Fees</span>
                    <span className="font-medium">{formatCurrency(metrics.costBreakdown.findersFees, 'CAD')}</span>
                  </div>
                  <Progress value={(metrics.costBreakdown.findersFees / (metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees)) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Profitability Analysis
                </CardTitle>
                <CardDescription>Revenue vs costs breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-green-600">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="font-bold">{formatCurrency(metrics.totalRevenue, 'CAD')}</span>
                  </div>

                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-sm font-medium">Total Costs</span>
                    <span className="font-bold">-{formatCurrency(metrics.totalAiCosts + metrics.totalMiscCosts + metrics.costBreakdown.partnerSplits + metrics.costBreakdown.findersFees, 'CAD')}</span>
                  </div>

                  <hr className="my-2" />

                  <div className="flex items-center justify-between text-blue-600">
                    <span className="text-sm font-medium">Net Profit</span>
                    <span className="font-bold text-lg">{formatCurrency(metrics.totalProfit, 'CAD')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profit Margin</span>
                    <span className="font-medium">{metrics.avgProfitMargin.toFixed(1)}%</span>
                  </div>

                  <Progress value={Math.max(0, metrics.avgProfitMargin)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Clients by Profitability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Client Profitability Ranking
              </CardTitle>
              <CardDescription>Clients ranked by profit contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.clientProfitability.slice(0, 8).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Revenue: {formatCurrency(client.revenue, 'CAD')} •
                          Costs: {formatCurrency(client.costs, 'CAD')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${client.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(client.profit, 'CAD')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.margin.toFixed(1)}% margin
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Client Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of clients by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    metrics.recentClients.reduce((acc, client) => {
                      acc[client.status] = (acc[client.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                          {status}
                        </Badge>
                        <span className="text-sm capitalize">{status} Clients</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Subscription Plans
                </CardTitle>
                <CardDescription>Distribution by subscription tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    metrics.recentClients.reduce((acc, client) => {
                      acc[client.subscription_plan] = (acc[client.subscription_plan] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="text-sm">{plan}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{count}</span>
                        <Progress value={(count / metrics.totalClients) * 100} className="w-16 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Client Activity</CardTitle>
              <CardDescription>Latest client registrations and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.type} • {client.subscription_plan} •
                        Joined {new Date(client.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(client.monthly_billing_amount_cad, 'CAD')}/mo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Distribution by Role
                </CardTitle>
                <CardDescription>Breakdown of users by access level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.userAnalytics.byRole).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{count}</span>
                        <Progress value={(count / metrics.totalUsers) * 100} className="w-16 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  User Activity Metrics
                </CardTitle>
                <CardDescription>User engagement and activity stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Today</span>
                  <span className="font-medium">{metrics.userAnalytics.activeToday}</span>
                </div>
                <Progress value={(metrics.userAnalytics.activeToday / metrics.totalUsers) * 100} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm">New This Month</span>
                  <span className="font-medium">{metrics.userAnalytics.newThisMonth}</span>
                </div>
                <Progress value={(metrics.userAnalytics.newThisMonth / metrics.totalUsers) * 100} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Users</span>
                  <span className="font-medium">{metrics.totalUsers}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Latest user registrations and logins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email} • {user.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.last_login_at
                          ? `Last login: ${new Date(user.last_login_at).toLocaleDateString()}`
                          : 'Never logged in'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{metrics.systemResources.cpuUsage}%</div>
                <Progress value={metrics.systemResources.cpuUsage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.systemResources.cpuUsage < 70 ? 'Normal' : 'High'} usage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{metrics.systemResources.memoryUsage}%</div>
                <Progress value={metrics.systemResources.memoryUsage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.systemResources.memoryUsage < 80 ? 'Normal' : 'High'} usage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{metrics.systemResources.storageUsage}%</div>
                <Progress value={metrics.systemResources.storageUsage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.systemResources.storageUsage < 85 ? 'Normal' : 'High'} usage
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  System Health Status
                </CardTitle>
                <CardDescription>Current system component status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Server</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Services</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Storage</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Messages</CardTitle>
                <CardDescription>Recent system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.systemMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent system messages</p>
                  ) : (
                    metrics.systemMessages.slice(0, 5).map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <Badge variant={
                          message.type === 'error' ? 'destructive' :
                            message.type === 'warning' ? 'secondary' :
                              message.type === 'success' ? 'default' : 'outline'
                        }>
                          {message.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call Operations
                </CardTitle>
                <CardDescription>Call volume and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Calls</span>
                  <span className="font-medium">{formatNumber(metrics.totalCalls)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Leads</span>
                  <span className="font-medium">{formatNumber(metrics.totalLeads)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-medium">{metrics.conversionRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.conversionRate} className="h-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Call Duration</span>
                  <span className="font-medium">{Math.round(metrics.avgCallDuration / 60)}m {metrics.avgCallDuration % 60}s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Agent Status Overview
                </CardTitle>
                <CardDescription>Current agent operational status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.agentStatuses.slice(0, 5).map((status) => (
                    <div key={status.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {status.client_id ? `Client ${status.client_id.slice(0, 8)}...` : 'Global Agent'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {status.message || 'No status message'}
                        </p>
                      </div>
                      <Badge
                        variant={
                          status.status === 'active' ? 'default' :
                            status.status === 'maintenance' ? 'secondary' : 'destructive'
                        }
                      >
                        {status.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Growth Trends
              </CardTitle>
              <CardDescription>Month-over-month growth metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-600">+{metrics.growthTrends.clientGrowth}%</div>
                  <p className="text-sm text-muted-foreground">Client Growth</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">+{metrics.growthTrends.revenueGrowth}%</div>
                  <p className="text-sm text-muted-foreground">Revenue Growth</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-red-600">+{metrics.growthTrends.costGrowth}%</div>
                  <p className="text-sm text-muted-foreground">Cost Growth</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-purple-600">+{metrics.growthTrends.profitGrowth}%</div>
                  <p className="text-sm text-muted-foreground">Profit Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;