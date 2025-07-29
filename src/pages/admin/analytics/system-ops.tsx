import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { SystemTab } from '@/components/admin/dashboard/tabs/SystemTab';
import { OperationsTab } from '@/components/admin/dashboard/tabs/OperationsTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TabErrorBoundary from '@/components/admin/dashboard/TabErrorBoundary';

const AdminSystemOpsPage: React.FC = () => {
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false // Disable toasts to avoid duplicate notifications
  });

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="System & Operations"
        subtitle="System health and operational metrics"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />
      
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="space-y-4">
          <TabErrorBoundary tabName="System Health">
            <SystemTab />
          </TabErrorBoundary>
        </TabsContent>
        
        <TabsContent value="operations" className="space-y-4">
          <TabErrorBoundary tabName="Operations">
            <OperationsTab />
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemOpsPage;