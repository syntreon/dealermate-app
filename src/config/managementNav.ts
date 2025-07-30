import { Users, Building2, Briefcase, Shield } from 'lucide-react';

export interface SubNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export const managementNavItems: SubNavItem[] = [
  {
    title: 'Users',
    href: '/admin/management/users',
    icon: Users,
    description: 'Manage user accounts and permissions.',
  },
  {
    title: 'Clients',
    href: '/admin/management/clients',
    icon: Building2,
    description: 'Manage client accounts and settings.',
  },
  {
    title: 'Business',
    href: '/admin/management/business',
    icon: Briefcase,
    description: 'Manage business settings and configuration.',
  },
  {
    title: 'Roles & Permissions',
    href: '/admin/management/roles',
    icon: Shield,
    description: 'Manage user roles and access permissions.',
  },
];