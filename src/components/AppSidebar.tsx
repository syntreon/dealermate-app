import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Phone, Settings, LogOut, FileText, BarChart, User, Shield, Bot, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { canAccessAdminPanel, hasClientAdminAccess, canAccessAnalytics } from '@/utils/clientDataIsolation';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";

// This array is used for both sidebar and mobile bottom nav
const allNavItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: User, label: 'Leads', path: '/leads' },
  { icon: BarChart, label: 'Analytics', path: '/analytics', requiresAnalyticsAccess: true },
  { icon: Bot, label: 'Agents', path: '/agents' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Hidden items that are accessible via direct URL but not shown in navigation
const hiddenRoutes = [
  { path: '/call', label: 'Outbound Call' },
];

// Desktop sidebar component
const DesktopSidebar = () => {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const location = useLocation();

  // Dynamic offset for fixed TopBar + optional banner
  const [topBarHeight, setTopBarHeight] = useState<number>(0);
  useEffect(() => {
    const onTopbarHeight = (e: Event) => {
      const detail = (e as CustomEvent).detail as { height?: number };
      if (detail && typeof detail.height === 'number') setTopBarHeight(detail.height);
    };
    window.addEventListener('admin-topbar-height', onTopbarHeight as EventListener);
    window.dispatchEvent(new CustomEvent('request-admin-topbar-height'));
    return () => window.removeEventListener('admin-topbar-height', onTopbarHeight as EventListener);
  }, []);

  // Check user privileges
  const isAdmin = canAccessAdminPanel(user);
  const hasClientAdmin = hasClientAdminAccess(user);
  const canViewAnalytics = canAccessAnalytics(user);
  
  // Filter navigation items based on user permissions
  const navItems = allNavItems.filter(item => 
    !item.requiresAnalyticsAccess || canViewAnalytics
  );

  return (
    <Sidebar
      className="border-r border-border bg-card shadow-sm fixed overflow-y-auto"
      style={{ top: topBarHeight, height: `calc(100vh - ${topBarHeight}px)` }}
    > {/* Positioned dynamically below TopBar/banner */}
      <SidebarContent className="pt-3"> {/* Added top padding to prevent first item obstruction */}
        {/* Increased spacing between menu items */}
        <SidebarMenu className="space-y-2.5 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  className="text-base"
                >
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-5 px-6 py-4 font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary active:scale-98 border-l-4 border-transparent"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-foreground/60 group-hover:text-foreground"
                    )} />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {/* Administration Access */}
          {(isAdmin || hasClientAdmin) && (
            <>
              <Separator className="my-4" />
              
              {/* Single Admin Panel - Shows different content based on role */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={isAdmin ? "Admin Panel" : "Administration"}
                  className="text-base"
                >
                  <NavLink
                    to="/admin/dashboard"
                    className={cn(
                      "flex items-center gap-5 px-6 py-4 font-medium rounded-lg transition-all duration-200",
                      location.pathname.startsWith('/admin')
                        ? "bg-orange-500/10 text-orange-600 border-l-4 border-orange-500"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary active:scale-98 border-l-4 border-transparent"
                    )}
                  >
                    <Shield className={cn(
                      "h-5 w-5 transition-colors",
                      location.pathname.startsWith('/admin') ? "text-orange-600" : "text-foreground/60 group-hover:text-foreground"
                    )} />
                    <span>{isAdmin ? "Admin Panel" : "Administration"}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-5 mt-auto border-t border-border">
        {/* Logout Button - Only show on desktop */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Logout"
              className="flex w-full items-center gap-5 px-6 py-4 text-base font-medium text-foreground/70 hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200 active:scale-98"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

// Mobile bottom navigation component
const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const canViewAnalytics = canAccessAnalytics(user);
  
  // Filter navigation items based on user permissions
  const navItems = allNavItems.filter(item => 
    !item.requiresAnalyticsAccess || canViewAnalytics
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-3 z-50 shadow-lg">
      <div className="flex justify-around items-center max-w-full mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary active:scale-95"
                )
              }
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-primary" : "text-foreground/60"
              )} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

// Main component that decides which navigation to show
const AppSidebarContent = () => {
  const { isMobile } = useSidebar();
  
  // On mobile, we render both - the sidebar (which will be hidden via CSS)
  // and the bottom navigation
  return (
    <>
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileBottomNav />}
    </>
  );
};

// Main component that wraps the sidebar with provider
const AppSidebar = () => {
  return (
    <AppSidebarContent />
  );
};

export default AppSidebar;
