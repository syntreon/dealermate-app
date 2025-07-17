import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import LeadAnalytics from '@/components/analytics/LeadAnalytics';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('leads');

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col space-y-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-3xl font-bold text-[#1F2937] mb-2 sm:mb-0">Analytics</h1>
          </div>
          <p className="text-[#6B7280]">Detailed analytics and insights for your call system.</p>
        </div>
      </div>

      <Tabs defaultValue="leads" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="calls">Call Analytics</TabsTrigger>
          <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
          <TabsTrigger value="costs">Cost Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calls">
          <Card>
            <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <ComingSoonBadge />
                <p className="mt-4 text-gray-600">Call analytics will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leads">
          <LeadAnalytics />
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