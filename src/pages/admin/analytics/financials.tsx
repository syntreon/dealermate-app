import React from 'react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialTab } from '@/components/admin/dashboard/tabs/FinancialTab';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import TabErrorBoundary from '@/components/admin/dashboard/TabErrorBoundary';
import { PartialDataProvider } from '@/components/admin/dashboard/PartialDataProvider';

const AdminFinancialsPage: React.FC = () => {
  const { lastUpdated, refresh, isLoading } = useAdminDashboardData({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false // Disable toasts to avoid duplicate notifications
  });

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Financial Analytics"
        subtitle="Revenue, costs, and profitability analysis"
        lastUpdated={lastUpdated || new Date()}
        isLoading={isLoading}
        onRefresh={refresh}
      />
      
      <TabErrorBoundary tabName="Financial Analytics">
        <PartialDataProvider>
          <FinancialTab />
        </PartialDataProvider>
      </TabErrorBoundary>
    </div>
  );
};

export default AdminFinancialsPage;