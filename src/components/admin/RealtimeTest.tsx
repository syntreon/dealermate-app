import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { simpleRealtimeService } from '@/services/simpleRealtimeService';
import { debugAuth } from '@/utils/debugAuth';

const RealtimeTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState(simpleRealtimeService.getConnectionStatus());
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to connection changes
    const connectionSub = simpleRealtimeService.onConnectionChange((status) => {
      setConnectionStatus(status);
      addTestResult(`Connection status: ${status.status}`);
    });

    // Update subscription count
    const updateCount = () => {
      setSubscriptionCount(simpleRealtimeService.getActiveSubscriptionsCount());
    };

    const interval = setInterval(updateCount, 1000);

    return () => {
      connectionSub.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAgentStatusSubscription = () => {
    addTestResult('Testing agent status subscription...');
    
    const subscription = simpleRealtimeService.subscribeToAgentStatus(
      null, // global
      (status) => {
        addTestResult(`Agent status received: ${status.status}`);
      }
    );

    // Unsubscribe after 10 seconds
    setTimeout(() => {
      subscription.unsubscribe();
      addTestResult('Agent status subscription ended');
    }, 10000);
  };

  const testSystemMessagesSubscription = () => {
    addTestResult('Testing system messages subscription...');
    
    const subscription = simpleRealtimeService.subscribeToSystemMessages(
      null, // global
      (messages) => {
        addTestResult(`System messages received: ${messages.length} messages`);
      }
    );

    // Unsubscribe after 10 seconds
    setTimeout(() => {
      subscription.unsubscribe();
      addTestResult('System messages subscription ended');
    }, 10000);
  };

  const runDebugAuth = async () => {
    addTestResult('Running auth debug...');
    await debugAuth();
    addTestResult('Auth debug completed - check console');
  };

  const disconnectAll = () => {
    simpleRealtimeService.disconnect();
    addTestResult('All subscriptions disconnected');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Realtime Service Test</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={connectionStatus.status === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus.status}
              </Badge>
              {connectionStatus.lastConnected && (
                <p className="text-sm text-muted-foreground">
                  Last connected: {connectionStatus.lastConnected.toLocaleTimeString()}
                </p>
              )}
              {connectionStatus.error && (
                <p className="text-sm text-destructive">
                  Error: {connectionStatus.error}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Active subscriptions: {subscriptionCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={testAgentStatusSubscription} size="sm" className="w-full">
                Test Agent Status
              </Button>
              <Button onClick={testSystemMessagesSubscription} size="sm" className="w-full">
                Test System Messages
              </Button>
              <Button onClick={runDebugAuth} size="sm" className="w-full">
                Debug Auth
              </Button>
              <Button onClick={disconnectAll} variant="destructive" size="sm" className="w-full">
                Disconnect All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No test results yet</p>
            ) : (
              testResults.map((result, index) => (
                <p key={index} className="text-sm font-mono">
                  {result}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeTest;