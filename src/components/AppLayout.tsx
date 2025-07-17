import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AppSidebar from './AppSidebar';
import { Toaster } from '@/components/ui/sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff, RefreshCw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AppLayout = () => {
  const {
    isAuthenticated,
    hasProfileError,
    isLoading,
    user,
    networkErrorDetected,
    refreshUserSession
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Force refresh the page
  const handleForceRefresh = () => {
    window.location.reload();
  };

  // Refresh user session data without full page reload
  const handleRefreshData = async () => {
    await refreshUserSession();
  };

  // If still loading, show a better loading state
  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="space-y-6 p-6 rounded-lg glass-morphism border border-zinc-800">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-purple" />
              <p className="text-zinc-300">Loading your profile...</p>
            </div>
            <div className="animate-pulse space-y-4">
              <Skeleton className="h-12 bg-zinc-800 rounded" />
              <Skeleton className="h-48 bg-zinc-800 rounded" />
              <Skeleton className="h-8 bg-zinc-800 rounded w-2/3" />
            </div>
            <Button onClick={handleForceRefresh} variant="outline" className="w-full mt-4">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry Loading
            </Button>
          </div>
        </div>
      </div>;
  }

  // Prevent infinite redirect loop by checking profile error
  if (!isAuthenticated) {
    // Only redirect if there's no profile error and not loading
    if (!hasProfileError && !isLoading) {
      const currentPath = location.pathname;
      return <Navigate to="/login" state={{
        from: currentPath === '/login' ? undefined : location
      }} replace />;
    }
  }

  // If there's a profile error, show an error page instead of redirecting
  if (hasProfileError) {
    return <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              User profile not found. This usually happens when you have an authenticated session but no user record exists.
              Please contact an administrator or try logging out and back in.
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.href = '/login'} className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded mt-4">
            Return to Login
          </Button>
        </div>
      </div>;
  }

  // If we have a user but it's a temporary one due to network issues
  const isTemporaryUser = user?.name === "Temporary User" || networkErrorDetected;
  return <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen bg-zinc-950 text-white flex w-full">
        <AppSidebar />
        
        <SidebarInset className={cn("flex-1 p-6 overflow-auto", isMobile && "pb-24" // Add bottom padding on mobile to prevent content being hidden behind navbar
      )}>
          {/* Removed the sidebar trigger for mobile since we're using bottom navigation */}
          
          {isTemporaryUser && <Alert variant="destructive" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Network Connection Issue</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                <p>There was a problem connecting to the server. Some features may be limited.
                You're currently using the app in a limited mode.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="self-start" onClick={handleForceRefresh}>
                    <RefreshCw className="h-3 w-3 mr-2" /> Refresh Page
                  </Button>
                  <Button variant="outline" size="sm" className="self-start" onClick={handleRefreshData}>
                    <RefreshCw className="h-3 w-3 mr-2" /> Refresh Data
                  </Button>
                </div>
              </AlertDescription>
            </Alert>}
          
          <div className="container mx-auto max-w-7xl animate-in px-0">
            <Outlet />
          </div>
        </SidebarInset>
        
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>;
};
export default AppLayout;