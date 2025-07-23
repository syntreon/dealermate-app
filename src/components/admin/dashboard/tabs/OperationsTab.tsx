'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, TrendingUp, DollarSign, Hash, AlertCircle, Activity, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMakeComAnalyticsData, MakeComAnalyticsData, CallWithOperationCost } from '@/services/makeComAnalyticsService';
import { makeOperationsService, type MakeOperationsMetrics, type ScenarioMetrics } from '@/services/makeOperationsService';
import { format, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const OperationsTab = () => {
  const [callData, setCallData] = useState<MakeComAnalyticsData | null>(null);
  const [scenarioMetrics, setScenarioMetrics] = useState<MakeOperationsMetrics | null>(null);
  const [scenarioDetails, setScenarioDetails] = useState<ScenarioMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const { toast } = useToast();

  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange(dateRange);
      
      // Fetch call-level operations data (existing functionality)
      const callAnalyticsData = await getMakeComAnalyticsData(start, end);
      setCallData(callAnalyticsData);

      // Fetch scenario-level operations data (new functionality)
      // For admin dashboard, we'll aggregate across all clients or show selected client
      if (selectedClient === 'all') {
        // For now, we'll show a message that scenario data needs client selection
        // In a real implementation, you might want to aggregate across all clients
        setScenarioMetrics(null);
        setScenarioDetails([]);
      } else {
        const [metrics, details] = await Promise.all([
          makeOperationsService.getOperationsMetrics(selectedClient, start, end),
          makeOperationsService.getScenarioMetrics(selectedClient, start, end)
        ]);
        setScenarioMetrics(metrics);
        setScenarioDetails(details);
      }
    } catch (err) {
      setError('Failed to load operations data. Please try again later.');
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load Make.com operations data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedClient]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      paused: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      error: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      disabled: { variant: 'outline' as const, icon: AlertCircle, color: 'text-gray-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h3 className="text-lg font-semibold">Make.com Operations</h3>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="call-analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="call-analytics">Call Analytics</TabsTrigger>
          <TabsTrigger value="scenario-tracking">Scenario Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="call-analytics" className="space-y-6">
          {!callData || callData.totalOperations === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Call Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p>No Make.com operations data found in calls for the selected period.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Call-level metrics */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <MetricCard 
                  title="Total Operations (Calls)" 
                  value={callData.totalOperations.toLocaleString()} 
                  icon={<Hash className="h-4 w-4 text-muted-foreground" />} 
                />
                <MetricCard 
                  title="Total Cost (Calls)" 
                  value={formatCurrency(callData.totalCost)} 
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
                />
                <MetricCard 
                  title="Avg. Operations Per Call" 
                  value={callData.averageOperationsPerCall.toFixed(2)} 
                  icon={<Hash className="h-4 w-4 text-muted-foreground" />} 
                />
              </div>

              {/* Operations over time chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Operations Over Time</CardTitle>
                  <CardDescription>Daily Make.com operations from call data and associated costs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={callData.operationsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" label={{ value: 'Operations', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Cost (USD)', angle: -90, position: 'insideRight' }} tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value, name) => name === 'cost' ? formatCurrency(Number(value)) : value} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="operations" stroke="#8884d8" name="Operations" />
                      <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top clients by operations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Clients by Operations</CardTitle>
                  <CardDescription>Clients with the highest Make.com operations usage from calls.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead className="text-right">Total Operations</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Call Count</TableHead>
                        <TableHead className="text-right">Avg Ops/Call</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callData.topClientsByOperations.map((client) => (
                        <TableRow key={client.client_id}>
                          <TableCell className="font-medium">{client.client_name}</TableCell>
                          <TableCell className="text-right">{client.total_operations.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{formatCurrency(client.total_cost)}</TableCell>
                          <TableCell className="text-right">{client.call_count.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{client.avg_operations_per_call.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Top calls by operations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Calls by Operations</CardTitle>
                  <CardDescription>Individual calls that consumed the most Make.com operations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Call Time</TableHead>
                        <TableHead>Caller</TableHead>
                        <TableHead className="text-right">Operations</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callData.topCallsByOperations.map((call: CallWithOperationCost) => (
                        <TableRow key={call.id}>
                          <TableCell>{new Date(call.call_start_time).toLocaleString()}</TableCell>
                          <TableCell>{call.caller_full_name || 'Unknown'}</TableCell>
                          <TableCell className="text-right">{call.make_com_operations?.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{formatCurrency(call.make_com_cost_usd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="scenario-tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scenario-Level Operations Tracking</CardTitle>
              <CardDescription>
                Track Make.com operations by scenario. This requires setting up daily data sync from Make.com.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClient === 'all' ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Client Selection Required</h4>
                  <p className="text-muted-foreground mb-4">
                    Scenario tracking is available per client. Select a specific client to view scenario operations data.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Note: This feature requires setting up daily data sync from Make.com scenarios to populate the operations database.
                  </p>
                </div>
              ) : scenarioMetrics ? (
                <>
                  {/* Scenario metrics */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <MetricCard 
                      title="Total Operations (Scenarios)" 
                      value={scenarioMetrics.totalOperations.toLocaleString()} 
                      icon={<Activity className="h-4 w-4 text-blue-600" />} 
                    />
                    <MetricCard 
                      title="Total Cost (Scenarios)" 
                      value={formatCurrency(scenarioMetrics.totalCost)} 
                      icon={<DollarSign className="h-4 w-4 text-green-600" />} 
                    />
                    <MetricCard 
                      title="Success Rate" 
                      value={`${scenarioMetrics.successRate.toFixed(1)}%`} 
                      icon={<CheckCircle className="h-4 w-4 text-green-600" />} 
                    />
                    <MetricCard 
                      title="Daily Average" 
                      value={Math.round(scenarioMetrics.dailyAverage).toString()} 
                      icon={<TrendingUp className="h-4 w-4 text-purple-600" />} 
                    />
                  </div>

                  {/* Scenario details */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Scenario Performance</h4>
                    {scenarioDetails.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No scenario operations data found for the selected period
                      </p>
                    ) : (
                      scenarioDetails.map((scenario) => (
                        <div key={scenario.scenario_name} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium">{scenario.scenario_name}</h5>
                              {getStatusBadge(scenario.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Operations:</span> {scenario.total_operations.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Cost:</span> {formatCurrency(scenario.total_cost)}
                              </div>
                              <div>
                                <span className="font-medium">Success Rate:</span> {scenario.success_rate.toFixed(1)}%
                              </div>
                              <div>
                                <span className="font-medium">Daily Avg:</span> {Math.round(scenario.avg_daily_operations)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Scenario Data</h4>
                  <p className="text-muted-foreground mb-4">
                    No scenario operations data found. This feature requires setting up daily data sync from Make.com.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    See the documentation for setup instructions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MetricCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
    <Skeleton className="h-80" />
    <Skeleton className="h-96" />
  </div>
);

export { OperationsTab };
export default OperationsTab;