import { 
  AuditLog, 
  AuditAction,
  AuditFilters,
  PaginatedResponse,
  PaginationOptions,
  DatabaseError,
  User,
  Client
} from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Create an admin client if the service role key is available
// This is used to bypass RLS policies for administrative operations
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Create admin client only if service role key is available
const adminSupabase = SUPABASE_SERVICE_ROLE_KEY ? createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'supabase-js-admin'
      }
    }
  }
) : null;

// Database utility functions
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('Audit Database error:', error);
  
  const dbError = new Error(error.message || 'Audit operation failed') as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  
  return dbError;
};

const transformAuditLog = (row: Database['public']['Tables']['audit_logs']['Row']): AuditLog => {
  return {
    id: row.id,
    user_id: row.user_id,
    client_id: row.client_id,
    action: row.action as AuditAction,
    table_name: row.table_name,
    record_id: row.record_id,
    old_values: row.old_values as Record<string, any> | null,
    new_values: row.new_values as Record<string, any> | null,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    created_at: new Date(row.created_at),
  };
};

// Generate human-readable summary for audit log
const generateAuditSummary = (log: AuditLog): string => {
  const actionMap: Record<AuditAction, string> = {
    'create': 'created',
    'update': 'updated',
    'delete': 'deleted',
    'login': 'logged in',
    'logout': 'logged out',
    'password_change': 'changed password',
    'role_change': 'changed role',
    'permission_change': 'changed permissions',
    'agent_status_change': 'changed agent status',
    'system_message_create': 'created system message',
    'bulk_operation': 'performed bulk operation',
    'data_export': 'exported data',
    'data_import': 'imported data'
  };

  const actionText = actionMap[log.action] || log.action;
  const tableName = log.table_name.replace('_', ' ');
  
  if (log.record_id) {
    return `User ${actionText} ${tableName} record ${log.record_id}`;
  } else {
    return `User ${actionText} ${tableName}`;
  }
};

