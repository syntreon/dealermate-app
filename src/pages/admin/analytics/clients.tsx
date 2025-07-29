import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { ClientsTab } from '@/components/admin/dashboard/tabs/ClientsTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import TabErrorBoundary from '@/components/admin/dashboard/TabErrorBoundary';

const AdminClientsPage: React.FC = () => {
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false // Disable toasts to avoid duplicate notifications
  });

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Client Analytics"
        subtitle="Client performance and engagement metrics"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />
      
      <TabErrorBoundary tabName="Client Analytics">
        <ClientsTab />
      </TabErrorBoundary>
    </div>
  );
};

export default AdminClientsPage;