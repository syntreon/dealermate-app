import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppSidebar from '../components/AppSidebar';
import { Toaster } from '@/components/ui/sonner';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff, RefreshCw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { NotificationModal } from '@/components/NotificationModal';
import { useState as useLocalState } from 'react';

const AppLayout = () => {
  const {
    isAuthenticated,
    hasProfileError,
    isLoading,
    user,
    refreshUserSession
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [currentNotification, setCurrentNotification] = useLocalState<any>(null);
  // Track TopBar height (including banner) to offset entire layout
  const [topBarHeight, setTopBarHeight] = useState<number>(0);

  useEffect(() => {
    const onTopbarHeight = (e: Event) => {
      const detail = (e as CustomEvent).detail as { height?: number };
      if (detail && typeof detail.height === 'number') setTopBarHeight(detail.height);
    };
    window.addEventListener('admin-topbar-height', onTopbarHeight as EventListener);
    // Request current height on mount
    window.dispatchEvent(new CustomEvent('request-admin-topbar-height'));
    return () => window.removeEventListener('admin-topbar-height', onTopbarHeight as EventListener);
  }, []);

  // Handle notification display with auto-dismiss
  const handleNotification = (notification: any) => {
    console.log('Received notification in AppLayout:', notification);
    setCurrentNotification(notification);
  };

  // Subscribe to real-time notifications
  useRealtimeNotifications({
    user,
    onNotification: handleNotification
  });
  // Force refresh the page
  const handleForceRefresh = () => {
    window.location.reload();
  };

  // Refresh user session data without full page reload
  const handleRefreshData = async () => {
    await refreshUserSession();
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    const currentPath = location.pathname;
    return <Navigate to="/login" state={{
      from: currentPath === '/login' ? undefined : location
    }} replace />;
  }

  // If there's a profile error, show an error page
  if (hasProfileError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              User profile not found. Please contact an administrator or try logging out and back in.
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.href = '/login'} className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SidebarProvider defaultOpen={!isMobile}>


          {/* Offset entire layout by TopBar+banner height so sidebar and content sit below */}
          <div className={cn("min-h-screen bg-background text-foreground flex w-full")} style={{ paddingTop: topBarHeight }}>
            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="flex flex-col flex-1">
              {/* TopBar is mounted globally via GlobalHeader */}

              {/* Page content */}
              <SidebarInset className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-2 pb-24 md:p-3">
                <div className="w-full animate-in">
                  <Outlet />
                </div>
              </SidebarInset>
            </div>

            <Toaster position="top-right" />
            <NotificationModal
              notification={currentNotification}
              onClose={() => setCurrentNotification(null)}
            />
          </div>
        </SidebarProvider>
    </ThemeProvider>
  );
};
export default AppLayout;