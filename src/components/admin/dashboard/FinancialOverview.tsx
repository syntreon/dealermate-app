import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Target, Percent, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatting';

interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  growthTrends: {
    revenueGrowth: number;
    costGrowth: number;
    profitGrowth: number;
  };
}

interface FinancialOverviewProps {
  metrics: FinancialMetrics;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-emerald-500 bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.totalRevenue, 'CAD')}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +{metrics.growthTrends.revenueGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-destructive bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Costs</CardTitle>
          <CreditCard className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(metrics.totalCosts, 'CAD')}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +{metrics.growthTrends.costGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(metrics.netProfit, 'CAD')}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +{metrics.growthTrends.profitGrowth}% from last month
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-violet-500 bg-card text-card-foreground border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
          <Percent className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {metrics.profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Average across all clients
          </p>
        </CardContent>
      </Card>
    </div>
  );
};