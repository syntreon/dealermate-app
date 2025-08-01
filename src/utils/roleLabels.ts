// Centralized mapping for user role display names
// Use this everywhere roles are displayed in the UI

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  client_admin: 'Business Manager', // was Client Manager
  user: 'Account Manager',          // was User (global)
  client_user: 'User',              // was Client User
};

/**
 * Get the display label for a given role.
 * Falls back to the role string if not found.
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}
