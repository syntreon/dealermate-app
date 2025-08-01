import { supabase } from '@/integrations/supabase/client';
import { SystemMessage, AgentStatus } from '@/types/dashboard';

// Enhanced system message type with publisher and client info
export interface EnhancedSystemMessage {
  id: string;
  clientId: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  expiresAt: Date | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  publisher?: {
    id: string;
    name: string;
    email: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

// Pagination response type
export interface PaginatedMessages {
  messages: EnhancedSystemMessage[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// In-memory cache for system messages
const messageCache = new Map<string, { data: PaginatedMessages; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

export class SystemStatusService {
  // System Messages CRUD operations
  
  // Enhanced paginated method with joins for publisher and client info
  static async getSystemMessagesPaginated(
    page: number = 1,
    pageSize: number = 5,
    clientId?: string | null,
    forceRefresh: boolean = false
  ): Promise<PaginatedMessages> {
    const cacheKey = `messages_${page}_${pageSize}_${clientId || 'all'}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && messageCache.has(cacheKey)) {
      const cached = messageCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    const offset = (page - 1) * pageSize;
    
    // Simplified query - just get the basic system_messages data first
    let query = supabase
      .from('system_messages')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Filter by client if specified
    if (clientId !== undefined && clientId !== null) {
      query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
    }

    const { data, error, count } = await query;
    
    if (error) throw error;

    // Fetch additional data for each message
    const enhancedMessages: EnhancedSystemMessage[] = [];
    
    for (const msg of data || []) {
      // Get publisher info
      let publisherInfo: { id: string; name: string; email: string } | undefined;
      if (msg.created_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', msg.created_by)
          .single();
          
        if (userData) {
          publisherInfo = {
            id: userData.id,
            name: userData.name,
            email: userData.email
          };
        }
      }
      
      // Get client info if applicable
      let clientInfo: { id: string; name: string } | undefined;
      if (msg.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', msg.client_id)
          .single();
          
        if (clientData) {
          clientInfo = {
            id: clientData.id,
            name: clientData.name
          };
        }
      }
      
      enhancedMessages.push({
        id: msg.id,
        clientId: msg.client_id,
        type: msg.type,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        expiresAt: msg.expires_at ? new Date(msg.expires_at) : null,
        createdBy: msg.created_by,
        updatedBy: msg.updated_by,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        publisher: publisherInfo,
        client: clientInfo
      });
    }

    const result: PaginatedMessages = {
      messages: enhancedMessages,
      totalCount: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize
    };

    // Cache the result
    messageCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  }

  // Clear cache (for manual refresh)
  static clearMessageCache(): void {
    messageCache.clear();
  }

  // Original method for backward compatibility
  static async getSystemMessages(clientId?: string | null): Promise<SystemMessage[]> {
    let query = supabase
      .from('system_messages')
      .select('*')
      .order('timestamp', { ascending: false });

    // If clientId is provided, get messages for that client + platform-wide messages
    // If clientId is null (admin), get all messages
    if (clientId !== undefined && clientId !== null) {
      query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return data?.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
      expiresAt: msg.expires_at ? new Date(msg.expires_at) : null
    })) || [];
  }

  static async createSystemMessage(
    message: Omit<SystemMessage, 'id' | 'timestamp'>, 
    clientId?: string | null,
    createdBy?: string
  ): Promise<SystemMessage> {
    const userId = createdBy || await getCurrentUserId();
    if (!userId) {
      throw new Error('User authentication required');
    }

    const { data, error } = await supabase
      .from('system_messages')
      .insert({
        client_id: clientId || null,
        type: message.type,
        message: message.message,
        expires_at: message.expiresAt?.toISOString() || null,
        created_by: userId,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      timestamp: new Date(data.timestamp),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null
    };
  }

  static async updateSystemMessage(id: string, updates: Partial<SystemMessage>): Promise<SystemMessage> {
    const { data, error } = await supabase
      .from('system_messages')
      .update({
        ...(updates.type && { type: updates.type }),
        ...(updates.message && { message: updates.message }),
        ...(updates.expiresAt !== undefined && { expires_at: updates.expiresAt?.toISOString() || null })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      timestamp: new Date(data.timestamp),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null
    };
  }

  static async deleteSystemMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Clear cache after deletion
    this.clearMessageCache();
  }

  // Agent Status operations
  static async getAgentStatus(clientId?: string | null): Promise<AgentStatus> {
    let query = supabase
      .from('agent_status')
      .select('*');

    // If clientId is provided, get status for that client, fallback to platform-wide
    // If clientId is null (admin), get platform-wide status
    if (clientId !== undefined && clientId !== null) {
      query = query.or(`client_id.eq.${clientId},client_id.is.null`);
    } else {
      query = query.is('client_id', null);
    }

    query = query.order('last_updated', { ascending: false }).limit(1);

    const { data, error } = await query.single();

    if (error) {
      // If no status exists, create a default one
      if (error.code === 'PGRST116') {
        return await this.updateAgentStatus({
          status: 'active',
          message: 'All systems operational'
        }, clientId);
      }
      throw error;
    }

    return {
      status: data.status,
      lastUpdated: new Date(data.last_updated),
      message: data.message
    };
  }

  static async updateAgentStatus(
    status: Omit<AgentStatus, 'lastUpdated'>, 
    clientId?: string | null,
    updatedBy?: string
  ): Promise<AgentStatus> {
    const userId = updatedBy || await getCurrentUserId();
    if (!userId) {
      throw new Error('User authentication required');
    }

    const { data, error } = await supabase
      .from('agent_status')
      .upsert({
        client_id: clientId || null,
        status: status.status,
        message: status.message,
        updated_by: userId,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'client_id'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      status: data.status,
      lastUpdated: new Date(data.last_updated),
      message: data.message
    };
  }

  // Real-time subscriptions
  static subscribeToSystemMessages(callback: (messages: SystemMessage[]) => void) {
    const subscription = supabase
      .channel('system_messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_messages' },
        async () => {
          // Refetch messages when changes occur
          try {
            const messages = await this.getSystemMessages();
            callback(messages);
          } catch (error) {
            console.error('Error fetching updated system messages:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  static subscribeToAgentStatus(callback: (status: AgentStatus) => void) {
    const subscription = supabase
      .channel('agent_status_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'agent_status' },
        async () => {
          // Refetch status when changes occur
          try {
            const status = await this.getAgentStatus();
            callback(status);
          } catch (error) {
            console.error('Error fetching updated agent status:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }
}

// Automated status monitoring (would run on server-side in production)
export class StatusMonitor {
  private static checkInterval: NodeJS.Timeout | null = null;

  static startMonitoring() {
    // Check system health every 30 seconds
    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000);
  }

  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private static async performHealthCheck() {
    try {
      // Example health checks
      const checks = await Promise.allSettled([
        this.checkDatabaseConnection(),
        this.checkAPIEndpoints(),
        this.checkExternalServices()
      ]);

      const failedChecks = checks.filter(check => check.status === 'rejected');
      
      if (failedChecks.length > 0) {
        // Update status to inactive if critical services are down
        await SystemStatusService.updateAgentStatus({
          status: 'inactive',
          message: `${failedChecks.length} critical service(s) are down`
        });
      } else {
        // Update status to active if all checks pass
        const currentStatus = await SystemStatusService.getAgentStatus();
        if (currentStatus.status !== 'maintenance') {
          await SystemStatusService.updateAgentStatus({
            status: 'active',
            message: 'All systems operational'
          });
        }
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  private static async checkDatabaseConnection(): Promise<boolean> {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw new Error('Database connection failed');
    return true;
  }

  private static async checkAPIEndpoints(): Promise<boolean> {
    // Add your API endpoint checks here
    return true;
  }

  private static async checkExternalServices(): Promise<boolean> {
    // Add external service checks (VAPI, OpenAI, etc.)
    return true;
  }
}