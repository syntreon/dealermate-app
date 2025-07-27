/**
 * Client Data Isolation Utilities
 * 
 * CRITICAL: These utilities enforce strict data isolation between clients
 * for compliance and privacy requirements. All components and services
 * that handle multi-client data must use these utilities.
 */

import { UserRole } from '@/types/user';

// A flexible user type that covers the essential properties from both User and UserData
export interface AuthUser {
    role?: UserRole | null;
    is_admin?: boolean | null;
    client_id?: string | null;
}

/**
 * Role hierarchy levels for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
    'owner': 5,
    'admin': 4,
    'user': 3,
    'client_admin': 2,
    'client_user': 1
};

/**
 * Gets the hierarchy level for a user role
 * @param role The user role
 * @returns The hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole | null | undefined): number {
    if (!role) return 0;
    return ROLE_HIERARCHY[role] || 0;
}

/**
 * Checks if a user has system-wide access (can see all clients)
 * @param user The authenticated user
 * @returns Boolean indicating if user has system-wide access
 */
export function hasSystemWideAccess(user: AuthUser | null): boolean {
    if (!user) return false;

    // Owner, admin, and internal staff (user role) have system-wide access
    return user.is_admin ||
        user.role === 'owner' ||
        user.role === 'admin' ||
        user.role === 'user';
}

/**
 * Checks if a user has client admin privileges
 * @param user The authenticated user
 * @returns Boolean indicating if user has client admin privileges
 */
export function hasClientAdminAccess(user: AuthUser | null): boolean {
    if (!user) return false;

    // System-wide access users and client_admin have client admin privileges
    return hasSystemWideAccess(user) || user.role === 'client_admin';
}

/**
 * Determines if a user should see only their client's data
 * @param user The authenticated user
 * @returns Boolean indicating if data should be filtered by client
 */
export function shouldFilterByClient(user: AuthUser | null): boolean {
    if (!user) return true; // No user = no access

    // Users with system-wide access can see all data
    return !hasSystemWideAccess(user);
}

/**
 * Gets the client ID to filter by based on user
 * @param user The authenticated user
 * @returns The client ID to filter by, or null for system-wide users
 */
export function getClientIdFilter(user: AuthUser | null): string | null {
    if (!user) return null;

    if (shouldFilterByClient(user)) {
        return user.client_id || null;
    }

    return null; // System-wide users don't need filtering
}

/**
 * Checks if a user has permission to view specific client data
 * @param user The authenticated user
 * @param clientId The client ID of the data being accessed
 * @returns Boolean indicating if access is allowed
 */
export function canAccessClientData(user: AuthUser | null, clientId: string | null): boolean {
    if (!user) return false;

    // System-wide users can access all client data
    if (hasSystemWideAccess(user)) return true;

    // Client-restricted users can only access their own client's data
    return !!user.client_id && user.client_id === clientId;
}

/**
 * Determines if sensitive information should be visible (system-wide data)
 * @param user The authenticated user
 * @returns Boolean indicating if sensitive info should be visible
 */
export function canViewSensitiveInfo(user: AuthUser | null): boolean {
    return hasSystemWideAccess(user);
}

/**
 * Checks if user can view call details and tool calls
 * @param user The authenticated user
 * @returns Boolean indicating if call details access is allowed
 */
export function canViewCallDetails(user: AuthUser | null): boolean {
    if (!user) return false;

    // System-wide access users and client_admin can view call details
    return hasSystemWideAccess(user) || user.role === 'client_admin';
}

/**
 * Checks if user can view call evaluation data
 * @param user The authenticated user
 * @returns Boolean indicating if call evaluation access is allowed
 */
export function canViewCallEvaluation(user: AuthUser | null): boolean {
    if (!user) return false;

    // System-wide access users and client_admin can view call evaluations
    return hasSystemWideAccess(user) || user.role === 'client_admin';
}

/**
 * Checks if user can view specific KPI metrics
 * @param user The authenticated user
 * @returns Boolean indicating if KPI metrics access is allowed
 */
export function canViewKPIMetrics(user: AuthUser | null): boolean {
    if (!user) return false;

    // System-wide access users and client_admin can view KPI metrics
    return hasSystemWideAccess(user) || user.role === 'client_admin';
}

/**
 * Checks if user can access analytics page
 * @param user The authenticated user
 * @returns Boolean indicating if analytics access is allowed
 */
export function canAccessAnalytics(user: AuthUser | null): boolean {
    if (!user) return false;

    // System-wide access users and client_admin can access analytics, but not client_user
    return hasSystemWideAccess(user) || user.role === 'client_admin';
}

/**
 * Checks if user can manage other users within their scope
 * @param user The authenticated user
 * @param targetUser The user being managed (optional)
 * @returns Boolean indicating if user management is allowed
 */
export function canManageUsers(user: AuthUser | null, targetUser?: AuthUser | null): boolean {
    if (!user) return false;

    const userLevel = getRoleLevel(user.role);

    // System-wide users can manage users
    if (hasSystemWideAccess(user)) {
        // If targeting a specific user, check hierarchy
        if (targetUser) {
            const targetLevel = getRoleLevel(targetUser.role);
            return userLevel > targetLevel;
        }
        return true;
    }

    // Client admins can manage client users within their client
    if (user.role === 'client_admin' && targetUser) {
        const targetLevel = getRoleLevel(targetUser.role);
        return userLevel > targetLevel &&
            user.client_id === targetUser.client_id;
    }

    return false;
}

/**
 * Checks if user can access admin panel
 * @param user The authenticated user
 * @returns Boolean indicating if admin panel access is allowed
 */
export function canAccessAdminPanel(user: AuthUser | null): boolean {
    if (!user) return false;

    return user.is_admin ||
        user.role === 'owner' ||
        user.role === 'admin';
}

/**
 * Filters an array of items by client ID based on user permissions
 * @param items Array of items with client_id property
 * @param user The authenticated user
 * @returns Filtered array of items
 */
export function filterItemsByClientAccess<T extends { client_id?: string | null }>(
    items: T[],
    user: AuthUser | null
): T[] {
    if (!user) return [];

    if (shouldFilterByClient(user)) {
        return items.filter(item => item.client_id === user.client_id);
    }

    return items; // System-wide users see all items
}

/**
 * Configuration object for easy access control management
 * This makes it easier to update permissions in the future
 */
export const ACCESS_CONTROL_CONFIG = {
    // Features accessible to client_admin in addition to system-wide users
    CLIENT_ADMIN_FEATURES: {
        CALL_DETAILS: true,        // Can view call details and tool calls
        CALL_EVALUATION: true,     // Can view evaluation data (but not prompt adherence)
        KPI_METRICS: true,         // Can view advanced KPI dashboard metrics
        TOOL_CALLS: true,          // Can view tool calls section
        ANALYTICS: true,           // Can access analytics page
    },

    // Features only accessible to system-wide users (owner, admin, user)
    SYSTEM_ONLY_FEATURES: {
        PROMPT_ADHERENCE: true,    // Can view prompt adherence reviews
        SENSITIVE_INFO: true,      // Can view sensitive system information
        ADMIN_PANEL: true,         // Can access admin panel
        ALL_CLIENTS_DATA: true,    // Can view data from all clients
    },

    // Features restricted from client_user
    CLIENT_USER_RESTRICTIONS: {
        ANALYTICS: true,           // Cannot access analytics page
    }
} as const;