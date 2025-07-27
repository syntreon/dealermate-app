/**
 * Cached wrapper for AdminService
 * Implements caching strategies for admin data
 */

import { AdminService } from './adminService';
import { 
  adminCache, 
  CacheKeys, 
  CacheInvalidation 
} from '@/utils/cache';
import type { 
  Client,
  User,
  ClientFilters,
  UserFilters,
  PaginatedResponse,
  PaginationOptions,
  CreateClientData,
  UpdateClientData,
  CreateUserData,
  UpdateUserData,
  BulkOperation,
  BulkOperationResult,
  SystemHealth
} from '@/types/admin';

export const CachedAdminService = {
  // Client management with caching
  getClients: async (filters?: ClientFilters, pagination?: PaginationOptions): Promise<Client[]> => {
    const result = await CachedAdminService.getClientsPaginated(filters, pagination);
    return result.data;
  },

  getClientsPaginated: async (
    filters?: ClientFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Client>> => {
    const cacheKey = CacheKeys.adminClients(filters, pagination);
    
    return adminCache.getOrSet(
      cacheKey,
      () => AdminService.getClientsPaginated(filters, pagination),
      3 * 60 * 1000 // 3 minutes TTL
    );
  },

  getClientById: async (id: string): Promise<Client | null> => {
    const cacheKey = `admin:client:${id}`;
    
    return adminCache.getOrSet(
      cacheKey,
      () => AdminService.getClientById(id),
      2 * 60 * 1000 // 2 minutes TTL for individual client
    );
  },

  createClient: async (data: CreateClientData, userId?: string): Promise<Client> => {
    const client = await AdminService.createClient(data, userId);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateAdmin();
    
    // Cache the new client
    const cacheKey = `admin:client:${client.id}`;
    adminCache.set(cacheKey, client, 2 * 60 * 1000);
    
    return client;
  },

  updateClient: async (id: string, data: UpdateClientData, userId?: string): Promise<Client> => {
    const client = await AdminService.updateClient(id, data, userId);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateAdmin();
    
    // Update the cached client
    const cacheKey = `admin:client:${id}`;
    adminCache.set(cacheKey, client, 2 * 60 * 1000);
    
    return client;
  },

  deleteClient: async (id: string, userId?: string): Promise<void> => {
    await AdminService.deleteClient(id, userId);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateAdmin();
    adminCache.delete(`admin:client:${id}`);
  },

  activateClient: async (id: string, userId?: string): Promise<Client> => {
    return CachedAdminService.updateClient(id, { status: 'active' }, userId);
  },

  deactivateClient: async (id: string, userId?: string): Promise<Client> => {
    return CachedAdminService.updateClient(id, { status: 'inactive' }, userId);
  },

  setClientToTrial: async (id: string, userId?: string): Promise<Client> => {
    return CachedAdminService.updateClient(id, { status: 'trial' }, userId);
  },

  churnClient: async (id: string, userId?: string): Promise<Client> => {
    return CachedAdminService.updateClient(id, { status: 'churned' }, userId);
  },

  bulkUpdateClients: async (operation: BulkOperation, userId?: string): Promise<BulkOperationResult> => {
    const result = await AdminService.bulkUpdateClients(operation, userId);
    
    // Invalidate all admin caches after bulk operations
    CacheInvalidation.invalidateAdmin();
    
    return result;
  },

  // User management with caching
  getUsers: async (filters?: UserFilters, pagination?: PaginationOptions): Promise<User[]> => {
    const result = await CachedAdminService.getUsersPaginated(filters, pagination);
    return result.data;
  },

  getUsersPaginated: async (
    filters?: UserFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<User>> => {
    const cacheKey = CacheKeys.adminUsers(filters, pagination);
    
    return adminCache.getOrSet(
      cacheKey,
      () => AdminService.getUsersPaginated(filters, pagination),
      3 * 60 * 1000 // 3 minutes TTL
    );
  },

  getUserById: async (id: string): Promise<User | null> => {
    const cacheKey = `admin:user:${id}`;
    
    return adminCache.getOrSet(
      cacheKey,
      () => AdminService.getUserById(id),
      2 * 60 * 1000 // 2 minutes TTL for individual user
    );
  },

  createUser: async (data: CreateUserData, createdBy?: string): Promise<User> => {
    const user = await AdminService.createUser(data, createdBy);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateAdmin();
    
    // Cache the new user
    const cacheKey = `admin:user:${user.id}`;
    adminCache.set(cacheKey, user, 2 * 60 * 1000);
    
    return user;
  },

  updateUser: async (id: string, data: UpdateUserData, updatedBy?: string): Promise<User> => {
    const user = await AdminService.updateUser(id, data, updatedBy);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateAdmin();
    
    // Update the cached user
    const cacheKey = `admin:user:${id}`;
    adminCache.set(cacheKey, user, 2 * 60 * 1000);
    
    return user;
  },

  deleteUser: async (id: string, deletedBy?: string): Promise<void> => {
    await AdminService.deleteUser(id, deletedBy);
    
    // Invalidate relevant caches
    CacheInvalidation.invalidateAdmin();
    adminCache.delete(`admin:user:${id}`);
  },

  bulkUpdateUsers: async (operation: BulkOperation, userId?: string): Promise<BulkOperationResult> => {
    const result = await AdminService.bulkUpdateUsers(operation, userId);
    
    // Invalidate all admin caches after bulk operations
    CacheInvalidation.invalidateAdmin();
    
    return result;
  },

  // System health with caching
  getSystemHealth: async (clientId?: string | null): Promise<SystemHealth> => {
    const cacheKey = CacheKeys.systemHealth(clientId);
    
    return adminCache.getOrSet(
      cacheKey,
      () => AdminService.getSystemHealth(clientId),
      30 * 1000 // 30 seconds TTL for system health
    );
  },

  // Saved filter management (these use localStorage, so no additional caching needed)
  getSavedFilters: AdminService.getSavedFilters,
  saveFilter: AdminService.saveFilter,
  updateSavedFilter: AdminService.updateSavedFilter,
  deleteSavedFilter: AdminService.deleteSavedFilter,

  /**
   * Batch load admin data for better performance
   */
  batchLoadAdminData: async (
    clientFilters?: ClientFilters,
    userFilters?: UserFilters,
    pagination?: PaginationOptions
  ) => {
    const promises = [
      CachedAdminService.getClientsPaginated(clientFilters, pagination),
      CachedAdminService.getUsersPaginated(userFilters, pagination),
      CachedAdminService.getSystemHealth()
    ];

    try {
      const [clients, users, systemHealth] = await Promise.all(promises);
      return { clients, users, systemHealth };
    } catch (error) {
      console.warn('Failed to batch load some admin data:', error);
      throw error;
    }
  },

  /**
   * Preload admin data for better performance
   */
  preloadAdminData: async () => {
    const promises = [
      // Load first page of clients and users
      CachedAdminService.getClientsPaginated(undefined, { page: 1, limit: 20 }),
      CachedAdminService.getUsersPaginated(undefined, { page: 1, limit: 20 }),
      
      // Load system health
      CachedAdminService.getSystemHealth(),
      
      // Load common client filters
      CachedAdminService.getClientsPaginated({ status: 'active' }, { page: 1, limit: 10 }),
      CachedAdminService.getClientsPaginated({ status: 'trial' }, { page: 1, limit: 10 }),
      
      // Load common user filters
      CachedAdminService.getUsersPaginated({ role: 'client_admin' }, { page: 1, limit: 10 }),
      CachedAdminService.getUsersPaginated({ role: 'client_user' }, { page: 1, limit: 10 })
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.warn('Failed to preload some admin data:', error);
    }
  },

  /**
   * Invalidate admin cache
   */
  invalidateCache: () => {
    CacheInvalidation.invalidateAdmin();
  },

  /**
   * Force refresh clients data (bypass cache)
   */
  refreshClients: async (
    filters?: ClientFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<Client>> => {
    const cacheKey = CacheKeys.adminClients(filters, pagination);
    adminCache.delete(cacheKey);
    return CachedAdminService.getClientsPaginated(filters, pagination);
  },

  /**
   * Force refresh users data (bypass cache)
   */
  refreshUsers: async (
    filters?: UserFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<User>> => {
    const cacheKey = CacheKeys.adminUsers(filters, pagination);
    adminCache.delete(cacheKey);
    return CachedAdminService.getUsersPaginated(filters, pagination);
  },

  /**
   * Get cache statistics for admin data
   */
  getCacheStats: () => {
    return adminCache.getStats();
  },

  /**
   * Clear admin cache
   */
  clearCache: () => {
    adminCache.clear();
  },

  /**
   * Warm up cache with common admin queries
   */
  warmUpCache: async () => {
    const commonQueries = [
      // Common client queries
      () => CachedAdminService.getClientsPaginated(undefined, { page: 1, limit: 20 }),
      () => CachedAdminService.getClientsPaginated({ status: 'active' }),
      () => CachedAdminService.getClientsPaginated({ status: 'trial' }),
      () => CachedAdminService.getClientsPaginated({ status: 'inactive' }),
      
      // Common user queries
      () => CachedAdminService.getUsersPaginated(undefined, { page: 1, limit: 20 }),
      () => CachedAdminService.getUsersPaginated({ role: 'client_admin' }),
      () => CachedAdminService.getUsersPaginated({ role: 'client_user' }),
      () => CachedAdminService.getUsersPaginated({ role: 'admin' }),
      
      // System health
      () => CachedAdminService.getSystemHealth()
    ];

    // Execute queries in batches
    const batchSize = 3;
    for (let i = 0; i < commonQueries.length; i += batchSize) {
      const batch = commonQueries.slice(i, i + batchSize);
      try {
        await Promise.all(batch.map(query => query()));
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to warm up admin cache batch ${i / batchSize + 1}:`, error);
      }
    }
  }
};

// Export the original service as well for direct access when needed
export { AdminService };