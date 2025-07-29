import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { UsersTab } from '@/components/admin/dashboard/tabs/UsersTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import TabErrorBoundary from '@/components/admin/dashboard/TabErrorBoundary';

const AdminUsersPage: React.FC = () => {
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false // Disable toasts to avoid duplicate notifications
  });

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="User Analytics"
        subtitle="User activity and engagement statistics"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />
      
      <TabErrorBoundary tabName="User Analytics">
        <UsersTab />
      </TabErrorBoundary>
    </div>
  );
};

export default AdminUsersPage;