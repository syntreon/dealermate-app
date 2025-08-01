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
import { cn } from '@/lib/utils';
import { ClientProvider } from '@/context/ClientContext';

const AdminLayout = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // IMPORTANT: Always declare all hooks at the top level, before any conditional logic
  // Calculate sidebar width for proper main content positioning
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    // Initialize with correct width based on saved state
    const saved = localStorage.getItem('admin-sidebar-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.mode === 'expanded' ? 256 : 64;
      } catch {
        return 64;
      }
    }
    return 64; // Default collapsed width
  });

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

  // Redirect client_admin users to Management section if they try to access admin dashboard
  if (hasClientAdmin && !hasSystemAccess && location.pathname === '/admin/dashboard') {
    return <Navigate to="/admin/management" replace />;
  }

  // Redirect client_admin users to Management section if they access /admin root
  if (hasClientAdmin && !hasSystemAccess && location.pathname === '/admin') {
    return <Navigate to="/admin/management" replace />;
  }
  
  // Determine active section based on current route
  const getActiveSection = (pathname: string): string => {
    for (const item of mainNavItems) {
      if (pathname.startsWith(item.href)) {
        return item.id;
      }
    }
    return mainNavItems[0]?.id || 'dashboard';
  };
  
  const activeSection = getActiveSection(location.pathname);
  const activeNavItem = mainNavItems.find(item => item.id === activeSection);
  
  // No sub-sidebar in the new structure - each section has its own layout
  const subSidebarVisible = false;

  // Calculate left margin for main content (only main sidebar now)
  const totalLeftMargin = isMobile ? 0 : mainSidebarWidth;

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <ClientProvider>
        <SidebarProvider defaultOpen={!isMobile}>
          {/* Use pt-12 (48px) on mobile and pt-14 (56px) on desktop to match TopBar height */}
          <div className={cn("min-h-screen bg-background text-foreground relative", isMobile ? "pt-12" : "pt-14")}>
            {/* Sidebar */}
            <AdminSidebar />
            
            {/* Main content area */}
            <div 
              className="min-h-screen transition-all duration-300 ease-in-out"
              style={{ 
                marginLeft: isMobile ? 0 : `${totalLeftMargin}px`,
                width: isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`
              }}
            >
              {/* Top Bar - Always show on admin panel, including mobile.
                  On mobile, TopBar renders the hamburger for sidebar. */}
              <TopBar />
              
              {/* Page content with proper responsive behavior */}
              <main className={cn(
                "w-full transition-all duration-300",
                isMobile ? "pt-20 px-4 pb-8" : "" // Remove p-6 here for desktop
              )}>
                <div className="w-full max-w-none overflow-x-auto"> {/* Add px-6 here for desktop */}
                  <Outlet />
                </div>
              </main>
            </div>
            
            <Toaster position="top-right" />
          </div>
        </SidebarProvider>
      </ClientProvider>
    </ThemeProvider>
  );
};

export default AdminLayout;