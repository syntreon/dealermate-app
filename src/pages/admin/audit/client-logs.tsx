import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Clock } from 'lucide-react';

const ClientLogs: React.FC = () => {
  // Use the admin dashboard data hook for header props
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: false,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false
  });

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2">
      {/* Standardized Dashboard Header */}
      <DashboardHeader
        title="Client Logs"
        subtitle="Track client-specific activities, data changes, and client interaction history"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <Card className="max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Client Logs</CardTitle>
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
            Client activity monitoring, data modification logs, and client-specific 
            audit trails will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLogs;