import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart, Funnel, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLeads } from '@/context/LeadContext';
import { useCalls } from '@/context/CallsContext';
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';

// Theme-aware colors for charts with better diversity
// Using CSS variables to ensure they work in both light and dark mode
const COLORS = [
  'hsl(var(--primary))', // Primary (indigo)
  'hsl(var(--destructive))', // Destructive (red)
  'hsl(142 71% 45%)', // Emerald
  'hsl(43 96% 58%)', // Amber
  'hsl(262 83% 58%)', // Purple
  'hsl(199 89% 48%)' // Sky blue
];

// Source colors with better diversity
const SOURCE_COLORS: Record<string, string> = {
  website: 'hsl(var(--primary))', // Primary (indigo)
  direct_call: 'hsl(var(--destructive))', // Destructive (red)
  referral: 'hsl(142 71% 45%)', // Emerald
  social_media: 'hsl(262 83% 58%)', // Purple
  other: 'hsl(43 96% 58%)' // Amber
};

interface LeadAnalyticsProps {
  clientId?: string;
  callType?: 'all' | 'live' | 'test';
}

const LeadAnalytics: React.FC<LeadAnalyticsProps> = ({ clientId, callType = 'live' }) => {
  const isMobile = useIsMobile();
  const { leads, stats } = useLeads();
  const { calls } = useCalls();
  const { dateRange, setDateRange, startDate, endDate } = useDateRange();
  
  // Prepare data for lead conversion funnel with updated theme-aware colors
  const leadFunnelData = useMemo(() => {
    // For a real implementation, we would filter by date range based on startDate and endDate
    return [
      { value: calls.length, name: 'Total Calls', fill: COLORS[0] },
      { value: leads.length, name: 'Total Leads', fill: COLORS[1] },
      { value: leads.filter(lead => lead.status === 'qualified').length, name: 'Qualified Leads', fill: COLORS[2] },
      { value: leads.filter(lead => lead.status === 'proposal').length, name: 'Proposals', fill: COLORS[3] },
      { value: leads.filter(lead => lead.status === 'closed_won').length, name: 'Conversions', fill: COLORS[4] },
    ];
  }, [calls.length, leads, startDate, endDate]);
  
  // Prepare data for lead sources
  const leadSourceData = useMemo(() => {
    const sourceData: Record<string, number> = stats.bySource;
    
    return Object.entries(sourceData).map(([source, count]) => ({
      name: source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      fill: SOURCE_COLORS[source] || '#a78bfa'
    }));
  }, [stats.bySource]);
  
  // Prepare data for lead status distribution
  const leadStatusData = useMemo(() => {
    const statusData: Record<string, number> = stats.byStatus;
    
    return Object.entries(statusData).map(([status, count], index) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      fill: COLORS[index % COLORS.length]
    }));
  }, [stats.byStatus]);

  return (
    <div className="space-y-6">
      <Card className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground">Lead Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-6">
          <div className="flex items-center mb-6 mt-2">
            <DateRangeFilter 
              onRangeChange={(start, end) => {
                // The useDateRange hook already handles the state
              }}
            />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border shadow-md p-3 rounded-md">
                          <p className="text-card-foreground font-medium">{`${payload[0].name}`}</p>
                          <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                          <p className="text-muted-foreground text-sm">
                            {payload[0].name !== 'Total Calls' && leadFunnelData[0].value > 0 &&
                              `Conversion: ${Math.round((Number(payload[0].value) / Number(leadFunnelData[0].value)) * 100)}%`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={leadFunnelData}
                  isAnimationActive
                />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-card-foreground">Lead Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border shadow-md p-3 rounded-md">
                            <p className="text-card-foreground font-medium">{`${payload[0].name}`}</p>
                            <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                            <p className="text-muted-foreground text-sm">
                              {`Percentage: ${Math.round((Number(payload[0].value) / Number(leadSourceData.reduce((sum, item) => sum + Number(item.value), 0))) * 100)}%`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-card-foreground">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadStatusData}
                  margin={isMobile ? { top: 5, right: 10, left: -20, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border shadow-md p-3 rounded-md">
                            <p className="text-card-foreground font-medium">{`${payload[0].name}`}</p>
                            <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                            <p className="text-muted-foreground text-sm">
                              {`Percentage: ${Math.round((Number(payload[0].value) / Number(leadStatusData.reduce((sum, item) => sum + Number(item.value), 0))) * 100)}%`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadAnalytics;