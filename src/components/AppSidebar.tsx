import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Phone, Settings, LogOut, FileText, BarChart, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { useAuth } from '@/context/AuthContext';
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

// This array is used for both sidebar and mobile bottom nav
const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Phone, label: 'Call', path: '/call' },
  { icon: FileText, label: 'Logs', path: '/logs' },
  { icon: BarChart, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Desktop sidebar component
const DesktopSidebar = () => {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const location = useLocation();

  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.is_admin;

  return (
    <Sidebar className="border-r border-border bg-card shadow-sm">
      <SidebarHeader className="p-7">
        <Logo />
      </SidebarHeader>

      <SidebarContent>
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

          {/* Admin Panel Access - Only show for admin users */}
          {isAdmin && (
            <>
              <Separator className="my-4" />
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Admin Panel"
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
                    <span>Admin Panel</span>
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
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 z-50 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary active:scale-95"
                )
              }
            >
              <item.icon className={cn(
                "h-6 w-6 mb-1",
                isActive ? "text-primary" : "text-foreground/60"
              )} />
              <span className="text-xs font-medium">{item.label}</span>
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
