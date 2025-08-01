import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import ClientSelector from '@/components/admin/ClientSelector';
import { AdminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const AgentStatusSettings: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientData = await AdminService.getClients();
        setClients(clientData);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
        toast({ title: 'Error', description: 'Failed to load client list.', variant: 'destructive' });
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, [toast]);

  const handlePublish = async () => {
    if (!status && !message) {
      toast({
        title: 'Nothing to publish',
        description: 'Please select a status or enter a message.',
        variant: 'default',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { SystemStatusService } = await import('@/services/systemStatusService');
      
      if (!user?.id) {
        throw new Error('User authentication required');
      }

      // If All Clients, update agent status for each client
      if (selectedClientId === null) {
        for (const client of clients) {
          await SystemStatusService.updateAgentStatus({
            status: status,
            message: message || undefined
          }, client.id, user.id);
        }
      } else if (status) {
        await SystemStatusService.updateAgentStatus({
          status: status,
          message: message || undefined
        }, selectedClientId, user.id);
      }
      
      // Always pass null for global message (All Clients)
      if (message && messageType) {
        await SystemStatusService.createSystemMessage({
          type: messageType,
          message: message,
          expiresAt: null
        }, selectedClientId, user.id);
      }

      toast({
        title: 'Success',
        description: 'System status and/or message has been published successfully.',
        variant: 'default',
      });
      setMessage('');
    } catch (err) {
      console.error('Error publishing system status:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        title: 'Publishing Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use the admin dashboard data hook for header props
  const { lastUpdated, refresh, isLoading: refreshLoading } = useAdminDashboardData({
    autoRefresh: false, // No auto-refresh for settings page
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableToasts: false
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Standardized Dashboard Header */}
      <DashboardHeader
        title="Agent Status & Messaging"
        subtitle="Update the agent status and send system-wide messages to users"
        lastUpdated={lastUpdated || new Date()}
        isLoading={refreshLoading}
        onRefresh={refresh}
      />

      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <MessageSquare className="h-5 w-5" />
            Global Status Control
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Set system-wide or client-specific agent status and broadcast messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client-selector">Target Client</Label>
              {/* Wrap client change to normalize 'all' to null for global */}
              <ClientSelector
                clients={clients}
                selectedClient={selectedClientId === null ? 'all' : selectedClientId}
                onClientChange={(clientId) => setSelectedClientId(clientId === 'all' ? null : clientId)}
                isLoading={isLoadingClients}
/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-selector">Agent Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger id="status-selector">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message-textarea">Broadcast Message (Optional)</Label>
            <Textarea
              id="message-textarea"
              placeholder="Enter a message to display to users..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
             <div className="space-y-2">
                <Label htmlFor="message-type-selector">Message Type</Label>
                <Select value={messageType} onValueChange={(value) => setMessageType(value as any)} disabled={!message}>
                    <SelectTrigger id="message-type-selector" className="w-[180px]">
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentStatusSettings;