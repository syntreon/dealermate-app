import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Calendar,
  User,
  Bot,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDrillDownState } from '@/hooks/useAIAccuracyFilters';
import { cn } from '@/lib/utils';

interface AIAccuracyDrillDownProps {
  drillDownData: any;
  loading: boolean;
  onBack: () => void;
  onDrillDown: (level: string, context?: any) => void;
  breadcrumbs: Array<{
    level: string;
    context?: any;
    isLast: boolean;
  }>;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AIAccuracyDrillDown: React.FC<AIAccuracyDrillDownProps> = ({
  drillDownData,
  loading,
  onBack,
  onDrillDown,
  breadcrumbs,
  className
}) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!drillDownData) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Overview</span>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="h-3 w-3" />
                  <span className={cn(
                    crumb.isLast ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {formatBreadcrumbLabel(crumb.level, crumb.context)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DrillDownContent 
          data={drillDownData} 
          onDrillDown={onDrillDown}
        />
      </CardContent>
    </Card>
  );
};

interface DrillDownContentProps {
  data: any;
  onDrillDown: (level: string, context?: any) => void;
}

const DrillDownContent: React.FC<DrillDownContentProps> = ({ data, onDrillDown }) => {
  // Model drill-down view
  if (data.modelName) {
    return <ModelDrillDownView data={data} onDrillDown={onDrillDown} />;
  }

  // Client drill-down view
  if (data.clientId) {
    return <ClientDrillDownView data={data} onDrillDown={onDrillDown} />;
  }

  // Date drill-down view
  if (data.date && data.hourlyDistribution) {
    return <DateDrillDownView data={data} onDrillDown={onDrillDown} />;
  }

  // Failure drill-down view
  if (data.failureCategory) {
    return <FailureDrillDownView data={data} onDrillDown={onDrillDown} />;
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        No drill-down data available for this selection.
      </AlertDescription>
    </Alert>
  );
};

const ModelDrillDownView: React.FC<{ data: any; onDrillDown: (level: string, context?: any) => void }> = ({ 
  data, 
  onDrillDown 
}) => {
  const { modelName, totalCalls, qualityMetrics, dailyPerformance, sampleCalls } = data;

  return (
    <div className="space-y-6">
      {/* Model Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {modelName} Performance Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalCalls}</div>
              <div className="text-sm text-muted-foreground">Total Calls</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {((qualityMetrics.clarity + qualityMetrics.naturalness + qualityMetrics.relevance) / 3).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Quality Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {qualityMetrics.leadIntent.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Lead Intent Score</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quality Metrics Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quality Metrics Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(qualityMetrics).map(([metric, value]) => (
              <div key={metric} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(value / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{value.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="averageQuality" 
                stroke="#8884d8" 
                name="Quality Score"
              />
              <Line 
                type="monotone" 
                dataKey="averageAdherence" 
                stroke="#82ca9d" 
                name="Adherence Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sample Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Calls Sample</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sampleCalls.slice(0, 5).map((call: any, index: number) => (
              <div key={call.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {new Date(call.created_at).toLocaleDateString()}
                  </Badge>
                  <span className="text-sm">Call #{call.id.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {call.lead_evaluations?.[0] && (
                    <Badge variant="secondary" className="text-xs">
                      Quality: {call.lead_evaluations[0].overall_evaluation_score?.toFixed(1) || 'N/A'}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDrillDown('call', { callId: call.id })}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ClientDrillDownView: React.FC<{ data: any; onDrillDown: (level: string, context?: any) => void }> = ({ 
  data, 
  onDrillDown 
}) => {
  const { clientId, clientMetrics, modelBreakdown, recentCalls } = data;

  return (
    <div className="space-y-6">
      {/* Client Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{clientMetrics.totalCalls}</div>
              <div className="text-sm text-muted-foreground">Total Calls</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{clientMetrics.modelsUsed}</div>
              <div className="text-sm text-muted-foreground">Models Used</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {Math.round(clientMetrics.averageCallDuration / 60)}m
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                ${clientMetrics.totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Cost</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Model Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={modelBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ modelName, callCount }) => `${modelName}: ${callCount}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="callCount"
              >
                {modelBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentCalls.slice(0, 10).map((call: any) => (
              <div key={call.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {new Date(call.created_at).toLocaleDateString()}
                  </Badge>
                  <span className="text-sm">{call.call_llm_model || 'Unknown Model'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDrillDown('model', { modelName: call.call_llm_model })}
                >
                  View Model
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DateDrillDownView: React.FC<{ data: any; onDrillDown: (level: string, context?: any) => void }> = ({ 
  data, 
  onDrillDown 
}) => {
  const { date, totalCalls, hourlyDistribution, modelBreakdown } = data;

  return (
    <div className="space-y-6">
      {/* Date Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {new Date(date).toLocaleDateString()} Analysis
        </h3>
        
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalCalls}</div>
            <div className="text-sm text-muted-foreground">Total Calls on {new Date(date).toLocaleDateString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hourly Call Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="callCount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model Breakdown for the Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Usage This Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {modelBreakdown.map((model: any) => (
              <div key={model.modelName} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{model.modelName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {model.callCount} calls
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDrillDown('model', { modelName: model.modelName })}
                  >
                    Analyze
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FailureDrillDownView: React.FC<{ data: any; onDrillDown: (level: string, context?: any) => void }> = ({ 
  data, 
  onDrillDown 
}) => {
  const { failureCategory, totalFailures, failureRate, affectedModels, failureExamples, modelBreakdown } = data;

  return (
    <div className="space-y-6">
      {/* Failure Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {failureCategory} Failures Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalFailures}</div>
              <div className="text-sm text-muted-foreground">Total Failures</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{failureRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Failure Rate</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{affectedModels.length}</div>
              <div className="text-sm text-muted-foreground">Affected Models</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Affected Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Affected Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {affectedModels.map((model: string) => (
              <Badge 
                key={model} 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => onDrillDown('model', { modelName: model })}
              >
                {model}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Failure Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Failure Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {failureExamples.map((example: any, index: number) => (
              <div key={example.callId} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {example.modelUsed}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(example.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                {example.whatWentWrong && (
                  <div className="text-sm">
                    <span className="font-medium">What went wrong:</span>
                    <p className="text-muted-foreground mt-1">
                      {Array.isArray(example.whatWentWrong) 
                        ? example.whatWentWrong.join(', ')
                        : example.whatWentWrong
                      }
                    </p>
                  </div>
                )}
                
                {example.recommendations && (
                  <div className="text-sm mt-2">
                    <span className="font-medium">Recommendations:</span>
                    <p className="text-muted-foreground mt-1">
                      {Array.isArray(example.recommendations) 
                        ? example.recommendations.join(', ')
                        : example.recommendations
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const formatBreadcrumbLabel = (level: string, context?: any): string => {
  switch (level) {
    case 'model':
      return context?.modelName || 'Model';
    case 'client':
      return context?.clientId || 'Client';
    case 'date':
      return context?.date ? new Date(context.date).toLocaleDateString() : 'Date';
    case 'failure':
      return context?.failureCategory || 'Failure';
    default:
      return level;
  }
};