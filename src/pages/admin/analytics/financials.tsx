import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialTab } from '@/components/admin/dashboard/tabs/FinancialTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminFinancialsPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Financial Analytics"
        lastUpdated={data?.lastUpdated}
        isLoading={loading}
        onRefresh={refetch}
      />
      
      <FinancialTab />
    </div>
  );
};

export default AdminFinancialsPage;