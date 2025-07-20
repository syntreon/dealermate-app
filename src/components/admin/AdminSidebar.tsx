import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Shield,
  Activity,
  ChevronLeft,
  BarChart3,
  Menu,
  X,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/Logo';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin/dashboard' },
  { icon: Building2, label: 'Client Management', path: '/admin/clients' },
  { icon: Users, label: 'User Management', path: '/admin/users' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Shield, label: 'Audit Logs', path: '/admin/audit' },
  { icon: Activity, label: 'System Status', path: '/admin/system-status' },
  { icon: Settings, label: 'Admin Settings', path: '/admin/settings' },
];

// Primary items to show in mobile bottom nav (limit to 4 most important)
const primaryAdminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Building2, label: 'Clients', path: '/admin/clients' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
];

// Desktop Admin Sidebar Component
const DesktopAdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border bg-card shadow-sm">
      <SidebarHeader className="p-7">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Back to Main App */}
        <div className="px-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full justify-start"
          >
            <NavLink to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Main App
            </NavLink>
          </Button>
        </div>

        {/* Admin Navigation */}
        <SidebarMenu className="space-y-2.5 px-2">
          {adminNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
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
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-5 mt-auto border-t border-border">
        {/* User Info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">{user?.full_name || user?.email}</div>
          <div className="text-xs text-muted-foreground capitalize">{user?.role} Access</div>
        </div>

        {/* Logout Button */}
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

// Mobile Admin Bottom Navigation
const MobileAdminBottomNav = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 z-50 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {/* Primary Navigation Items */}
          {primaryAdminNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
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

          {/* More Menu Button */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 text-foreground/70 hover:text-foreground hover:bg-secondary active:scale-95"
              >
                <MoreHorizontal className="h-6 w-6 mb-1 text-foreground/60" />
                <span className="text-xs font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] p-0 bg-card">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">Admin Menu</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Back to Main App */}
                <div className="p-4 border-b border-border">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full justify-start"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <NavLink to="/dashboard">
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back to Main App
                    </NavLink>
                  </Button>
                </div>
                
                {/* All Admin Navigation Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {adminNavItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary border-l-4 border-primary"
                            : "text-foreground/70 hover:text-foreground hover:bg-secondary active:scale-98 border-l-4 border-transparent"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-foreground/60"
                        )} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
                
                {/* User Info and Logout */}
                <div className="p-4 border-t border-border">
                  <MobileUserInfo />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};

// Mobile User Info Component
const MobileUserInfo = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="text-sm font-medium">{user?.full_name || user?.email}</div>
        <div className="text-xs text-muted-foreground capitalize">{user?.role} Access</div>
      </div>
      <Button 
        variant="destructive" 
        className="w-full flex items-center justify-center gap-2"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};

// Main AdminSidebar component that decides which version to show
const AdminSidebar = () => {
  const { isMobile } = useSidebar();

  return (
    <>
      {!isMobile && <DesktopAdminSidebar />}
      {isMobile && <MobileAdminBottomNav />}
    </>
  );
};

export default AdminSidebar;