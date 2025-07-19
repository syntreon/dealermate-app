// Export all admin services
export { AdminService } from './adminService';
export { AgentStatusService } from './agentStatusService';
export { SystemMessageService } from './systemMessageService';
export { AuditService } from './auditService';

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
  BulkOperationResult
} from '@/types/admin';