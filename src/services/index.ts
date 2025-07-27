// Export all admin services
export { AdminService } from './adminService';
export { AgentStatusService } from './agentStatusService';
export { SystemMessageService } from './systemMessageService';
export { AuditService } from './auditService';

// Export cached services
export { CachedAdminService } from './cachedAdminService';
export { CachedDashboardService } from './cachedDashboardService';
export { CachedAnalyticsService } from './cachedAnalyticsService';
export { CachedCallsService } from './cachedCallsService';

// Export original services for direct access
export { DashboardService } from './dashboardService';
export { AnalyticsService } from './analyticsService';
export { CallsService } from './callsService';

// Re-export types for convenience
export type {
  Client,
  User,
  AgentStatus,
  SystemMessage,
  AuditLog,
  ClientFilters,
  UserFilters,
  SystemMessageFilters,
  AuditFilters,
  PaginatedResponse,
  PaginationOptions,
  DatabaseError,
  BulkOperation,
  BulkOperationResult,
  CreateClientData,
  UpdateClientData,
  CreateUserData,
  UpdateUserData
} from '@/types/admin';