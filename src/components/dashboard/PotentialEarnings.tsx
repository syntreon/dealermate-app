import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign } from 'lucide-react';
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
    const CONVERSION_RATE = 0.20;
  const convertedLeads = Math.floor(totalLeads * CONVERSION_RATE);
  const potentialEarnings = convertedLeads * LEAD_VALUE;

  const chartData = [
    {
      name: 'Calls',
      value: totalCalls,
    },
    {
      name: 'Leads',
      value: totalLeads,
    },
    {
      name: 'Converted Leads',
      value: convertedLeads,
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
    <Card className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-card-foreground">Opportunity Value</CardTitle> {/* OLD value: Potential Earnings */}
        <CardDescription>Based on lead value and call volume.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="flex items-center justify-center p-6 rounded-lg bg-muted/50 border border-dashed">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Opportunity Value</p> {/* OLD value: Potential Earnings */}
            <p className="text-4xl font-bold text-primary">{formatCurrency(potentialEarnings)}</p>
          </div>
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
                  if (entry.name === 'Leads') color = '#f59e0b'; // Orange from Quality Analytics
                  if (entry.name === 'Converted Leads') color = '#10b981'; // Green from Quality Analytics
                  return <Cell key={entry.name} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-muted-foreground pt-2">
          *Calculations use a 20% conversion rate and a potential value of {formatCurrency(LEAD_VALUE)} per converted lead.
        </p>
      </CardContent>
    </Card>
  );
};
