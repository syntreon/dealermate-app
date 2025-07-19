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

interface QualityAnalyticsProps {
  startDate?: string;
  endDate?: string;
}

interface QualityAnalyticsData {
  // KPI metrics
  overallQualityScore: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
  reviewMetrics: {
    totalCalls: number;
    callsForReview: number;
    reviewPercentage: number;
    negativeCallRate: number;
  };
  // Chart data
  qualityTrends: Array<{ date: string; score: number }>;
  scoreDistribution: Array<{ scoreRange: string; count: number }>;
  sentimentTrends: Array<{ date: string; positive: number; neutral: number; negative: number }>;
  reviewReasons: Array<{ reason: string; count: number }>;
}

const QualityAnalytics: React.FC<QualityAnalyticsProps> = ({ startDate, endDate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<QualityAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const fetchQualityAnalytics = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call to fetch quality analytics
        // For now, using mock data based on the spec
        const mockData: QualityAnalyticsData = {
          overallQualityScore: 8.5,
          sentimentBreakdown: {
            positive: 145,
            neutral: 67,
            negative: 23,
            positivePercentage: 61.7,
            neutralPercentage: 28.5,
            negativePercentage: 9.8
          },
          reviewMetrics: {
            totalCalls: 235,
            callsForReview: 28,
            reviewPercentage: 11.9,
            negativeCallRate: 9.8
          },
          qualityTrends: [
            { date: '2025-01-01', score: 8.2 },
            { date: '2025-01-02', score: 8.4 },
            { date: '2025-01-03', score: 8.1 },
            { date: '2025-01-04', score: 8.6 },
            { date: '2025-01-05', score: 8.5 },
            { date: '2025-01-06', score: 8.7 },
            { date: '2025-01-07', score: 8.5 }
          ],
          scoreDistribution: [
            { scoreRange: '9-10', count: 89 },
            { scoreRange: '8-9', count: 67 },
            { scoreRange: '7-8', count: 45 },
            { scoreRange: '6-7', count: 23 },
            { scoreRange: '5-6', count: 8 },
            { scoreRange: '<5', count: 3 }
          ],
          sentimentTrends: [
            { date: '2025-01-01', positive: 15, neutral: 8, negative: 2 },
            { date: '2025-01-02', positive: 18, neutral: 6, negative: 3 },
            { date: '2025-01-03', positive: 22, neutral: 9, negative: 1 },
            { date: '2025-01-04', positive: 19, neutral: 11, negative: 4 },
            { date: '2025-01-05', positive: 21, neutral: 7, negative: 2 },
            { date: '2025-01-06', positive: 25, neutral: 12, negative: 5 },
            { date: '2025-01-07', positive: 25, neutral: 14, negative: 6 }
          ],
          reviewReasons: [
            { reason: 'Low clarity score', count: 12 },
            { reason: 'Poor objection handling', count: 8 },
            { reason: 'Negative sentiment', count: 6 },
            { reason: 'Incomplete lead capture', count: 2 }
          ]
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setData(mockData);
      } catch (err) {
        console.error('Error fetching quality analytics:', err);
        setError('Failed to load quality analytics data');
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

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">No quality analytics data available</p>
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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Sentiment Breakdown</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <Heart className="h-3 w-3 text-emerald-500 mr-1" />
                      <span>Positive</span>
                    </div>
                    <span className="font-medium">{data.sentimentBreakdown.positivePercentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <Meh className="h-3 w-3 text-gray-500 mr-1" />
                      <span>Neutral</span>
                    </div>
                    <span className="font-medium">{data.sentimentBreakdown.neutralPercentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center">
                      <Frown className="h-3 w-3 text-red-500 mr-1" />
                      <span>Negative</span>
                    </div>
                    <span className="font-medium">{data.sentimentBreakdown.negativePercentage}%</span>
                  </div>
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
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={scoreColors[index % scoreColors.length]} />
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
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke={sentimentColors.neutral} 
                  strokeWidth={2}
                  name="Neutral"
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke={sentimentColors.negative} 
                  strokeWidth={2}
                  name="Negative"
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.reviewReasons} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="reason" 
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} calls`, 'Count']}
                />
                <Bar 
                  dataKey="count" 
                  fill="#f59e0b" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QualityAnalytics;
