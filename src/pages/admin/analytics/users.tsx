import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { UsersTab } from '@/components/admin/dashboard/tabs/UsersTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminUsersPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="User Analytics"
        lastUpdated={data?.lastUpdated}
        isLoading={loading}
        onRefresh={refetch}
      />
      
      <UsersTab />
    </div>
  );
};

export default AdminUsersPage;