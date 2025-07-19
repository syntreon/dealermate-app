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
import { Phone, Clock, TrendingUp, TrendingDown, Users, PhoneCall } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AnalyticsService } from '@/services/analyticsService';

interface CallAnalyticsProps {
  startDate?: string;
  endDate?: string;
}

interface CallAnalyticsData {
  callVolume: Array<{ date: string, count: number }>;
  callDuration: Array<{ date: string, avgDuration: number }>;
  callOutcomes: Array<{ outcome: string, count: number, percentage: number }>;
  hourlyDistribution: Array<{ hour: number, count: number }>;
  dailyDistribution: Array<{ day: string, count: number }>;
  performanceMetrics: {
    totalCalls: number;
    completedCalls: number;
    transferredCalls: number;
    avgDuration: number;
    completionRate: number;
    transferRate: number;
  };
}

const CallAnalytics: React.FC<CallAnalyticsProps> = ({ startDate, endDate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<CallAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Determine effective client ID based on user role
        const isAdminUser = user.client_id === null && (user.role === 'admin' || user.role === 'owner');
        const effectiveClientId = isAdminUser ? undefined : user.client_id || undefined;

        const [analyticsData, performanceData] = await Promise.all([
          AnalyticsService.getAnalyticsData({
            clientId: effectiveClientId,
            startDate,
            endDate,
            timeframe: 'month'
          }),
          AnalyticsService.getCallPerformanceMetrics(effectiveClientId)
        ]);

        setData({
          callVolume: analyticsData.callVolume,
          callDuration: analyticsData.callDuration,
          callOutcomes: analyticsData.callOutcomes,
          hourlyDistribution: analyticsData.hourlyDistribution,
          dailyDistribution: analyticsData.dailyDistribution,
          performanceMetrics: performanceData
        });
      } catch (err) {
        console.error('Error fetching call analytics:', err);
        setError('Failed to load call analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
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
            <p className="text-red-600 mb-2">Error loading analytics</p>
            <p className="text-gray-600">{error}</p>
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
            <p className="text-gray-600">No call analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const outcomeColors = {
    completed: '#10b981',
    transferred: '#f59e0b',
    failed: '#ef4444',
    incomplete: '#6b7280'
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.totalCalls.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(data.performanceMetrics.avgDuration)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.completionRate.toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  {data.performanceMetrics.completionRate >= 80 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <Badge variant={data.performanceMetrics.completionRate >= 80 ? "default" : "destructive"} className="text-xs">
                    {data.performanceMetrics.completionRate >= 80 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transfer Rate</p>
                <p className="text-2xl font-bold">{data.performanceMetrics.transferRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.performanceMetrics.transferredCalls} transferred
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <PhoneCall className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Call Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.callVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [`${value} calls`, 'Call Volume']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.callOutcomes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ outcome, percentage }) => `${outcome} (${percentage}%)`}
                  >
                    {data.callOutcomes.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={outcomeColors[entry.outcome as keyof typeof outcomeColors] || '#6b7280'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} calls`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Calls by Hour of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => `${value}:00`}
                    formatter={(value) => [`${value} calls`, 'Call Count']}
                  />
                  <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Average Duration Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Average Call Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.callDuration}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatDuration(value)}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [formatDuration(value as number), 'Avg Duration']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgDuration" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallAnalytics;