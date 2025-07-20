import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { ConnectionStatus } from '@/services/realtimeService';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  connectionStatus: ConnectionStatus;
  onReconnect?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  connectionStatus,
  onReconnect,
  showLabel = true,
  size = 'md',
  className
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
          label: 'Connected',
          description: 'Real-time updates active'
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          label: 'Connecting',
          description: 'Establishing connection...',
          animate: true
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50 border-muted',
          label: 'Disconnected',
          description: 'Real-time updates unavailable'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10 border-destructive/20',
          label: 'Error',
          description: connectionStatus.error || 'Connection error'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50 border-muted',
          label: 'Unknown',
          description: 'Connection status unknown'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          icon: 'h-3 w-3',
          text: 'text-xs',
          badge: 'px-2 py-1',
          button: 'h-6 w-6'
        };
      case 'lg':
        return {
          icon: 'h-5 w-5',
          text: 'text-sm',
          badge: 'px-3 py-1.5',
          button: 'h-10 w-10'
        };
      default: // md
        return {
          icon: 'h-4 w-4',
          text: 'text-sm',
          badge: 'px-2.5 py-1',
          button: 'h-8 w-8'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  const indicator = (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-1.5 border",
          config.bgColor,
          sizeClasses.badge
        )}
      >
        <Icon 
          className={cn(
            sizeClasses.icon,
            config.color,
            config.animate && "animate-spin"
          )} 
        />
        {showLabel && (
          <span className={cn(sizeClasses.text, config.color)}>
            {config.label}
          </span>
        )}
      </Badge>
      
      {onReconnect && connectionStatus.status !== 'connected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          className={cn("p-0", sizeClasses.button)}
          disabled={connectionStatus.status === 'connecting'}
        >
          <RefreshCw 
            className={cn(
              sizeClasses.icon,
              connectionStatus.status === 'connecting' && "animate-spin"
            )} 
          />
        </Button>
      )}
    </div>
  );

  if (size === 'sm' && !showLabel) {
    // For small size without label, just show the icon with tooltip
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground">
                {config.description}
              </div>
              {connectionStatus.lastConnected && (
                <div className="text-xs text-muted-foreground mt-1">
                  Last connected: {connectionStatus.lastConnected.toLocaleTimeString()}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">{config.description}</div>
            {connectionStatus.lastConnected && (
              <div className="text-xs text-muted-foreground mt-1">
                Last connected: {connectionStatus.lastConnected.toLocaleTimeString()}
              </div>
            )}
            {connectionStatus.error && (
              <div className="text-xs text-destructive mt-1">
                {connectionStatus.error}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatusIndicator;