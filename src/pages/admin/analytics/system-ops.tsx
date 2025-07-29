import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { SystemTab } from '@/components/admin/dashboard/tabs/SystemTab';
import { OperationsTab } from '@/components/admin/dashboard/tabs/OperationsTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminSystemOpsPage: React.FC = () => {
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false // Disable toasts to avoid duplicate notifications
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System & Operations</h1>
          <p className="text-muted-foreground">
            System health and operational metrics • Last updated: {(lastUpdated || new Date()).toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={refresh} 
          disabled={isLoading} 
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
        >
          <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="space-y-4">
          <SystemTab />
        </TabsContent>
        
        <TabsContent value="operations" className="space-y-4">
          <OperationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemOpsPage;