import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DatabaseCallsProps {
  isLoading: boolean;
  handleDatabaseCall: () => Promise<void>;
}

/**
 * DatabaseCalls component for initiating calls from database records
 * Responsive layout for mobile and desktop
 */
const DatabaseCalls: React.FC<DatabaseCallsProps> = ({ 
  isLoading, 
  handleDatabaseCall
}) => {
  const [error, setError] = useState<string | null>(null);

  const onSendDatabaseCalls = async () => {
    setError(null);
    
    try {
      await handleDatabaseCall();
    } catch (err) {
      console.error('Error in database call component:', err);
      setError('Failed to send database calls.');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted p-2 rounded-full">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Database Calls</CardTitle>
            <CardDescription>
              Initiate calls from your database records
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6 sm:py-10">
        <div className="bg-muted p-6 sm:p-8 rounded-full mb-4 sm:mb-6">
          <Database className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
        </div>
        <h3 className="text-lg sm:text-xl font-medium mb-2">Send Database Calls</h3>
        <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
          This will send a request with "Call Now" selected from your Google Sheets to initiate a call.
        </p>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={onSendDatabaseCalls} 
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? 'Sending...' : 'Send Database Calls'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DatabaseCalls;
