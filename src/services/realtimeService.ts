import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AgentStatus, SystemMessage, Client, User } from '@/types/admin';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  table: string;
  record: T;
  old_record?: T;
  timestamp: Date;
}

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastConnected?: Date;
  error?: string;
}

export interface Subscription {
  unsubscribe: () => void;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionStatus: ConnectionStatus = { status: 'disconnected' };
  private connectionCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // Modern Supabase doesn't expose direct realtime connection events
    // We'll monitor connection status through channel subscription status
    // and implement our own connection monitoring
    
    // Start with disconnected status
    this.updateConnectionStatus({ status: 'disconnected' });
    
    // Set up periodic connection health check
    this.startConnectionHealthCheck();
  }

  private startConnectionHealthCheck() {
    // Check connection health every 30 seconds
    setInterval(() => {
      this.checkConnectionHealth();
    }, 30000);
    
    // Initial health check
    setTimeout(() => this.checkConnectionHealth(), 1000);
  }

  private async checkConnectionHealth() {
    try {
      // Test connection by creating a temporary channel
      const testChannel = supabase.channel('health-check-' + Date.now());
      
      const subscriptionPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000); // 5 second timeout
        
        testChannel.subscribe((status) => {
          clearTimeout(timeout);
          if (status === 'SUBSCRIBED') {
            resolve(true);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            resolve(false);
          }
        });
      });
      
      const isConnected = await subscriptionPromise;
      
      // Clean up test channel
      testChannel.unsubscribe();
      
      if (isConnected) {
        if (this.connectionStatus.status !== 'connected') {
          this.updateConnectionStatus({ 
            status: 'connected', 
            lastConnected: new Date() 
          });
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
        }
      } else {
        if (this.connectionStatus.status === 'connected') {
          this.updateConnectionStatus({ status: 'disconnected' });
          this.handleReconnection();
        }
      }
    } catch (error) {
      console.error('Connection health check failed:', error);
      this.updateConnectionStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Connection error' 
      });
      this.handleReconnection();
    }
  }

  private updateConnectionStatus(status: Partial<ConnectionStatus>) {
    this.connectionStatus = { ...this.connectionStatus, ...status };
    this.connectionCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  private async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateConnectionStatus({ 
        status: 'error', 
        error: 'Max reconnection attempts reached' 
      });
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionStatus({ status: 'connecting' });

    setTimeout(async () => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      // The health check will automatically detect if we're back online
      await this.checkConnectionHealth();
      
      // If still not connected, increase delay and try again
      if (this.connectionStatus.status !== 'connected') {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
        this.handleReconnection();
      }
    }, this.reconnectDelay);
  }

  /**
   * Subscribe to agent status changes for a specific client or all clients
   */
  subscribeToAgentStatus(
    clientId: string | null,
    callback: (status: AgentStatus) => void
  ): Subscription {
    const channelName = `agent-status-${clientId || 'global'}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_status',
          filter: clientId ? `client_id=eq.${clientId}` : 'client_id=is.null'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Agent status change received:', payload);
          
          const record = payload.new || payload.old;
          if (record) {
            const agentStatus: AgentStatus = {
              id: record.id,
              client_id: record.client_id,
              status: record.status,
              message: record.message,
              last_updated: new Date(record.last_updated),
              updated_by: record.updated_by,
              created_at: new Date(record.created_at)
            };
            
            callback(agentStatus);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Agent status subscription status: ${status}`);
        
        // Update connection status based on subscription status
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to agent status for client: ${clientId || 'global'}`);
          this.updateConnectionStatus({ 
            status: 'connected', 
            lastConnected: new Date() 
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Agent status subscription failed: ${status}`);
          this.updateConnectionStatus({ 
            status: 'error', 
            error: `Subscription failed: ${status}` 
          });
        }
      });

    this.channels.set(channelName, channel);

    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to system message changes for a specific client or all clients
   */
  subscribeToSystemMessages(
    clientId: string | null,
    callback: (messages: SystemMessage[]) => void
  ): Subscription {
    const channelName = `system-messages-${clientId || 'global'}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_messages',
          filter: clientId ? `client_id=eq.${clientId}` : 'client_id=is.null'
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('System message change received:', payload);
          
          // Fetch updated messages after any change
          try {
            let query = supabase
              .from('system_messages')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(10);

            if (clientId) {
              query = query.or(`client_id.eq.${clientId},client_id.is.null`);
            } else {
              query = query.is('client_id', null);
            }

            const { data, error } = await query;

            if (error) {
              console.error('Error fetching updated system messages:', error);
              return;
            }

            const messages: SystemMessage[] = (data || []).map(msg => ({
              id: msg.id,
              client_id: msg.client_id,
              type: msg.type as 'info' | 'warning' | 'error' | 'success',
              message: msg.message,
              timestamp: new Date(msg.timestamp),
              expires_at: msg.expires_at ? new Date(msg.expires_at) : null,
              created_by: msg.created_by,
              updated_by: msg.updated_by,
              created_at: new Date(msg.created_at),
              updated_at: new Date(msg.updated_at),
              isExpired: msg.expires_at ? new Date(msg.expires_at) < new Date() : false,
              isGlobal: msg.client_id === null
            }));

            callback(messages);
          } catch (error) {
            console.error('Error processing system message update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`System messages subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to system messages for client: ${clientId || 'global'}`);
        }
      });

    this.channels.set(channelName, channel);

    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to client data changes
   */
  subscribeToClientUpdates(
    callback: (client: Client) => void,
    clientId?: string
  ): Subscription {
    const channelName = `client-updates-${clientId || 'all'}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: clientId ? `id=eq.${clientId}` : undefined
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Client update received:', payload);
          
          const record = payload.new || payload.old;
          if (record && payload.eventType !== 'DELETE') {
            const client: Client = {
              id: record.id,
              name: record.name,
              status: record.status,
              type: record.type,
              subscription_plan: record.subscription_plan,
              contact_person: record.contact_person,
              contact_email: record.contact_email,
              phone_number: record.phone_number,
              billing_address: record.billing_address,
              monthly_billing_amount_cad: record.monthly_billing_amount_cad,
              average_monthly_ai_cost_usd: record.average_monthly_ai_cost_usd,
              average_monthly_misc_cost_usd: record.average_monthly_misc_cost_usd,
              partner_split_percentage: record.partner_split_percentage,
              finders_fee_cad: record.finders_fee_cad,
              slug: record.slug,
              config_json: record.config_json,
              joined_at: new Date(record.joined_at),
              last_active_at: record.last_active_at ? new Date(record.last_active_at) : null
            };
            
            callback(client);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Client updates subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to client updates for: ${clientId || 'all clients'}`);
        }
      });

    this.channels.set(channelName, channel);

    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to user data changes
   */
  subscribeToUserUpdates(
    callback: (user: User) => void,
    userId?: string
  ): Subscription {
    const channelName = `user-updates-${userId || 'all'}`;
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: userId ? `id=eq.${userId}` : undefined
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('User update received:', payload);
          
          const record = payload.new || payload.old;
          if (record && payload.eventType !== 'DELETE') {
            const user: User = {
              id: record.id,
              email: record.email,
              full_name: record.full_name,
              role: record.role,
              client_id: record.client_id,
              last_login_at: record.last_login_at ? new Date(record.last_login_at) : null,
              created_at: new Date(record.created_at),
              preferences: record.preferences
            };
            
            callback(user);
          }
        }
      )
      .subscribe((status) => {
        console.log(`User updates subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to user updates for: ${userId || 'all users'}`);
        }
      });

    this.channels.set(channelName, channel);

    return {
      unsubscribe: () => {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): Subscription {
    this.connectionCallbacks.push(callback);
    
    return {
      unsubscribe: () => {
        const index = this.connectionCallbacks.indexOf(callback);
        if (index > -1) {
          this.connectionCallbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Manually trigger reconnection
   */
  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    this.handleReconnection();
  }

  /**
   * Disconnect all subscriptions
   */
  disconnect(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.updateConnectionStatus({ status: 'disconnected' });
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.channels.size;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();