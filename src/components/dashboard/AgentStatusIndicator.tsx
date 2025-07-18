import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, AlertTriangle, Wrench } from 'lucide-react';
import { AgentStatus } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface AgentStatusIndicatorProps {
  agentStatus: AgentStatus;
  className?: string;
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ 
  agentStatus, 
  className 
}) => {
  const getStatusConfig = (status: AgentStatus['status']) => {
    switch (status) {
      case 'active':
        return {
          icon: Circle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          label: 'Active',
          variant: 'default' as const
        };
      case 'inactive':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Inactive',
          variant: 'destructive' as const
        };
      case 'maintenance':
        return {
          icon: Wrench,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          label: 'Maintenance',
          variant: 'secondary' as const
        };
      default:
        return {
          icon: Circle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          label: 'Unknown',
          variant: 'secondary' as const
        };
    }
  };

  const config = getStatusConfig(agentStatus.status);
  const Icon = config.icon;

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full border",
              config.bgColor,
              config.borderColor
            )}>
              <Icon className={cn("h-3 w-3", config.color)} />
              <span className="text-xs font-medium">Agent</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-3 w-3", config.color)} />
              <span className="font-medium">Agent Status: {config.label}</span>
            </div>
            {agentStatus.message && (
              <p className="text-xs text-muted-foreground">{agentStatus.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Last updated: {formatLastUpdated(agentStatus.lastUpdated)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AgentStatusIndicator;