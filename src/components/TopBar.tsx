import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings, Building2, AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import AgentStatusIndicator from '@/components/dashboard/AgentStatusIndicator';
import SystemMessages from '@/components/dashboard/SystemMessages';
import useDashboardMetrics from '@/hooks/useDashboardMetrics';
import { AdminService } from '@/services/adminService';
import { Badge } from '@/components/ui/badge';
import { useSystemStatus, MessageType } from '@/hooks/use-system-status';
import { AgentStatus } from '@/types/dashboard';

const TopBar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [clientName, setClientName] = useState<string>("");
  
  // Get client ID from user if available
  const clientId = user?.client_id || undefined;
  
  // Use the system status hook to get real-time status updates
  const { status, statusMessage, broadcastMessage, isLoading } = useSystemStatus(clientId);
  
  // Fetch dashboard metrics for system messages
  const { metrics } = useDashboardMetrics(clientId);
  
  // Create agent status object from real-time system status
  const agentStatus: AgentStatus = {
    status: status || 'active',
    message: statusMessage || '',
    lastUpdated: new Date()
  };
  
  // Fetch client name when component mounts or clientId changes
  useEffect(() => {
    const fetchClientName = async () => {
      if (clientId) {
        try {
          const client = await AdminService.getClientById(clientId);
          if (client) {
            setClientName(client.name);
          }
        } catch (error) {
          console.error('Error fetching client name:', error);
        }
      }
    };
    
    if (clientId) {
      fetchClientName();
    } else if (user?.is_admin) {
      setClientName("Admin");
    } else {
      setClientName("");
    }
  }, [clientId, user]);
  
  // Toggle between light, dark, and system themes
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Helper function to get icon based on message type
  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Helper function to get background color based on status
  const getStatusBackgroundColor = () => {
    switch (status) {
      case 'maintenance':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'inactive':
        return 'bg-destructive/10 border-destructive/30';
      default:
        return '';
    }
  };

  return (
    <>
      {/* System Status Banner */}
      {!isLoading && (status !== 'active' || broadcastMessage) && (
        <div className={cn(
          "w-full px-4 py-2 border-b flex items-center justify-between z-10 relative",
          getStatusBackgroundColor(),
          broadcastMessage && status === 'active' && (
            broadcastMessage.type === 'warning' ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" :
            broadcastMessage.type === 'error' ? "bg-destructive/10 border-destructive/30" :
            broadcastMessage.type === 'success' ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" :
            "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
          )
        )}>
          <div className="flex items-center space-x-2">
            {status !== 'active' ? (
              <>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  status === 'maintenance' ? "text-amber-500" : "text-destructive"
                )} />
                <span className="font-medium">
                  {status === 'maintenance' ? 'System Maintenance' : 'System Unavailable'}
                </span>
                {statusMessage && (
                  <span className="text-sm text-muted-foreground"> - {statusMessage}</span>
                )}
              </>
            ) : broadcastMessage && (
              <>
                {getMessageIcon(broadcastMessage.type)}
                <span className="text-sm">{broadcastMessage.message}</span>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="w-full h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-medium">Call Facilitation Dashboard</h1>
        {clientName && (
          <div className="flex items-center">
            <Badge variant="outline" className="flex items-center gap-1 ml-2 px-2 py-1">
              <Building2 className="h-3 w-3" />
              <span>{clientName}</span>
            </Badge>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Agent Status Indicator - Using the original component with real-time status data */}
        {!isLoading && (
          <AgentStatusIndicator agentStatus={agentStatus} />
        )}
        
        {/* System Messages */}
        {metrics?.systemMessages && (
          <SystemMessages messages={metrics.systemMessages} />
        )}
        
        {/* Theme Toggle with icon for current theme */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="rounded-full"
          aria-label="Toggle theme"
          title={`Current theme: ${theme || 'system'}. Click to change.`}
        >
          {theme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : theme === 'light' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <div className="relative h-5 w-5">
              {/* System theme icon (combined sun/moon) */}
              <Sun className="h-4 w-4 absolute top-0 left-0" />
              <Moon className="h-3 w-3 absolute bottom-0 right-0" />
            </div>
          )}
        </Button>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full overflow-hidden"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name || "User"}</span>
                <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
                {user?.is_admin && (
                  <span className="text-xs text-primary font-medium">Admin</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </>
  );
};

export default TopBar;