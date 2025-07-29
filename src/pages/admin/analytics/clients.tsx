import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { ClientsTab } from '@/components/admin/dashboard/tabs/ClientsTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminClientsPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Client Analytics"
        lastUpdated={data?.lastUpdated}
        isLoading={loading}
        onRefresh={refetch}
      />
      
      <ClientsTab />
    </div>
  );
};

export default AdminClientsPage;