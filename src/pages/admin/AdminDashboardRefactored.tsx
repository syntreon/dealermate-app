import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Components
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';
import { BusinessMetrics } from '@/components/admin/dashboard/BusinessMetrics';
import TabErrorBoundary from '@/components/admin/dashboard/TabErrorBoundary';
import ErrorFallback from '@/components/admin/dashboard/ErrorFallback';

// Lazy load tab components for better performance
const FinancialTab = React.lazy(() => import('@/components/admin/dashboard/tabs/FinancialTab').then(m => ({ default: m.FinancialTab })));
const ClientsTab = React.lazy(() => import('@/components/admin/dashboard/tabs/ClientsTab').then(m => ({ default: m.ClientsTab })));
const UsersTab = React.lazy(() => import('@/components/admin/dashboard/tabs/UsersTab').then(m => ({ default: m.UsersTab })));
const SystemTab = React.lazy(() => import('@/components/admin/dashboard/tabs/SystemTab').then(m => ({ default: m.SystemTab })));
const OperationsTab = React.lazy(() => import('@/components/admin/dashboard/tabs/OperationsTab').then(m => ({ default: m.OperationsTab })));

// Temporary mock data - will be replaced with real data hook
const mockFinancialMetrics = {
  totalRevenue: 125000,
  totalCosts: 75000,
  netProfit: 50000,
  profitMargin: 40,
  revenueGrowth: 12,
  costGrowth: 8,
  profitGrowth: 18
};

const mockBusinessMetrics = {
  activeClients: 24,
  totalClients: 28,
  activeUsersToday: 15,
  totalUsers: 45,
  newUsersThisMonth: 3,
  apiUtilization: 67.5,
  apiCallsToday: 1350,
  systemHealth: { status: 'healthy' as const, components: {}, lastChecked: new Date() },
  clientGrowth: 15
};

const AdminDashboardRefactored = () => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const tabsRef = useRef<HTMLDivElement>(null);

  // Tab options
  const tabOptions = [
    { id: 'financial', label: 'Financial', shortLabel: 'Financial' },
    { id: 'clients', label: 'Clients', shortLabel: 'Clients' },
    { id: 'users', label: 'Users', shortLabel: 'Users' },
    { id: 'system', label: 'System', shortLabel: 'System' },
    { id: 'operations', label: 'Operations', shortLabel: 'Ops' }
  ];

  // Handle tab scrolling on mobile
  const scrollToTab = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    
    const scrollAmount = direction === 'left' ? -120 : 120;
    tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement real data refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      setLastUpdated(new Date());
      toast({
        title: "Dashboard Refreshed",
        description: "All metrics have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 bg-background text-foreground">
      {/* Header */}
      <DashboardHeader
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Financial Overview Cards */}
      <FinancialOverview
        metrics={mockFinancialMetrics}
        isLoading={isLoading}
      />

      {/* Business Metrics Cards */}
      <BusinessMetrics
        metrics={mockBusinessMetrics}
        isLoading={isLoading}
      />

      {/* Dashboard Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        {/* Mobile-optimized tabs with horizontal scrolling */}
        {isMobile ? (
          <div className="relative mb-6">
            {/* Left scroll button */}
            <button 
              onClick={() => scrollToTab('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-card shadow-md border border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Scrollable tabs container */}
            <div 
              ref={tabsRef}
              className="overflow-x-auto scrollbar-hide py-2 px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <TabsList className="inline-flex w-auto space-x-2 rounded-full bg-muted/50 p-1">
                {tabOptions.map(tab => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap"
                  >
                    {tab.shortLabel}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {/* Right scroll button */}
            <button 
              onClick={() => scrollToTab('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-card shadow-md border border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Desktop tabs */
          <TabsList className="grid w-full grid-cols-5">
            {tabOptions.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {/* Tab Content with Error Boundaries and Suspense for lazy loading */}
        <TabsContent value="financial">
          <TabErrorBoundary tabName="Financial Analysis" fallback={ErrorFallback}>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <FinancialTab />
            </React.Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="clients">
          <TabErrorBoundary tabName="Client Analytics" fallback={ErrorFallback}>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <ClientsTab />
            </React.Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="users">
          <TabErrorBoundary tabName="User Analytics" fallback={ErrorFallback}>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <UsersTab />
            </React.Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="system">
          <TabErrorBoundary tabName="System Health" fallback={ErrorFallback}>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <SystemTab />
            </React.Suspense>
          </TabErrorBoundary>
        </TabsContent>

        <TabsContent value="operations">
          <TabErrorBoundary tabName="Operations" fallback={ErrorFallback}>
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <OperationsTab />
            </React.Suspense>
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardRefactored;