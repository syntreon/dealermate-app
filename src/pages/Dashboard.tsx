import React, { useState } from 'react';
import { useCalls, Call } from '@/context/CallsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
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
    { name: 'Sent', value: stats.sent, color: '#9b87f5' },
    { name: 'Answered', value: stats.answered, color: '#6E59A5' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
  ];
  
  const getStatusIcon = (status: Call['status']) => {
    switch (status) {
      case 'sent':
        return <SendHorizontal className="h-4 w-4 text-purple" />;
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
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
            <h1 className="text-3xl font-bold text-gradient mb-2 sm:mb-0">Dashboard</h1>
            <ComingSoonBadge />
          </div>
          <p className="text-zinc-400">Overview of your AI call system performance. (Mock Data)</p>
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
            className="bg-purple hover:bg-purple-dark text-white px-4 py-2" /* Added more padding */
          >
            <Phone className="h-4 w-4 mr-2" /> New Call
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls Card */}
        <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Total Calls</span>
              <div className="bg-purple/10 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-purple" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              {mockStats.totalCalls}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.callsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.callsGrowth >= 0 ? '↑' : '↓'} {Math.abs(mockStats.callsGrowth)}% 
              </span>
              <span className="text-xs text-zinc-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost Card */}
        <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Total Cost</span>
              <div className="bg-purple/10 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              ${mockStats.totalCost.toFixed(2)}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.costGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.costGrowth >= 0 ? '↑' : '↓'} {Math.abs(mockStats.costGrowth)}% 
              </span>
              <span className="text-xs text-zinc-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Avg. Cost/Call Card */}
        <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Avg. Cost/Call</span>
              <div className="bg-purple/10 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple">
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
              <span className="text-xs text-zinc-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Duration Card */}
        <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Total Duration</span>
              <div className="bg-purple/10 p-2 rounded-lg">
                <Clock2 className="h-5 w-5 text-purple" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-2">
              {mockStats.totalDuration}
            </h3>
            <div className="flex items-center">
              <span className={`text-xs ${mockStats.durationGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockStats.durationGrowth >= 0 ? '↑' : '↓'} {Math.abs(mockStats.durationGrowth)}% 
              </span>
              <span className="text-xs text-zinc-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Call Analytics section */}
      <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Call Analytics</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-6">
          <div className="flex items-center mb-6 mt-2">
            <div className="bg-zinc-800/40 p-1 rounded-lg flex space-x-2">
              <Button 
                size="sm" 
                variant={chartPeriod === 'daily' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'daily' ? 'bg-purple hover:bg-purple-dark' : 'text-zinc-400 hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('daily')}
              >
                Daily
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'weekly' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'weekly' ? 'bg-purple hover:bg-purple-dark' : 'text-zinc-400 hover:bg-zinc-800'}`}
                onClick={() => setChartPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button 
                size="sm" 
                variant={chartPeriod === 'monthly' ? 'default' : 'outline'}
                className={`px-4 py-1 rounded-md ${chartPeriod === 'monthly' ? 'bg-purple hover:bg-purple-dark' : 'text-zinc-400 hover:bg-zinc-800'}`}
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
                    <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7E69AB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7E69AB" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-md">
                          <p className="text-zinc-300">{`${payload[0].payload.name}`}</p>
                          <p className="text-purple">{`Calls: ${payload[0].value}`}</p>
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
                  stroke="#9b87f5" 
                  fillOpacity={1} 
                  fill="url(#colorCalls)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#7E69AB" 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
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
                          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-md">
                            <p className="text-zinc-300">{`${payload[0].name}: ${payload[0].value}`}</p>
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
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                <p>No call data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      
        <Card className="glass-morphism hover:border-purple/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {calls.length > 0 ? (
              <div className="space-y-4">
                {calls.slice(0, 5).map((call) => (
                  <div 
                    key={call.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-200"
                  >
                    <div className="p-2 rounded-full bg-purple/10">
                      {getStatusIcon(call.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium truncate">{call.name}</h4>
                        <span className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex flex-wrap mt-1 gap-x-3 gap-y-1">
                        <div className="flex items-center text-xs text-zinc-400">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{call.phoneNumber}</span>
                        </div>
                        <div className="flex items-center text-xs text-zinc-400">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{call.appointmentDate}</span>
                        </div>
                        <div className="flex items-center text-xs text-zinc-400">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{call.appointmentTime}</span>
                        </div>
                      </div>
                      {call.message && (
                        <div className="flex items-start mt-2 text-xs text-zinc-400">
                          <MessageSquare className="h-3 w-3 mr-1 mt-0.5" />
                          <p className="line-clamp-1">{call.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-zinc-500">
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
