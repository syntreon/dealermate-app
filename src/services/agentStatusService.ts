import { 
  AgentStatus, 
  AgentStatusUpdate, 
  AgentStatusHistory,
  DatabaseError,
  User
} from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Database utility functions
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('Agent Status Database error:', error);
  
  const dbError = new Error(error.message || 'Agent status operation failed') as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  
  return dbError;
};

const transformAgentStatus = (row: Database['public']['Tables']['agent_status']['Row']): AgentStatus => {
  return {
    id: row.id,
    client_id: row.client_id,
    status: row.status as 'active' | 'inactive' | 'maintenance',
    message: row.message,
    last_updated: new Date(row.last_updated),
    updated_by: row.updated_by,
    created_at: new Date(row.created_at),
  };
};

export const AgentStatusService = {
  // Get agent status for a specific client or all clients
  getAgentStatus: async (clientId?: string): Promise<AgentStatus[]> => {
    try {
      let query = supabase
        .from('agent_status')
        .select('*')
        .order('last_updated', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(transformAgentStatus);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get agent status for a specific client (single record)
  getClientAgentStatus: async (clientId: string): Promise<AgentStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('agent_status')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleDatabaseError(error);
      }

      return transformAgentStatus(data);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update agent status for a client
  updateAgentStatus: async (clientId: string, update: AgentStatusUpdate, updatedBy: string): Promise<AgentStatus> => {
    try {
      // First, try to update existing record
      const { data: existingData, error: selectError } = await supabase
        .from('agent_status')
        .select('*')
        .eq('client_id', clientId)
        .single();

      let result;

      if (selectError && selectError.code === 'PGRST116') {
        // Record doesn't exist, create new one
        const { data: newData, error: insertError } = await supabase
          .from('agent_status')
          .insert({
            client_id: clientId,
            status: update.status,
            message: update.message || null,
            updated_by: updatedBy,
            last_updated: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw handleDatabaseError(insertError);
        }

        result = newData;
      } else if (selectError) {
        throw handleDatabaseError(selectError);
      } else {
        // Record exists, update it
        const { data: updatedData, error: updateError } = await supabase
          .from('agent_status')
          .update({
            status: update.status,
            message: update.message || null,
            updated_by: updatedBy,
            last_updated: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .select()
          .single();

        if (updateError) {
          throw handleDatabaseError(updateError);
        }

        result = updatedData;
      }

      return transformAgentStatus(result);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get agent status history for a client
  getAgentStatusHistory: async (clientId: string, limit: number = 50): Promise<AgentStatusHistory[]> => {
    try {
      // For now, we'll use the current agent_status table as history
      // In a full implementation, you'd have a separate agent_status_history table
      const { data, error } = await supabase
        .from('agent_status')
        .select(`
          *,
          users!agent_status_updated_by_fkey(id, full_name, email)
        `)
        .eq('client_id', clientId)
        .order('last_updated', { ascending: false })
        .limit(limit);

      if (error) {
        throw handleDatabaseError(error);
      }

      // Transform to history format
      return (data || []).map((row, index, array) => {
        const current = transformAgentStatus(row);
        const next = array[index + 1];
        
        // Calculate duration until next change (or current time if it's the latest)
        const endTime = next ? new Date(next.last_updated) : new Date();
        const duration = Math.floor((endTime.getTime() - current.last_updated.getTime()) / (1000 * 60));

        return {
          id: current.id,
          client_id: current.client_id,
          status: current.status,
          message: current.message,
          changed_at: current.last_updated,
          changed_by: current.updated_by,
          duration_minutes: duration,
          changedByUser: (row as any).users ? {
            id: (row as any).users.id,
            full_name: (row as any).users.full_name,
            email: (row as any).users.email
          } as User : undefined
        };
      });
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get all agent statuses with user information
  getAgentStatusWithUsers: async (): Promise<(AgentStatus & { updatedByUser?: User })[]> => {
    try {
      const { data, error } = await supabase
        .from('agent_status')
        .select(`
          *,
          users!agent_status_updated_by_fkey(id, full_name, email),
          clients(id, name)
        `)
        .order('last_updated', { ascending: false });

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(row => {
        const status = transformAgentStatus(row);
        return {
          ...status,
          updatedByUser: (row as any).users ? {
            id: (row as any).users.id,
            full_name: (row as any).users.full_name,
            email: (row as any).users.email
          } as User : undefined
        };
      });
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Subscribe to agent status changes for real-time updates
  subscribeToAgentStatus: (clientId: string | null, callback: (status: AgentStatus) => void) => {
    let channel = supabase
      .channel('agent_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_status',
          filter: clientId ? `client_id=eq.${clientId}` : undefined
        },
        (payload) => {
          if (payload.new) {
            callback(transformAgentStatus(payload.new as any));
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },

  // Bulk update agent status for multiple clients
  bulkUpdateAgentStatus: async (
    updates: Array<{ clientId: string; update: AgentStatusUpdate }>,
    updatedBy: string
  ): Promise<AgentStatus[]> => {
    try {
      const results: AgentStatus[] = [];
      
      // Process updates sequentially to avoid conflicts
      for (const { clientId, update } of updates) {
        try {
          const result = await AgentStatusService.updateAgentStatus(clientId, update, updatedBy);
          results.push(result);
        } catch (error) {
          console.error(`Failed to update agent status for client ${clientId}:`, error);
          // Continue with other updates even if one fails
        }
      }

      return results;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Initialize agent status for a new client
  initializeClientAgentStatus: async (clientId: string, updatedBy: string): Promise<AgentStatus> => {
    try {
      const { data, error } = await supabase
        .from('agent_status')
        .insert({
          client_id: clientId,
          status: 'inactive',
          message: 'Agent initialized - awaiting activation',
          updated_by: updatedBy,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      return transformAgentStatus(data);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete agent status record (when client is deleted)
  deleteAgentStatus: async (clientId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('agent_status')
        .delete()
        .eq('client_id', clientId);

      if (error) {
        throw handleDatabaseError(error);
      }
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
};