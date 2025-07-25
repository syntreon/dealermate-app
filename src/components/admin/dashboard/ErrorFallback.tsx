import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Bug, Wifi, Database } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  tabName: string;
}

// Error type detection based on error message/type
const getErrorType = (error: Error) => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      icon: Wifi,
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection.',
      variant: 'secondary' as const
    };
  }
  
  if (message.includes('database') || message.includes('sql') || message.includes('query')) {
    return {
      type: 'database',
      icon: Database,
      title: 'Database Error',
      description: 'There was an issue accessing the database. This is usually temporary.',
      variant: 'destructive' as const
    };
  }
  
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      type: 'permission',
      icon: AlertTriangle,
      title: 'Permission Error',
      description: 'You don\'t have permission to access this data.',
      variant: 'secondary' as const
    };
  }
  
  // Default to generic error
  return {
    type: 'generic',
    icon: Bug,
    title: 'Unexpected Error',
    description: 'Something went wrong while loading this section.',
    variant: 'destructive' as const
  };
};

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, tabName }) => {
  const errorInfo = getErrorType(error);
  const Icon = errorInfo.icon;

  return (
    <Card className="bg-card text-card-foreground border-border border-destructive/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Icon className="h-5 w-5 text-destructive" />
            {errorInfo.title}
          </CardTitle>
          <Badge variant={errorInfo.variant} className="text-xs">
            {tabName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {errorInfo.description}
        </p>
        
        {/* Specific error message */}
        <div className="p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-sm text-foreground font-medium mb-1">Error Details:</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        
        {/* Action suggestions based on error type */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">What you can try:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            {errorInfo.type === 'network' && (
              <>
                <li>• Check your internet connection</li>
                <li>• Try refreshing the page</li>
                <li>• Wait a moment and try again</li>
              </>
            )}
            {errorInfo.type === 'database' && (
              <>
                <li>• Wait a moment and try again</li>
                <li>• Check if other sections are working</li>
                <li>• Contact support if the issue persists</li>
              </>
            )}
            {errorInfo.type === 'permission' && (
              <>
                <li>• Contact your administrator</li>
                <li>• Check if you're logged in correctly</li>
                <li>• Try logging out and back in</li>
              </>
            )}
            {errorInfo.type === 'generic' && (
              <>
                <li>• Try refreshing this section</li>
                <li>• Check the browser console for more details</li>
                <li>• Contact support if the issue persists</li>
              </>
            )}
          </ul>
        </div>
        
        {/* Retry button */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={resetError}
            className="gap-2"
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          
          {/* Additional action for network errors */}
          {errorInfo.type === 'network' && (
            <Button 
              onClick={() => window.location.reload()}
              variant="ghost"
              size="sm"
            >
              Refresh Page
            </Button>
          )}
        </div>
        
        {/* Development error details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Stack Trace (Development)
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-40">
              <pre className="text-muted-foreground whitespace-pre-wrap">
                {error.stack}
              </pre>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorFallback;