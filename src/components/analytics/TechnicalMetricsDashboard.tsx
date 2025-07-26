import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Clock,
  Coins,
  CreditCard,
  AlertCircle,
  Terminal,
  Cpu,
  DatabaseIcon,
  Gauge,
  ArrowRight,
  CheckCircle2,
  XCircle,
  PanelRightOpen,
  BarChart2,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { TechnicalMetricsData, PerformanceDiagnostic } from '@/types/aiAccuracyAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface TechnicalMetricsDashboardProps {
  technicalMetrics?: TechnicalMetricsData;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Technical Metrics Dashboard displays detailed technical performance metrics 
 * for AI models, including response times, token usage, and cost efficiency.
 */
const TechnicalMetricsDashboard: React.FC<TechnicalMetricsDashboardProps> = ({
  technicalMetrics,
  isLoading = false,
  error = null
}) => {
  // Helper function to format milliseconds into readable format
  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Helper function to format cost
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}`;
  };

  // Helper function to get color based on severity
  const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
    switch (severity) {
      case 'low':
        return 'text-emerald-500';
      case 'medium':
        return 'text-amber-500';
      case 'high':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };
  
  // Helper function to get class for performance status
  const getPerformanceStatusClass = (status: 'optimal' | 'warning' | 'critical'): string => {
    switch (status) {
      case 'optimal':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  // Helper function to get icon for performance status
  const getPerformanceStatusIcon = (status: 'optimal' | 'warning' | 'critical') => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border border-border bg-card">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="border border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Technical Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!technicalMetrics) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Technical Metrics</CardTitle>
          <CardDescription>
            No technical metrics data available for the selected filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Try adjusting your filter criteria or selecting a different date range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Time Metrics */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Response Time Metrics
          </CardTitle>
          <CardDescription>
            Analysis of model response times and latency performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Average Response Time</p>
              <p className="text-2xl font-bold">
                {formatResponseTime(technicalMetrics.responseTimeStats.avg)}
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Median Response Time</p>
              <p className="text-2xl font-bold">
                {formatResponseTime(technicalMetrics.responseTimeStats.median)}
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">95th Percentile</p>
              <p className="text-2xl font-bold">
                {formatResponseTime(technicalMetrics.responseTimeStats.p95)}
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Maximum Response Time</p>
              <p className="text-2xl font-bold">
                {formatResponseTime(technicalMetrics.responseTimeStats.p99)}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={technicalMetrics.responseTimeTrend}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Response Time (ms)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: 'var(--muted-foreground)' } 
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}
                labelStyle={{ color: 'var(--card-foreground)' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="var(--primary)" 
                activeDot={{ r: 8 }} 
                name="Average Response Time"
              />
              <Line 
                type="monotone" 
                dataKey="p95" 
                stroke="var(--amber-500)" 
                strokeDasharray="5 5" 
                name="95th Percentile"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Token Usage Analysis */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            Token Usage Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of token consumption and efficiency metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg Input Tokens</p>
              <p className="text-2xl font-bold">
                {technicalMetrics.tokenUsageStats.avgInputTokens.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Per Conversation
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg Output Tokens</p>
              <p className="text-2xl font-bold">
                {technicalMetrics.tokenUsageStats.avgOutputTokens.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Per Conversation
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Token Usage</p>
              <p className="text-2xl font-bold">
                {technicalMetrics.tokenUsageStats.totalTokens.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For Selected Period
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={technicalMetrics.tokenDistributionByModel}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="modelName" 
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Average Tokens', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: 'var(--muted-foreground)' } 
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)'
                }}
                labelStyle={{ color: 'var(--card-foreground)' }}
              />
              <Legend />
              <Bar dataKey="inputTokens" fill="var(--blue-500)" name="Input Tokens" />
              <Bar dataKey="outputTokens" fill="var(--emerald-500)" name="Output Tokens" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Efficiency Metrics */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Cost Efficiency Metrics
          </CardTitle>
          <CardDescription>
            Analysis of cost per conversation and cost efficiency by model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Average Cost Per Call</p>
              <p className="text-2xl font-bold">
                {formatCost(technicalMetrics.costEfficiencyMetrics.avgCostPerCall)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                USD per conversation
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Cost Per 1k Tokens</p>
              <p className="text-2xl font-bold">
                {formatCost(technicalMetrics.costEfficiencyMetrics.avgCostPer1kTokens)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Average across models
              </p>
            </div>
            <div className="p-4 border rounded-md bg-card/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Cost-Accuracy Ratio</p>
              <p className="text-2xl font-bold">
                {technicalMetrics.costEfficiencyMetrics.costAccuracyRatio.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lower is better (cost per accuracy point)
              </p>
            </div>
          </div>

          <Tabs defaultValue="cost-trend">
            <TabsList className="mb-4">
              <TabsTrigger value="cost-trend">Cost Trends</TabsTrigger>
              <TabsTrigger value="cost-model">Cost by Model</TabsTrigger>
              <TabsTrigger value="cost-accuracy">Cost vs Accuracy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cost-trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={technicalMetrics.costTrend}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    label={{ 
                      value: 'Cost (USD)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fill: 'var(--muted-foreground)' } 
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)'
                    }}
                    labelStyle={{ color: 'var(--card-foreground)' }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="var(--primary)" 
                    name="Average Cost Per Call"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="cost-model">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={technicalMetrics.costByModel}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="modelName" 
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12 }}
                    label={{ 
                      value: 'Cost (USD)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fill: 'var(--muted-foreground)' } 
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)'
                    }}
                    labelStyle={{ color: 'var(--card-foreground)' }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                  <Legend />
                  <Bar dataKey="avgCost" fill="var(--violet-500)" name="Avg Cost Per Call" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="cost-accuracy">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    type="number"
                    dataKey="cost"
                    name="Cost"
                    stroke="var(--muted-foreground)"
                    label={{ 
                      value: 'Cost Per Call (USD)', 
                      position: 'bottom', 
                      offset: 0,
                      style: { fill: 'var(--muted-foreground)' } 
                    }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    type="number"
                    dataKey="accuracy"
                    name="Accuracy"
                    stroke="var(--muted-foreground)"
                    label={{ 
                      value: 'Accuracy Score', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fill: 'var(--muted-foreground)' } 
                    }}
                    domain={[0, 5]}
                  />
                  <ZAxis
                    type="number"
                    dataKey="callVolume"
                    range={[50, 500]}
                    name="Call Volume"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === "Cost") return [`$${value.toFixed(4)}`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Scatter 
                    name="Models" 
                    data={technicalMetrics.costAccuracyCorrelation} 
                    fill="var(--primary)"
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Bubble size represents call volume. Top-right models have highest accuracy but higher cost. 
                Top-left models have best cost-efficiency ratio.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Diagnostics */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Performance Diagnostics
          </CardTitle>
          <CardDescription>
            System performance issues and recommended remediation steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          {technicalMetrics.performanceDiagnostics.length === 0 ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <p className="flex items-center text-emerald-500 font-medium">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                All systems operating within optimal parameters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {technicalMetrics.performanceDiagnostics.map((diagnostic, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-md ${getPerformanceStatusClass(diagnostic.status)}`}
                >
                  <div className="flex items-center gap-2 font-medium mb-2">
                    {getPerformanceStatusIcon(diagnostic.status)}
                    {diagnostic.issue}
                  </div>
                  <p className="text-sm mb-2">{diagnostic.description}</p>
                  {diagnostic.impact && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Impact:</p>
                      <p className="text-sm">{diagnostic.impact}</p>
                    </div>
                  )}
                  {diagnostic.remediation && (
                    <div className="mt-3 border-t pt-2 border-border/60">
                      <p className="text-xs font-medium mb-1">Recommended Steps:</p>
                      <ul className="text-sm space-y-1">
                        {(Array.isArray(diagnostic.remediation) ? diagnostic.remediation : [diagnostic.remediation]).map((step, stepIndex) => (
                          <li key={stepIndex} className="flex">
                            <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Technical and Accuracy Correlation
          </CardTitle>
          <CardDescription>
            How technical metrics correlate with model accuracy and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {technicalMetrics.correlationAnalysis.map((correlation, index) => (
              <div key={index} className="p-4 border rounded-md bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{correlation.factor}</p>
                  <Badge variant={
                    Math.abs(correlation.correlationStrength) > 0.7 ? "default" : 
                    Math.abs(correlation.correlationStrength) > 0.4 ? "outline" : "secondary"
                  }>
                    {Math.abs(correlation.correlationStrength) > 0.7 ? "Strong" : 
                     Math.abs(correlation.correlationStrength) > 0.4 ? "Moderate" : "Weak"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-full bg-muted/50 h-2 rounded-full overflow-hidden"
                    title={`Correlation: ${correlation.correlationStrength.toFixed(2)}`}
                  >
                    <div 
                      className={`h-full rounded-full ${
                        correlation.correlationStrength > 0 ? 'bg-emerald-500' : 'bg-destructive'
                      }`}
                      style={{ 
                        width: `${Math.abs(correlation.correlationStrength * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {correlation.correlationStrength.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {correlation.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 border rounded-md bg-card/50">
            <p className="text-sm font-medium mb-2">Key Performance Insights:</p>
            <ul className="space-y-2">
              {technicalMetrics.performanceInsights.map((insight, index) => (
                <li key={index} className="text-sm flex gap-2">
                  <Timer className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
const getPerformanceStatusClass = (status: 'optimal' | 'good' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'optimal':
      return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800';
    case 'good':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
    case 'warning':
      return 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800';
    case 'critical':
      return 'bg-destructive/10 border-destructive/20';
    default:
      return 'bg-muted border-border';
  }
};

const getPerformanceStatusIcon = (status: 'optimal' | 'good' | 'warning' | 'critical') => {
  switch (status) {
    case 'optimal':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'good':
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'critical':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatResponseTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`;
  } else {
    return `${(timeMs / 1000).toFixed(2)}s`;
  }
};

export default TechnicalMetricsDashboard;
