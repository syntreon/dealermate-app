import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Phone, 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { Client, User } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { ClientPerformanceChart } from '@/components/admin/analytics/ClientPerformanceChart';
import { RevenueAnalyticsChart } from '@/components/admin/analytics/RevenueAnalyticsChart';
import { UserActivityChart } from '@/components/admin/analytics/UserActivityChart';
import { CallVolumeChart } from '@/components/admin/analytics/CallVolumeChart';
import { ConversionFunnelChart } from '@/components/admin/analytics/ConversionFunnelChart';
import { GeographicDistribution } from '@/components/admin/analytics/GeographicDistribution';
import { PerformanceMetricsTable } from '@/components/admin/analytics/PerformanceMetricsTable';
import { formatCurrency, formatNumber } from '@/utils/formatting';

interface AnalyticsData {
  clients: Client[];
  users: User[];
  totalCalls: number;
  totalLeads: number;
  totalRevenue: number;
  conversionRate: number;
  avgCallDuration: number;
  activeClients: number;
  growthMetrics: {
    clientGrowth: number;
    revenueGrowth: number;
    callGrowth: number;
    leadGrowth: number;
  };
  timeSeriesData: Array<{
    date: string;
    calls: number;
    leads: number;
    revenue: number;
  }>;
}

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [selectedMetric, setSelectedMetric] = useState<'calls' | 'leads' | 'revenue'>('calls');
  const { toast } = useToast();

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Load all data in parallel
      const [clients, users] = await Promise.all([
        AdminService.getClients(),
        AdminService.getUsers()
      ]);

      // Calculate metrics
      const totalCalls = clients.reduce((sum, client) => sum + (client.metrics?.totalCalls || 0), 0);
      const totalLeads = clients.reduce((sum, client) => sum + (client.metrics?.totalLeads || 0), 0);
      const totalRevenue = clients.reduce((sum, client) => sum + client.monthly_billing_amount_cad, 0);
      const conversionRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;
      const activeClients = clients.filter(c => c.status === 'active').length;
      
      // Calculate average call duration
      const callDurations = clients
        .map(c => c.metrics?.avgCallDuration || 0)
        .filter(d => d > 0);
      const avgCallDuration = callDurations.length > 0 
        ? Math.round(callDurations.reduce((sum, d) => sum + d, 0) / callDurations.length)
        : 0;

      // Generate mock growth metrics (in production, calculate from historical data)
      const growthMetrics = {
        clientGrowth: Math.random() * 20 + 5, // 5-25% growth
        revenueGrowth: Math.random() * 30 + 10, // 10-40% growth
        callGrowth: Math.random() * 25 + 5, // 5-30% growth
        leadGrowth: Math.random() * 35 + 10 // 10-45% growth
      };

      // Generate time series data (mock for now)
      const timeSeriesData = generateTimeSeriesData(30, totalCalls, totalLeads, totalRevenue);

      setAnalyticsData({
        clients,
        users,
        totalCalls,
        totalLeads,
        totalRevenue,
        conversionRate,
        avgCallDuration,
        activeClients,
        growthMetrics,
        timeSeriesData
      });
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSeriesData = (days: number, totalCalls: number, totalLeads: number, totalRevenue: number) => {
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic daily values
      const dailyCalls = Math.floor((totalCalls / 30) * (0.7 + Math.random() * 0.6));
      const dailyLeads = Math.floor((totalLeads / 30) * (0.7 + Math.random() * 0.6));
      const dailyRevenue = (totalRevenue / 30) * (0.8 + Math.random() * 0.4);
      
      data.push({
        date: date.toISOString().split('T')[0],
        calls: dailyCalls,
        leads: dailyLeads,
        revenue: dailyRevenue
      });
    }
    
    return data;
  };

  const handleExportData = () => {
    if (!analyticsData) return;
    
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Total Clients', analyticsData.clients.length.toString()],
      ['Active Clients', analyticsData.activeClients.toString()],
      ['Total Users', analyticsData.users.length.toString()],
      ['Total Calls', analyticsData.totalCalls.toString()],
      ['Total Leads', analyticsData.totalLeads.toString()],
      ['Total Revenue (CAD)', analyticsData.totalRevenue.toString()],
      ['Conversion Rate (%)', analyticsData.conversionRate.toFixed(2)],
      ['Avg Call Duration (seconds)', analyticsData.avgCallDuration.toString()]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Analytics data has been exported to CSV.",
    });
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  if (isLoading && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Analytics</h1>
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

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground mb-4">Unable to load analytics data.</p>
          <Button onClick={loadAnalyticsData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights across all clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter
            onRangeChange={(start, end) => setDateRange({ start, end })}
          />
          <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={loadAnalyticsData} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.clients.length)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{analyticsData.growthMetrics.clientGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalCalls)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{analyticsData.growthMetrics.callGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalLeads)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{analyticsData.growthMetrics.leadGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue, 'CAD')}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{analyticsData.growthMetrics.revenueGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CallVolumeChart data={analyticsData.timeSeriesData} />
            <ConversionFunnelChart 
              totalCalls={analyticsData.totalCalls}
              totalLeads={analyticsData.totalLeads}
              conversionRate={analyticsData.conversionRate}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Critical metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <Badge variant="default">{analyticsData.conversionRate.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Clients</span>
                  <Badge variant="default">{analyticsData.activeClients}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Call Duration</span>
                  <Badge variant="outline">{Math.round(analyticsData.avgCallDuration / 60)}m</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue per Client</span>
                  <Badge variant="outline">
                    {formatCurrency(analyticsData.totalRevenue / analyticsData.clients.length, 'CAD')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <GeographicDistribution clients={analyticsData.clients} />
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ClientPerformanceChart clients={analyticsData.clients} />
            <Card>
              <CardHeader>
                <CardTitle>Client Status Distribution</CardTitle>
                <CardDescription>Breakdown of client statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['active', 'trial', 'inactive', 'churned'].map(status => {
                    const count = analyticsData.clients.filter(c => c.status === status).length;
                    const percentage = analyticsData.clients.length > 0 ? (count / analyticsData.clients.length) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={status === 'active' ? 'default' : 'secondary'} className="capitalize">
                            {status}
                          </Badge>
                          <span className="text-sm">{count} clients</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <PerformanceMetricsTable clients={analyticsData.clients} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueAnalyticsChart data={analyticsData.timeSeriesData} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue distribution by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Free Trial', 'Basic', 'Pro', 'Custom'].map(plan => {
                    const planClients = analyticsData.clients.filter(c => c.subscription_plan === plan);
                    const planRevenue = planClients.reduce((sum, c) => sum + c.monthly_billing_amount_cad, 0);
                    const percentage = analyticsData.totalRevenue > 0 ? (planRevenue / analyticsData.totalRevenue) * 100 : 0;
                    
                    return (
                      <div key={plan} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{plan}</Badge>
                          <span className="text-sm">{planClients.length} clients</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(planRevenue, 'CAD')}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Clients</CardTitle>
                <CardDescription>Highest contributing clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.clients
                    .sort((a, b) => b.monthly_billing_amount_cad - a.monthly_billing_amount_cad)
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium">{client.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(client.monthly_billing_amount_cad, 'CAD')}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetricsTable clients={analyticsData.clients} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserActivityChart users={analyticsData.users} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;