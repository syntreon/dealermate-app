import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Wifi, 
  Database, 
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface DataStatusIndicatorProps {
  isLoading?: boolean;
  error?: string | null;
  lastUpdated?: Date | null;
  isStale?: boolean;
  onRefresh?: () => void;
  showRefreshButton?: boolean;
  staleThreshold?: number; // in minutes
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'inline' | 'card';
}

const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({
  isLoading = false,
  error = null,
  lastUpdated = null,
  isStale = false,
  onRefresh,
  showRefreshButton = true,
  staleThreshold = 10,
  size = 'md',
  variant = 'badge'
}) => {
  // Determine status
  const getStatus = () => {
    if (error) return 'error';
    if (isLoading) return 'loading';
    if (isStale) return 'stale';
    return 'success';
  };

  const status = getStatus();

  // Status configuration
  const statusConfig = {
    error: {
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      label: 'Error',
      badgeVariant: 'destructive' as const
    },
    loading: {
      icon: Loader2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      label: 'Loading',
      badgeVariant: 'secondary' as const
    },
    stale: {
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      label: 'Stale',
      badgeVariant: 'secondary' as const
    },
    success: {
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      label: 'Updated',
      badgeVariant: 'secondary' as const
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Size configuration
  const sizeConfig = {
    sm: {
      iconSize: 'h-3 w-3',
      textSize: 'text-xs',
      padding: 'px-1.5 py-0.5',
      gap: 'gap-1'
    },
    md: {
      iconSize: 'h-4 w-4',
      textSize: 'text-sm',
      padding: 'px-2 py-1',
      gap: 'gap-1.5'
    },
    lg: {
      iconSize: 'h-5 w-5',
      textSize: 'text-base',
      padding: 'px-3 py-1.5',
      gap: 'gap-2'
    }
  };

  const sizeStyles = sizeConfig[size];

  // Format time ago
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

  // Get tooltip content
  const getTooltipContent = () => {
    if (error) return `Error: ${error}`;
    if (isLoading) return 'Loading data...';
    if (isStale) return `Data is older than ${staleThreshold} minutes`;
    if (lastUpdated) return `Last updated ${formatTimeAgo(lastUpdated)}`;
    return 'Data is up to date';
  };

  // Badge variant
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <div className={`flex items-center ${sizeStyles.gap}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={config.badgeVariant} className={`${sizeStyles.padding} ${sizeStyles.gap}`}>
                <Icon className={`${sizeStyles.iconSize} ${config.color} ${isLoading ? 'animate-spin' : ''}`} />
                <span className={sizeStyles.textSize}>{config.label}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipContent()}</p>
            </TooltipContent>
          </Tooltip>
          
          {showRefreshButton && onRefresh && (
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center ${sizeStyles.gap} ${sizeStyles.textSize} ${config.color}`}>
        <Icon className={`${sizeStyles.iconSize} ${isLoading ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
        {lastUpdated && status === 'success' && (
          <span className="text-muted-foreground">
            • {formatTimeAgo(lastUpdated)}
          </span>
        )}
        {showRefreshButton && onRefresh && (
          <Button
            onClick={onRefresh}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 ml-1"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`flex items-center justify-between p-3 rounded-md border ${config.bgColor} ${config.borderColor}`}>
        <div className={`flex items-center ${sizeStyles.gap}`}>
          <Icon className={`${sizeStyles.iconSize} ${config.color} ${isLoading ? 'animate-spin' : ''}`} />
          <div>
            <div className={`font-medium ${config.color} ${sizeStyles.textSize}`}>
              {config.label}
            </div>
            {(error || (lastUpdated && status === 'success')) && (
              <div className="text-xs text-muted-foreground">
                {error || (lastUpdated && `Updated ${formatTimeAgo(lastUpdated)}`)}
              </div>
            )}
          </div>
        </div>
        
        {showRefreshButton && onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default DataStatusIndicator;