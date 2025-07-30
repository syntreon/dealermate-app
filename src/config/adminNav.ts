import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Shield,
  Settings,
  ChevronLeft
} from 'lucide-react';

export interface MainNavItem {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  requiredAccess: 'system_admin' | 'client_admin';
}

export const mainNavItems: MainNavItem[] = [
  { 
    id: 'dashboard',
    title: 'Dashboard', 
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    requiredAccess: 'system_admin'
  },
  {
    id: 'management',
    title: 'Management',
    icon: Users,
    href: '/admin/management',
    requiredAccess: 'client_admin'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    href: '/admin/analytics',
    requiredAccess: 'system_admin'
  },
  {
    id: 'audit',
    title: 'Logs',
    icon: Shield,
    href: '/admin/audit',
    requiredAccess: 'system_admin'
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
    href: '/admin/settings',
    requiredAccess: 'system_admin'
  }
];

// Back to main app navigation item
export const backToMainAppItem = {
  title: 'Back to Main App',
  icon: ChevronLeft,
  href: '/dashboard'
};

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