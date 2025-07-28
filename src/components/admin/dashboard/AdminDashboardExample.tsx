import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

/**
 * Example component demonstrating how to use the useAdminDashboardData hook
 * This shows the patterns for handling loading states, errors, and data display
 */
export const AdminDashboardExample: React.FC = () => {
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    loadingStates,
    errors,
    refresh,
    retrySection,
    hasAnyData,
    hasAnyErrors,
    isAnyLoading,
    getSectionState
  } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: true,
    retryAttempts: 3
  });

  // Show initial loading state
  if (isLoading && !hasAnyData) {
    return <TabLoadingSkeleton tabType="financial" stage="initial" />;
  }

  // Show error state if no data could be loaded
  if (error && !hasAnyData) {
    return (
      <Card className="bg-card text-card-foreground border-border border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Failed to Load Admin Dashboard
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              {error.message}
            </p>
            <Button onClick={refresh} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyErrors && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {Object.values(errors).filter(e => e).length} errors
            </Badge>
          )}
          {isAnyLoading && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
              Loading
            </Badge>
          )}
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlatformMetricCard
          title="Total Clients"
          value={data.platformMetrics?.totalClients}
          isLoading={loadingStates.platformMetrics}
          error={errors.platformMetrics}
          onRetry={() => retrySection('platformMetrics')}
        />
        <PlatformMetricCard
          title="Active Clients"
          value={data.platformMetrics?.activeClients}
          isLoading={loadingStates.platformMetrics}
          error={errors.platformMetrics}
          onRetry={() => retrySection('platformMetrics')}
        />
        <PlatformMetricCard
          title="Total Users"
          value={data.platformMetrics?.totalUsers}
          isLoading={loadingStates.platformMetrics}
          error={errors.platformMetrics}
          onRetry={() => retrySection('platformMetrics')}
        />
        <PlatformMetricCard
          title="Monthly Revenue"
          value={data.platformMetrics?.totalRevenue}
          formatter={formatCurrency}
          isLoading={loadingStates.platformMetrics}
          error={errors.platformMetrics}
          onRetry={() => retrySection('platformMetrics')}
        />
      </div>

      {/* Financial Overview */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue, costs, and profitability metrics</CardDescription>
            </div>
            <SectionStatusIndicator
              isLoading={loadingStates.financialMetrics}
              error={errors.financialMetrics}
              onRetry={() => retrySection('financialMetrics')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingStates.financialMetrics ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-8 bg-muted rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          ) : errors.financialMetrics ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">{errors.financialMetrics.message}</p>
            </div>
          ) : data.financialMetrics ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.financialMetrics.totalRevenue)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Costs</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(data.financialMetrics.totalCosts)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <div className="flex items-center gap-2">
                  {data.financialMetrics.netProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <p className={`text-2xl font-bold ${
                    data.financialMetrics.netProfit >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-destructive'
                  }`}>
                    {formatCurrency(data.financialMetrics.netProfit)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No financial data available</p>
          )}
        </CardContent>
      </Card>

      {/* Client Profitability */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Client Profitability</CardTitle>
              <CardDescription>Most profitable clients this month</CardDescription>
            </div>
            <SectionStatusIndicator
              isLoading={loadingStates.clientProfitability}
              error={errors.clientProfitability}
              onRetry={() => retrySection('clientProfitability')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingStates.clientProfitability ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded animate-pulse">
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                  <div className="h-4 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : errors.clientProfitability ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">{errors.clientProfitability.message}</p>
            </div>
          ) : data.clientProfitability.length > 0 ? (
            <div className="space-y-3">
              {data.clientProfitability.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 border border-border rounded">
                  <div className="space-y-1">
                    <p className="font-medium text-card-foreground">{client.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(client.callVolume)} calls
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      client.profit >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-destructive'
                    }`}>
                      {formatCurrency(client.profit)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {client.margin.toFixed(1)}% margin
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No client profitability data available</p>
          )}
        </CardContent>
      </Card>

      {/* Debug Information (remove in production) */}
      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="font-medium">Loading States:</p>
              <ul className="space-y-1">
                {Object.entries(loadingStates).map(([key, loading]) => (
                  <li key={key} className="flex items-center gap-2">
                    {loading ? (
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    )}
                    {key}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Error States:</p>
              <ul className="space-y-1">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key} className="flex items-center gap-2">
                    {error ? (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    )}
                    {key}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for platform metric cards
interface PlatformMetricCardProps {
  title: string;
  value?: number;
  formatter?: (value: number) => string;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const PlatformMetricCard: React.FC<PlatformMetricCardProps> = ({
  title,
  value,
  formatter = formatNumber,
  isLoading,
  error,
  onRetry
}) => (
  <Card className="bg-card text-card-foreground border-border">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded animate-pulse w-16" />
        </div>
      ) : error ? (
        <div className="space-y-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <Button onClick={onRetry} variant="ghost" size="sm" className="h-6 text-xs">
            Retry
          </Button>
        </div>
      ) : value !== undefined ? (
        <div className="text-2xl font-bold text-card-foreground">
          {formatter(value)}
        </div>
      ) : (
        <div className="text-2xl font-bold text-muted-foreground">-</div>
      )}
    </CardContent>
  </Card>
);

// Helper component for section status indicators
interface SectionStatusIndicatorProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const SectionStatusIndicator: React.FC<SectionStatusIndicatorProps> = ({
  isLoading,
  error,
  onRetry
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <Button onClick={onRetry} variant="ghost" size="sm" className="text-xs">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="h-4 w-4 text-emerald-500" />
      <span className="text-sm text-muted-foreground">Loaded</span>
    </div>
  );
};

export default AdminDashboardExample;