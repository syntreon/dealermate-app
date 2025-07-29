import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Building2, 
  Settings,
  Shield,
  Activity
} from 'lucide-react';

export interface MainNavItem {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  requiredAccess: 'system_admin' | 'client_admin';
  subSidebar: SubSidebarConfig;
  basePath?: string; // Base path for sections with sub-sidebars
}

export interface SubSidebarConfig {
  title: string;
  links: SubNavLink[];
}

export interface SubNavLink {
  title: string;
  href: string;
  requiredAccess: 'system_admin' | 'client_admin';
  description?: string;
}

export const mainNavItems: MainNavItem[] = [
  { 
    id: 'dashboard',
    title: 'Dashboard', 
    icon: LayoutDashboard,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'Dashboard',
      links: [
        { title: 'Overview', href: '/admin/dashboard', requiredAccess: 'system_admin', description: 'Main admin dashboard with KPIs' }
      ]
    }
  },
  {
    id: 'analytics',
    title: 'Analytics',
    basePath: '/admin/analytics',
    icon: BarChart3,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'Analytics',
      links: [
        { title: 'Financials', href: '/admin/analytics/financials', requiredAccess: 'system_admin', description: 'Revenue, costs, and profitability' },
        { title: 'Clients', href: '/admin/analytics/clients', requiredAccess: 'system_admin', description: 'Client performance and metrics' },
        { title: 'Users', href: '/admin/analytics/users', requiredAccess: 'system_admin', description: 'User activity and engagement' },
        { title: 'Platform', href: '/admin/analytics/platform', requiredAccess: 'system_admin', description: 'Platform-wide analytics' },
        { title: 'System & Ops', href: '/admin/analytics/system-ops', requiredAccess: 'system_admin', description: 'System health and operations' }
      ]
    }
  },
  { 
    id: 'users',
    title: 'User Management', 
    icon: Users,
    requiredAccess: 'client_admin',
    subSidebar: {
      title: 'User Management',
      links: [
        { title: 'All Users', href: '/admin/user-management', requiredAccess: 'client_admin', description: 'Manage user accounts' }
      ]
    }
  },
  { 
    id: 'clients',
    title: 'Client Management', 
    icon: Building2,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'Client Management',
      links: [
        { title: 'All Clients', href: '/admin/clients', requiredAccess: 'system_admin', description: 'Manage client accounts' }
      ]
    }
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    icon: Shield,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'Audit Logs',
      links: [
        { title: 'All Logs', href: '/admin/audit', requiredAccess: 'system_admin', description: 'View all audit logs' }
      ]
    }
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'Settings',
      links: [
        { title: 'Admin Settings', href: '/admin/settings', requiredAccess: 'system_admin', description: 'General admin settings' }
      ]
    }
  }
];

// Helper function to check if user has required access
export const hasRequiredAccess = (user: unknown, requiredAccess: 'system_admin' | 'client_admin'): boolean => {
  if (!user) return false;
  
  // Simple role-based check without external dependencies
  const userObj = user as { role?: string };
  
  if (requiredAccess === 'system_admin') {
    return userObj?.role === 'system_admin' || userObj?.role === 'owner' || userObj?.role === 'admin';
  }
  
  if (requiredAccess === 'client_admin') {
    return userObj?.role === 'system_admin' || userObj?.role === 'owner' || userObj?.role === 'admin' || userObj?.role === 'client_admin';
  }
  
  return true; // Default: show to everyone with admin access
};