import React from 'react';
import { Moon, Sun, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const TopBar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Get client ID from user if available
  const clientId = user?.client_id || undefined;
  
  // Fetch dashboard metrics for agent status and system messages
  const { metrics } = useDashboardMetrics(clientId);
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="w-full h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-medium">Call Facilitation Dashboard</h1>
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
        
        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="rounded-full"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
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
                <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
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