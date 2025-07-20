import { supabase } from '@/integrations/supabase/client';
import { 
  AgentStatus, 
  AgentStatusUpdate, 
  AgentStatusHistory, 
  PaginatedResponse, 
  PaginationOptions,
  DatabaseError 
} from '@/types/admin';
import { AuditService } from './auditService';

// Database utility functions
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('Agent Status Database error:', error);
  
  const dbError = new Error(error.message || 'Database operation failed') as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  
  return dbError;
};

// Get current user ID for audit logging
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

const transformAgentStatus = (row: any): AgentStatus => {
  return {
    id: row.id,
    client_id: row.client_id,
    status: row.status as 'active' | 'inactive' | 'maintenance',
    message: row.message,
    last_updated: new Date(row.last_updated),
    updated_by: row.updated_by,
    created_at: new Date(row.created_at)
  };
};

const transformAgentStatusHistory = (row: any): AgentStatusHistory => {
  return {
    id: row.id,
    client_id: row.client_id,
    status: row.status as 'active' | 'inactive' | 'maintenance',
    message: row.message,
    changed_at: new Date(row.changed_at),
    changed_by: row.changed_by,
    duration_minutes: row.duration_minutes || 0
  };
};

export const AgentStatusService = {
  /**
   * Get current agent status for a specific client or platform-wide
   */
  getAgentStatus: async (clientId?: string | null): Promise<AgentStatus | null> => {
    try {
      let query = supabase
        .from('agent_status')
        .select('*')
        .order('last_updated', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleDatabaseError(error);
      }

      return data ? transformAgentStatus(data) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Get agent status for multiple clients
   */
  getMultipleAgentStatuses: async (clientIds: string[]): Promise<AgentStatus[]> => {
    try {
      if (clientIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('agent_status')
        .select('*')
        .in('client_id', clientIds)
        .order('last_updated', { ascending: false });

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(transformAgentStatus);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Update agent status for a specific client or platform-wide
   */
  updateAgentStatus: async (
    clientId: string | null,
    statusUpdate: AgentStatusUpdate,
    updatedBy?: string
  ): Promise<AgentStatus> => {
    try {
      const userId = updatedBy || await getCurrentUserId();
      if (!userId) {
        throw new Error('User authentication required');
      }

      // Get existing status for audit logging
      const existingStatus = await AgentStatusService.getAgentStatus(clientId);

      // Use the upsert function to handle insert/update logic
      const { data, error } = await supabase
        .rpc('upsert_agent_status', {
          p_client_id: clientId,
          p_status: statusUpdate.status,
          p_message: statusUpdate.message || null,
          p_updated_by: userId
        });

      if (error) {
        console.error('Agent status update error:', error);
        throw handleDatabaseError(error);
      }

      const agentStatus = transformAgentStatus(data);

      // Log audit event
      try {
        await AuditService.logAgentStatusChange(
          userId,
          clientId,
          existingStatus?.status || null,
          statusUpdate.status,
          statusUpdate.message
        );
      } catch (auditError) {
        console.error('Failed to log agent status audit event:', auditError);
      }

      return agentStatus;
    } catch (error) {
      console.error('AgentStatusService.updateAgentStatus error:', error);
      throw handleDatabaseError(error);
    }
  },

  /**
   * Get agent status history for a client or platform-wide
   * Uses audit_logs table instead of separate history table
   */
  getAgentStatusHistory: async (
    clientId?: string | null,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<AgentStatusHistory>> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action', 'agent_status_change')
        .eq('table_name', 'agent_status')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
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

      // Transform audit logs to AgentStatusHistory format
      const history: AgentStatusHistory[] = (data || []).map(log => ({
        id: log.id,
        client_id: log.client_id,
        status: log.new_values?.status || 'unknown',
        message: log.new_values?.message || null,
        changed_at: new Date(log.created_at),
        changed_by: log.user_id || '',
        duration_minutes: 0 // Could be calculated if needed
      }));

      const total = count || 0;
      const limit = pagination?.limit || total;
      const page = pagination?.page || 1;

      return {
        data: history,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Get agent status summary for all clients (admin view)
   */
  getAgentStatusSummary: async (): Promise<{
    active: number;
    inactive: number;
    maintenance: number;
    total: number;
    statuses: AgentStatus[];
  }> => {
    try {
      const { data, error } = await supabase
        .from('agent_status')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) {
        throw handleDatabaseError(error);
      }

      const statuses = (data || []).map(transformAgentStatus);
      
      const summary = {
        active: statuses.filter(s => s.status === 'active').length,
        inactive: statuses.filter(s => s.status === 'inactive').length,
        maintenance: statuses.filter(s => s.status === 'maintenance').length,
        total: statuses.length,
        statuses
      };

      return summary;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Bulk update agent status for multiple clients
   */
  bulkUpdateAgentStatus: async (
    updates: Array<{
      clientId: string | null;
      status: AgentStatusUpdate;
    }>,
    updatedBy?: string
  ): Promise<AgentStatus[]> => {
    try {
      const userId = updatedBy || await getCurrentUserId();
      if (!userId) {
        throw new Error('User authentication required');
      }

      const results: AgentStatus[] = [];

      // Process updates sequentially to maintain data integrity
      for (const update of updates) {
        try {
          const result = await AgentStatusService.updateAgentStatus(
            update.clientId,
            update.status,
            userId
          );
          results.push(result);
        } catch (error) {
          console.error(`Failed to update agent status for client ${update.clientId}:`, error);
          // Continue with other updates even if one fails
        }
      }

      return results;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Check if agent status exists for a client
   */
  hasAgentStatus: async (clientId: string | null): Promise<boolean> => {
    try {
      const status = await AgentStatusService.getAgentStatus(clientId);
      return status !== null;
    } catch (error) {
      console.error('Error checking agent status existence:', error);
      return false;
    }
  },

  /**
   * Get agent uptime statistics
   * Uses audit_logs to calculate uptime from status changes
   */
  getAgentUptimeStats: async (
    clientId?: string | null,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    uptime: number; // percentage
    totalTime: number; // minutes
    activeTime: number; // minutes
    maintenanceTime: number; // minutes
    inactiveTime: number; // minutes
  }> => {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get status changes from audit logs
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'agent_status_change')
        .eq('table_name', 'agent_status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (clientId) {
        query = query.eq('client_id', clientId);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      // Calculate time in each status
      let activeTime = 0;
      let maintenanceTime = 0;
      let inactiveTime = 0;

      const statusChanges = data || [];
      
      // Simple calculation: assume current status for the entire timeframe
      // In a more sophisticated implementation, you'd calculate duration between status changes
      const totalMinutes = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60));
      
      if (statusChanges.length === 0) {
        // No status changes, assume active
        activeTime = totalMinutes;
      } else {
        // Use the most recent status for the entire period (simplified)
        const latestStatus = statusChanges[statusChanges.length - 1]?.new_values?.status || 'active';
        switch (latestStatus) {
          case 'active':
            activeTime = totalMinutes;
            break;
          case 'maintenance':
            maintenanceTime = totalMinutes;
            break;
          case 'inactive':
            inactiveTime = totalMinutes;
            break;
        }
      }

      const totalTime = activeTime + maintenanceTime + inactiveTime;
      const uptime = totalTime > 0 ? Math.round((activeTime / totalTime) * 100) : 100;

      return {
        uptime,
        totalTime,
        activeTime,
        maintenanceTime,
        inactiveTime
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
};