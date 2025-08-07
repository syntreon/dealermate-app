// src/hooks/useRealtimeNotifications.ts
import { useEffect, useRef, useState } from 'react';
import { simpleRealtimeService, ConnectionStatus, Subscription } from '@/services/simpleRealtimeService';
import { getClientIdFilter } from '@/utils/clientDataIsolation';
import { UserData } from '@/hooks/useAuthSession';

export interface Notification {
  id: string;
  type?: string | null;
  created_at?: string | null;
  title?: string | null;
  body?: string | null;
  listen_url?: string | null;
  payload?: any;
  call_id?: string | null;
  client_id?: string | null;
}

interface UseRealtimeNotificationsOptions {
  user: UserData | null;
  onNotification?: (notification: Notification) => void;
}

interface UseRealtimeNotificationsReturn {
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for subscribing to real-time notifications based on client ID.
 * Uses a stable callback ref to prevent resubscribe churn on each render.
 */
export const useRealtimeNotifications = (
  options: UseRealtimeNotificationsOptions
): UseRealtimeNotificationsReturn => {
  const { user, onNotification } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    simpleRealtimeService.getConnectionStatus()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callback in a ref so effect deps can stay minimal
  const callbackRef = useRef<typeof onNotification>();
  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);
  
  // Compute client filter once per user change
  const clientIdFilter = user ? getClientIdFilter(user) : null;

  useEffect(() => {
    console.log('useRealtimeNotifications hook initialized with user:', user);
    console.log('Client ID filter:', clientIdFilter);

    // Only subscribe if we have a user
    if (!user) {
      console.log('No user, skipping subscription');
      return;
    }

    setIsLoading(true);
    let notificationSubscription: Subscription | null = null;
    let connectionSubscription: Subscription | null = null;

    try {
      // Subscribe to notifications for this client
      notificationSubscription = simpleRealtimeService.subscribeToNotifications(
        clientIdFilter,
        (notification: Notification) => {
          console.log('Received notification in hook:', notification);
          // Call the latest handler without re-subscribing
          const cb = callbackRef.current;
          if (cb) cb(notification);
        }
      );

      // Subscribe to connection status changes
      connectionSubscription = simpleRealtimeService.onConnectionChange((status) => {
        console.log('Connection status changed:', status);
        setConnectionStatus(status);
      });
      
      setIsLoading(false);
    } catch (err) {
      console.warn('Failed to subscribe to notifications:', err);
      setError('Failed to subscribe to notifications');
      setIsLoading(false);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('Cleaning up notification subscription');
      if (notificationSubscription) notificationSubscription.unsubscribe();
      if (connectionSubscription) connectionSubscription.unsubscribe();
    };
    // Only re-run when the user identity or their client filter changes
  }, [user, clientIdFilter]);

  return { connectionStatus, isLoading, error };
};