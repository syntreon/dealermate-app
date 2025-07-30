import { FileText, User, Building2, Server } from 'lucide-react';

export interface SubNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export const auditNavItems: SubNavItem[] = [
  {
    title: 'All Logs',
    href: '/admin/audit/all',
    icon: FileText,
    description: 'View all system audit logs and activities.',
  },
  {
    title: 'User Logs',
    href: '/admin/audit/users',
    icon: User,
    description: 'View user-specific audit logs and actions.',
  },
  {
    title: 'Client Logs',
    href: '/admin/audit/clients',
    icon: Building2,
    description: 'View client-related audit logs and changes.',
  },
  {
    title: 'System Logs',
    href: '/admin/audit/system',
    icon: Server,
    description: 'View system-level logs and operations.',
  },
];