import { useState, useEffect, useCallback, useRef } from 'react';
import { SystemMessage, CreateSystemMessageData, UpdateSystemMessageData } from '@/types/admin';
import { simpleRealtimeService as realtimeService, ConnectionStatus, Subscription } from '@/services/simpleRealtimeService';
import { SystemMessageService } from '@/services/systemMessageService';
import { toast } from 'sonner';

interface UseRealtimeSystemMessagesOptions {
  clientId?: string | null;
  enableNotifications?: boolean;
  onMessagesChange?: (messages: SystemMessage[]) => void;
  autoCleanupExpired?: boolean;
}

interface UseRealtimeSystemMessagesReturn {
  messages: SystemMessage[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  createMessage: (messageData: CreateSystemMessageData) => Promise<SystemMessage>;
  updateMessage: (id: string, messageData: UpdateSystemMessageData) => Promise<SystemMessage>;
  deleteMessage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  isUpdating: boolean;
  activeMessages: SystemMessage[];
  expiredMessages: SystemMessage[];
}

export const useRealtimeSystemMessages = (
  options: UseRealtimeSystemMessagesOptions = {}
): UseRealtimeSystemMessagesReturn => {
  const { 
    clientId, 
    enableNotifications = true, 
    onMessagesChange,
    autoCleanupExpired = true 
  } = options;
  
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );

  const subscriptionRef = useRef<Subscription | null>(null);
  const connectionSubscriptionRef = useRef<Subscription | null>(null);
  const lastMessagesRef = useRef<SystemMessage[]>([]);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter active and expired messages
  const activeMessages = messages.filter(msg => 
    !msg.expires_at || msg.expires_at > new Date()
  );
  
  const expiredMessages = messages.filter(msg => 
    msg.expires_at && msg.expires_at <= new Date()
  );

  // Load system messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let loadedMessages: SystemMessage[];
      
      if (clientId) {
        loadedMessages = await SystemMessageService.getMessagesForClient(clientId, true);
      } else {
        const result = await SystemMessageService.getSystemMessages(
          { client_id: 'global', includeExpired: true },
          { page: 1, limit: 50 }
        );
        loadedMessages = result.data;
      }
      
      setMessages(loadedMessages);
      lastMessagesRef.current = loadedMessages;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load system messages';
      setError(errorMessage);
      console.error('Error loading system messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Create new message
  const createMessage = useCallback(async (messageData: CreateSystemMessageData): Promise<SystemMessage> => {
    try {
      setIsUpdating(true);
      setError(null);

      const newMessage = await SystemMessageService.createSystemMessage(messageData);

      if (enableNotifications) {
        toast.success('System message created successfully');
      }

      return newMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create system message';
      setError(errorMessage);
      
      if (enableNotifications) {
        toast.error(errorMessage);
      }
      
      console.error('Error creating system message:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [enableNotifications]);

  // Update existing message
  const updateMessage = useCallback(async (
    id: string, 
    messageData: UpdateSystemMessageData
  ): Promise<SystemMessage> => {
    try {
      setIsUpdating(true);
      setError(null);

      const updatedMessage = await SystemMessageService.updateSystemMessage(id, messageData);

      if (enableNotifications) {
        toast.success('System message updated successfully');
      }

      return updatedMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update system message';
      setError(errorMessage);
      
      if (enableNotifications) {
        toast.error(errorMessage);
      }
      
      console.error('Error updating system message:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [enableNotifications]);

  // Delete message
  const deleteMessage = useCallback(async (id: string): Promise<void> => {
    try {
      setIsUpdating(true);
      setError(null);

      await SystemMessageService.deleteSystemMessage(id);

      if (enableNotifications) {
        toast.success('System message deleted successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete system message';
      setError(errorMessage);
      
      if (enableNotifications) {
        toast.error(errorMessage);
      }
      
      console.error('Error deleting system message:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [enableNotifications]);

  // Refresh messages
  const refresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  // Handle real-time message updates
  const handleMessagesUpdate = useCallback((newMessages: SystemMessage[]) => {
    console.log('Received real-time system messages update:', newMessages);
    
    // Check for new messages to show notifications
    if (enableNotifications && lastMessagesRef.current.length > 0) {
      const lastMessageIds = new Set(lastMessagesRef.current.map(m => m.id));
      const newMessagesList = newMessages.filter(m => !lastMessageIds.has(m.id));
      
      newMessagesList.forEach(message => {
        const typeLabels = {
          info: 'Info',
          warning: 'Warning',
          error: 'Error',
          success: 'Success'
        };

        toast(message.message, {
          description: `${typeLabels[message.type]} message`,
          duration: message.type === 'error' ? 10000 : 5000,
        });
      });
    }

    setMessages(newMessages);
    lastMessagesRef.current = newMessages;

    // Call external callback if provided
    if (onMessagesChange) {
      onMessagesChange(newMessages);
    }
  }, [enableNotifications, onMessagesChange]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    
    if (enableNotifications) {
      if (status.status === 'connected' && connectionStatus.status !== 'connected') {
        toast.success('Real-time connection established');
      } else if (status.status === 'disconnected' && connectionStatus.status === 'connected') {
        toast.warning('Real-time connection lost');
      } else if (status.status === 'error') {
        toast.error(`Connection error: ${status.error}`);
      }
    }
  }, [connectionStatus.status, enableNotifications]);

  // Cleanup expired messages locally
  const cleanupExpiredMessages = useCallback(() => {
    if (!autoCleanupExpired) return;

    setMessages(prevMessages => {
      const now = new Date();
      const activeMessages = prevMessages.filter(msg => 
        !msg.expires_at || msg.expires_at > now
      );
      
      // Only update if there were expired messages removed
      if (activeMessages.length !== prevMessages.length) {
        console.log(`Cleaned up ${prevMessages.length - activeMessages.length} expired messages`);
        return activeMessages;
      }
      
      return prevMessages;
    });
  }, [autoCleanupExpired]);

  // Setup subscriptions and cleanup
  useEffect(() => {
    // Load initial data
    loadMessages();

    // Subscribe to real-time updates
    subscriptionRef.current = realtimeService.subscribeToSystemMessages(
      clientId || null,
      handleMessagesUpdate
    );

    // Subscribe to connection status changes
    connectionSubscriptionRef.current = realtimeService.onConnectionChange(
      handleConnectionChange
    );

    // Setup cleanup interval for expired messages
    if (autoCleanupExpired) {
      cleanupIntervalRef.current = setInterval(cleanupExpiredMessages, 60000); // Every minute
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (connectionSubscriptionRef.current) {
        connectionSubscriptionRef.current.unsubscribe();
        connectionSubscriptionRef.current = null;
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [clientId, loadMessages, handleMessagesUpdate, handleConnectionChange, autoCleanupExpired, cleanupExpiredMessages]);

  // Handle connection recovery
  useEffect(() => {
    if (connectionStatus.status === 'connected' && messages.length === 0 && !isLoading) {
      // Refresh data when connection is restored
      refresh();
    }
  }, [connectionStatus.status, messages.length, isLoading, refresh]);

  return {
    messages,
    isLoading,
    error,
    connectionStatus,
    createMessage,
    updateMessage,
    deleteMessage,
    refresh,
    isUpdating,
    activeMessages,
    expiredMessages
  };
};