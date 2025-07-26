import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import TopBar from '@/components/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeProvider } from 'next-themes';

const AdminLayout = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.is_admin;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-muted rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You don't have permission to access the admin panel. Admin privileges are required.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="w-full mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen bg-background text-foreground flex w-full">
          {/* Sidebar */}
          <AdminSidebar />
          
          {/* Main content area */}
          <div className="flex flex-col flex-1">
            {/* Top Bar - Only show on desktop */}
            {!isMobile && <TopBar />}
            
            {/* Page content */}
            <main className="flex-1 overflow-auto p-2 pb-24 md:p-4">
              <div className="w-full">
                <Outlet />
              </div>
            </main>
          </div>
          
          <Toaster position="top-right" />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default AdminLayout;