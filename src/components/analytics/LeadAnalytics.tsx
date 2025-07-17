import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart, Funnel, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLeads } from '@/context/LeadContext';
import { useCalls } from '@/context/CallsContext';

// Colors for status chart
const COLORS = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

// Source colors
const SOURCE_COLORS: Record<string, string> = {
  website: '#a78bfa',
  direct_call: '#8b5cf6',
  referral: '#7c3aed',
  social_media: '#6d28d9',
  other: '#5b21b6'
};

interface LeadAnalyticsProps {
  clientId?: string;
}

const LeadAnalytics: React.FC<LeadAnalyticsProps> = ({ clientId }) => {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const isMobile = useIsMobile();
  const { leads, stats } = useLeads();
  const { calls } = useCalls();
  
  // Prepare data for lead conversion funnel
  const leadFunnelData = useMemo(() => {
    // For a real implementation, we would filter by date range based on chartPeriod
    return [
      { value: calls.length, name: 'Total Calls', fill: '#a78bfa' },
      { value: leads.length, name: 'Total Leads', fill: '#8b5cf6' },
      { value: leads.filter(lead => lead.status === 'qualified').length, name: 'Qualified Leads', fill: '#7c3aed' },
      { value: leads.filter(lead => lead.status === 'proposal').length, name: 'Proposals', fill: '#6d28d9' },
      { value: leads.filter(lead => lead.status === 'closed_won').length, name: 'Conversions', fill: '#5b21b6' },
    ];
  }, [calls.length, leads, chartPeriod]);
  
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
      <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Lead Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-6">
          <div className="flex items-center mb-6 mt-2">
            <div className="bg-gray-100 p-1 rounded-lg flex space-x-2">
              <Button 
                size="sm" 
                variant={chartPeriod === 'daily' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'daily' ? 'bg-primary hover:bg-primary/80' : 'text-[#6B7280] hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('daily')}
              >
                Daily
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'weekly' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'weekly' ? 'bg-primary hover:bg-primary/80' : 'text-gray-600 hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'monthly' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'monthly' ? 'bg-primary hover:bg-primary/80' : 'text-gray-600 hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-200 shadow-md p-3 rounded-md">
                          <p className="text-gray-700 font-medium">{`${payload[0].name}`}</p>
                          <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                          <p className="text-gray-600 text-sm">
                            {payload[0].name !== 'Total Calls' && leadFunnelData[0].value > 0 &&
                              `Conversion: ${Math.round((payload[0].value / leadFunnelData[0].value) * 100)}%`}
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
        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Lead Source Distribution</CardTitle>
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
                          <div className="bg-white border border-gray-200 shadow-md p-3 rounded-md">
                            <p className="text-gray-700 font-medium">{`${payload[0].name}`}</p>
                            <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                            <p className="text-gray-600 text-sm">
                              {`Percentage: ${Math.round((payload[0].value / leadSourceData.reduce((sum, item) => sum + item.value, 0)) * 100)}%`}
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

        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={leadStatusData}
                  margin={isMobile ? { top: 5, right: 10, left: -20, bottom: 5 } : { top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="name" stroke="#4b5563" />
                  <YAxis stroke="#4b5563" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-gray-200 shadow-md p-3 rounded-md">
                            <p className="text-gray-700 font-medium">{`${payload[0].name}`}</p>
                            <p className="text-primary">{`Count: ${payload[0].value}`}</p>
                            <p className="text-gray-600 text-sm">
                              {`Percentage: ${Math.round((payload[0].value / leadStatusData.reduce((sum, item) => sum + item.value, 0)) * 100)}%`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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