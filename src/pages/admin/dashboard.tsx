import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';
import { BusinessMetrics } from '@/components/admin/dashboard/BusinessMetrics';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminDashboardPage: React.FC = () => {
  const { data, loading, error, refetch } = useAdminDashboardData();

  if (loading && !data) {
    return <div>Loading...</div>; // TODO: Add proper loading skeleton
  }

  if (error && !data) {
    return <div>Error loading dashboard</div>; // TODO: Add proper error component
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Admin Dashboard"
        lastUpdated={data?.lastUpdated}
        isLoading={loading}
        onRefresh={refetch}
      />
      
      <FinancialOverview metrics={data?.financial} />
      <BusinessMetrics metrics={data?.business} />
      
      {/* TODO: Add quick access cards to analytics sections */}
    </div>
  );
};

export default AdminDashboardPage;