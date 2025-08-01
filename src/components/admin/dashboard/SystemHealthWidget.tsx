import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Database, 
  Server, 
  Wifi,
  RefreshCw
} from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { SystemHealth, SystemComponent } from '@/types/admin';

export const SystemHealthWidget = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSystemHealth = async () => {
    try {
      const healthData = await AdminService.getSystemHealth();
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to load system health:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSystemHealth();
  };

  useEffect(() => {
    loadSystemHealth();
    
    // DISABLED: Auto-refresh to reduce database egress costs
    // const interval = setInterval(loadSystemHealth, 2 * 60 * 1000);
    // return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'up' | 'down') => {
    return status === 'up' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Real-time system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Real-time system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Unable to load system health</p>
            <Button onClick={handleRefresh} className="mt-4" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Real-time system status • Last checked: {health.lastChecked.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {health.status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {health.status === 'degraded' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            {health.status === 'down' && <XCircle className="h-5 w-5 text-red-500" />}
            <span className="font-medium">Overall Status</span>
          </div>
          <Badge 
            variant={
              health.status === 'healthy' ? 'default' : 
              health.status === 'degraded' ? 'secondary' : 'destructive'
            }
            className="capitalize"
          >
            {health.status}
          </Badge>
        </div>

        {/* Component Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Components</h4>
          <div className="space-y-2">
            {Object.entries(health.components).map(([key, component]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getComponentIcon(component.type)}
                  <div>
                    <p className="text-sm font-medium">{component.name}</p>
                    {component.message && (
                      <p className="text-xs text-muted-foreground">{component.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(component.status)}
                  <Badge variant={component.status === 'up' ? 'default' : 'destructive'}>
                    {component.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {Object.values(health.components).filter(c => c.status === 'up').length}
              </div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {Object.values(health.components).filter(c => c.status === 'down').length}
              </div>
              <div className="text-xs text-muted-foreground">Issues</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};