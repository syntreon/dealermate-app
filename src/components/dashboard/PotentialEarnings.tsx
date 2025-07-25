import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMediaQuery } from '@/hooks/use-media-query';
import { type TooltipProps } from 'recharts';

interface PotentialEarningsProps {
  totalCalls: number;
  totalLeads: number;
  isLoading: boolean;
}

const LEAD_VALUE = 1200;

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover p-2 text-sm shadow-sm transition-all">
        <div className="flex flex-col space-y-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-bold text-popover-foreground">
            {payload[0].value.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const PotentialEarnings: React.FC<PotentialEarningsProps> = ({ totalCalls, totalLeads, isLoading }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  const potentialEarnings = totalLeads * LEAD_VALUE;

  const chartData = [
    {
      name: 'Calls',
      value: totalCalls,
    },
    {
      name: 'Leads',
      value: totalLeads,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunity Value</CardTitle>
        <CardDescription>
          Based on a potential value of {formatCurrency(LEAD_VALUE)} per lead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center my-4">
            <p className="text-sm text-muted-foreground">Potential Value</p>
            <p className="text-4xl font-bold text-primary">{formatCurrency(potentialEarnings)}</p>
        </div>
        
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: isDesktop ? 5 : -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                interval="preserveStartEnd"
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={isDesktop ? 12 : 11}
                tickLine={false}
                axisLine={false}
                width={isDesktop ? 85 : 60}
                textAnchor="end"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="value" barSize={18} radius={[4, 4, 4, 4]}>
                {chartData.map((entry) => {
                  let color = 'hsl(var(--primary))'; // Default for Calls
                  if (entry.name === 'Leads') color = '#f59e0b'; // Orange
                  return <Cell key={entry.name} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
