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
  
  // Monitoring interval reference
  private static checkInterval: NodeJS.Timeout | null = null;
  
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
    if (clientId !== undefined) {
      if (clientId === null) {
        // For admin view (All Clients), show all messages
        // No additional filtering needed
      } else {
        // For specific client, show client-specific messages + global messages
        query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
      }
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
          .select('id, full_name, email')
          .eq('id', msg.created_by)
          .single();
          
        if (userData) {
          publisherInfo = {
            id: userData.id,
            name: userData.full_name || 'Unknown User',
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
    if (clientId !== undefined) {
      if (clientId === null) {
        // For admin view (All Clients), show all messages
        // No additional filtering needed
      } else {
        // For specific client, show client-specific messages + global messages
        query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
      }
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

    // Ensure clientId is properly handled - convert undefined to null, keep null as null
    const effectiveClientId = clientId === undefined ? null : clientId;

    const { data, error } = await supabase
      .from('system_messages')
      .insert({
        client_id: effectiveClientId,
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
      message: data.message || null
    };
  }

  static async updateAgentStatus(
    status: Omit<AgentStatus, 'lastUpdated'>, 
    clientId?: string | null,
    updatedBy?: string
  ): Promise<AgentStatus> {
    // Try to get user ID with retries if not provided
    let userId = updatedBy;
    if (!userId) {
      // Retry mechanism for getting user ID
      for (let i = 0; i < 3; i++) {
        userId = await getCurrentUserId();
        if (userId) break;
        // Wait 100ms before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (!userId) {
      throw new Error('User authentication required');
    }

    // Ensure clientId is properly handled - convert undefined to null, keep null as null
    const effectiveClientId = clientId === undefined ? null : clientId;
    
    const { data, error } = await supabase
      .from('agent_status')
      .upsert({
        client_id: effectiveClientId,
        status: status.status,
        message: status.message || null,
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

  // Get agent status history from audit logs
  static async getAgentStatusHistory(
    clientId?: string | null,
    limit: number = 20
  ): Promise<Array<{
    id: string;
    clientId: string | null;
    status: string;
    message: string | null;
    changedAt: Date;
    changedBy: string;
    changedByName: string | null;
    changedByEmail: string | null;
    previousStatus: string | null;
    previousMessage: string | null;
    isCurrent?: boolean;
  }>> {
    // First, get the current agent status
    let currentStatus = null;
    try {
      currentStatus = await this.getAgentStatus(clientId);
    } catch (error) {
      console.warn('Could not fetch current agent status:', error);
    }

    // Query audit logs for agent_status changes
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        client_id,
        new_values,
        old_values,
        created_at,
        user_id
      `)
      .eq('table_name', 'agent_status')
      .order('created_at', { ascending: false })
      .limit(limit - 1); // Reserve one spot for current status

    // Filter by client_id if specified
    if (clientId !== undefined) {
      if (clientId === null) {
        query = query.is('client_id', null);
      } else {
        query = query.eq('client_id', clientId);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform audit log entries into status history format
    const historyEntries = await Promise.all((data || []).map(async (item) => {
      // Extract status and message from new_values
      const newValues = item.new_values || {};
      const oldValues = item.old_values || {};
      
      // Fetch user data separately to avoid join issues
      let userName = 'Unknown User';
      let userEmail = null;
      
      if (item.user_id) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', item.user_id)
            .single();
          
          if (userData) {
            userName = userData.full_name || 'Unknown User';
            userEmail = userData.email;
          }
        } catch (error) {
          // User might not exist anymore, keep default values
          console.warn('Could not fetch user data for audit log:', error);
        }
      }
      
      return {
        id: item.id,
        clientId: item.client_id,
        status: newValues.status || '',
        message: newValues.message || null,
        changedAt: new Date(item.created_at),
        changedBy: item.user_id,
        changedByName: userName,
        changedByEmail: userEmail,
        previousStatus: oldValues.status || null,
        previousMessage: oldValues.message || null,
        isCurrent: false
      };
    }));

    // Add current status as the first entry if available
    if (currentStatus) {
      const currentEntry = {
        id: 'current',
        clientId: clientId || null,
        status: currentStatus.status,
        message: currentStatus.message || null,
        changedAt: currentStatus.lastUpdated,
        changedBy: 'system',
        changedByName: 'Current Status',
        changedByEmail: null,
        previousStatus: null,
        previousMessage: null,
        isCurrent: true
      };
      
      return [currentEntry, ...historyEntries];
    }

    return historyEntries;
  }

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