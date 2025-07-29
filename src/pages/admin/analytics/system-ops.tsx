import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { SystemTab } from '@/components/admin/dashboard/tabs/SystemTab';
import { OperationsTab } from '@/components/admin/dashboard/tabs/OperationsTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminSystemOpsPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="System & Operations"
        lastUpdated={data?.lastUpdated}
        isLoading={loading}
        onRefresh={refetch}
      />
      
      <div className="grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <SystemTab />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Operations Metrics</h3>
          <OperationsTab />
        </div>
      </div>
    </div>
  );
};

export default AdminSystemOpsPage;