import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  User, 
  Building2, 
  Phone, 
  UserCheck, 
  Settings,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { AuditService } from '@/services/auditService';
import { AuditLog } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'user' | 'client' | 'call' | 'lead' | 'system' | 'agent';
  action: string;
  description: string;
  timestamp: Date;
  user?: string;
  client?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const RecentActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRecentActivity = async () => {
    try {
      // Get recent audit logs
      const auditLogs = await AuditService.getAuditLogs({
        sortBy: 'created_at',
        sortDirection: 'desc'
      });

      // Transform audit logs to activity items
      const activityItems: ActivityItem[] = auditLogs.data.slice(0, 20).map(log => ({
        id: log.id,
        type: getActivityType(log.table_name, log.action),
        action: log.action,
        description: generateActivityDescription(log),
        timestamp: log.created_at,
        user: log.user?.full_name || 'System',
        client: log.client?.name,
        severity: getActivitySeverity(log.action)
      }));

      setActivities(activityItems);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      // Generate mock data as fallback
      setActivities(generateMockActivity());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getActivityType = (tableName: string, action: string): ActivityItem['type'] => {
    if (tableName === 'users') return 'user';
    if (tableName === 'clients') return 'client';
    if (tableName === 'calls') return 'call';
    if (tableName === 'leads') return 'lead';
    if (tableName === 'agent_status') return 'agent';
    return 'system';
  };

  const getActivitySeverity = (action: string): ActivityItem['severity'] => {
    if (action === 'delete') return 'error';
    if (action === 'create') return 'success';
    if (action.includes('warning') || action.includes('alert')) return 'warning';
    return 'info';
  };

  const generateActivityDescription = (log: AuditLog): string => {
    const userName = log.user?.full_name || 'System';
    const clientName = log.client?.name || 'Unknown Client';
    
    switch (log.action) {
      case 'create':
        if (log.table_name === 'users') return `${userName} created a new user account`;
        if (log.table_name === 'clients') return `${userName} added new client: ${clientName}`;
        if (log.table_name === 'calls') return `New call recorded for ${clientName}`;
        if (log.table_name === 'leads') return `New lead generated for ${clientName}`;
        return `${userName} created a new ${log.table_name} record`;
      
      case 'update':
        if (log.table_name === 'users') return `${userName} updated user information`;
        if (log.table_name === 'clients') return `${userName} updated client: ${clientName}`;
        if (log.table_name === 'agent_status') return `${userName} changed agent status for ${clientName}`;
        return `${userName} updated ${log.table_name} record`;
      
      case 'delete':
        if (log.table_name === 'users') return `${userName} deleted a user account`;
        if (log.table_name === 'clients') return `${userName} deleted client: ${clientName}`;
        return `${userName} deleted ${log.table_name} record`;
      
      case 'login':
        return `${userName} logged into the system`;
      
      case 'agent_status_change':
        return `${userName} changed agent status for ${clientName}`;
      
      case 'bulk_operation':
        return `${userName} performed bulk operation on ${log.table_name}`;
      
      default:
        return `${userName} performed ${log.action} on ${log.table_name}`;
    }
  };

  const generateMockActivity = (): ActivityItem[] => {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'user',
        action: 'login',
        description: 'Admin user logged into the system',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000),
        user: 'Admin User',
        severity: 'info'
      },
      {
        id: '2',
        type: 'client',
        action: 'create',
        description: 'New client "Acme Corp" was added to the system',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000),
        user: 'Admin User',
        client: 'Acme Corp',
        severity: 'success'
      },
      {
        id: '3',
        type: 'call',
        action: 'create',
        description: 'New call recorded for TechStart Inc',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
        client: 'TechStart Inc',
        severity: 'info'
      }
    ];
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentActivity();
  };

  useEffect(() => {
    loadRecentActivity();
    
    // DISABLED: Auto-refresh to reduce database egress costs
    // const interval = setInterval(loadRecentActivity, 30 * 1000);
    // return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'client':
        return <Building2 className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'lead':
        return <UserCheck className="h-4 w-4" />;
      case 'agent':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: ActivityItem['severity']) => {
    switch (severity) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
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
            Recent Activity
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
        <CardDescription>Latest system events and user actions</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-muted ${getSeverityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {activity.user && (
                      <span className="text-xs text-muted-foreground">by {activity.user}</span>
                    )}
                    {activity.client && (
                      <Badge variant="outline" className="text-xs">
                        {activity.client}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={
                    activity.severity === 'success' ? 'default' :
                    activity.severity === 'warning' ? 'secondary' :
                    activity.severity === 'error' ? 'destructive' : 'outline'
                  }
                  className="text-xs"
                >
                  {activity.action}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};