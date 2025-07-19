import React, { useState, useEffect } from 'react';
import { Moon, Sun, Settings, Building2 } from 'lucide-react';
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

const TopBar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [clientName, setClientName] = useState<string>("");
  
  // Get client ID from user if available
  const clientId = user?.client_id || undefined;
  
  // Fetch dashboard metrics for agent status and system messages
  const { metrics } = useDashboardMetrics(clientId);
  
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

  return (
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
        {/* Agent Status Indicator */}
        {metrics?.agentStatus && (
          <AgentStatusIndicator agentStatus={metrics.agentStatus} />
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
  );
};

export default TopBar;