import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Users, Phone, UserCheck } from 'lucide-react';
import { formatNumber, formatPercentage } from '@/utils/formatting';

interface ConversionFunnelChartProps {
  totalCalls: number;
  totalLeads: number;
  conversionRate: number;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  totalCalls,
  totalLeads,
  conversionRate
}) => {
  // Calculate funnel stages
  const stages = [
    {
      name: 'Total Calls',
      value: totalCalls,
      percentage: 100,
      icon: Phone,
      color: 'bg-blue-500'
    },
    {
      name: 'Qualified Calls',
      value: Math.floor(totalCalls * 0.8), // Assume 80% are qualified
      percentage: 80,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      name: 'Interested Prospects',
      value: Math.floor(totalCalls * 0.4), // Assume 40% show interest
      percentage: 40,
      icon: TrendingDown,
      color: 'bg-orange-500'
    },
    {
      name: 'Generated Leads',
      value: totalLeads,
      percentage: conversionRate,
      icon: UserCheck,
      color: 'bg-green-500'
    }
  ];

  const maxValue = Math.max(...stages.map(stage => stage.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>Call to lead conversion breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Conversion Rate */}
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-3xl font-bold text-green-600">
            {formatPercentage(conversionRate)}
          </div>
          <div className="text-sm text-muted-foreground">Overall Conversion Rate</div>
        </div>

        {/* Funnel Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const widthPercentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            
            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {formatNumber(stage.value)}
                    </Badge>
                    <Badge variant="secondary">
                      {formatPercentage(stage.percentage)}
                    </Badge>
                  </div>
                </div>
                
                {/* Visual funnel bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-8 flex items-center">
                    <div 
                      className={`${stage.color} h-6 rounded-full mx-1 flex items-center justify-center text-white text-xs font-medium transition-all duration-500`}
                      style={{ width: `${Math.max(widthPercentage, 10)}%` }}
                    >
                      {stage.value > 0 && formatNumber(stage.value)}
                    </div>
                  </div>
                </div>
                
                {/* Drop-off indicator */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center">
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {formatPercentage(stages[index + 1].percentage - stage.percentage)} drop-off
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatNumber(totalCalls - totalLeads)}
            </div>
            <div className="text-xs text-muted-foreground">Calls Lost</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {totalCalls > 0 ? formatPercentage((totalLeads / totalCalls) * 100) : '0%'}
            </div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};