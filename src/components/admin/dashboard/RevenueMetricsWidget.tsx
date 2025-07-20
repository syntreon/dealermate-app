import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatNumber } from '@/utils/formatting';

interface RevenueMetrics {
  totalMonthlyRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  averageRevenuePerClient: number;
  topRevenueClients: Array<{
    name: string;
    revenue: number;
    percentage: number;
  }>;
}

interface RevenueMetricsWidgetProps {
  totalRevenue: number;
}

export const RevenueMetricsWidget: React.FC<RevenueMetricsWidgetProps> = ({ totalRevenue }) => {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRevenueMetrics = async () => {
    try {
      // Get client revenue data
      const { data: clients } = await supabase
        .from('clients')
        .select('name, monthly_billing_amount_cad, average_monthly_ai_cost_usd, average_monthly_misc_cost_usd')
        .eq('status', 'active');

      if (!clients) return;

      // Calculate total costs (convert USD to CAD with approximate rate)
      const usdToCadRate = 1.35; // Approximate conversion rate
      const totalCosts = clients.reduce((sum, client) => 
        sum + (client.average_monthly_ai_cost_usd + client.average_monthly_misc_cost_usd) * usdToCadRate, 0
      );

      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const averageRevenuePerClient = clients.length > 0 ? totalRevenue / clients.length : 0;

      // Get top revenue clients
      const topRevenueClients = clients
        .sort((a, b) => b.monthly_billing_amount_cad - a.monthly_billing_amount_cad)
        .slice(0, 5)
        .map(client => ({
          name: client.name,
          revenue: client.monthly_billing_amount_cad,
          percentage: totalRevenue > 0 ? (client.monthly_billing_amount_cad / totalRevenue) * 100 : 0
        }));

      setMetrics({
        totalMonthlyRevenue: totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        averageRevenuePerClient,
        topRevenueClients
      });
    } catch (error) {
      console.error('Failed to load revenue metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRevenueMetrics();
  }, [totalRevenue]);

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Metrics
          </CardTitle>
          <CardDescription>Financial performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Metrics
        </CardTitle>
        <CardDescription>Financial performance overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Financial Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(metrics.totalMonthlyRevenue, 'CAD')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Costs</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(metrics.totalCosts, 'CAD')}
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Net Profit</span>
            <div className="flex items-center gap-2">
              {metrics.netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.netProfit, 'CAD')}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Profit Margin</span>
            <Badge variant={metrics.profitMargin >= 20 ? 'default' : metrics.profitMargin >= 10 ? 'secondary' : 'destructive'}>
              {metrics.profitMargin.toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Revenue/Client</span>
            <span className="font-medium">
              {formatCurrency(metrics.averageRevenuePerClient, 'CAD')}
            </span>
          </div>
        </div>

        {/* Top Revenue Clients */}
        {metrics.topRevenueClients.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Top Revenue Contributors</h4>
            <div className="space-y-2">
              {metrics.topRevenueClients.slice(0, 3).map((client, index) => (
                <div key={client.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{client.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(client.revenue, 'CAD')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};