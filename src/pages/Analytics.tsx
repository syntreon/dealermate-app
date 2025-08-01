import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import LeadAnalytics from '@/components/analytics/LeadAnalytics';
import CallAnalytics from '@/components/analytics/CallAnalytics';
import QualityAnalytics from '@/components/analytics/QualityAnalytics';
import SimpleAIAnalytics from '@/components/analytics/SimpleAIAnalytics';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useClient } from '@/context/ClientContext';
import { canViewSensitiveInfo, canAccessAnalytics } from '@/utils/clientDataIsolation';
import { Navigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const { user } = useAuth();
  const { selectedClientId } = useClient();
  const [activeTab, setActiveTab] = useState('calls');
  
  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  const { dateRange, setDateRange, startDate, endDate } = useDateRange();
  const [dateFilters, setDateFilters] = useState<{ start?: string; end?: string }>({});
  const isMobile = useIsMobile();
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Use useMemo to stabilize permission checks to prevent infinite renders
  const canViewAnalytics = useMemo(() => canAccessAnalytics(user), [user]);
  
  // Redirect if user doesn't have access
  if (!canViewAnalytics) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check if user can view all clients (admin)
  const canViewAllClients = useMemo(() => canViewSensitiveInfo(user), [user]);
  
  // Tab options
  const allTabOptions = [
    { id: 'calls', label: 'Call Analytics', shortLabel: 'Calls' },
    { id: 'quality', label: 'Quality Analytics', shortLabel: 'Quality' },
    { id: 'ai-accuracy', label: 'AI Accuracy', shortLabel: 'AI Accuracy', adminOnly: true },
  ];

  const tabOptions = allTabOptions.filter(tab => !tab.adminOnly || canViewAllClients);
  
  // Client selection is now handled by the global ClientContext
  
  // Handle tab scrolling on mobile
  const scrollToTab = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    
    const scrollAmount = direction === 'left' ? -120 : 120;
    tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Mobile-first compact header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Detailed analytics and insights for your call system</p>
        </div>
      </div>
      
      {/* Filters section - separate row on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {/* Date filter */}
        <DateRangeFilter
          className="w-full sm:w-auto max-w-xs"
          onRangeChange={useCallback((start, end) => {
            setDateFilters({ start: start || undefined, end: end || undefined });
          }, [])}
        />
      </div>

      <Tabs defaultValue="calls" className="w-full" onValueChange={handleTabChange}>
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