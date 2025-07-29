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
    icon: BarChart3,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'Analytics',
      links: [
        { title: 'Analytics Dashboard', href: '/admin/analytics', requiredAccess: 'system_admin', description: 'Comprehensive analytics overview' }
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
        { title: 'All Users', href: '/admin/users', requiredAccess: 'client_admin', description: 'Manage user accounts' }
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
    id: 'system',
    title: 'System',
    icon: Activity,
    requiredAccess: 'system_admin',
    subSidebar: {
      title: 'System',
      links: [
        { title: 'System Status', href: '/admin/system-status', requiredAccess: 'system_admin', description: 'System health monitoring' },
        { title: 'System Health', href: '/admin/system-health', requiredAccess: 'system_admin', description: 'Detailed system health metrics' }
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