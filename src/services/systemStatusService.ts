import { supabase } from '@/integrations/supabase/client';
import { SystemMessage, AgentStatus } from '@/types/dashboard';

export class SystemStatusService {
  // System Messages CRUD operations
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
    const { data, error } = await supabase
      .from('system_messages')
      .insert({
        client_id: clientId || null,
        type: message.type,
        message: message.message,
        expires_at: message.expiresAt?.toISOString() || null,
        created_by: createdBy,
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
    const { data, error } = await supabase
      .from('agent_status')
      .upsert({
        client_id: clientId || null,
        status: status.status,
        message: status.message,
        updated_by: updatedBy,
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