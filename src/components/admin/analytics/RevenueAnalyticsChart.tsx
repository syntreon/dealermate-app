import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/utils/formatting';
import { format, parseISO } from 'date-fns';
import { CustomThemedTooltip, getThemeAwareCursorStyle } from '@/components/ui/themed-chart-tooltip';

interface RevenueAnalyticsChartProps {
  data: Array<{
    date: string;
    calls: number;
    leads: number;
    revenue: number;
  }>;
}

export const RevenueAnalyticsChart: React.FC<RevenueAnalyticsChartProps> = ({ data }) => {
  // Transform data for the chart
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    formattedRevenue: formatCurrency(item.revenue, 'CAD')
  }));

  const renderTooltipContent = (data: any, label?: string) => (
    <div className="space-y-2">
      <p className="font-medium text-popover-foreground">{label}</p>
      <div className="space-y-1">
        <p className="text-sm text-green-600 dark:text-green-400">
          Revenue: {formatCurrency(data.revenue, 'CAD')}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Calls: {data.calls}
        </p>
        <p className="text-sm text-purple-600 dark:text-purple-400">
          Leads: {data.leads}
        </p>
      </div>
    </div>
  );

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgDailyRevenue = totalRevenue / data.length;
  const maxRevenue = Math.max(...data.map(item => item.revenue));
  const minRevenue = Math.min(...data.map(item => item.revenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
        <CardDescription>Daily revenue trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue, 'CAD')}
            </div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(avgDailyRevenue, 'CAD')}
            </div>
            <div className="text-xs text-muted-foreground">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(maxRevenue, 'CAD')}
            </div>
            <div className="text-xs text-muted-foreground">Peak Day</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                fontSize={12}
              />
              <Tooltip 
                content={<CustomThemedTooltip render={renderTooltipContent} />}
                cursor={getThemeAwareCursorStyle()}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Highest Day:</span>
            <span className="text-sm font-medium">{formatCurrency(maxRevenue, 'CAD')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Lowest Day:</span>
            <span className="text-sm font-medium">{formatCurrency(minRevenue, 'CAD')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};