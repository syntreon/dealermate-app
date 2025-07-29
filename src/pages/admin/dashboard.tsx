import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';
import { BusinessMetrics } from '@/components/admin/dashboard/BusinessMetrics';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertCircle, BarChart3, Users, Building2, Activity, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

// Quick access card component
interface QuickAccessCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  color 
}) => (
  <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
    <NavLink to={href} className="block">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </NavLink>
  </Card>
);

// Quick access grid component
const QuickAccessGrid: React.FC = () => {
  const quickAccessItems = [
    {
      title: 'Financial Analytics',
      description: 'Revenue, costs, and profitability analysis',
      href: '/admin/analytics/financials',
      icon: BarChart3,
      color: 'bg-emerald-500'
    },
    {
      title: 'Client Analytics',
      description: 'Client performance and engagement metrics',
      href: '/admin/analytics/clients',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'User Analytics',
      description: 'User activity and system usage',
      href: '/admin/analytics/users',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'System & Operations',
      description: 'System health and operational metrics',
      href: '/admin/analytics/system-ops',
      icon: Activity,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Quick Access</h2>
        <Button variant="outline" size="sm" asChild>
          <NavLink to="/admin/analytics/platform">
            View All Analytics
            <ArrowRight className="h-4 w-4 ml-2" />
          </NavLink>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickAccessItems.map((item) => (
          <QuickAccessCard key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
};

// Error fallback component
interface AdminDashboardErrorProps {
  onRetry: () => void;
}

const AdminDashboardError: React.FC<AdminDashboardErrorProps> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <AlertCircle className="h-12 w-12 text-destructive" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-foreground">Failed to Load Dashboard</h3>
      <p className="text-muted-foreground">
        There was an error loading the admin dashboard data.
      </p>
    </div>
    <Button onClick={onRetry} variant="outline">
      Try Again
    </Button>
  </div>
);

// Loading skeleton component
const AdminDashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-10 w-24 bg-muted animate-pulse rounded" />
    </div>

    {/* Financial overview skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Business metrics skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-36 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Quick access skeleton */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

// Main dashboard page component
const AdminDashboardPage: React.FC = () => {
  const { data, isLoading, error, lastUpdated, refresh } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: true
  });

  // Show loading skeleton on initial load
  if (isLoading && !data.dashboardMetrics && !data.financialMetrics) {
    return <AdminDashboardSkeleton />;
  }

  // Show error state if there's a critical error and no data
  if (error && !data.dashboardMetrics && !data.financialMetrics) {
    return <AdminDashboardError onRetry={refresh} />;
  }

  // Prepare financial metrics for FinancialOverview component
  const financialMetrics = data.financialMetrics ? {
    totalRevenue: data.financialMetrics.totalRevenue,
    totalCosts: data.financialMetrics.totalCosts,
    netProfit: data.financialMetrics.netProfit,
    profitMargin: data.financialMetrics.profitMargin,
    growthTrends: data.growthTrends ? {
      revenueGrowth: data.growthTrends.revenueGrowth,
      costGrowth: data.growthTrends.costGrowth,
      profitGrowth: data.growthTrends.profitGrowth
    } : {
      revenueGrowth: 0,
      costGrowth: 0,
      profitGrowth: 0
    }
  } : null;

  // Prepare business metrics for BusinessMetrics component
  const businessMetrics = data.platformMetrics ? {
    activeClients: data.platformMetrics.activeClients,
    totalClients: data.platformMetrics.totalClients,
    clientGrowth: data.growthTrends?.clientGrowth || 0,
    activeUsersToday: data.userAnalytics?.activeToday || 0,
    totalUsers: data.platformMetrics.totalUsers,
    newUsersThisMonth: data.userAnalytics?.newThisMonth || 0,
    apiUtilization: 85.2, // Mock data - replace with real API utilization
    apiCallsToday: data.platformMetrics.platformCallVolume || 0,
    systemHealth: data.platformMetrics.systemHealth
  } : null;

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader 
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />
      
      {/* Financial Overview */}
      {financialMetrics ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Financial Overview</h2>
          <FinancialOverview metrics={financialMetrics} />
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
      
      {/* Business Metrics */}
      {businessMetrics ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Business Metrics</h2>
          <BusinessMetrics metrics={businessMetrics} />
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
      
      {/* Quick Access Cards */}
      <QuickAccessGrid />
    </div>
  );
};

export default AdminDashboardPage;