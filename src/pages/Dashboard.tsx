import React, { useState } from 'react';
import { useCalls, Call } from '@/context/CallsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
// Custom date formatting function instead of date-fns
import { Phone, Clock, Calendar, MessageSquare, CheckCircle, XCircle, SendHorizontal, RefreshCw, DollarSign, Clock2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';
import { useNavigate } from 'react-router-dom';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard = () => {
  const { calls, stats } = useCalls();
  const { networkErrorDetected } = useAuth();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const isMobile = useIsMobile();
  
  // Mock data based on the image
  const mockStats = {
    totalCalls: 156,
    totalCost: 327.6,
    avgCostPerCall: 2.1,
    totalDuration: '2h 22m',
    callsGrowth: 12,
    costGrowth: 8,
    avgCostReduction: -3,
    durationGrowth: 15,
  };

  // Mock data for the area chart
  const areaChartData = [
    { name: 'Mon', calls: 4, cost: 8 },
    { name: 'Tue', calls: 6, cost: 12 },
    { name: 'Wed', calls: 8, cost: 16 },
    { name: 'Thu', calls: 10, cost: 20 },
    { name: 'Fri', calls: 8, cost: 16 },
    { name: 'Sat', calls: 3, cost: 6 },
    { name: 'Sun', calls: 2, cost: 4 },
  ];
  
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls Card */}
        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#6B7280] text-sm">Total Calls</span>
              <div className="bg-primary/10 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              {mockStats.totalCalls}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.callsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.callsGrowth >= 0 ? '↑' : '↓'} {Math.abs(mockStats.callsGrowth)}% 
              </span>
              <span className="text-xs text-[#6B7280] ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost Card */}
        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#6B7280] text-sm">Total Cost</span>
              <div className="bg-primary/10 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ${mockStats.totalCost.toFixed(2)}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.costGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.costGrowth >= 0 ? '↑' : '↓'} {Math.abs(mockStats.costGrowth)}% 
              </span>
              <span className="text-xs text-[#6B7280] ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Avg. Cost/Call Card */}
        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#6B7280] text-sm">Avg. Cost/Call</span>
              <div className="bg-primary/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ${mockStats.avgCostPerCall.toFixed(2)}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.avgCostReduction < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.avgCostReduction < 0 ? '↓' : '↑'} {Math.abs(mockStats.avgCostReduction)}% 
              </span>
              <span className="text-xs text-[#6B7280] ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Duration Card */}
        <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#6B7280] text-sm">Total Duration</span>
              <div className="bg-primary/10 p-2 rounded-lg">
                <Clock2 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              {mockStats.totalDuration}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.durationGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.durationGrowth >= 0 ? '↑' : '↓'} {Math.abs(mockStats.durationGrowth)}% 
              </span>
              <span className="text-xs text-[#6B7280] ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Call Analytics section */}
      <Card className="bg-white shadow-sm hover:border-primary/20 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Call Analytics</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-6">
          <div className="flex items-center mb-6 mt-2">
            <div className="bg-gray-100 p-1 rounded-lg flex space-x-2">
              <Button 
                size="sm" 
                variant={chartPeriod === 'daily' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'daily' ? 'bg-primary hover:bg-primary/80' : 'text-[#6B7280] hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('daily')}
              >
                Daily
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'weekly' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'weekly' ? 'bg-primary hover:bg-primary/80' : 'text-gray-600 hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'monthly' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'monthly' ? 'bg-primary hover:bg-primary/80' : 'text-gray-600 hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaChartData}
                margin={isMobile ? { top: 10, right: 10, left: -30, bottom: 0 } : { top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4b5563" /> {/* Darker color for better contrast on light background */}
                <YAxis stroke="#4b5563" /> {/* Darker color for better contrast on light background */}
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" /> {/* Lighter gray for grid lines on light background */}
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-md">
                          <p className="text-gray-700">{`${payload[0].payload.name}`}</p>
                          <p className="text-primary">{`Calls: ${payload[0].value}`}</p>
                          <p className="text-[#7E69AB]">{`Cost: $${payload[1].value}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#a78bfa" 
                  fillOpacity={1} 
                  fill="url(#colorCalls)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
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
