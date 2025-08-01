// Centralized management tab config for admin panel
// This is part of the config-driven routing system planned for future implementation
// Currently used for role-based access control in Management section
// Future: Will be integrated with adminRoutes.ts for unified config-driven routing

export interface ManagementTab {
  id: string;
  label: string;
  href: string;
  roles: ('system_admin' | 'client_admin')[];
}

export const managementTabs: ManagementTab[] = [
  {
    id: 'users',
    label: 'Users',
    href: '/admin/management/user-management',
    roles: ['system_admin', 'client_admin']
  },
  {
    id: 'business',
    label: 'Business',
    href: '/admin/management/business',
    roles: ['system_admin', 'client_admin']
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    href: '/admin/management/roles',
    roles: ['system_admin', 'client_admin']
  },
  {
    id: 'clients',
    label: 'Clients',
    href: '/admin/management/client-management',
    roles: ['system_admin'] // Only system admins can manage clients
  },
];

// Helper function to filter tabs based on user role
export const getFilteredManagementTabs = (userRole: string): ManagementTab[] => {
  return managementTabs.filter(tab =>
    tab.roles.includes(userRole as 'system_admin' | 'client_admin')
  );
};

// Helper function to check if user has access to a specific tab
export const hasTabAccess = (tabId: string, userRole: string): boolean => {
  const tab = managementTabs.find(t => t.id === tabId);
  return tab ? tab.roles.includes(userRole as 'system_admin' | 'client_admin') : false;
};