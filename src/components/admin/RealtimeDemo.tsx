import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeAgentStatus } from '@/hooks/useRealtimeAgentStatus';
import { useRealtimeSystemMessages } from '@/hooks/useRealtimeSystemMessages';
import { useRealtimeClients } from '@/hooks/useRealtimeClients';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import RealtimeTest from './RealtimeTest';
import { debugAuth, checkAdminStatus, getCurrentUserClientId } from '@/utils/debugAuth';
import { RefreshCw, Users, MessageSquare, Activity, Bug } from 'lucide-react';

interface RealtimeDemoProps {
  clientId?: string | null;
}

/**
 * Demo component showing real-time functionality
 * This demonstrates how to use the real-time hooks and services
 */
const RealtimeDemo: React.FC<RealtimeDemoProps> = ({ clientId }) => {
  // Agent Status Real-time Hook
  const {
    agentStatus,
    isLoading: agentLoading,
    connectionStatus: agentConnection,
    updateStatus,
    refresh: refreshAgent
  } = useRealtimeAgentStatus({
    clientId,
    enableNotifications: true
  });

  // System Messages Real-time Hook
  const {
    messages,
    activeMessages,
    isLoading: messagesLoading,
    connectionStatus: messagesConnection,
    createMessage,
    refresh: refreshMessages
  } = useRealtimeSystemMessages({
    clientId,
    enableNotifications: true
  });

  // Clients Real-time Hook
  const {
    clients,
    isLoading: clientsLoading,
    connectionStatus: clientsConnection,
    refresh: refreshClients,
    totalCount
  } = useRealtimeClients({
    pagination: { page: 1, limit: 5 },
    enableNotifications: true
  });

  const handleTestAgentUpdate = async () => {
    try {
      await updateStatus({
        status: agentStatus?.status === 'active' ? 'maintenance' : 'active',
        message: `Test update at ${new Date().toLocaleTimeString()}`
      });
    } catch (error) {
      console.error('Failed to update agent status:', error);
    }
  };

  const handleTestMessageCreate = async () => {
    try {
      await createMessage({
        client_id: clientId,
        type: 'info',
        message: `Test message created at ${new Date().toLocaleTimeString()}`,
        expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      });
    } catch (error) {
      console.error('Failed to create message:', error);
    }
  };

  const handleDebugAuth = async () => {
    await debugAuth();
    const isAdmin = await checkAdminStatus();
    const userClientId = await getCurrentUserClientId();
    console.log('Is Admin:', isAdmin);
    console.log('User Client ID:', userClientId);
  };

  return (
    <div className="space-y-6">
      {/* Simple Test Component */}
      <RealtimeTest />
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Demo (Advanced)</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDebugAuth}
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug Auth
          </Button>
          <ConnectionStatusIndicator
            connectionStatus={agentConnection}
            onReconnect={refreshAgent}
            size="sm"
          />
          <span className="text-sm text-muted-foreground">Agent Status</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : agentStatus ? (
                <div className="space-y-2">
                  <Badge variant={agentStatus.status === 'active' ? 'default' : 'secondary'}>
                    {agentStatus.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {agentStatus.message || 'No message'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated: {agentStatus.last_updated.toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No status available</p>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestAgentUpdate}
                disabled={agentLoading}
                className="w-full"
              >
                Test Status Update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Messages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ConnectionStatusIndicator
                  connectionStatus={messagesConnection}
                  showLabel={false}
                  size="sm"
                />
                <span className="text-sm">
                  {messagesLoading ? 'Loading...' : `${activeMessages.length} active`}
                </span>
              </div>
              
              {activeMessages.slice(0, 2).map(message => (
                <div key={message.id} className="p-2 bg-muted rounded text-xs">
                  <Badge variant="outline" className="mb-1">
                    {message.type}
                  </Badge>
                  <p className="truncate">{message.message}</p>
                </div>
              ))}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleTestMessageCreate}
                disabled={messagesLoading}
                className="w-full"
              >
                Test Message Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ConnectionStatusIndicator
                  connectionStatus={clientsConnection}
                  showLabel={false}
                  size="sm"
                />
                <span className="text-sm">
                  {clientsLoading ? 'Loading...' : `${totalCount} total`}
                </span>
              </div>
              
              {clients.slice(0, 3).map(client => (
                <div key={client.id} className="p-2 bg-muted rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{client.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {client.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              <Button
                size="sm"
                variant="outline"
                onClick={refreshClients}
                disabled={clientsLoading}
                className="w-full"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${clientsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Real-time Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Agent Status</span>
              <ConnectionStatusIndicator
                connectionStatus={agentConnection}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">System Messages</span>
              <ConnectionStatusIndicator
                connectionStatus={messagesConnection}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="text-sm font-medium">Client Updates</span>
              <ConnectionStatusIndicator
                connectionStatus={clientsConnection}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Real-time Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">✅ Implemented Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Real-time agent status updates with WebSocket subscriptions</li>
                <li>Live system message broadcasting and notifications</li>
                <li>Client and user data updates with optimistic UI updates</li>
                <li>Connection status monitoring and automatic reconnection</li>
                <li>Comprehensive error handling and user feedback</li>
                <li>Configurable notification system</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔧 How to Test:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Click "Test Status Update" to simulate agent status changes</li>
                <li>Click "Test Message Create" to create new system messages</li>
                <li>Open multiple browser tabs to see real-time synchronization</li>
                <li>Check browser console for real-time event logs</li>
                <li>Disconnect network to test reconnection logic</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDemo;