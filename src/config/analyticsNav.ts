import { BarChart3, Users, Building2, Activity, Server } from 'lucide-react';

export const analyticsNavItems = [
  { 
    title: 'Financials', 
    href: '/admin/analytics/financials', 
    icon: BarChart3 
  },
  { 
    title: 'Users', 
    href: '/admin/analytics/users', 
    icon: Users 
  },
  { 
    title: 'Clients', 
    href: '/admin/analytics/clients', 
    icon: Building2 
  },
  { 
    title: 'Platform', 
    href: '/admin/analytics/platform', 
    icon: Activity 
  },
  { 
    title: 'System & Ops', 
    href: '/admin/analytics/system-ops', 
    icon: Server 
  },
];