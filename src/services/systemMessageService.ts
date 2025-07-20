import { supabase } from '@/integrations/supabase/client';
import { 
  SystemMessage, 
  CreateSystemMessageData, 
  UpdateSystemMessageData,
  SystemMessageFilters,
  PaginatedResponse, 
  PaginationOptions,
  DatabaseError 
} from '@/types/admin';
import { AuditService } from './auditService';

// Database utility functions
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('System Message Database error:', error);
  
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

const transformSystemMessage = (row: any): SystemMessage => {
  return {
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
    isExpired: row.expires_at ? new Date(row.expires_at) < new Date() : false,
    isGlobal: row.client_id === null
  };
};

export const SystemMessageService = {
  /**
   * Get system messages with filtering and pagination
   */
  getSystemMessages: async (
    filters?: SystemMessageFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<SystemMessage>> => {
    try {
      let query = supabase
        .from('system_messages')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        // Client filter
        if (filters.client_id && filters.client_id !== 'all') {
          if (filters.client_id === 'global') {
            query = query.is('client_id', null);
          } else {
            query = query.eq('client_id', filters.client_id);
          }
        }

        // Type filter
        if (filters.type && filters.type !== 'all') {
          query = query.eq('type', filters.type);
        }

        // Expired messages filter
        if (!filters.includeExpired) {
          query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
        }

        // Search filter
        if (filters.search) {
          query = query.ilike('message', `%${filters.search}%`);
        }

        // Sorting
        if (filters.sortBy) {
          const ascending = filters.sortDirection !== 'desc';
          query = query.order(filters.sortBy, { ascending });
        } else {
          query = query.order('timestamp', { ascending: false });
        }
      } else {
        // Default sorting
        query = query.order('timestamp', { ascending: false });
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

      const messages = (data || []).map(transformSystemMessage);
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

  /**
   * Get system messages for a specific client (including global messages)
   */
  getMessagesForClient: async (
    clientId: string,
    includeExpired: boolean = false
  ): Promise<SystemMessage[]> => {
    try {
      let query = supabase
        .from('system_messages')
        .select('*')
        .or(`client_id.eq.${clientId},client_id.is.null`)
        .order('timestamp', { ascending: false });

      // Filter out expired messages unless requested
      if (!includeExpired) {
        query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      return (data || []).map(transformSystemMessage);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Get a specific system message by ID
   */
  getSystemMessageById: async (id: string): Promise<SystemMessage | null> => {
    try {
      const { data, error } = await supabase
        .from('system_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleDatabaseError(error);
      }

      return transformSystemMessage(data);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Create a new system message
   */
  createSystemMessage: async (
    messageData: CreateSystemMessageData,
    createdBy?: string
  ): Promise<SystemMessage> => {
    try {
      const userId = createdBy || await getCurrentUserId();
      if (!userId) {
        throw new Error('User authentication required');
      }

      console.log('Creating system message:', { messageData, userId });

      const now = new Date().toISOString();

      const insertData = {
        client_id: messageData.client_id || null,
        type: messageData.type,
        message: messageData.message,
        timestamp: now,
        expires_at: messageData.expires_at?.toISOString() || null,
        created_by: userId,
        updated_by: userId,
        created_at: now,
        updated_at: now
      };

      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('system_messages')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('System message creation error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw handleDatabaseError(error);
      }

      console.log('System message created successfully:', data);

      const systemMessage = transformSystemMessage(data);

      // Log audit event
      try {
        await AuditService.logSystemMessageAction(
          userId,
          'create',
          systemMessage.id,
          undefined,
          {
            type: systemMessage.type,
            message: systemMessage.message,
            client_id: systemMessage.client_id
          },
          systemMessage.client_id
        );
      } catch (auditError) {
        console.error('Failed to log system message audit event:', auditError);
      }

      return systemMessage;
    } catch (error) {
      console.error('SystemMessageService.createSystemMessage error:', error);
      throw handleDatabaseError(error);
    }
  },

  /**
   * Update an existing system message
   */
  updateSystemMessage: async (
    id: string,
    messageData: UpdateSystemMessageData,
    updatedBy?: string
  ): Promise<SystemMessage> => {
    try {
      const userId = updatedBy || await getCurrentUserId();
      if (!userId) {
        throw new Error('User authentication required');
      }

      // Get existing message for audit logging
      const existingMessage = await SystemMessageService.getSystemMessageById(id);
      if (!existingMessage) {
        throw new Error('System message not found');
      }

      const updateData: any = {
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      // Only include defined fields in the update
      if (messageData.type !== undefined) updateData.type = messageData.type;
      if (messageData.message !== undefined) updateData.message = messageData.message;
      if (messageData.client_id !== undefined) updateData.client_id = messageData.client_id;
      if (messageData.expires_at !== undefined) {
        updateData.expires_at = messageData.expires_at?.toISOString() || null;
      }

      const { data, error } = await supabase
        .from('system_messages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      const systemMessage = transformSystemMessage(data);

      // Log audit event
      try {
        await AuditService.logSystemMessageAction(
          userId,
          'update',
          systemMessage.id,
          {
            type: existingMessage.type,
            message: existingMessage.message,
            client_id: existingMessage.client_id
          },
          {
            type: systemMessage.type,
            message: systemMessage.message,
            client_id: systemMessage.client_id
          },
          systemMessage.client_id
        );
      } catch (auditError) {
        console.error('Failed to log system message audit event:', auditError);
      }

      return systemMessage;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Delete a system message
   */
  deleteSystemMessage: async (id: string, deletedBy?: string): Promise<void> => {
    try {
      const userId = deletedBy || await getCurrentUserId();
      if (!userId) {
        throw new Error('User authentication required');
      }

      // Get existing message for audit logging
      const existingMessage = await SystemMessageService.getSystemMessageById(id);
      if (!existingMessage) {
        throw new Error('System message not found');
      }

      const { error } = await supabase
        .from('system_messages')
        .delete()
        .eq('id', id);

      if (error) {
        throw handleDatabaseError(error);
      }

      // Log audit event
      try {
        await AuditService.logSystemMessageAction(
          userId,
          'delete',
          id,
          {
            type: existingMessage.type,
            message: existingMessage.message,
            client_id: existingMessage.client_id
          },
          undefined,
          existingMessage.client_id
        );
      } catch (auditError) {
        console.error('Failed to log system message audit event:', auditError);
      }
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Clean up expired messages
   */
  cleanupExpiredMessages: async (): Promise<number> => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('system_messages')
        .delete()
        .lt('expires_at', now)
        .select('id');

      if (error) {
        throw handleDatabaseError(error);
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} expired system messages`);
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired messages:', error);
      throw handleDatabaseError(error);
    }
  },

  /**
   * Get message statistics
   */
  getMessageStatistics: async (clientId?: string | null): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    expired: number;
    global: number;
    clientSpecific: number;
  }> => {
    try {
      let query = supabase
        .from('system_messages')
        .select('*');

      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      const messages = (data || []).map(transformSystemMessage);
      const now = new Date();

      const stats = {
        total: messages.length,
        byType: {
          info: 0,
          warning: 0,
          error: 0,
          success: 0
        },
        active: 0,
        expired: 0,
        global: 0,
        clientSpecific: 0
      };

      messages.forEach(message => {
        // Count by type
        stats.byType[message.type]++;

        // Count active vs expired
        if (message.expires_at && message.expires_at < now) {
          stats.expired++;
        } else {
          stats.active++;
        }

        // Count global vs client-specific
        if (message.client_id === null) {
          stats.global++;
        } else {
          stats.clientSpecific++;
        }
      });

      return stats;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Broadcast urgent message to all clients
   */
  broadcastUrgentMessage: async (
    message: string,
    type: 'warning' | 'error' = 'warning',
    expiresInHours?: number,
    createdBy?: string
  ): Promise<SystemMessage> => {
    try {
      const expiresAt = expiresInHours 
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
        : undefined;

      return await SystemMessageService.createSystemMessage({
        client_id: null, // Global message
        type,
        message,
        expires_at: expiresAt
      }, createdBy);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Schedule message cleanup (to be called periodically)
   */
  scheduleCleanup: () => {
    // Clean up expired messages every hour
    setInterval(async () => {
      try {
        await SystemMessageService.cleanupExpiredMessages();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
};