import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Clock } from 'lucide-react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const SystemLogs: React.FC = () => {
  // Use the admin dashboard data hook for header props
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: false,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false
  });

  return (
    <div className="space-y-6">
      {/* Standardized Dashboard Header */}
      <DashboardHeader
        title="System Logs"
        subtitle="Monitor system events, errors, performance metrics, and infrastructure logs"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <Card className="max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Server className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">System Logs</CardTitle>
          <CardDescription>
            This feature is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Coming Soon</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            System health monitoring, error tracking, performance logs, and infrastructure 
            monitoring will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;