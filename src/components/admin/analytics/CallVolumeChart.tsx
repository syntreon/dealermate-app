import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/utils/formatting';
import { format, parseISO } from 'date-fns';

interface CallVolumeChartProps {
  data: Array<{
    date: string;
    calls: number;
    leads: number;
    revenue: number;
  }>;
}

export const CallVolumeChart: React.FC<CallVolumeChartProps> = ({ data }) => {
  // Transform data for the chart
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    conversionRate: item.calls > 0 ? (item.leads / item.calls * 100) : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            Calls: {formatNumber(data.calls)}
          </p>
          <p className="text-sm text-green-600">
            Leads: {formatNumber(data.leads)}
          </p>
          <p className="text-sm text-purple-600">
            Conversion: {data.conversionRate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const totalCalls = data.reduce((sum, item) => sum + item.calls, 0);
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);
  const avgConversion = totalCalls > 0 ? (totalLeads / totalCalls * 100) : 0;
  const maxCalls = Math.max(...data.map(item => item.calls));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Volume & Conversion</CardTitle>
        <CardDescription>Daily call volume and lead conversion trends</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(totalCalls)}
            </div>
            <div className="text-xs text-muted-foreground">Total Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(totalLeads)}
            </div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {avgConversion.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Conversion</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                fontSize={12}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="calls" 
                fill="#3b82f6" 
                name="Calls"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                yAxisId="left"
                dataKey="leads" 
                fill="#22c55e" 
                name="Leads"
                radius={[2, 2, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="conversionRate" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Conversion Rate (%)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Peak Call Day:</span>
            <span className="text-sm font-medium">{formatNumber(maxCalls)} calls</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Daily Average:</span>
            <span className="text-sm font-medium">{formatNumber(Math.round(totalCalls / data.length))} calls</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};