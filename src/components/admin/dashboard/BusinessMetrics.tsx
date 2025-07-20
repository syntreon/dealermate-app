import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Zap, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/utils/formatting';

interface BusinessMetricsData {
  activeClients: number;
  totalClients: number;
  clientGrowth: number;
  activeUsersToday: number;
  totalUsers: number;
  newUsersThisMonth: number;
  apiUtilization: number;
  apiCallsToday: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

interface BusinessMetricsProps {
  metrics: BusinessMetricsData;
}

export const BusinessMetrics: React.FC<BusinessMetricsProps> = ({ metrics }) => {
  const getHealthIcon = () => {
    switch (metrics.systemHealth) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
      case 'down':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatNumber(metrics.activeClients)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalClients} total • +{metrics.clientGrowth}% growth
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Users Today</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatNumber(metrics.activeUsersToday)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalUsers} total • {metrics.newUsersThisMonth} new this month
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">API Utilization</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {metrics.apiUtilization.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(metrics.apiCallsToday)} calls today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold capitalize text-foreground">
              {metrics.systemHealth}
            </div>
            {getHealthIcon()}
          </div>
          <p className="text-xs text-muted-foreground">
            All systems operational
          </p>
        </CardContent>
      </Card>
    </div>
  );
};