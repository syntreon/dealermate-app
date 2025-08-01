import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define types for the system status
export type AgentStatus = 'active' | 'inactive' | 'maintenance';
export type MessageType = 'info' | 'warning' | 'error' | 'success';

export interface SystemMessage {
  id: string;
  client_id: string | null;
  type: MessageType;
  message: string;
  timestamp: string;
  expires_at: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentStatusData {
  id: string;
  client_id: string | null;
  status: AgentStatus;
  message: string | null;
  last_updated: string;
  updated_by: string;
  created_at: string;
}

export interface SystemStatusState {
  status: AgentStatus;
  statusMessage: string | null;
  broadcastMessage: SystemMessage | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to subscribe to and manage system status and messages
 * 
 * @param clientId Optional client ID to filter status and messages for a specific client
 * @returns Current system status state including agent status and broadcast messages
 */
export const useSystemStatus = (clientId?: string) => {
  const [state, setState] = useState<SystemStatusState>({
    status: 'active', // Default to active
    statusMessage: null,
    broadcastMessage: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Function to fetch the current status and messages
    const fetchCurrentStatus = async () => {
      try {
        // Fetch agent status - prioritize client-specific status if clientId is provided
        const statusQuery = supabase
          .from('agent_status')
          .select('*');
          
        // If clientId is provided, get both client-specific and global status
        // Otherwise, just get global status (where client_id is null)
        const statusFilter = clientId 
          ? `client_id.is.null,client_id.eq.${clientId}` 
          : 'client_id.is.null';
          
        const { data: statusData, error: statusError } = await statusQuery
          .or(statusFilter)
          .order('client_id', { ascending: false }) // Client-specific first
          .limit(2);
          
        if (statusError) throw statusError;
        
        // Get the most relevant status (client-specific takes precedence over global)
        const relevantStatus = statusData && statusData.length > 0 ? statusData[0] : null;
        
        // Fetch active system messages (not expired and relevant to this client)
        const now = new Date().toISOString();
        const messageQuery = supabase
          .from('system_messages')
          .select('*')
          .or(`expires_at.gt.${now},expires_at.is.null`); // Not expired or no expiry
          
        // Filter messages by client if clientId is provided
        const messageFilter = clientId 
          ? `client_id.is.null,client_id.eq.${clientId}` 
          : 'client_id.is.null';
          
        const { data: messageData, error: messageError } = await messageQuery
          .or(messageFilter)
          .order('timestamp', { ascending: false }) // Most recent first
          .limit(5);
          
        if (messageError) throw messageError;
        
        // Get the most recent message
        const latestMessage = messageData && messageData.length > 0 ? messageData[0] : null;
        
        setState({
          status: relevantStatus?.status || 'active',
          statusMessage: relevantStatus?.message,
          broadcastMessage: latestMessage,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching system status:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error instanceof Error ? error : new Error('Unknown error fetching system status') 
        }));
      }
    };

    // Initial fetch
    fetchCurrentStatus();

    // Set up real-time subscriptions
    const statusSubscription = supabase
      .channel('agent-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_status' }, 
        fetchCurrentStatus
      )
      .subscribe();

    const messageSubscription = supabase
      .channel('system-message-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'system_messages' }, 
        fetchCurrentStatus
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(statusSubscription);
      supabase.removeChannel(messageSubscription);
    };
  }, [supabase, clientId]);

  return state;
};
