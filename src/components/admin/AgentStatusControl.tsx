import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Circle, AlertTriangle, Wrench, Save } from 'lucide-react';
import { AgentStatus } from '@/types/dashboard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AgentStatusControlProps {
  currentStatus: AgentStatus;
  onUpdateStatus: (status: Omit<AgentStatus, 'lastUpdated'>) => Promise<void>;
}

const AgentStatusControl: React.FC<AgentStatusControlProps> = ({
  currentStatus,
  onUpdateStatus
}) => {
  const [formData, setFormData] = useState({
    status: currentStatus.status,
    message: currentStatus.message || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusConfig = (status: AgentStatus['status']) => {
    switch (status) {
      case 'active':
        return {
          icon: Circle,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          label: 'Active',
          description: 'All systems operational'
        };
      case 'inactive':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          label: 'Inactive',
          description: 'System is down or unavailable'
        };
      case 'maintenance':
        return {
          icon: Wrench,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          label: 'Maintenance',
          description: 'System is under maintenance'
        };
      default:
        return {
          icon: Circle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const currentConfig = getStatusConfig(currentStatus.status);
  const CurrentIcon = currentConfig.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await onUpdateStatus({
        status: formData.status,
        message: formData.message || undefined
      });
      toast.success('Agent status updated successfully');
    } catch (error) {
      toast.error('Failed to update agent status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Agent Status Control</h2>

      {/* Current Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("flex items-center gap-3 p-4 rounded-lg", currentConfig.bgColor)}>
            <CurrentIcon className={cn("h-6 w-6", currentConfig.color)} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{currentConfig.label}</span>
                <Badge variant="outline">
                  Last updated: {currentStatus.lastUpdated.toLocaleString()}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {currentStatus.message || currentConfig.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                onValueChange={(value: AgentStatus['status']) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-green-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-yellow-500" />
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
              onClick={() => setFormData({ status: 'active', message: 'All systems operational' })}
              className="flex items-center gap-2"
            >
              <Circle className="h-4 w-4 text-green-500" />
              Set Active
            </Button>
            <Button
              variant="outline"
              onClick={() => setFormData({ status: 'maintenance', message: 'Scheduled maintenance in progress' })}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4 text-yellow-500" />
              Set Maintenance
            </Button>
            <Button
              variant="outline"
              onClick={() => setFormData({ status: 'inactive', message: 'System temporarily unavailable' })}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Set Inactive
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentStatusControl;