import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Server, 
  Database, 
  Cloud, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import { useSupabase } from '@/hooks/use-supabase';
import { useIsMobile } from '@/hooks/use-mobile';

// System Health Types
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  lastChecked: Date;
  responseTime?: number;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  api: {
    callsToday: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

interface ServiceHealth {
  vercel: SystemHealth;
  database: SystemHealth;
  makecom: SystemHealth;
  n8n: SystemHealth;
  storage: SystemHealth;
}

interface SystemTabProps {
  // No props needed - component fetches its own data
}

export const SystemTab: React.FC<SystemTabProps> = () => {
  // State for Agent Status & Messaging
  
  const { supabase } = useSupabase();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMobile = useIsMobile();

  

  useEffect(() => {
    fetchSystemData();
    // DISABLED: Set up polling for real-time updates to reduce database egress costs
    // const interval = setInterval(fetchSystemData, 30000);
    // return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setError(null);
      
      // For now, using mock data since we don't have real system monitoring APIs
      // In production, these would be actual API calls to monitoring services
      const [metrics, health] = await Promise.all([
        getMockSystemMetrics(),
        getMockServiceHealth()
      ]);

      setSystemMetrics(metrics);
      setServiceHealth(health);
    } catch (err) {
      console.error('Error fetching system data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load system data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchSystemData();
  };

  // Mock data functions (replace with real API calls in production)
  const getMockSystemMetrics = async (): Promise<SystemMetrics> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      cpu: {
        usage: Math.floor(Math.random() * 40) + 20, // 20-60%
        cores: 4,
        temperature: Math.floor(Math.random() * 20) + 45 // 45-65°C
      },
      memory: {
        used: Math.floor(Math.random() * 4) + 2, // 2-6 GB
        total: 8,
        percentage: 0
      },
      storage: {
        used: Math.floor(Math.random() * 200) + 100, // 100-300 GB
        total: 500,
        percentage: 0
      },
      api: {
        callsToday: Math.floor(Math.random() * 1000) + 500,
        avgResponseTime: Math.floor(Math.random() * 200) + 100,
        errorRate: Math.random() * 2 // 0-2%
      }
    };
  };

  const getMockServiceHealth = async (): Promise<ServiceHealth> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const statuses: ('healthy' | 'degraded' | 'down')[] = ['healthy', 'healthy', 'healthy', 'degraded'];
    const getRandomStatus = () => statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      vercel: {
        status: 'healthy',
        message: 'All systems operational',
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 100) + 50
      },
      database: {
        status: getRandomStatus(),
        message: 'Database connections stable',
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 50) + 20
      },
      makecom: {
        status: getRandomStatus(),
        message: 'Automation workflows running',
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 200) + 100
      },
      n8n: {
        status: getRandomStatus(),
        message: 'Workflow engine operational',
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 150) + 75
      },
      storage: {
        status: 'healthy',
        message: 'File storage accessible',
        lastChecked: new Date(),
        responseTime: Math.floor(Math.random() * 80) + 40
      }
    };
  };

  // Calculate percentages for metrics
  if (systemMetrics) {
    systemMetrics.memory.percentage = Math.round((systemMetrics.memory.used / systemMetrics.memory.total) * 100);
    systemMetrics.storage.percentage = Math.round((systemMetrics.storage.used / systemMetrics.storage.total) * 100);
  }

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusVariant = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'default' as const;
      case 'degraded':
        return 'secondary' as const;
      case 'down':
        return 'destructive' as const;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return 'bg-emerald-500 dark:bg-emerald-400';
    if (percentage < 80) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-destructive';
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="bg-card text-card-foreground border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Failed to Load System Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time system health and performance metrics</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Resource Monitoring */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Activity className="h-5 w-5" />
            System Resources
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            CPU, memory, storage usage and API performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : systemMetrics ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* CPU Usage */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">CPU Usage</span>
                </div>
                <Progress 
                  value={systemMetrics.cpu.usage} 
                  className={`h-2 ${getProgressColor(systemMetrics.cpu.usage)}`} 
                  aria-valuenow={systemMetrics.cpu.usage} 
                  aria-valuemin={0} 
                  aria-valuemax={100} 
                  role="progressbar"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{systemMetrics.cpu.usage}%</span>
                  <span>{systemMetrics.cpu.cores} cores</span>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">Memory</span>
                </div>
                <Progress 
                  value={systemMetrics.memory.percentage} 
                  className={`h-2 ${getProgressColor(systemMetrics.memory.percentage)}`} 
                  aria-valuenow={systemMetrics.memory.percentage} 
                  aria-valuemin={0} 
                  aria-valuemax={100} 
                  role="progressbar"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{systemMetrics.memory.percentage}%</span>
                  <span>{systemMetrics.memory.used}GB / {systemMetrics.memory.total}GB</span>
                </div>
              </div>

              {/* Storage Usage */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">Storage</span>
                </div>
                <Progress 
                  value={systemMetrics.storage.percentage} 
                  className={`h-2 ${getProgressColor(systemMetrics.storage.percentage)}`} 
                  aria-valuenow={systemMetrics.storage.percentage} 
                  aria-valuemin={0} 
                  aria-valuemax={100} 
                  role="progressbar"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{systemMetrics.storage.percentage}%</span>
                  <span>{systemMetrics.storage.used}GB / {systemMetrics.storage.total}GB</span>
                </div>
              </div>

              {/* API Performance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">API Performance</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Calls Today</span>
                    <span className="text-card-foreground font-medium">{systemMetrics.api.callsToday.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg Response</span>
                    <span className="text-card-foreground font-medium">{systemMetrics.api.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className={`font-medium ${
                      systemMetrics.api.errorRate < 1 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : systemMetrics.api.errorRate < 2 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-destructive'
                    }`}>
                      {systemMetrics.api.errorRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No system metrics available</p>
          )}
        </CardContent>
      </Card>

      

      {/* Service Health Status */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Globe className="h-5 w-5" />
            Service Health Status
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Status of critical infrastructure services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3 p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : serviceHealth ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Vercel Server */}
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">Vercel</span>
                  </div>
                  <Badge
                    variant={getStatusVariant(serviceHealth.vercel.status)}
                    className="capitalize flex items-center gap-1"
                    aria-label={`Status: ${serviceHealth.vercel.status}`}
                    role="status"
                  >
                    {getStatusIcon(serviceHealth.vercel.status)}
                    <span className="ml-1 capitalize">{serviceHealth.vercel.status}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{serviceHealth.vercel.message}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response: {serviceHealth.vercel.responseTime}ms</span>
                  <span>Last checked: {serviceHealth.vercel.lastChecked.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Database (Supabase) */}
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">Database</span>
                  </div>
                  <Badge variant={getStatusVariant(serviceHealth.database.status)}>
                    {getStatusIcon(serviceHealth.database.status)}
                    <span className="ml-1 capitalize">{serviceHealth.database.status}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{serviceHealth.database.message}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response: {serviceHealth.database.responseTime}ms</span>
                  <span>Last checked: {serviceHealth.database.lastChecked.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Make.com */}
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">Make.com</span>
                  </div>
                  <Badge variant={getStatusVariant(serviceHealth.makecom.status)}>
                    {getStatusIcon(serviceHealth.makecom.status)}
                    <span className="ml-1 capitalize">{serviceHealth.makecom.status}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{serviceHealth.makecom.message}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response: {serviceHealth.makecom.responseTime}ms</span>
                  <span>Last checked: {serviceHealth.makecom.lastChecked.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* N8N Server */}
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">N8N Server</span>
                  </div>
                  <Badge variant={getStatusVariant(serviceHealth.n8n.status)}>
                    {getStatusIcon(serviceHealth.n8n.status)}
                    <span className="ml-1 capitalize">{serviceHealth.n8n.status}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{serviceHealth.n8n.message}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response: {serviceHealth.n8n.responseTime}ms</span>
                  <span>Last checked: {serviceHealth.n8n.lastChecked.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Storage */}
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">Storage</span>
                  </div>
                  <Badge variant={getStatusVariant(serviceHealth.storage.status)}>
                    {getStatusIcon(serviceHealth.storage.status)}
                    <span className="ml-1 capitalize">{serviceHealth.storage.status}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{serviceHealth.storage.message}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Response: {serviceHealth.storage.responseTime}ms</span>
                  <span>Last checked: {serviceHealth.storage.lastChecked.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No service health data available</p>
          )}
        </CardContent>
      </Card>

      {/* System Alerts (if any) */}
      {serviceHealth && Object.values(serviceHealth).some(service => service.status !== 'healthy') && (
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              System Alerts
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Services requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(serviceHealth)
                .filter(([_, service]) => service.status !== 'healthy')
                .map(([serviceName, service]) => (
                  <div key={serviceName} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {getStatusIcon(service.status)}
                    <div className="flex-1">
                      <div className="font-medium text-card-foreground capitalize">
                        {serviceName} - {service.status}
                      </div>
                      <div className="text-sm text-muted-foreground">{service.message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.lastChecked.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};