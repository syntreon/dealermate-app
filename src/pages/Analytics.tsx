import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import LeadAnalytics from '@/components/analytics/LeadAnalytics';
import CallAnalytics from '@/components/analytics/CallAnalytics';
import QualityAnalytics from '@/components/analytics/QualityAnalytics';
import SimpleAIAnalytics from '@/components/analytics/SimpleAIAnalytics';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import ClientSelector from '@/components/ClientSelector';
import { useDateRange } from '@/hooks/useDateRange';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo, canAccessAnalytics } from '@/utils/clientDataIsolation';
import { Navigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calls');
  const { dateRange, setDateRange, startDate, endDate } = useDateRange();
  const [dateFilters, setDateFilters] = useState<{ start?: string; end?: string }>({});
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Check if user can access analytics
  const canViewAnalytics = canAccessAnalytics(user);
  
  // Redirect if user doesn't have access
  if (!canViewAnalytics) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check if user can view all clients (admin)
  const canViewAllClients = canViewSensitiveInfo(user);
  
  // Tab options
  const allTabOptions = [
    { id: 'calls', label: 'Call Analytics', shortLabel: 'Calls' },
    { id: 'quality', label: 'Quality Analytics', shortLabel: 'Quality' },
    { id: 'ai-accuracy', label: 'AI Accuracy', shortLabel: 'AI Accuracy', adminOnly: true },
  ];

  const tabOptions = allTabOptions.filter(tab => !tab.adminOnly || canViewAllClients);
  
  // Handle client selection change
  const handleClientChange = useCallback((clientId: string | null) => {
    setSelectedClientId(clientId);
  }, []);
  
  // Handle tab scrolling on mobile
  const scrollToTab = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    
    const scrollAmount = direction === 'left' ? -120 : 120;
    tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col space-y-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-3xl font-bold text-card-foreground mb-2 sm:mb-0">Analytics</h1>
          </div>
          <p className="text-muted-foreground">Detailed analytics and insights for your call system.</p>
        </div>
        
        {/* Filters section */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Client selector for admin users */}
          {canViewAllClients && (
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={handleClientChange}
              className="w-full sm:w-auto"
            />
          )}
          
          {/* Date filter is hidden on smallest screens and shown as a dropdown on larger screens */}
          <DateRangeFilter
            className={cn("mt-2 sm:mt-0", isMobile ? "hidden sm:block" : "")}
            onRangeChange={useCallback((start, end) => {
              setDateFilters({ start: start || undefined, end: end || undefined });
            }, [])}
          />
        </div>
      </div>
      
      {/* Mobile-only date filter button that opens a bottom sheet */}
      {isMobile && (
        <div className="mb-4">
          <button 
            className="w-full py-2 px-4 bg-muted/50 rounded-lg border border-border flex items-center justify-center gap-2 text-sm font-medium text-foreground"
            onClick={() => {
              // This would open a date picker sheet in a real implementation
              alert("Date filter would open here");
            }}
          >
            <span>Filter by Date</span>
          </button>
        </div>
      )}

      <Tabs defaultValue="calls" className="w-full" onValueChange={setActiveTab}>
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
                    className="rounded-full px-4 py-2 text-sm font-medium"
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
          <TabsList className={cn("grid mb-8", `grid-cols-${tabOptions.length}`)}>
            {tabOptions.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="calls">
          <CallAnalytics 
            startDate={dateFilters.start} 
            endDate={dateFilters.end}
            clientId={selectedClientId}
          />
        </TabsContent>

        {/* Lead Analytics hidden for future updates */}
        {/* <TabsContent value="leads">
          <LeadAnalytics />
        </TabsContent> */}

        <TabsContent value="quality">
          <QualityAnalytics 
            startDate={dateFilters.start} 
            endDate={dateFilters.end}
            clientId={selectedClientId}
          />
        </TabsContent>

        {canViewAllClients && (
          <TabsContent value="ai-accuracy">
            <SimpleAIAnalytics 
              startDate={dateFilters.start} 
              endDate={dateFilters.end}
              clientId={selectedClientId}
            />
          </TabsContent>
        )}
        
        {/* Mobile-only date range indicator */}
        {isMobile && activeTab !== 'ai-accuracy' && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Date Range:</span>
              <span className="font-medium text-foreground">
                {dateFilters.start ? new Date(dateFilters.start).toLocaleDateString() : 'All time'} - {dateFilters.end ? new Date(dateFilters.end).toLocaleDateString() : 'Present'}
              </span>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default Analytics;