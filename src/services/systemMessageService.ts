import { 
  SystemMessage, 
  CreateSystemMessageData, 
  UpdateSystemMessageData,
  SystemMessageFilters,
  PaginatedResponse,
  PaginationOptions,
  DatabaseError,
  User,
  Client
} from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Database utility functions
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('System Message Database error:', error);
  
  const dbError = new Error(error.message || 'System message operation failed') as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  
  return dbError;
};

const transformSystemMessage = (row: Database['public']['Tables']['system_messages']['Row']): SystemMessage => {
  const message: SystemMessage = {
    id: row.id,
    client_id: row.client_id,
    type: row.type as 'info' | 'warning' | 'error' | 'success',
    message: row.message,
    timestamp: new Date(row.timestamp),
    expires_at: row.expires_at ? new Date(row.expires_at) : null,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };

  // Add computed fields
  message.isExpired = message.expires_at ? new Date() > message.expires_at : false;
  message.isGlobal = message.client_id === null;

  return message;
};

export const SystemMessageService = {
  // Get system messages with filtering and pagination
  getSystemMessages: async (
    filters?: SystemMessageFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<SystemMessage>> => {
    try {
      let query = supabase
        .from('system_messages')
        .select(`
          *,
          users!system_messages_created_by_fkey(id, full_name, email),
          clients(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.client_id && filters.client_id !== 'all') {
          if (filters.client_id === 'global') {
            query = query.is('client_id', null);
          } else {
            query = query.eq('client_id', filters.client_id);
          }
        }

        if (filters.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }

        if (filters.search) {
          query = query.ilike('message', `%${filters.search}%`);
        }

        // Handle expired messages
        if (!filters.includeExpired) {
          query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
        }

        // Apply sorting
        if (filters.sortBy) {
          const ascending = filters.sortDirection !== 'desc';
          query = query.order(filters.sortBy, { ascending });
        } else {
          query = query.order('timestamp', { ascending: false });
        }
      } else {
        // Default: exclude expired messages and sort by timestamp
        query = query
          .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
          .order('timestamp', { ascending: false });
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
      const messages = (data || []).map(row => {
        const message = transformSystemMessage(row);
        
        // Add user info
        if ((row as any).users) {
          message.createdByUser = {
            id: (row as any).users.id,
            full_name: (row as any).users.full_name,
            email: (row as any).users.email
          } as User;
        }

        return message;
      });

      const total = count || 0;
      const limit = pagination?.limit || total;
      const page = pagination?.page || 1;

      return {
        data: messages,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get system messages for a specific client (including global messages)
  getClientSystemMessages: async (clientId: string): Promise<SystemMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('system_messages')
        .select(`
          *,
          users!system_messages_created_by_fkey(id, full_name, email)
        `)
        .or(`client_id.is.null,client_id.eq.${clientId}`)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(row => {
        const message = transformSystemMessage(row);
        
        if ((row as any).users) {
          message.createdByUser = {
            id: (row as any).users.id,
            full_name: (row as any).users.full_name,
            email: (row as any).users.email
          } as User;
        }

        return message;
      });
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get a specific system message by ID
  getSystemMessageById: async (id: string): Promise<SystemMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('system_messages')
        .select(`
          *,
          users!system_messages_created_by_fkey(id, full_name, email),
          clients(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleDatabaseError(error);
      }

      const message = transformSystemMessage(data);
      
      if ((data as any).users) {
        message.createdByUser = {
          id: (data as any).users.id,
          full_name: (data as any).users.full_name,
          email: (data as any).users.email
        } as User;
      }

      return message;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Create a new system message
  createSystemMessage: async (data: CreateSystemMessageData, createdBy: string): Promise<SystemMessage> => {
    try {
      const { data: newMessage, error } = await supabase
        .from('system_messages')
        .insert({
          client_id: data.client_id || null,
          type: data.type,
          message: data.message,
          expires_at: data.expires_at ? data.expires_at.toISOString() : null,
          created_by: createdBy,
          timestamp: new Date().toISOString()
        })
        .select(`
          *,
          users!system_messages_created_by_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      const message = transformSystemMessage(newMessage);
      
      if ((newMessage as any).users) {
        message.createdByUser = {
          id: (newMessage as any).users.id,
          full_name: (newMessage as any).users.full_name,
          email: (newMessage as any).users.email
        } as User;
      }

      return message;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update an existing system message
  updateSystemMessage: async (id: string, data: UpdateSystemMessageData, updatedBy: string): Promise<SystemMessage> => {
    try {
      const updateData: any = {
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      // Only include defined fields in the update
      if (data.client_id !== undefined) updateData.client_id = data.client_id;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.message !== undefined) updateData.message = data.message;
      if (data.expires_at !== undefined) {
        updateData.expires_at = data.expires_at ? data.expires_at.toISOString() : null;
      }

      const { data: updatedMessage, error } = await supabase
        .from('system_messages')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users!system_messages_created_by_fkey(id, full_name, email)
        `)
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      const message = transformSystemMessage(updatedMessage);
      
      if ((updatedMessage as any).users) {
        message.createdByUser = {
          id: (updatedMessage as any).users.id,
          full_name: (updatedMessage as any).users.full_name,
          email: (updatedMessage as any).users.email
        } as User;
      }

      return message;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete a system message
  deleteSystemMessage: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('system_messages')
        .delete()
        .eq('id', id);

      if (error) {
        throw handleDatabaseError(error);
      }
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Clean up expired messages
  cleanupExpiredMessages: async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('system_messages')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw handleDatabaseError(error);
      }

      return data?.length || 0;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Subscribe to system message changes for real-time updates
  subscribeToSystemMessages: (clientId: string | null, callback: (messages: SystemMessage[]) => void) => {
    let channel = supabase
      .channel('system_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_messages',
          filter: clientId ? `client_id=eq.${clientId}` : undefined
        },
        async () => {
          // Refetch messages when changes occur
          try {
            const messages = clientId 
              ? await SystemMessageService.getClientSystemMessages(clientId)
              : (await SystemMessageService.getSystemMessages()).data;
            callback(messages);
          } catch (error) {
            console.error('Error fetching updated system messages:', error);
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

  // Get message statistics
  getMessageStatistics: async (clientId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    expired: number;
  }> => {
    try {
      let query = supabase
        .from('system_messages')
        .select('type, expires_at');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      const now = new Date();
      const stats = {
        total: data?.length || 0,
        byType: {} as Record<string, number>,
        active: 0,
        expired: 0
      };

      (data || []).forEach(message => {
        // Count by type
        stats.byType[message.type] = (stats.byType[message.type] || 0) + 1;

        // Count active vs expired
        const isExpired = message.expires_at && new Date(message.expires_at) < now;
        if (isExpired) {
          stats.expired++;
        } else {
          stats.active++;
        }
      });

      return stats;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Bulk create system messages for multiple clients
  bulkCreateSystemMessages: async (
    message: string,
    type: 'info' | 'warning' | 'error' | 'success',
    clientIds: string[],
    createdBy: string,
    expiresAt?: Date
  ): Promise<SystemMessage[]> => {
    try {
      const insertData = clientIds.map(clientId => ({
        client_id: clientId,
        type,
        message,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        created_by: createdBy,
        timestamp: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('system_messages')
        .insert(insertData)
        .select();

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(transformSystemMessage);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
};