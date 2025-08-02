import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { AgentStatus, SystemMessage, Client, User } from '@/types/admin';

export interface Subscription {
  unsubscribe: () => void;
}

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastConnected?: Date;
  error?: string;
}

class SimpleRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionStatus: ConnectionStatus = { status: 'disconnected' };
  private connectionCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private isDebugMode: boolean = process.env.NODE_ENV === 'development';
  private isRealtimeEnabled: boolean = true; // Always enabled, just silenced in dev

  constructor() {
    // Start with a simple connected status
    // In practice, Supabase handles connection management internally
    this.updateConnectionStatus({ 
      status: 'connected', 
      lastConnected: new Date() 
    });
  }

  private log(message: string, ...args: any[]) {
    // Completely disable all realtime logging to prevent console spam
    // TODO: Re-enable when subscription churn issue is resolved
    return;
  }

  private updateConnectionStatus(status: Partial<ConnectionStatus>) {
    this.connectionStatus = { ...this.connectionStatus, ...status };
    this.connectionCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  private callbacks: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Subscribe to agent status changes
   */
  subscribeToAgentStatus(
    clientId: string | null,
    callback: (status: AgentStatus) => void
  ): Subscription {


    const channelName = `agent-status-${clientId || 'global'}`;
    
    // Add callback to the set
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, new Set());
    }
    this.callbacks.get(channelName)!.add(callback);
    
    // Only create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      this.log(`Creating new agent status subscription for ${channelName}`);
      
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
            this.log('Agent status change received:', payload);
            
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
              
              // Call all registered callbacks
              const callbacks = this.callbacks.get(channelName);
              if (callbacks) {
                callbacks.forEach(cb => cb(agentStatus));
              }
            }
          }
        )
        .subscribe((status) => {
          this.log(`Agent status subscription: ${status}`);
        });

      this.channels.set(channelName, channel);
    } else {
      this.log(`Reusing existing agent status subscription for ${channelName}`);
    }

    return {
      unsubscribe: () => {
        // Remove callback from set
        const callbacks = this.callbacks.get(channelName);
        if (callbacks) {
          callbacks.delete(callback);
          
          // If no more callbacks, unsubscribe from channel
          if (callbacks.size === 0) {
            this.log(`No more callbacks for ${channelName}, unsubscribing`);
            const channel = this.channels.get(channelName);
            if (channel) {
              channel.unsubscribe();
              this.channels.delete(channelName);
            }
            this.callbacks.delete(channelName);
          }
        }
      }
    };
  }

  /**
   * Subscribe to system message changes
   */
  subscribeToSystemMessages(
    clientId: string | null,
    callback: (messages: SystemMessage[]) => void
  ): Subscription {


    const channelName = `system-messages-${clientId || 'global'}`;
    
    // Add callback to the set
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, new Set());
    }
    this.callbacks.get(channelName)!.add(callback);
    
    // Only create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      this.log(`Creating new system messages subscription for ${channelName}`);
      
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
            this.log('System message change received:', payload);
            
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
                this.log('Error fetching updated system messages:', error);
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

              // Call all registered callbacks
              const callbacks = this.callbacks.get(channelName);
              if (callbacks) {
                callbacks.forEach(cb => cb(messages));
              }
            } catch (error) {
              this.log('Error processing system message update:', error);
            }
          }
        )
        .subscribe((status) => {
          this.log(`System messages subscription: ${status}`);
        });

      this.channels.set(channelName, channel);
    } else {
      this.log(`Reusing existing system messages subscription for ${channelName}`);
    }

    return {
      unsubscribe: () => {
        // Remove callback from set
        const callbacks = this.callbacks.get(channelName);
        if (callbacks) {
          callbacks.delete(callback);
          
          // If no more callbacks, unsubscribe from channel
          if (callbacks.size === 0) {
            this.log(`No more callbacks for ${channelName}, unsubscribing`);
            const channel = this.channels.get(channelName);
            if (channel) {
              channel.unsubscribe();
              this.channels.delete(channelName);
            }
            this.callbacks.delete(channelName);
          }
        }
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
    
    // Check if channel already exists and is active
    if (this.channels.has(channelName)) {
      this.log(`Reusing existing client updates subscription for ${channelName}`);
      const existingChannel = this.channels.get(channelName)!;
      return {
        unsubscribe: () => {
          existingChannel.unsubscribe();
          this.channels.delete(channelName);
        }
      };
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
          this.log('Client update received:', payload);
          
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
        this.log(`Client updates subscription: ${status}`);
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
    
    // Check if channel already exists and is active
    if (this.channels.has(channelName)) {
      this.log(`Reusing existing user updates subscription for ${channelName}`);
      const existingChannel = this.channels.get(channelName)!;
      return {
        unsubscribe: () => {
          existingChannel.unsubscribe();
          this.channels.delete(channelName);
        }
      };
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
          this.log('User update received:', payload);
          
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
        this.log(`User updates subscription: ${status}`);
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
   * Manually trigger reconnection (no-op in simple version)
   */
  async reconnect(): Promise<void> {
    this.log('Reconnect requested - Supabase handles this automatically');
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

  /**
   * Enable or disable realtime subscriptions (for debugging)
   */
  setRealtimeEnabled(enabled: boolean): void {
    this.isRealtimeEnabled = enabled;
    this.log(`Realtime ${enabled ? 'enabled' : 'disabled'}`);
    
    if (!enabled) {
      // Disconnect all existing subscriptions when disabling
      this.disconnect();
    }
  }

  /**
   * Check if realtime is currently enabled
   */
  isRealtimeCurrentlyEnabled(): boolean {
    return this.isRealtimeEnabled;
  }
}

// Export singleton instance
export const simpleRealtimeService = new SimpleRealtimeService();

// Add global debugging methods in development
if (process.env.NODE_ENV === 'development') {
  (window as any).realtimeService = {
    enable: () => simpleRealtimeService.setRealtimeEnabled(true),
    disable: () => simpleRealtimeService.setRealtimeEnabled(false),
    status: () => simpleRealtimeService.isRealtimeCurrentlyEnabled(),
    subscriptions: () => simpleRealtimeService.getActiveSubscriptionsCount(),
    disconnect: () => simpleRealtimeService.disconnect()
  };
}