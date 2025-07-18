import React from 'react';
import { Bell, Info, AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SystemMessage } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface SystemMessagesProps {
  messages: SystemMessage[];
  className?: string;
}

const SystemMessages: React.FC<SystemMessagesProps> = ({ messages, className }) => {
  const getMessageConfig = (type: SystemMessage['type']) => {
    switch (type) {
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeVariant: 'default' as const
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeVariant: 'secondary' as const
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeVariant: 'default' as const
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Filter out expired messages
  const activeMessages = messages.filter(message => 
    !message.expiresAt || new Date() < message.expiresAt
  );

  const hasUnreadMessages = activeMessages.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("rounded-full relative", className)}
          aria-label="System messages"
        >
          <Bell className="h-5 w-5" />
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] text-white font-medium">
                {activeMessages.length > 9 ? '9+' : activeMessages.length}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>System Messages</span>
          {hasUnreadMessages && (
            <Badge variant="secondary" className="text-xs">
              {activeMessages.length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {activeMessages.length > 0 ? (
          <ScrollArea className="max-h-80">
            <div className="space-y-2 p-2">
              {activeMessages.map((message) => {
                const config = getMessageConfig(message.type);
                const Icon = config.icon;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {message.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(message.timestamp)}
                          </span>
                          <Badge variant={config.badgeVariant} className="text-xs capitalize">
                            {message.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 px-4 text-center">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No system messages</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SystemMessages;