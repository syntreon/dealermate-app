import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Circle, AlertTriangle, Wrench, Save, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { AgentStatus } from '@/types/admin';
import { useRealtimeAgentStatus } from '@/hooks/useRealtimeAgentStatus';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AgentStatusControlProps {
  clientId?: string | null;
  onStatusChange?: (status: AgentStatus) => void;
}

const AgentStatusControl: React.FC<AgentStatusControlProps> = ({
  clientId,
  onStatusChange
}) => {
  const {
    agentStatus,
    isLoading,
    error,
    connectionStatus,
    updateStatus,
    refresh,
    isUpdating
  } = useRealtimeAgentStatus({
    clientId,
    enableNotifications: true,
    onStatusChange
  });

  const [formData, setFormData] = useState({
    status: 'active' as 'active' | 'inactive' | 'maintenance',
    message: ''
  });

  // Update form data when agent status changes
  useEffect(() => {
    if (agentStatus) {
      setFormData({
        status: agentStatus.status,
        message: agentStatus.message || ''
      });
    }
  }, [agentStatus]);

  const getStatusConfig = (status: 'active' | 'inactive' | 'maintenance') => {
    switch (status) {
      case 'active':
        return {
          icon: Circle,
          color: 'text-emerald-300',
          bgColor: 'bg-emerald-900/30 dark:bg-emerald-900/50',
          label: 'Active',
          description: 'All systems operational'
        };
      case 'inactive':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: 'Inactive',
          description: 'System is down or unavailable'
        };
      case 'maintenance':
        return {
          icon: Wrench,
          color: 'text-amber-500',
          bgColor: 'bg-warning/20',
          label: 'Maintenance',
          description: 'System is under maintenance'
        };
      default:
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-emerald-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="h-4 w-4 text-destructive" />;
      default:
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const currentConfig = agentStatus ? getStatusConfig(agentStatus.status) : getStatusConfig('active');
  const CurrentIcon = currentConfig.icon;

  const handleQuickUpdate = async (status: 'active' | 'inactive' | 'maintenance', message: string) => {
    try {
      await updateStatus({ status, message });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStatus({
        status: formData.status,
        message: formData.message || undefined
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Agent Status Control</h2>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agent Status Control</h2>
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <span className="text-sm text-muted-foreground">
            {connectionStatus.status === 'connected' ? 'Live' : 'Offline'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {connectionStatus.status === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connection error: {connectionStatus.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Status Display */}
      {agentStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("flex items-center gap-3 p-4 rounded-lg", currentConfig.bgColor)}>
              <CurrentIcon className={cn("h-6 w-6", currentConfig.color)} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white dark:text-emerald-100">{currentConfig.label}</span>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30 dark:bg-emerald-100/20 dark:text-emerald-100 dark:border-emerald-100/30">
                    Last updated: {agentStatus.last_updated.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-white/80 dark:text-emerald-100/80 mt-1">
                  {agentStatus.message || currentConfig.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-emerald-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-amber-500" />
                      Maintenance
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Status Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter a custom status message..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate('active', 'All systems operational')}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <Circle className="h-4 w-4 text-emerald-500" />
              Set Active
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate('maintenance', 'Scheduled maintenance in progress')}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4 text-amber-500" />
              Set Maintenance
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickUpdate('inactive', 'System temporarily unavailable')}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Set Inactive
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentStatusControl;