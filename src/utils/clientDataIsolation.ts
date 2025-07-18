/**
 * Client Data Isolation Utilities
 * 
 * CRITICAL: These utilities enforce strict data isolation between clients
 * for compliance and privacy requirements. All components and services
 * that handle multi-client data must use these utilities.
 */

import { User } from '@/types/user';

/**
 * Determines if a user should see only their client's data
 * @param user The authenticated user
 * @returns Boolean indicating if data should be filtered by client
 */
export function shouldFilterByClient(user: User | null): boolean {
    if (!user) return true; // No user = no access

    // Admin users can see all data
    if (user.is_admin || user.role === 'admin' || user.role === 'owner') {
        return false;
    }

    // All other users should only see their client's data
    return true;
}

/**
 * Gets the client ID to filter by based on user
 * @param user The authenticated user
 * @returns The client ID to filter by, or null for admins
 */
export function getClientIdFilter(user: User | null): string | null {
    if (!user) return null;

    if (shouldFilterByClient(user)) {
        return user.client_id;
    }

    return null; // Admin users don't need filtering
}

/**
 * Checks if a user has permission to view specific client data
 * @param user The authenticated user
 * @param clientId The client ID of the data being accessed
 * @returns Boolean indicating if access is allowed
 */
export function canAccessClientData(user: User | null, clientId: string | null): boolean {
    if (!user) return false;

    // Admin users can access all client data
    if (!shouldFilterByClient(user)) return true;

    // Non-admin users can only access their own client's data
    return user.client_id === clientId;
}

/**
 * Determines if sensitive information should be visible
 * @param user The authenticated user
 * @returns Boolean indicating if sensitive info should be visible
 */
export function canViewSensitiveInfo(user: User | null): boolean {
    if (!user) return false;

    return user.is_admin || user.role === 'admin' || user.role === 'owner';
}

/**
 * Filters an array of items by client ID based on user permissions
 * @param items Array of items with client_id property
 * @param user The authenticated user
 * @returns Filtered array of items
 */
export function filterItemsByClientAccess<T extends { client_id?: string | null }>(
    items: T[],
    user: User | null
): T[] {
    if (!user) return [];

    if (shouldFilterByClient(user)) {
        return items.filter(item => item.client_id === user.client_id);
    }

    return items; // Admin users see all items
}