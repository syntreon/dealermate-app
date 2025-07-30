import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Database, 
  Shield, 
  Bug,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  sectionName: string;
}

/**
 * Network error fallback component
 */
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  sectionName
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyErrorDetails = async () => {
    try {
      await navigator.clipboard.writeText(error.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy error details:', err);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-fit">
            <Wifi className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl">Connection Problem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Unable to load {sectionName} due to a network issue. Please check your 
            internet connection and try again.
          </p>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This might be a temporary issue. The service should be back online shortly.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={copyErrorDetails}
              className="w-full gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Error Details
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Database error fallback component
 */
export const DatabaseErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  sectionName
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
            <Database className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Data Access Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            There was a problem accessing the data for {sectionName}. 
            This might be due to a temporary database issue.
          </p>
          
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Our team has been notified and is working to resolve this issue.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Loading
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Permission error fallback component
 */
export const PermissionErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  sectionName
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full w-fit">
            <Shield className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl">Access Restricted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            You don't have permission to access {sectionName}. 
            Please contact your administrator if you believe this is an error.
          </p>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Your current role may not include access to this section.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/dashboard'}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Generic application error fallback
 */
export const ApplicationErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  sectionName
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
            <Bug className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Something Went Wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            An unexpected error occurred while loading {sectionName}. 
            We apologize for the inconvenience.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
              
              {showDetails && (
                <div className="p-3 bg-muted rounded-md text-xs font-mono text-left overflow-auto max-h-40">
                  <div className="text-destructive font-semibold mb-2">
                    {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <pre className="text-muted-foreground whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => window.open('mailto:support@dealermate.com?subject=Application Error', '_blank')}
              className="w-full gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Error type detector utility
 */
export const getErrorFallbackComponent = (error: Error): React.ComponentType<ErrorFallbackProps> => {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return NetworkErrorFallback;
  }
  
  if (errorMessage.includes('database') || errorMessage.includes('sql')) {
    return DatabaseErrorFallback;
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return PermissionErrorFallback;
  }
  
  return ApplicationErrorFallback;
};