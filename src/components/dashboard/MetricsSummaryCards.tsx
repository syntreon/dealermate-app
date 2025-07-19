import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Clock, ArrowRightLeft, Users } from 'lucide-react';

interface MetricsSummaryCardsProps {
  metrics: {
    totalCalls: number;
    averageHandleTime: string;
    callsTransferred: number;
    totalLeads: number;
    callsGrowth?: number;
    timeGrowth?: number;
    transferGrowth?: number;
    leadsGrowth?: number;
  };
  isLoading?: boolean;
}

const MetricsSummaryCards: React.FC<MetricsSummaryCardsProps> = ({ 
  metrics, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card shadow-sm">
            <CardContent className="pt-6">
              <div className="h-20 animate-pulse bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If there's no data, show empty state
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card shadow-sm">
            <CardContent className="pt-6 flex flex-col items-center justify-center h-32">
              <p className="text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Calls",
      value: metrics.totalCalls,
      icon: <Phone className="h-5 w-5 text-primary" />,
      growth: metrics.callsGrowth,
      format: (value: number) => value.toLocaleString()
    },
    {
      title: "Average Handle Time",
      value: metrics.averageHandleTime,
      icon: <Clock className="h-5 w-5 text-primary" />,
      growth: metrics.timeGrowth,
      format: (value: string) => value
    },
    {
      title: "Calls Transferred",
      value: metrics.callsTransferred,
      icon: <ArrowRightLeft className="h-5 w-5 text-primary" />,
      growth: metrics.transferGrowth,
      format: (value: number) => value.toLocaleString()
    },
    {
      title: "Total Leads",
      value: metrics.totalLeads,
      icon: <Users className="h-5 w-5 text-primary" />,
      growth: metrics.leadsGrowth,
      format: (value: number) => value.toLocaleString()
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="bg-card shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-sm">{card.title}</span>
              <div className="bg-primary/10 p-2 rounded-lg">
                {card.icon}
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2 text-card-foreground">
              {card.format(card.value as any)}
            </h3>
            {card.growth !== undefined && (
              <div className="flex items-center">
                <span className={`text-xs ${card.growth >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {card.growth >= 0 ? '↑' : '↓'} {Math.abs(card.growth)}% 
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsSummaryCards;