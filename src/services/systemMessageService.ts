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
  createSystemMessage: async (messageData: CreateSystemMessageData): Promise<SystemMessage> => {
    try {
      const userId = await getCurrentUserId();
      
      // Import SystemStatusService dynamically to avoid circular dependencies
      const { SystemStatusService } = await import('./systemStatusService');
      
      // Use SystemStatusService to create the message
      const message = await SystemStatusService.createSystemMessage({
        type: messageData.type,
        message: messageData.message,
        expiresAt: messageData.expires_at ? new Date(messageData.expires_at) : null
      }, messageData.client_id || null, userId || undefined);
      
      // Log the action
      await AuditService.logAuditEvent(
        userId,
        'system_message_create',
        'system_messages',
        message.id,
        null,
        { message: messageData.message, type: messageData.type },
        messageData.client_id || null
      );

      // Transform to expected format
      return {
        id: message.id,
        client_id: messageData.client_id || null,
        type: message.type,
        message: message.message,
        timestamp: message.timestamp,
        expires_at: message.expiresAt,
        created_by: userId || '',
        updated_by: userId || null,
        created_at: new Date(),
        updated_at: new Date(),
        isExpired: message.expiresAt ? message.expiresAt < new Date() : false,
        isGlobal: messageData.client_id === null
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Update an existing system message
   */
  updateSystemMessage: async (id: string, messageData: UpdateSystemMessageData): Promise<SystemMessage> => {
    try {
      const userId = await getCurrentUserId();
      
      // Get existing message first to have complete data
      const existingMessage = await SystemMessageService.getSystemMessageById(id);
      if (!existingMessage) {
        throw new Error('System message not found');
      }
      
      // Import SystemStatusService dynamically to avoid circular dependencies
      const { SystemStatusService } = await import('./systemStatusService');
      
      // Use SystemStatusService to update the message
      const message = await SystemStatusService.updateSystemMessage(id, {
        type: messageData.type || existingMessage.type,
        message: messageData.message || existingMessage.message,
        expiresAt: messageData.expires_at !== undefined 
          ? (messageData.expires_at ? new Date(messageData.expires_at) : null)
          : existingMessage.expires_at
      });
      
      // Log the action
      await AuditService.logAuditEvent(
        userId,
        'update',
        'system_messages',
        id,
        { type: existingMessage.type, message: existingMessage.message },
        { type: message.type, message: message.message },
        existingMessage.client_id
      );

      // Return in expected format
      return {
        id: message.id,
        client_id: existingMessage.client_id,
        type: message.type,
        message: message.message,
        timestamp: message.timestamp,
        expires_at: message.expiresAt,
        created_by: existingMessage.created_by,
        updated_by: userId || existingMessage.updated_by,
        created_at: existingMessage.created_at,
        updated_at: new Date(),
        isExpired: message.expiresAt ? message.expiresAt < new Date() : false,
        isGlobal: existingMessage.client_id === null
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  /**
   * Delete a system message
   */
  deleteSystemMessage: async (id: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      
      // Get existing message first for audit logging
      const existingMessage = await SystemMessageService.getSystemMessageById(id);
      if (!existingMessage) {
        throw new Error('System message not found');
      }
      
      // Import SystemStatusService dynamically to avoid circular dependencies
      const { SystemStatusService } = await import('./systemStatusService');
      
      // Use SystemStatusService to delete the message
      await SystemStatusService.deleteSystemMessage(id);
      
      // Log the action
      await AuditService.logAuditEvent(
        userId,
        'delete',
        'system_messages',
        id,
        { type: existingMessage.type, message: existingMessage.message },
        null,
        existingMessage.client_id
      );
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
      });
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