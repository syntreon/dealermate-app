import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Brain,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AIAccuracyAnalyticsService } from '@/services/aiAccuracyAnalyticsService';
import { AIAccuracyAnalyticsData, AIAccuracyFilters } from '@/types/aiAccuracyAnalytics';
import ModelComparisonVisualizations from './ModelComparisonVisualizations';
import FailurePatternAnalysis from './FailurePatternAnalysis';

interface AIAccuracyAnalyticsProps {
  startDate?: string;
  endDate?: string;
  clientId?: string | null;
  callType?: 'all' | 'live' | 'test';
}

const AIAccuracyAnalytics: React.FC<AIAccuracyAnalyticsProps> = ({ 
  startDate, 
  endDate, 
  clientId,
  callType = 'live'
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<AIAccuracyAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAIAccuracyAnalytics = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Determine effective client ID based on user role and clientId prop
        const isAdminUser = user.client_id === null && (user.role === 'admin' || user.role === 'owner');
        const effectiveClientId = isAdminUser ? clientId || undefined : user.client_id || undefined;

        // Prepare filters
        const filters: AIAccuracyFilters = {
          startDate: startDate || '2022-01-01',
          endDate: endDate || '2022-12-31',
          clientId: effectiveClientId
        };

        // Fetch AI accuracy analytics data using individual service methods
        const [modelPerformance, accuracyTrends, failurePatterns, keywordAnalysis, conversationQuality, technicalMetrics] = await Promise.all([
          AIAccuracyAnalyticsService.getModelPerformanceMetrics(
            startDate || '2022-01-01',
            endDate || '2022-12-31',
            effectiveClientId,
            undefined, // modelType
            callType
          ),
          AIAccuracyAnalyticsService.getAccuracyTrends(
            startDate || '2022-01-01',
            endDate || '2022-12-31',
            effectiveClientId,
            undefined, // modelType
            callType
          ),
          AIAccuracyAnalyticsService.getFailurePatterns(
            startDate || '2022-01-01',
            endDate || '2022-12-31',
            effectiveClientId,
            undefined, // modelType
            callType
          ),
          AIAccuracyAnalyticsService.getKeywordAnalysis(
            startDate || '2022-01-01',
            endDate || '2022-12-31',
            effectiveClientId,
            undefined, // modelType
            callType
          ),
          AIAccuracyAnalyticsService.getConversationQualityMetrics(
            startDate || '2022-01-01',
            endDate || '2022-12-31',
            effectiveClientId,
            undefined, // modelType
            callType
          ),
          AIAccuracyAnalyticsService.getTechnicalMetrics(
            startDate || '2022-01-01',
            endDate || '2022-12-31',
            effectiveClientId,
            undefined, // modelType
            callType
          )
        ]);

        const analyticsData: AIAccuracyAnalyticsData = {
          modelPerformance,
          accuracyTrends,
          failurePatterns,
          keywordAnalysis,
          conversationQuality,
          technicalMetrics
        };
        
        console.log('AI Accuracy analytics data fetched:', analyticsData);
        setData(analyticsData);
      } catch (err) {
        console.error('Error fetching AI accuracy analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load AI accuracy analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAIAccuracyAnalytics();
  }, [user?.id, user?.role, user?.client_id, startDate, endDate, clientId]); // Only depend on specific user properties

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Error Loading Analytics</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please try refreshing the page or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.modelPerformance.totalCalls === 0) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No AI Accuracy Data Available</h3>
            <p className="text-muted-foreground mb-2">
              No AI model performance data found for the selected time period.
            </p>
            <p className="text-sm text-muted-foreground">
              AI accuracy analytics will appear here once calls have been processed and evaluated.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 9.0) return { 
      variant: 'default' as const, 
      label: 'Excellent', 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600'
    };
    if (accuracy >= 8.0) return { 
      variant: 'secondary' as const, 
      label: 'Good', 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600'
    };
    if (accuracy >= 7.0) return { 
      variant: 'outline' as const, 
      label: 'Fair', 
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600'
    };
    return { 
      variant: 'destructive' as const, 
      label: 'Needs Improvement', 
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600'
    };
  };

  const getFailureRateBadge = (failureRate: number) => {
    if (failureRate <= 5) return { 
      variant: 'default' as const, 
      label: 'Low', 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600'
    };
    if (failureRate <= 15) return { 
      variant: 'secondary' as const, 
      label: 'Moderate', 
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600'
    };
    return { 
      variant: 'destructive' as const, 
      label: 'High', 
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600'
    };
  };

  const getPerformanceTrend = (current: number, threshold: number) => {
    if (current >= threshold) {
      return {
        icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
        text: 'Above Target',
        color: 'text-emerald-600'
      };
    }
    return {
      icon: <TrendingDown className="h-4 w-4 text-amber-500" />,
      text: 'Below Target',
      color: 'text-amber-600'
    };
  };

  const getQualityBadge = (qualityScore: number) => {
    if (qualityScore >= 9.0) return { 
      variant: 'default' as const, 
      label: 'Excellent', 
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    };
    if (qualityScore >= 8.0) return { 
      variant: 'secondary' as const, 
      label: 'Good', 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    };
    if (qualityScore >= 7.0) return { 
      variant: 'outline' as const, 
      label: 'Fair', 
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600'
    };
    return { 
      variant: 'destructive' as const, 
      label: 'Poor', 
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    };
  };

  const accuracyBadge = getAccuracyBadge(data.modelPerformance.averageAccuracy);
  const totalFailures = data.failurePatterns.commonFailures.reduce((sum, failure) => sum + failure.count, 0);
  const failureRate = data.modelPerformance.totalCalls > 0 ? (totalFailures / data.modelPerformance.totalCalls) * 100 : 0;
  const failureBadge = getFailureRateBadge(failureRate);
  
  // Calculate additional metrics
  const averageQualityScore = data.conversationQuality.overallQualityScore;
  const qualityBadge = getQualityBadge(averageQualityScore);
  const accuracyTrend = getPerformanceTrend(data.modelPerformance.averageAccuracy, 8.0);
  const qualityTrend = getPerformanceTrend(averageQualityScore, 8.0);
  const failureTrend = getPerformanceTrend(100 - failureRate, 90); // Inverted for failure rate
  
  // Calculate average response time across all models
  const averageResponseTime = data.modelPerformance.modelsUsed.length > 0
    ? data.modelPerformance.modelsUsed.reduce((sum, model) => sum + model.responseTime, 0) / data.modelPerformance.modelsUsed.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced Performance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {/* Overall AI Accuracy */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Overall AI Accuracy</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{data.modelPerformance.averageAccuracy.toFixed(1)}</p>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 ${accuracyBadge.bgColor} rounded-full flex-shrink-0`}>
                <Brain className={`h-4 w-4 sm:h-5 sm:w-5 ${accuracyBadge.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {accuracyTrend.icon}
                <Badge variant={accuracyBadge.variant} className={`text-xs ${accuracyBadge.color} ${accuracyBadge.bgColor} ${accuracyBadge.borderColor}`}>
                  {accuracyBadge.label}
                </Badge>
              </div>
              <span className={`text-xs ${accuracyTrend.color} font-medium`}>
                {accuracyTrend.text}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Quality Score */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Conversation Quality</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{averageQualityScore.toFixed(1)}</p>
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 ${qualityBadge.bgColor} rounded-full flex-shrink-0`}>
                <Target className={`h-4 w-4 sm:h-5 sm:w-5 ${qualityBadge.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {qualityTrend.icon}
                <Badge variant={qualityBadge.variant} className={`text-xs ${qualityBadge.color} ${qualityBadge.bgColor}`}>
                  {qualityBadge.label}
                </Badge>
              </div>
              <span className={`text-xs ${qualityTrend.color} font-medium`}>
                {qualityTrend.text}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Calls Processed */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Total Calls Processed</p>
                <p className="text-2xl sm:text-3xl font-bold text-card-foreground mt-1">{data.modelPerformance.totalCalls.toLocaleString()}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-full flex-shrink-0">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {data.modelPerformance.modelsUsed.length} model{data.modelPerformance.modelsUsed.length !== 1 ? 's' : ''} used
              </p>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-purple-600 font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failure Rate */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Failure Rate</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{failureRate.toFixed(1)}</p>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 ${failureBadge.bgColor} rounded-full flex-shrink-0`}>
                <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${failureBadge.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {failureTrend.icon}
                <Badge variant={failureBadge.variant} className={`text-xs ${failureBadge.color} ${failureBadge.bgColor} ${failureBadge.borderColor}`}>
                  {failureBadge.label}
                </Badge>
              </div>
              <span className={`text-xs ${failureTrend.color} font-medium`}>
                {failureTrend.text}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Performance Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {/* Best Performing Model */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Best Performing Model</p>
                <p className="text-lg sm:text-xl font-bold text-card-foreground truncate mt-1" title={data.modelPerformance.bestPerformingModel}>
                  {data.modelPerformance.bestPerformingModel}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-50 rounded-full flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                Top Performer
              </Badge>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Leading</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Avg Response Time</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{averageResponseTime.toFixed(1)}</p>
                  <span className="text-sm text-muted-foreground">s</span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-full flex-shrink-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {averageResponseTime <= 30 ? 'Fast' : averageResponseTime <= 60 ? 'Normal' : 'Slow'}
              </Badge>
              <div className="flex items-center gap-1">
                {averageResponseTime <= 30 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-amber-500" />
                )}
                <span className={`text-xs font-medium ${averageResponseTime <= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {averageResponseTime <= 30 ? 'Optimal' : 'Monitor'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Failures */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Critical Failures</p>
                <p className="text-2xl sm:text-3xl font-bold text-card-foreground mt-1">
                  {data.failurePatterns.criticalFailures.length}
                </p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${
                data.failurePatterns.criticalFailures.length === 0 ? 'bg-emerald-50' : 'bg-red-50'
              }`}>
                <XCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  data.failurePatterns.criticalFailures.length === 0 ? 'text-emerald-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={data.failurePatterns.criticalFailures.length === 0 ? 'secondary' : 'destructive'} className="text-xs">
                {data.failurePatterns.criticalFailures.length === 0 ? 'None' : 'Attention Needed'}
              </Badge>
              <div className="flex items-center gap-1">
                {data.failurePatterns.criticalFailures.length === 0 ? (
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${
                  data.failurePatterns.criticalFailures.length === 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {data.failurePatterns.criticalFailures.length === 0 ? 'Good' : 'Review'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Diversity */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">Models in Use</p>
                <p className="text-2xl sm:text-3xl font-bold text-card-foreground mt-1">
                  {data.modelPerformance.modelsUsed.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-indigo-50 rounded-full flex-shrink-0">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {data.modelPerformance.modelsUsed.length === 1 ? 'Single' : 'Multi-Model'}
              </Badge>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-indigo-500" />
                <span className="text-xs text-indigo-600 font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Model Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {data.modelPerformance.modelsUsed.length > 0 ? (
            <div className="space-y-4">
              {data.modelPerformance.modelsUsed.map((model, index) => (
                <div key={`${model.modelName}-${index}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-card-foreground">{model.modelName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {model.callCount} calls ({model.usagePercentage.toFixed(1)}%)
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Accuracy</p>
                        <p className="font-medium">{model.averageAccuracy.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quality Score</p>
                        <p className="font-medium">{model.averageQualityScore.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failure Rate</p>
                        <p className="font-medium">{model.failureRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Response</p>
                        <p className="font-medium">{model.responseTime}s</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="p-2 bg-background rounded-full">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No model performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Comparison Visualizations */}
      <ModelComparisonVisualizations
        modelsUsed={data.modelPerformance.modelsUsed}
        accuracyTrends={data.accuracyTrends}
        performanceComparison={data.modelPerformance.performanceComparison}
      />

      {/* Failure Pattern Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Failure Pattern Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {data.failurePatterns && data.keywordAnalysis ? (
            <FailurePatternAnalysis 
              failurePatterns={data.failurePatterns}
              keywordAnalysis={data.keywordAnalysis}
              startDate={startDate}
              endDate={endDate}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No failure pattern data available for the selected period</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAccuracyAnalytics;