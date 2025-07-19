import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import LeadAnalytics from '@/components/analytics/LeadAnalytics';
import CallAnalytics from '@/components/analytics/CallAnalytics';
import QualityAnalytics from '@/components/analytics/QualityAnalytics';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('calls');
  const { dateRange, setDateRange, startDate, endDate } = useDateRange();
  const [dateFilters, setDateFilters] = useState<{ start?: string; end?: string }>({});

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col space-y-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-3xl font-bold text-card-foreground mb-2 sm:mb-0">Analytics</h1>
          </div>
          <p className="text-muted-foreground">Detailed analytics and insights for your call system.</p>
        </div>
        <DateRangeFilter
          className="mt-4 sm:mt-0"
          onRangeChange={useCallback((start, end) => {
            setDateFilters({ start: start || undefined, end: end || undefined });
          }, [])}
        />
      </div>

      <Tabs defaultValue="calls" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          {/* Mobile view tabs */}
          <TabsTrigger value="calls" className="sm:hidden px-1">Call</TabsTrigger>
          <TabsTrigger value="quality" className="sm:hidden px-1">Quality</TabsTrigger>
          <TabsTrigger value="costs" className="sm:hidden px-1">Cost</TabsTrigger>
          
          {/* Desktop view tabs */}
          <TabsTrigger value="calls" className="hidden sm:flex">Call Analytics</TabsTrigger>
          <TabsTrigger value="quality" className="hidden sm:flex">Quality Analytics</TabsTrigger>
          <TabsTrigger value="costs" className="hidden sm:flex">Cost Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calls">
          <CallAnalytics startDate={dateFilters.start} endDate={dateFilters.end} />
        </TabsContent>

        {/* Lead Analytics hidden for future updates */}
        {/* <TabsContent value="leads">
          <LeadAnalytics />
        </TabsContent> */}

        <TabsContent value="quality">
          <QualityAnalytics startDate={dateFilters.start} endDate={dateFilters.end} />
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <ComingSoonBadge />
                <p className="mt-4 text-gray-600">Cost analytics will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;