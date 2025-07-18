import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import SystemMessageManager from '@/components/admin/SystemMessageManager';
import AgentStatusControl from '@/components/admin/AgentStatusControl';
import { SystemStatusService } from '@/services/systemStatusService';
import { SystemMessage, AgentStatus } from '@/types/dashboard';
import { toast } from 'sonner';

const AdminSystemStatus = () => {
  const { user } = useAuth();
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.is_admin;

  useEffect(() => {
    if (!isAdmin) return;

    const loadData = async () => {
      try {
        const [messages, status] = await Promise.all([
          SystemStatusService.getSystemMessages(),
          SystemStatusService.getAgentStatus()
        ]);
        
        setSystemMessages(messages);
        setAgentStatus(status);
      } catch (error) {
        console.error('Failed to load system status data:', error);
        toast.error('Failed to load system status data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time subscriptions
    const unsubscribeMessages = SystemStatusService.subscribeToSystemMessages(setSystemMessages);
    const unsubscribeStatus = SystemStatusService.subscribeToAgentStatus(setAgentStatus);

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
    };
  }, [isAdmin]);

  // System Message handlers
  const handleCreateMessage = async (message: Omit<SystemMessage, 'id' | 'timestamp'>) => {
    await SystemStatusService.createSystemMessage(message);
  };

  const handleUpdateMessage = async (id: string, updates: Partial<SystemMessage>) => {
    await SystemStatusService.updateSystemMessage(id, updates);
  };

  const handleDeleteMessage = async (id: string) => {
    await SystemStatusService.deleteSystemMessage(id);
  };

  // Agent Status handlers
  const handleUpdateStatus = async (status: Omit<AgentStatus, 'lastUpdated'>) => {
    await SystemStatusService.updateAgentStatus(status);
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Status Administration</h1>
        <p className="text-gray-600">
          Manage agent status and system messages that appear to all users
        </p>
      </div>

      <Tabs defaultValue="agent-status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agent-status">Agent Status</TabsTrigger>
          <TabsTrigger value="system-messages">System Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="agent-status">
          {agentStatus && (
            <AgentStatusControl
              currentStatus={agentStatus}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </TabsContent>

        <TabsContent value="system-messages">
          <SystemMessageManager
            messages={systemMessages}
            onCreateMessage={handleCreateMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
          />
        </TabsContent>
      </Tabs>

      {/* Real-time Status Indicator */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            Real-time Updates Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Changes made here will be immediately visible to all users across the platform.
            The system automatically monitors for updates and pushes them in real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemStatus;