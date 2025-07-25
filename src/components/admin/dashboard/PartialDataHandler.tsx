import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Wifi, Database, Clock } from 'lucide-react';

interface PartialDataHandlerProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  hasData?: boolean;
  lastUpdated?: Date | null;
  onRetry?: () => void;
  showStaleIndicator?: boolean;
  staleThreshold?: number; // in minutes
  sectionName?: string;
}

const PartialDataHandler: React.FC<PartialDataHandlerProps> = ({
  children,
  isLoading = false,
  error = null,
  hasData = true,
  lastUpdated = null,
  onRetry,
  showStaleIndicator = true,
  staleThreshold = 10, // 10 minutes
  sectionName = 'section'
}) => {
  // Check if data is stale
  const isStale = lastUpdated && showStaleIndicator 
    ? (Date.now() - lastUpdated.getTime()) > (staleThreshold * 60 * 1000)
    : false;

  // Determine the status indicator
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertTriangle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        label: 'Error',
        variant: 'destructive' as const
      };
    }
    
    if (isLoading) {
      return {
        icon: RefreshCw,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        label: 'Loading',
        variant: 'secondary' as const
      };
    }
    
    if (isStale) {
      return {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        label: 'Stale',
        variant: 'secondary' as const
      };
    }
    
    return null;
  };

  const statusInfo = getStatusInfo();

  // If there's an error and no data, show error state
  if (error && !hasData) {
    return (
      <Card className="bg-card text-card-foreground border-border border-destructive/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Failed to Load {sectionName}</span>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // If loading and no data, show loading state
  if (isLoading && !hasData) {
    return (
      <Card className="bg-card text-card-foreground border-border">
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading {sectionName}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show data with status indicator if needed
  return (
    <div className="relative">
      {/* Status indicator */}
      {statusInfo && (
        <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-xs ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
          <statusInfo.icon className={`h-3 w-3 ${statusInfo.color} ${isLoading ? 'animate-spin' : ''}`} />
          <span className={statusInfo.color}>{statusInfo.label}</span>
          {error && onRetry && (
            <button 
              onClick={onRetry}
              className={`ml-1 ${statusInfo.color} hover:underline`}
              title="Retry loading"
            >
              ↻
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className={error ? 'opacity-75' : ''}>
        {children}
      </div>

      {/* Bottom status bar for additional info */}
      {(error || isStale) && hasData && (
        <div className={`mt-2 p-2 rounded-md text-xs ${statusInfo?.bgColor} ${statusInfo?.borderColor} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusInfo && <statusInfo.icon className={`h-3 w-3 ${statusInfo.color}`} />}
              <span className={statusInfo?.color}>
                {error ? `Error: ${error}` : isStale ? 'Data may be outdated' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-muted-foreground">
                  Updated {formatTimeAgo(lastUpdated)}
                </span>
              )}
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                >
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export default PartialDataHandler;