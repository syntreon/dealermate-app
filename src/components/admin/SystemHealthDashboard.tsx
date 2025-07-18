import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  BarChart,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Phone,
  Building2,
  Info
} from 'lucide-react';
import { SystemHealth, SystemMetrics, SystemComponent } from '@/types/admin';
import { formatDate } from '@/utils/formatters';

interface SystemHealthDashboardProps {
  health: SystemHealth;
  metrics: SystemMetrics;
  isLoading: boolean;
  onRefresh: () => void;
  onRunHealthCheck: () => void;
}

const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  health,
  metrics,
  isLoading,
  onRefresh,
  onRunHealthCheck
}) => {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComponentStatusColor = (status: 'up' | 'down') => {
    return status === 'up' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'api':
        return <Globe className="h-5 w-5" />;
      case 'server':
        return <Server className="h-5 w-5" />;
      case 'storage':
        return <HardDrive className="h-5 w-5" />;
      case 'processor':
        return <Cpu className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: 'up' | 'down') => {
    return status === 'up' 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />;
  };

  const renderMetricCard = (title: string, value: number, icon: React.ReactNode, description?: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">System Health</h2>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Health</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRunHealthCheck}>
            <Activity className="h-4 w-4 mr-2" />
            Run Health Check
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${health.status === 'healthy' ? 'bg-green-100' : health.status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {health.status === 'healthy' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : health.status === 'degraded' ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium flex items-center gap-2">
                  System Status
                  <Badge className={getStatusColor(health.status)}>
                    {health.status === 'healthy' ? 'Healthy' : health.status === 'degraded' ? 'Degraded' : 'Down'}
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Last checked: {formatDate(health.lastChecked, { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-medium">Overall Health:</span>
                <Progress value={
                  health.components && Object.keys(health.components).length > 0
                    ? (Object.values(health.components).filter(c => c.status === 'up').length / Object.values(health.components).length) * 100
                    : 100
                } className="w-32" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Object.values(health.components).filter(c => c.status === 'up').length} of {Object.values(health.components).length} components operational
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard('Total Calls', metrics.totalCalls, <Phone className="h-4 w-4 text-muted-foreground" />)}
        {renderMetricCard('Total Leads', metrics.totalLeads, <Users className="h-4 w-4 text-muted-foreground" />)}
        {renderMetricCard('Active Clients', metrics.activeClients, <Building2 className="h-4 w-4 text-muted-foreground" />)}
        {renderMetricCard('Error Rate', metrics.errorRate, <AlertTriangle className="h-4 w-4 text-muted-foreground" />, `${metrics.errorRate.toFixed(2)}%`)}
      </div>

      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">System Components</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(health.components).map(([key, component]) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getComponentIcon(component.type)}
                      <CardTitle className="text-base">{component.name}</CardTitle>
                    </div>
                    <Badge className={getComponentStatusColor(component.status)}>
                      {component.status === 'up' ? 'Operational' : 'Down'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{component.message || 'No issues reported'}</p>
                      {component.lastChecked && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last checked: {formatDate(component.lastChecked, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(component.status)}
                      <span className="text-xs font-medium">
                        {component.status === 'up' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Performance Over Time</h3>
            <Select value={timeframe} onValueChange={(value: 'day' | 'week' | 'month') => setTimeframe(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
              <CardDescription>Average API response time in milliseconds</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Response time chart would be displayed here</p>
                {/* In a real implementation, this would be a chart component */}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
                <CardDescription>Percentage of failed requests</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Error rate chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Load</CardTitle>
                <CardDescription>CPU and memory utilization</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>System load chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Events</CardTitle>
          <CardDescription>Last 5 system events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentEvents.map((event, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className={`p-2 rounded-full ${
                  event.type === 'error' ? 'bg-red-100' : 
                  event.type === 'warning' ? 'bg-yellow-100' : 
                  event.type === 'info' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {event.type === 'error' ? <XCircle className="h-4 w-4 text-red-600" /> :
                   event.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                   event.type === 'info' ? <Info className="h-4 w-4 text-blue-600" /> :
                   <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{event.message}</p>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatDate(event.timestamp, { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{event.details}</p>
                </div>
              </div>
            ))}

            {metrics.recentEvents.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No recent system events</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthDashboard;