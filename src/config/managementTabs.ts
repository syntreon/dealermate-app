// Centralized management tab config for admin panel
// Only update this file to change which roles see which tabs
export interface ManagementTab {
  id: string;
  label: string;
  href: string;
  roles: ('system_admin' | 'client_admin')[];
}

export const managementTabs: ManagementTab[] = [
  { id: 'users', label: 'Users', href: '/admin/management/user-management', roles: ['system_admin', 'client_admin'] },
  { id: 'business', label: 'Business', href: '/admin/management/business', roles: ['system_admin', 'client_admin'] },
  { id: 'roles', label: 'Roles', href: '/admin/management/roles', roles: ['system_admin', 'client_admin'] },
  { id: 'permissions', label: 'Permissions', href: '/admin/management/permissions', roles: ['system_admin', 'client_admin'] },
  { id: 'clients', label: 'Clients', href: '/admin/management/client-management', roles: ['system_admin'] },
  // Add more as needed
];
