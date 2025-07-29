import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminPlatformPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Platform Analytics"
        lastUpdated={data?.lastUpdated}
        isLoading={loading}
        onRefresh={refetch}
      />
      
      {/* TODO: Implement platform-wide analytics component */}
      <div className="p-6 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Platform Analytics</h3>
        <p className="text-muted-foreground">Platform-wide analytics will be implemented here.</p>
      </div>
    </div>
  );
};

export default AdminPlatformPage;