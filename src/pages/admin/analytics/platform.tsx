import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertCircle, BarChart3, TrendingUp, Users, Building2, Activity, Globe, RefreshCw } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/utils/formatting';

// Platform-wide analytics overview page
// Follows same minimal, modular pattern as financials.tsx

const PlatformOverviewCards: React.FC<{ data: any }> = ({ data }) => {
  const platformMetrics = data.platformMetrics;
  const financialMetrics = data.financialMetrics;
  const userAnalytics = data.userAnalytics;
  const clientDistribution = data.clientDistribution;

  if (!platformMetrics) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Revenue */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
          <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(financialMetrics?.totalRevenue || 0, 'CAD')}
          </div>
          <p className="text-xs text-muted-foreground">
            Monthly recurring revenue
          </p>
        </CardContent>
      </Card>

      {/* Total Clients */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatNumber(platformMetrics.totalClients)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(platformMetrics.activeClients)} active
          </p>
        </CardContent>
      </Card>

      {/* Total Users */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatNumber(platformMetrics.totalUsers)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(userAnalytics?.activeToday || 0)} active today
          </p>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Platform Health</CardTitle>
          <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 capitalize">
            {platformMetrics.systemHealth}
          </div>
          <p className="text-xs text-muted-foreground">
            All systems operational
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Platform analytics charts component
const PlatformAnalyticsCharts: React.FC<{ data: any }> = ({ data }) => {
  const clientDistribution = data.clientDistribution;
  const userAnalytics = data.userAnalytics;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Client Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Client Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of clients by status and subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientDistribution ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">By Status</h4>
                <div className="space-y-2">
                  {clientDistribution.byStatus.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground capitalize">{item.status}</span>
                      <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">By Subscription Plan</h4>
                <div className="space-y-2">
                  {clientDistribution.bySubscriptionPlan.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{item.plan}</span>
                      <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No client distribution data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Analytics
          </CardTitle>
          <CardDescription>
            User activity and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userAnalytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatNumber(userAnalytics.activeToday)}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Today</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(userAnalytics.activeThisWeek)}
                  </div>
                  <p className="text-xs text-muted-foreground">Active This Week</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">New Users This Month</span>
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {formatNumber(userAnalytics.newThisMonth)}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">By Role</h4>
                  <div className="space-y-2">
                    {userAnalytics.byRole.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground capitalize">{item.role.replace('_', ' ')}</span>
                        <span className="text-sm font-medium">{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No user analytics data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Error fallback component
const PlatformAnalyticsError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <AlertCircle className="h-12 w-12 text-destructive" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-foreground">Failed to Load Platform Analytics</h3>
      <p className="text-muted-foreground">
        There was an error loading the platform analytics data.
      </p>
    </div>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

// Main platform analytics page component
const AdminPlatformPage: React.FC = () => {
  // Use the admin dashboard data hook for header props
  const { data, lastUpdated, refresh, isLoading, error } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false
  });

  // Show loading state on initial load
  if (isLoading && !data.platformMetrics) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Platform Analytics Overview"
          subtitle="Key metrics and trends across the entire platform"
          lastUpdated={new Date()}
          isLoading={true}
          onRefresh={refresh}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error and no data
  if (error && !data.platformMetrics) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          title="Platform Analytics Overview"
          subtitle="Key metrics and trends across the entire platform"
          lastUpdated={lastUpdated || new Date()}
          isLoading={isLoading}
          onRefresh={refresh}
        />
        <PlatformAnalyticsError onRetry={refresh} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Platform Analytics Overview"
        subtitle="Key metrics and trends across the entire platform"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      {/* Platform Overview Cards */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Platform Overview</h2>
        <PlatformOverviewCards data={data} />
      </div>

      {/* Platform Analytics Charts */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Detailed Analytics</h2>
        <PlatformAnalyticsCharts data={data} />
      </div>

      {/* Platform Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Insights
          </CardTitle>
          <CardDescription>
            Key insights and trends across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Growth Metrics</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Client Growth Rate</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {data.growthTrends?.clientGrowth?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue Growth Rate</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {data.growthTrends?.revenueGrowth?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Platform Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Call Volume</span>
                  <span className="text-sm font-medium">
                    {formatNumber(data.platformMetrics?.platformCallVolume || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Lead Volume</span>
                  <span className="text-sm font-medium">
                    {formatNumber(data.platformMetrics?.platformLeadVolume || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlatformPage;