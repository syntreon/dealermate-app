import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdminPanel, hasClientAdminAccess, hasSystemWideAccess } from '@/utils/clientDataIsolation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import TopBar from '@/components/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeProvider } from 'next-themes';
import { mainNavItems, hasRequiredAccess } from '@/config/adminNav';

const AdminLayout = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Check if user has admin or client admin privileges
  const canAccessAdmin = canAccessAdminPanel(user);
  const hasClientAdmin = hasClientAdminAccess(user);
  const hasSystemAccess = hasSystemWideAccess(user);
  
  // Allow access if user has either admin panel access OR client admin access
  const canAccessInterface = canAccessAdmin || hasClientAdmin;

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

  if (!canAccessInterface) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You don't have permission to access the administration interface. Admin or client admin privileges are required.
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

  // Redirect client_admin users to User Management if they try to access admin dashboard
  if (hasClientAdmin && !hasSystemAccess && location.pathname === '/admin/dashboard') {
    return <Navigate to="/admin/user-management" replace />;
  }

  // Redirect client_admin users to User Management if they access /admin root
  if (hasClientAdmin && !hasSystemAccess && location.pathname === '/admin') {
    return <Navigate to="/admin/user-management" replace />;
  }

  // Calculate sidebar widths for proper main content positioning
  const [mainSidebarWidth, setMainSidebarWidth] = useState(256); // Default expanded width
  const subSidebarWidth = 256; // Sub-sidebar is always 256px when visible
  
  // Determine if SubSidebar should be visible based on current route and user permissions
  const getActiveSection = (pathname: string): string => {
    for (const item of mainNavItems) {
      for (const link of item.subSidebar.links) {
        if (pathname.startsWith(link.href)) {
          return item.id;
        }
      }
    }
    return mainNavItems[0]?.id || 'dashboard';
  };
  
  const activeSection = getActiveSection(location.pathname);
  const activeNavItem = mainNavItems.find(item => item.id === activeSection);
  const subSidebarVisible = !!(activeNavItem && hasRequiredAccess(user, activeNavItem.requiredAccess));
  
  // Listen for sidebar width changes (only for main sidebar width)
  useEffect(() => {
    const handleSidebarResize = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail.width) {
        setMainSidebarWidth(detail.width);
      }
    };

    window.addEventListener('admin-sidebar-resize', handleSidebarResize as EventListener);
    return () => {
      window.removeEventListener('admin-sidebar-resize', handleSidebarResize as EventListener);
    };
  }, []);

  // Calculate total left margin for main content
  const totalLeftMargin = isMobile ? 0 : mainSidebarWidth + (subSidebarVisible ? subSidebarWidth : 0);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="min-h-screen bg-background text-foreground relative">
          {/* Sidebar */}
          <AdminSidebar />
          
          {/* Main content area */}
          <div 
            className="min-h-screen transition-all duration-300"
            style={{ 
               marginLeft: isMobile ? 0 : `${totalLeftMargin}px`,
               width: isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`
            }}
          >

            
            {/* Top Bar - Only show on desktop */}
            {!isMobile && <TopBar />}
            
            {/* Page content */}
            <main className="p-2 pb-24 md:p-6 w-full">
              <div className="w-full max-w-none overflow-x-hidden">
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