import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Star,
  Heart,
  Meh,
  Frown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { QualityAnalyticsService, QualityAnalyticsData } from '@/services/qualityAnalyticsService';



interface QualityAnalyticsProps {
  startDate?: string;
  endDate?: string;
}

// QualityAnalyticsData interface is now imported from the service

const QualityAnalytics: React.FC<QualityAnalyticsProps> = ({ startDate, endDate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<QualityAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualityAnalytics = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Determine effective client ID based on user role (same logic as CallAnalytics)
        const isAdminUser = user.client_id === null && (user.role === 'admin' || user.role === 'owner');
        const effectiveClientId = isAdminUser ? undefined : user.client_id || undefined;

        // Fetch quality analytics data from the service
        const qualityData = await QualityAnalyticsService.getQualityAnalyticsData({
          clientId: effectiveClientId,
          startDate,
          endDate
        });

        console.log('Quality analytics data fetched:', qualityData);
        setData(qualityData);
      } catch (err) {
        console.error('Error fetching quality analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quality analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchQualityAnalytics();
  }, [user, startDate, endDate]);

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

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading quality analytics</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.reviewMetrics.totalCalls === 0) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Quality Data Available</h3>
            <p className="text-muted-foreground mb-2">
              No call evaluations found for the selected time period.
            </p>
            <p className="text-sm text-muted-foreground">
              Quality analytics will appear here once calls have been evaluated.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sentimentColors = {
    positive: '#10b981', // emerald-500
    neutral: '#6b7280',  // gray-500
    negative: '#ef4444'  // red-500
  };



  const scoreColors = ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Quality Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Quality Score</p>
                <p className="text-2xl font-bold text-card-foreground">{data.overallQualityScore}/10</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    Excellent
                  </Badge>
                </div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-full">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Breakdown */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Sentiment Breakdown</p>
                <div className="p-2 bg-blue-50 rounded-full">
                  <Heart className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              
              {/* Visual sentiment bars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <Heart className="h-3 w-3 text-emerald-500 mr-1" />
                    <span>Positive</span>
                  </div>
                  <span className="font-medium">{data.sentimentBreakdown.positivePercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${data.sentimentBreakdown.positivePercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <Meh className="h-3 w-3 text-gray-500 mr-1" />
                    <span>Neutral</span>
                  </div>
                  <span className="font-medium">{data.sentimentBreakdown.neutralPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-gray-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${data.sentimentBreakdown.neutralPercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <Frown className="h-3 w-3 text-red-500 mr-1" />
                    <span>Negative</span>
                  </div>
                  <span className="font-medium">{data.sentimentBreakdown.negativePercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${data.sentimentBreakdown.negativePercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Summary stats */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total Calls</span>
                  <span className="font-medium">{data.sentimentBreakdown.positive + data.sentimentBreakdown.neutral + data.sentimentBreakdown.negative}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calls Flagged for Review */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calls Flagged for Review</p>
                <p className="text-2xl font-bold text-card-foreground">{data.reviewMetrics.reviewPercentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.reviewMetrics.callsForReview} of {data.reviewMetrics.totalCalls} calls
                </p>
              </div>
              <div className={`p-2 rounded-full ${data.reviewMetrics.reviewPercentage > 15 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <AlertTriangle className={`h-5 w-5 ${data.reviewMetrics.reviewPercentage > 15 ? 'text-amber-600' : 'text-emerald-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Negative Call Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Negative Call Rate</p>
                <p className="text-2xl font-bold text-card-foreground">{data.reviewMetrics.negativeCallRate}%</p>
                <div className="flex items-center mt-1">
                  {data.reviewMetrics.negativeCallRate < 10 ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <Badge 
                    variant={data.reviewMetrics.negativeCallRate < 10 ? "secondary" : "destructive"} 
                    className={`text-xs ${data.reviewMetrics.negativeCallRate < 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
                  >
                    {data.reviewMetrics.negativeCallRate < 10 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
              <div className={`p-2 rounded-full ${data.reviewMetrics.negativeCallRate < 10 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <XCircle className={`h-5 w-5 ${data.reviewMetrics.negativeCallRate < 10 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Score Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Quality Score Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.qualityTrends}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 10]}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value}/10`, 'Quality Score']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="quality-score"
                  id="quality-score-line"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="scoreRange" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value} calls`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="score-distribution" fill="#8884d8">
                  {data.scoreDistribution.map((entry, index) => (
                    <Cell key={`score-cell-${entry.scoreRange}-${index}`} fill={scoreColors[index % scoreColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Sentiment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.sentimentTrends}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="positive" 
                  stroke={sentimentColors.positive} 
                  strokeWidth={2}
                  name="Positive"
                  id="sentiment-positive-line"
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke={sentimentColors.neutral} 
                  strokeWidth={2}
                  name="Neutral"
                  id="sentiment-neutral-line"
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke={sentimentColors.negative} 
                  strokeWidth={2}
                  name="Negative"
                  id="sentiment-negative-line"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reasons for Human Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Reasons for Human Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
              {data.reviewReasons && data.reviewReasons.length > 0 ? (
                data.reviewReasons.map((item, index) => (
                  <div key={`reason-${index}-${item.count}`} className="flex items-start justify-between text-sm">
                    <p className="text-muted-foreground mr-4 flex-1">
                      {item.reason}
                    </p>
                    <Badge variant="secondary" className="font-semibold">{item.count}</Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No specific reasons for review were provided.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QualityAnalytics;
