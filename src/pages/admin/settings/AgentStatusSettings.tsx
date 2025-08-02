import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Clock, Settings, Bell, Activity } from 'lucide-react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import ClientSelector from '@/components/ClientSelector';
import { AdminService } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import SystemMessagesTable from '@/components/admin/SystemMessagesTable';
import SystemUpdatePopup from '@/components/admin/SystemUpdatePopup';
import { useSystemMessages } from '@/hooks/useSystemMessages';
import { EnhancedSystemMessage, SystemStatusService } from '@/services/systemStatusService';
import { Client } from '@/types/admin';

const AgentStatusSettings: React.FC = () => {
  // Agent Status State
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  
  // System Messages State
  const [systemMessageClientId, setSystemMessageClientId] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  
  // Common State
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const { user } = useAuth();
  
  // System messages table state
  const [selectedMessage, setSelectedMessage] = useState<EnhancedSystemMessage | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // Agent status history state
  const [statusHistory, setStatusHistory] = useState<Array<{
    id: string;
    clientId: string | null;
    status: string;
    message: string | null;
    changedAt: Date;
    changedBy: string;
    changedByName: string | null;
    changedByEmail: string | null;
    previousStatus: string | null;
    previousMessage: string | null;
    isCurrent?: boolean;
  }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // System messages hook with pagination and caching
  const {
    messages,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoading: isLoadingMessages,
    error: messagesError,
    refresh: refreshMessages,
    nextPage,
    prevPage,
    deleteMessage
  } = useSystemMessages({ pageSize: 5, clientId: null }); // Show all messages for admin

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientData = await AdminService.getClients();
        setClients(clientData);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        toast({
          title: 'Error',
          description: 'Failed to load clients',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, [toast]);

  // Fetch agent status history
  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        setIsLoadingHistory(true);
        setHistoryError(null);
        const history = await SystemStatusService.getAgentStatusHistory(selectedClientId, 10);
        setStatusHistory(history);
      } catch (err) {
        console.error('Failed to fetch status history:', err);
        setHistoryError('Failed to load status history');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchStatusHistory();
  }, [selectedClientId]);
  
  // Handle row click to open popup
  const handleMessageClick = (message: EnhancedSystemMessage) => {
    setSelectedMessage(message);
    setIsPopupOpen(true);
  };
  
  // Handle popup close
  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedMessage(null);
  };
  
  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast({
        title: 'Success',
        description: 'System message has been deleted successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the system message.',
        variant: 'destructive',
      });
    }
  };

  const handleAgentStatusClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
  };

  const handleSystemMessageClientChange = (clientId: string | null) => {
    setSystemMessageClientId(clientId);
  };

  const handleStatusUpdate = async () => {
    if (!status) {
      toast({
        title: 'Status Required',
        description: 'Please select a status.',
        variant: 'default',
      });
      return;
    }

    setIsSubmittingStatus(true);
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
            message: statusMessage || undefined
          }, client.id, user.id);
        }
      } else {
        await SystemStatusService.updateAgentStatus({
          status: status,
          message: statusMessage || undefined
        }, selectedClientId, user.id);
      }

      toast({
        title: 'Success',
        description: 'Agent status has been updated successfully.',
        variant: 'default',
      });
      
      // Refresh the status history
      const history = await SystemStatusService.getAgentStatusHistory(selectedClientId, 10);
      setStatusHistory(history);
    } catch (err) {
      console.error('Error updating agent status:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handlePublishSystemMessage = async () => {
    if (!systemMessage) {
      toast({
        title: 'Message Required',
        description: 'Please enter a system message.',
        variant: 'default',
      });
      return;
    }

    setIsSubmittingMessage(true);
    try {
      const { SystemStatusService } = await import('@/services/systemStatusService');
      
      if (!user?.id) {
        throw new Error('User authentication required');
      }

      await SystemStatusService.createSystemMessage({
        type: messageType,
        message: systemMessage,
        expiresAt: null
      }, systemMessageClientId, user.id);

      toast({
        title: 'Success',
        description: 'System message has been published successfully.',
        variant: 'default',
      });
      setSystemMessage('');
      
      // Refresh the messages table to show the new message
      await refreshMessages();
    } catch (err) {
      console.error('Error publishing system message:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast({
        title: 'Publishing Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingMessage(false);
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

      {/* Agent Status Management */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Agent Status Management
          </CardTitle>
          <CardDescription>Control the operational status of AI agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-client">Client</Label>
            <ClientSelector
              onClientChange={handleAgentStatusClientChange}
              selectedClientId={selectedClientId}
              clients={clients}
              loading={isLoadingClients}
              error={null}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Agent Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Inactive
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Maintenance
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-message">Status Message (Optional)</Label>
            <Textarea
              id="status-message"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="Enter optional status message..."
              rows={2}
            />
          </div>

          <Button 
            onClick={handleStatusUpdate}
            disabled={isSubmittingStatus}
            className="w-full"
          >
            {isSubmittingStatus ? 'Updating...' : 'Update Agent Status'}
          </Button>
        </CardContent>
      </Card>

      {/* System Messages Management */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Messages
          </CardTitle>
          <CardDescription>Send banner notifications to users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-client">Target Audience</Label>
            <ClientSelector
              onClientChange={handleSystemMessageClientChange}
              selectedClientId={systemMessageClientId}
              clients={clients}
              loading={isLoadingClients}
              error={null}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message-type">Message Type</Label>
            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Info
                  </div>
                </SelectItem>
                <SelectItem value="success">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Success
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Warning
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Error
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-message">Message Content</Label>
            <Textarea
              id="system-message"
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
              placeholder="Enter system message content..."
              rows={3}
            />
          </div>

          <Button 
            onClick={handlePublishSystemMessage}
            disabled={isSubmittingMessage}
            className="w-full"
          >
            {isSubmittingMessage ? 'Publishing...' : 'Publish System Message'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Agent Status History */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agent Status History
          </CardTitle>
          <CardDescription>Recent changes to agent operational status (active, inactive, maintenance)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : historyError ? (
            <div className="text-center py-4 text-destructive">
              {historyError}
            </div>
          ) : statusHistory.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No status history found
            </div>
          ) : (
            <div className="space-y-3">
              {statusHistory.map((entry) => (
                <div key={entry.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg transition-colors ${
                  entry.isCurrent ? 'bg-primary/5 border-primary/20' : 'hover:bg-accent'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${entry.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 
                          entry.status === 'inactive' ? 'bg-destructive/10 text-destructive dark:bg-destructive/20' : 
                          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'}`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                      {entry.isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Current
                        </span>
                      )}
                      {entry.previousStatus && entry.previousStatus !== entry.status && !entry.isCurrent && (
                        <span className="text-muted-foreground text-sm">
                          from <span className="font-medium">{entry.previousStatus}</span>
                        </span>
                      )}
                    </div>
                    {entry.message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {entry.message}
                      </p>
                    )}
                    {entry.previousMessage && entry.previousMessage !== entry.message && !entry.isCurrent && (
                      <p className="text-xs text-muted-foreground/70 line-through truncate">
                        {entry.previousMessage}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-0 sm:text-right flex-shrink-0">
                    <div className="text-sm font-medium">
                      {entry.changedByName || entry.changedByEmail?.split('@')[0] || 'Unknown User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.isCurrent ? 'Current Status' : entry.changedAt.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Active System Messages */}
      <Card className="bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Active System Messages
          </CardTitle>
          <CardDescription>Currently published system messages and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <SystemMessagesTable 
            messages={messages}
            totalCount={messages.length}
            isLoading={isLoadingMessages}
            error={messagesError}
            onRowClick={handleMessageClick}
            onRefresh={refreshMessages}
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
            onNextPage={() => nextPage(currentPage + 1)}
            onPrevPage={() => nextPage(currentPage - 1)}
          />
        </CardContent>
      </Card>
      
      {/* System Message Details Popup */}
      <SystemUpdatePopup
        message={selectedMessage}
        isOpen={isPopupOpen}
        onClose={handlePopupClose}
        onDelete={handleDeleteMessage}
      />
    </div>
  );
};

export default AgentStatusSettings;