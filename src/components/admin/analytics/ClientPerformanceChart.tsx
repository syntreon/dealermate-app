import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Client } from '@/types/admin';
import { formatNumber } from '@/utils/formatting';
import { CustomThemedTooltip, getThemeAwareCursorStyle } from '@/components/ui/themed-chart-tooltip';

interface ClientPerformanceChartProps {
  clients: Client[];
}

export const ClientPerformanceChart: React.FC<ClientPerformanceChartProps> = ({ clients }) => {
  // Prepare data for the chart
  const chartData = clients
    .filter(client => client.metrics && (client.metrics.totalCalls > 0 || client.metrics.totalLeads > 0))
    .sort((a, b) => (b.metrics?.totalCalls || 0) - (a.metrics?.totalCalls || 0))
    .slice(0, 10) // Top 10 clients
    .map(client => ({
      name: client.name.length > 15 ? client.name.substring(0, 15) + '...' : client.name,
      fullName: client.name,
      calls: client.metrics?.totalCalls || 0,
      leads: client.metrics?.totalLeads || 0,
      conversionRate: client.metrics?.totalCalls ? 
        ((client.metrics.totalLeads || 0) / client.metrics.totalCalls * 100) : 0,
      status: client.status
    }));

  const getBarColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e'; // green
      case 'trial':
        return '#3b82f6'; // blue
      case 'inactive':
        return '#6b7280'; // gray
      case 'churned':
        return '#ef4444'; // red
      default:
        return '#8b5cf6'; // purple
    }
  };

  const renderTooltipContent = (data: any) => (
    <div className="space-y-2">
      <p className="font-medium text-popover-foreground">{data.fullName}</p>
      <div className="space-y-1">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Calls: {formatNumber(data.calls)}
        </p>
        <p className="text-sm text-green-600 dark:text-green-400">
          Leads: {formatNumber(data.leads)}
        </p>
        <p className="text-sm text-purple-600 dark:text-purple-400">
          Conversion: {data.conversionRate.toFixed(1)}%
        </p>
      </div>
      <Badge variant={data.status === 'active' ? 'default' : 'secondary'} className="mt-1">
        {data.status}
      </Badge>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Performance</CardTitle>
          <CardDescription>Call volume by client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Performance</CardTitle>
        <CardDescription>Call volume by top performing clients</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                content={<CustomThemedTooltip render={renderTooltipContent} />}
                cursor={getThemeAwareCursorStyle()}
              />
              <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-xs">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-xs">Trial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-xs">Inactive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-xs">Churned</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};