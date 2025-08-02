import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Moon, Sun, Settings, Building2, AlertTriangle, Info, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Logo from "@/components/Logo"; // DealerMate logo for TopBar
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
import TestModeBadge from '@/components/common/TestModeBadge';
import { useQuery } from '@tanstack/react-query';
import SystemMessages from '@/components/dashboard/SystemMessages';
import useDashboardMetrics from '@/hooks/useDashboardMetrics';
import { AdminService } from '@/services/adminService';
import { Badge } from '@/components/ui/badge';
import { useSystemStatus, MessageType } from '@/hooks/use-system-status';
import { AgentStatus } from '@/types/dashboard';
import GlobalClientSelector from './GlobalClientSelector';
import GlobalCallTypeFilter from './GlobalCallTypeFilter';
import { useCallType } from '@/context/CallTypeContext';

const TopBar = () => {
  const location = useLocation();
  // Determine if user is in admin panel (route starts with /admin)
  const isAdminRoute = location.pathname.startsWith('/admin');

  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [clientName, setClientName] = useState<string>("");
  const [isThemeChanging, setIsThemeChanging] = useState(false);
  
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

  // Fetch client data using React Query for test mode badge
  const { data: clientData } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? AdminService.getClientById(clientId) : Promise.resolve(undefined),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000 // 5 minutes for minimal refetching
  });

  // Fetch client name when component mounts or clientId changes
  useEffect(() => {
    if (clientData && clientData.name) {
      setClientName(clientData.name);
    } else if (user?.is_admin) {
      setClientName("Admin");
    } else {
      setClientName("");
    }
  }, [clientData, user]);
  
  // Toggle between light, dark, and system themes using theme service
  const toggleTheme = async () => {
    if (!user || isThemeChanging) return;
    
    let newTheme: 'light' | 'dark' | 'system';
    if (theme === 'light') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }

    setIsThemeChanging(true);

    try {
      const { themeService } = await import('@/services/themeService');
      // Instant theme update - no await needed
      themeService.updateTheme(
        user.id,
        newTheme,
        'topbar',
        user,
        undefined, // No user update callback needed in TopBar
        setTheme
      );
    } catch (error) {
      console.error('Failed to update theme from TopBar:', error);
      // Show user-friendly error feedback
      const { toast } = await import('sonner');
      toast.error('Failed to update theme. Please try again.');
    } finally {
      setIsThemeChanging(false);
    }
  };

  // Helper function to get icon based on message type
  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'warning':
        // Use semantic warning color
        return <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />;
      case 'error':
        // Use semantic destructive color
        return <AlertCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />;
      case 'success':
        // Use semantic success color
        return <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />;
      case 'info':
      default:
        // Use semantic primary color
        return <Info className="h-4 w-4 text-[hsl(var(--primary))]" />;
    }
  };

  // Helper function to get background color based on status
  const getStatusBackgroundColor = () => {
    switch (status) {
      case 'maintenance':
        return 'bg-[hsl(var(--warning)/0.08)] border-[hsl(var(--warning))]'; // Use semantic warning color
      case 'inactive':
        return 'bg-[hsl(var(--destructive)/0.08)] border-[hsl(var(--destructive))]'; // Use semantic destructive color
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
            // Use theme-aware semantic background and border for each type
            // Use theme-aware backgrounds for each type; info uses --info-bg for proper dark mode support
            broadcastMessage.type === 'warning' ? "bg-[hsl(var(--warning)/0.08)] border-[hsl(var(--warning))]" :
            broadcastMessage.type === 'error' ? "bg-[hsl(var(--destructive)/0.08)] border-[hsl(var(--destructive))]" :
            broadcastMessage.type === 'success' ? "bg-[hsl(var(--success)/0.08)] border-[hsl(var(--success))]" :
            "bg-[hsl(var(--info-bg))] border-[hsl(var(--info))]"
          )
        )}>
          <div className="flex items-center space-x-2">
            {status !== 'active' ? (
              <>
                {status === 'maintenance' ? (
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" />
                )}
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
      
      {/* Responsive TopBar: reduced height on mobile, normal on desktop */}
      <div className="fixed top-0 left-0 w-full h-12 md:h-14 border-b border-border bg-background z-50 flex items-center justify-between px-2 md:px-6">
        {/* Mobile admin sidebar hamburger button: only on admin routes, only on mobile */}
        {isAdminRoute && (
          <div className="md:hidden flex items-center mr-2">
            {/* This button will trigger the admin sidebar drawer. 
                To avoid duplicate triggers, ensure only one exists in the app. 
                You may need to lift state/context if both TopBar and AdminSidebar are mounted. */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Open admin menu"
              onClick={() => {
                // Dispatch a custom event, or use context, to open the admin sidebar
                // This is minimal and decoupled; AdminSidebar should listen for this event
                window.dispatchEvent(new CustomEvent('open-admin-sidebar'));
              }}
            >
              <span className="sr-only">Open admin menu</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu h-6 w-6"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
            </Button>
          </div>
        )}

        {/* TopBar is now fixed and full-width */}
      {/* DealerMate Logo at the left */}
      <div className="flex items-center gap-3">
        {/* Responsive logo: smaller on mobile, default on desktop */}
        <Logo className="h-7 w-auto md:h-8" />
  
  {/* Admin badge/icon shown only for admin users */}
  {/* Hide Admin badge on mobile, show only on md+ screens */}
  {user?.is_admin && (
    <span className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
      <Shield className="h-4 w-4" />
      Admin
    </span>
  )}
  {/* Separator for sequential filters, styled with border color */}
  <span className="hidden md:inline mx-1 text-[hsl(var(--border))] select-none">/</span>
  {/* Global Client Selector - Now immediately after logo */}
  <GlobalClientSelector />
  {/* Separator for sequential filters, styled with border color */}
  <span className="hidden md:inline mx-1 text-[hsl(var(--border))] select-none">/</span>
  {/* Global Call Type Filter for admins, context-driven */}
  {(() => {
    const { selectedCallType, setSelectedCallType } = useCallType();
    return <GlobalCallTypeFilter selectedCallType={selectedCallType} onCallTypeChange={setSelectedCallType} />;
  })()}
  {/* Separator for future filters 
  <span className="hidden md:inline mx-1 text-[hsl(var(--border))] select-none">/</span> */}
</div>
      {/* Removed: Call Facilitation Dashboard heading */}
      
      <div className="flex items-center space-x-3">
              
        {/* Agent Status Indicator and Test Mode Badge */}
        <div className="flex items-center gap-2">
          {!isLoading && (
            <AgentStatusIndicator agentStatus={agentStatus} />
          )}
          {/* Conditionally render TestModeBadge if test mode is enabled */}
          {clientData?.is_in_test_mode && <TestModeBadge />}
        </div>
        
        {/* System Messages */}
        {metrics?.systemMessages && (
          <SystemMessages messages={metrics.systemMessages} />
        )}
        
        {/* Hide theme toggle on mobile, show only on md+ screens */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme} 
          className="hidden md:inline-flex rounded-full"
          aria-label="Toggle theme"
          title={`Current theme: ${theme || 'system'}. Click to change.`}
          disabled={isThemeChanging}
        >
          {isThemeChanging ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : theme === 'dark' ? (
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