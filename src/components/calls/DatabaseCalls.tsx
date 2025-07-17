
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DatabaseCallsProps {
  isLoading: boolean;
  handleDatabaseCall: () => Promise<void>;
  webhookUrl?: string;
}

const DatabaseCalls: React.FC<DatabaseCallsProps> = ({ 
  isLoading, 
  handleDatabaseCall, 
  webhookUrl 
}) => {
  const [error, setError] = useState<string | null>(null);

  const isValidWebhookUrl = (url?: string) => {
    if (!url || url === 'https://webhook.site/your-webhook-id') return false;
    
    try {
      new URL(url); // Will throw if URL is invalid
      return true;
    } catch {
      return false;
    }
  };

  const onSendDatabaseCalls = async () => {
    setError(null);
    
    // Validate webhook URL before attempting to send
    if (!isValidWebhookUrl(webhookUrl)) {
      setError('Please configure a valid webhook URL in Settings first');
      return;
    }
    
    try {
      await handleDatabaseCall();
    } catch (err) {
      console.error('Error in database call component:', err);
      setError('Failed to send database calls. Check your webhook URL configuration.');
    }
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle>Database Calls</CardTitle>
        <CardDescription>
          Initiate calls from your database records
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <div className="bg-zinc-900/70 p-8 rounded-full mb-6">
          <Database className="h-12 w-12 text-purple" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Send Database Calls</h3>
        <p className="text-zinc-400 text-sm text-center max-w-md mb-6">
          This will send a request with "Call Now" selected from your Google Sheets to initiate a call.
        </p>
        
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-700">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={onSendDatabaseCalls} 
          className="bg-purple hover:bg-purple-dark text-white px-8" 
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Database Calls'}
        </Button>
        
        {isValidWebhookUrl(webhookUrl) ? (
          <p className="text-xs text-zinc-500 mt-4">
            Webhook configured: {webhookUrl?.substring(0, 30)}...
          </p>
        ) : (
          <p className="text-xs text-red-400 mt-4">
            No valid webhook configured. Please set one in Settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseCalls;
