import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Calculator, TrendingUp, TrendingDown, DollarSign, Users, AlertCircle } from 'lucide-react';
import { MetricsCalculationService, FinancialMetrics, CostBreakdown, ClientProfitability } from '@/services/metricsCalculationService';
import { formatCurrency, formatNumber } from '@/utils/formatting';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinancialTabProps {
  // No props needed - component fetches its own data
}

export const FinancialTab: React.FC<FinancialTabProps> = () => {
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [clientProfitability, setClientProfitability] = useState<ClientProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all financial data in parallel
      const [metrics, costs, profitability] = await Promise.all([
        MetricsCalculationService.getFinancialMetrics('current_month'),
        MetricsCalculationService.getCostBreakdown(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          new Date() // Current date
        ),
        MetricsCalculationService.getClientProfitability('current_month')
      ]);

      setFinancialMetrics(metrics);
      setCostBreakdown(costs);
      setClientProfitability(profitability);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load financial data';
      setError(errorMessage);
      toast({
        title: 'Error Loading Financial Data',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate main cost categories for high-level overview
  const getMainCostCategories = (costs: CostBreakdown) => {
    const total = costs.totalCosts;
    if (total === 0) return [];

    return [
      { name: 'Call Costs', value: costs.totalCallCosts, percentage: (costs.totalCallCosts / total) * 100, color: 'text-slate-700 dark:text-slate-300' },
      { name: 'Tool Costs', value: costs.toolCosts, percentage: (costs.toolCosts / total) * 100, color: 'text-red-600 dark:text-red-400' },
      { name: 'Partner Splits', value: costs.partnerSplits, percentage: (costs.partnerSplits / total) * 100, color: 'text-amber-600 dark:text-amber-400' },
      { name: 'Finder\'s Fees', value: costs.findersFees, percentage: (costs.findersFees / total) * 100, color: 'text-pink-600 dark:text-pink-400' },
    ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  };

  // Calculate call cost breakdown for detailed view
  const getCallCostBreakdown = (costs: CostBreakdown) => {
    if (costs.totalCallCosts === 0) return [];

    return [
      { name: 'AI Costs', value: costs.aiCosts, percentage: (costs.aiCosts / costs.totalCallCosts) * 100, color: 'text-blue-600 dark:text-blue-400', subcategories: [] },
      { 
        name: 'VAPI Costs', 
        value: costs.vapiCosts + costs.vapiLlmCosts, // Total VAPI including LLM
        percentage: ((costs.vapiCosts + costs.vapiLlmCosts) / costs.totalCallCosts) * 100, 
        color: 'text-green-600 dark:text-green-400',
        subcategories: costs.vapiLlmCosts > 0 ? [
          { name: 'VAPI LLM', value: costs.vapiLlmCosts, percentage: (costs.vapiLlmCosts / (costs.vapiCosts + costs.vapiLlmCosts)) * 100, color: 'text-emerald-600 dark:text-emerald-400' }
        ] : []
      },
      { name: 'Twilio Costs', value: costs.twilioCosts, percentage: (costs.twilioCosts / costs.totalCallCosts) * 100, color: 'text-purple-600 dark:text-purple-400', subcategories: [] },
      { name: 'SMS Costs', value: costs.smsCosts, percentage: (costs.smsCosts / costs.totalCallCosts) * 100, color: 'text-orange-600 dark:text-orange-400', subcategories: [] },
    ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-card text-card-foreground border-border">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="bg-card text-card-foreground border-border border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error Loading Financial Data</span>
            </div>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainCostCategories = costBreakdown ? getMainCostCategories(costBreakdown) : [];
  const callCostBreakdown = costBreakdown ? getCallCostBreakdown(costBreakdown) : [];

  return (
    <div className="space-y-6">
      {/* Cost Breakdown and Profitability Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 4.1 Cost Breakdown Visualization */}
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <PieChart className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Monthly operational costs by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {costBreakdown && mainCostCategories.length > 0 ? (
              <div className="space-y-6">
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(costBreakdown.totalCosts, 'CAD')}
                </div>
                
                {/* Main Cost Categories */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cost Categories</h4>
                  {mainCostCategories.map((cost, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{cost.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${cost.color}`}>
                            {formatCurrency(cost.value, 'CAD')}
                          </span>
                          <span className="text-muted-foreground">
                            ({cost.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={cost.percentage} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
                
                {/* Call Cost Breakdown */}
                {callCostBreakdown.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Call Cost Breakdown</h4>
                    <div className="text-lg font-semibold text-foreground mb-2">
                      {formatCurrency(costBreakdown.totalCallCosts, 'CAD')} total call costs
                    </div>
                    {callCostBreakdown.map((cost, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{cost.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${cost.color}`}>
                              {formatCurrency(cost.value, 'CAD')}
                            </span>
                            <span className="text-muted-foreground">
                              ({cost.percentage.toFixed(1)}% of calls)
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={cost.percentage} 
                          className="h-1.5" 
                        />
                        
                        {/* VAPI LLM Subcategory */}
                        {cost.subcategories && cost.subcategories.length > 0 && (
                          <div className="ml-4 mt-2 space-y-1">
                            {cost.subcategories.map((subCost, subIndex) => (
                              <div key={subIndex} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">↳ {subCost.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${subCost.color}`}>
                                    {formatCurrency(subCost.value, 'CAD')}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ({subCost.percentage.toFixed(1)}% of VAPI)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No cost data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4.2 Profitability Analysis */}
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calculator className="h-5 w-5" />
              Profitability Analysis
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Revenue vs costs breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {financialMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(financialMetrics.totalRevenue, 'CAD')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Costs</p>
                    <p className="text-xl font-bold text-destructive">
                      {formatCurrency(financialMetrics.totalCosts, 'CAD')}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Net Profit</span>
                    <div className="flex items-center gap-1">
                      {financialMetrics.netProfit >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-xl font-bold ${
                        financialMetrics.netProfit >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-destructive'
                      }`}>
                        {formatCurrency(financialMetrics.netProfit, 'CAD')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profit Margin</span>
                    <span className={`text-lg font-semibold ${
                      financialMetrics.profitMargin >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-destructive'
                    }`}>
                      {financialMetrics.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No profitability data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4.3 Client Profitability Ranking */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            Client Profitability Ranking
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Revenue, costs, profit, and margin by client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientProfitability.length > 0 ? (
            isMobile ? (
              // Mobile card layout
              <div className="space-y-4">
                {clientProfitability.map((client, index) => (
                  <Card key={client.id} className="bg-muted/50 border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground">#{index + 1}</span>
                          <span className="font-medium text-foreground">{client.name}</span>
                        </div>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(client.revenue, 'CAD')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Costs</p>
                          <p className="font-medium text-destructive">
                            {formatCurrency(client.costs, 'CAD')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Profit</p>
                          <p className={`font-medium ${
                            client.profit >= 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-destructive'
                          }`}>
                            {formatCurrency(client.profit, 'CAD')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margin</p>
                          <p className={`font-medium ${
                            client.margin >= 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-destructive'
                          }`}>
                            {client.margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        <span>{formatNumber(client.callVolume)} calls</span>
                        <span>{client.leadConversion.toFixed(1)}% conversion</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop table layout
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costs</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientProfitability.map((client, index) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(client.revenue, 'CAD')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(client.costs, 'CAD')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          client.profit >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-destructive'
                        }`}>
                          {formatCurrency(client.profit, 'CAD')}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          client.margin >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-destructive'
                        }`}>
                          {client.margin.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatNumber(client.callVolume)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {client.leadConversion.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No client profitability data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};