import { ShieldCheck, SlidersHorizontal } from 'lucide-react';

export interface SubNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

export const settingsNavItems: SubNavItem[] = [
  {
    title: 'General',
    href: '/admin/settings',
    icon: SlidersHorizontal,
    description: 'Manage general application settings.',
  },
  {
    title: 'Agent Status',
    href: '/admin/settings/agent-status',
    icon: ShieldCheck,
    description: 'Control agent status and broadcast messages.',
  },
];
