import React from 'react';
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
  BarChart3
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

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
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

export default AdminSidebar;