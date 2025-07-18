import React from 'react';
import { useCalls, Call } from '@/context/CallsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Phone, Clock, Calendar, MessageSquare, CheckCircle, XCircle, SendHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MetricsSummaryCards from '@/components/dashboard/MetricsSummaryCards';
import useDashboardMetrics from '@/hooks/useDashboardMetrics';
import { CallActivityTimeline } from '@/components/dashboard/CallActivityTimeline';

const Dashboard = () => {
  const { calls, stats } = useCalls();
  const { networkErrorDetected, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Get client ID from user if available
  const clientId = user?.client_id || undefined;

  // Use our custom hook to fetch dashboard metrics
  const { metrics, isLoading, error } = useDashboardMetrics(clientId);

  const chartData = [
    { name: 'Sent', value: stats.sent, color: '#a78bfa' }, // Lighter purple for better contrast
    { name: 'Answered', value: stats.answered, color: '#8b5cf6' }, // Primary purple
    { name: 'Failed', value: stats.failed, color: '#f87171' }, // Lighter red for better contrast
  ];

  const getStatusIcon = (status: Call['status']) => {
    switch (status) {
      case 'sent':
        return <SendHorizontal className="h-4 w-4 text-primary" />;
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Custom function to format time ago (replacement for formatDistanceToNow)
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Define time intervals in seconds
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;

    // Calculate the appropriate time format
    if (diffInSeconds < minute) {
      return 'just now';
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < week) {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < month) {
      const weeks = Math.floor(diffInSeconds / week);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / year);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  const handleForceRefresh = () => {
    window.location.reload();
  };

  const handleNewCall = () => {
    navigate('/call');
  };

  return (
    <div className="space-y-8 pb-8"> {/* Increased top-level spacing */}
      {/* Enhanced responsive header layout with improved spacing */}
      <div className="flex flex-col space-y-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-3"> {/* Increased vertical spacing */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3"> {/* Stack vertically on mobile */}
            <h1 className="text-3xl font-bold text-[#1F2937] mb-2 sm:mb-0">Dashboard</h1>
            <ComingSoonBadge />
          </div>
          <p className="text-[#6B7280]">Overview of your AI call system performance. (Mock Data)</p> {/* Improved contrast */}
        </div>

        <div className="flex gap-3 mt-4 sm:mt-0"> {/* Increased button spacing and added top margin on mobile */}
          {networkErrorDetected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              className="animate-pulse"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          )}

          <Button
            onClick={handleNewCall}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2" /* Added more padding */
          >
            <Phone className="h-4 w-4 mr-2" /> New Call
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <MetricsSummaryCards
        metrics={metrics ? {
          totalCalls: metrics.totalCalls,
          averageHandleTime: metrics.averageHandleTime,
          callsTransferred: metrics.callsTransferred,
          totalLeads: metrics.totalLeads,
          callsGrowth: metrics.callsGrowth,
          timeGrowth: metrics.timeGrowth,
          transferGrowth: metrics.transferGrowth,
          leadsGrowth: metrics.leadsGrowth
        } : {
          totalCalls: 156,
          averageHandleTime: '2h 22m',
          callsTransferred: 23,
          totalLeads: 42,
          callsGrowth: 12,
          timeGrowth: 15,
          transferGrowth: 8,
          leadsGrowth: 15
        }}
        isLoading={isLoading}
      />

      {/* Call Activity Timeline */}
      <CallActivityTimeline />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Call Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {stats.totalCalls > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-gray-200 shadow-md p-3 rounded-md">
                            <p className="text-gray-700">{`${payload[0].name}: ${payload[0].value}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                <p>No call data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {calls.length > 0 ? (
              <div className="space-y-4">
                {calls.slice(0, 5).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      {getStatusIcon(call.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium truncate">{call.name}</h4>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(new Date(call.timestamp))}
                        </span>
                      </div>
                      <div className="flex flex-wrap mt-1 gap-x-3 gap-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{call.phoneNumber}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{call.appointmentDate}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{call.appointmentTime}</span>
                        </div>
                      </div>
                      {call.message && (
                        <div className="flex items-start mt-2 text-xs text-gray-600">
                          <MessageSquare className="h-3 w-3 mr-1 mt-0.5" />
                          <p className="line-clamp-1">{call.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-500">
                <p>No activity yet. Start by making a call.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;