export const AuditService = {
  // Log an audit event
  logAuditEvent: async (
    userId: string | null,
    action: AuditAction,
    tableName: string,
    recordId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> => {
    // Create a minimal audit log object that will be returned if logging fails
    const minimalAuditLog = {
      id: 'error',
      user_id: userId,
      client_id: clientId || null,
      action: action,
      table_name: tableName,
      record_id: recordId || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: new Date(),
      summary: `Failed to log ${action} on ${tableName}`
    };

    // Check if we have the service role key available
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Audit logging skipped: No service role key available');
      return minimalAuditLog;
    }

    try {
      const auditData = {
        user_id: userId,
        client_id: clientId || null,
        action,
        table_name: tableName,
        record_id: recordId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      };

      console.log('Attempting audit log with admin client:', { 
        action, 
        tableName, 
        recordId,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
        adminClientAvailable: !!adminSupabase
      });

      // Try admin client if available (bypasses RLS)
      if (adminSupabase) {
        try {
          const { data, error } = await adminSupabase
            .from('audit_logs')
            .insert(auditData)
            .select()
            .single();

          if (error) {
            console.error('Admin client error for audit logging:', error);
            return minimalAuditLog;
          }

          if (data) {
            const auditLog = transformAuditLog(data);
            auditLog.summary = generateAuditSummary(auditLog);
            console.log('Audit log created successfully with admin client');
            return auditLog;
          }
        } catch (adminError) {
          console.error('Admin client exception for audit logging:', adminError);
          return minimalAuditLog;
        }
      } else {
        console.warn('Admin client not available for audit logging');
      }
      
      // Don't try with regular client as it will fail due to RLS
      // Just return the minimal audit log
      console.warn('Skipping regular client fallback for audit logging due to RLS restrictions');
      return minimalAuditLog;
    } catch (error) {
      // For non-critical operations, log the error but don't throw
      // This prevents audit logging failures from breaking core functionality
      console.error('Audit logging failed:', error);
      return minimalAuditLog;
    }
  },

  // Get audit logs with filtering and pagination
  getAuditLogs: async (
    filters?: AuditFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<AuditLog>> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users(id, full_name, email),
          clients(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id);
        }

        if (filters.client_id) {
          query = query.eq('client_id', filters.client_id);
        }

        if (filters.action && filters.action !== 'all') {
          query = query.eq('action', filters.action);
        }

        if (filters.table_name) {
          query = query.eq('table_name', filters.table_name);
        }

        if (filters.dateRange) {
          query = query
            .gte('created_at', filters.dateRange.start.toISOString())
            .lte('created_at', filters.dateRange.end.toISOString());
        }

        if (filters.search) {
          query = query.or(`action.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
        }

        // Apply sorting
        if (filters.sortBy) {
          const ascending = filters.sortDirection !== 'desc';
          query = query.order(filters.sortBy, { ascending });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (pagination) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      // Transform data and add user/client info
      const auditLogs = (data || []).map(row => {
        const log = transformAuditLog(row);
        
        // Add user info
        if ((row as any).users) {
          log.user = {
            id: (row as any).users.id,
            full_name: (row as any).users.full_name,
            email: (row as any).users.email
          } as User;
        }

        // Add client info
        if ((row as any).clients) {
          log.client = {
            id: (row as any).clients.id,
            name: (row as any).clients.name
          } as Client;
        }

        // Generate summary
        log.summary = generateAuditSummary(log);

        return log;
      });

      const total = count || 0;
      const limit = pagination?.limit || total;
      const page = pagination?.page || 1;

      return {
        data: auditLogs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get audit logs for a specific record
  getRecordAuditLogs: async (tableName: string, recordId: string): Promise<AuditLog[]> => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users(id, full_name, email)
        `)
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(row => {
        const log = transformAuditLog(row);
        
        if ((row as any).users) {
          log.user = {
            id: (row as any).users.id,
            full_name: (row as any).users.full_name,
            email: (row as any).users.email
          } as User;
        }

        log.summary = generateAuditSummary(log);
        return log;
      });
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get audit statistics
  getAuditStatistics: async (
    dateRange?: { start: Date; end: Date },
    clientId?: string
  ): Promise<{
    totalEvents: number;
    byAction: Record<string, number>;
    byTable: Record<string, number>;
    byUser: Record<string, number>;
    recentActivity: AuditLog[];
  }> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          action,
          table_name,
          user_id,
          created_at,
          users(full_name)
        `);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      const stats = {
        totalEvents: data?.length || 0,
        byAction: {} as Record<string, number>,
        byTable: {} as Record<string, number>,
        byUser: {} as Record<string, number>,
        recentActivity: [] as AuditLog[]
      };

      (data || []).forEach(row => {
        // Count by action
        stats.byAction[row.action] = (stats.byAction[row.action] || 0) + 1;

        // Count by table
        stats.byTable[row.table_name] = (stats.byTable[row.table_name] || 0) + 1;

        // Count by user
        const userName = (row as any).users?.full_name || 'Unknown User';
        stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;
      });

      // Get recent activity (last 10 events)
      const recentQuery = await supabase
        .from('audit_logs')
        .select(`
          *,
          users(id, full_name, email),
          clients(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentQuery.data) {
        stats.recentActivity = recentQuery.data.map(row => {
          const log = transformAuditLog(row);
          
          if ((row as any).users) {
            log.user = {
              id: (row as any).users.id,
              full_name: (row as any).users.full_name,
              email: (row as any).users.email
            } as User;
          }

          if ((row as any).clients) {
            log.client = {
              id: (row as any).clients.id,
              name: (row as any).clients.name
            } as Client;
          }

          log.summary = generateAuditSummary(log);
          return log;
        });
      }

      return stats;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Export audit logs
  exportAuditLogs: async (
    filters?: AuditFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<{ data: string; filename: string }> => {
    try {
      // Get all matching audit logs (without pagination)
      const result = await AuditService.getAuditLogs(filters, { page: 1, limit: 10000 });
      const logs = result.data;

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit_logs_${timestamp}.${format}`;

      if (format === 'json') {
        return {
          data: JSON.stringify(logs, null, 2),
          filename
        };
      } else {
        // CSV format
        const headers = [
          'ID',
          'Date/Time',
          'User',
          'Action',
          'Table',
          'Record ID',
          'Client',
          'Summary',
          'IP Address'
        ];

        const csvRows = [
          headers.join(','),
          ...logs.map(log => [
            log.id,
            log.created_at.toISOString(),
            log.user?.full_name || 'Unknown',
            log.action,
            log.table_name,
            log.record_id || '',
            log.client?.name || '',
            `"${log.summary || ''}"`,
            log.ip_address || ''
          ].join(','))
        ];

        return {
          data: csvRows.join('\n'),
          filename
        };
      }
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Clean up old audit logs (for data retention)
  cleanupOldAuditLogs: async (retentionDays: number = 365): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw handleDatabaseError(error);
      }

      return data?.length || 0;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Helper functions for common audit operations
  logClientAction: async (
    userId: string,
    action: 'create' | 'update' | 'delete',
    clientId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> => {
    return AuditService.logAuditEvent(
      userId,
      action,
      'clients',
      clientId,
      oldValues,
      newValues,
      clientId,
      ipAddress,
      userAgent
    );
  },

  logUserAction: async (
    userId: string,
    action: 'create' | 'update' | 'delete',
    targetUserId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> => {
    // Use the generic logAuditEvent which already handles the adminSupabase client
    try {
      return AuditService.logAuditEvent(
        userId,
        action,
        'users',
        targetUserId,
        oldValues,
        newValues,
        clientId,
        ipAddress,
        userAgent
      );
    } catch (error) {
      // For user actions, we don't want audit failures to break core functionality
      // Log the error but return a minimal audit log object
      console.error('Failed to log user action:', error);
      
      return {
        id: 'error',
        user_id: userId,
        client_id: clientId || null,
        action: action,
        table_name: 'users',
        record_id: targetUserId,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        created_at: new Date(),
        summary: `Failed to log ${action} on users record ${targetUserId}`
      };
    }
  },

  logAgentStatusChange: async (
    userId: string,
    clientId: string,
    oldStatus?: string,
    newStatus?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> => {
    return AuditService.logAuditEvent(
      userId,
      'agent_status_change',
      'agent_status',
      clientId,
      oldStatus ? { status: oldStatus } : undefined,
      newStatus ? { status: newStatus } : undefined,
      clientId,
      ipAddress,
      userAgent
    );
  },

  logSystemMessageAction: async (
    userId: string,
    messageId: string,
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> => {
    return AuditService.logAuditEvent(
      userId,
      'system_message_create',
      'system_messages',
      messageId,
      undefined,
      undefined,
      clientId,
      ipAddress,
      userAgent
    );
  },

  logBulkOperation: async (
    userId: string,
    tableName: string,
    operation: string,
    affectedIds: string[],
    clientId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> => {
    // Use the generic logAuditEvent which already handles the adminSupabase client
    try {
      return AuditService.logAuditEvent(
        userId,
        'bulk_operation',
        tableName,
        undefined,
        undefined,
        { operation, affected_ids: affectedIds, count: affectedIds.length },
        clientId,
        ipAddress,
        userAgent
      );
    } catch (error) {
      // For bulk operations, we don't want audit failures to break core functionality
      // Log the error but return a minimal audit log object
      console.error('Failed to log bulk operation:', error);
      
      return {
        id: 'error',
        user_id: userId,
        client_id: clientId || null,
        action: 'bulk_operation',
        table_name: tableName,
        record_id: null,
        old_values: null,
        new_values: { operation, affected_ids: affectedIds, count: affectedIds.length },
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        created_at: new Date(),
        summary: `Failed to log bulk ${operation} on ${tableName}`
      };
    }
  }
};