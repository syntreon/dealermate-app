import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Real-time update configuration
interface RealtimeConfig {
  enabled: boolean;
  tables: string[];
  events: Array<'INSERT' | 'UPDATE' | 'DELETE'>;
  debounceMs: number;
  maxUpdatesPerMinute: number;
}

// Update event structure
interface UpdateEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  old: any;
  new: any;
  timestamp: Date;
}

// Auto-refresh configuration
interface AutoRefreshConfig {
  enabled: boolean;
  interval: number; // in milliseconds
  pauseOnInactive: boolean;
  pauseOnError: boolean;
  maxRetries: number;
  backoffMultiplier: number;
}

// Visibility and activity tracking
interface ActivityTracker {
  isVisible: boolean;
  isActive: boolean;
  lastActivity: Date;
  inactiveThreshold: number; // milliseconds
}

export interface UseRealtimeUpdatesOptions {
  realtimeConfig?: Partial<RealtimeConfig>;
  autoRefreshConfig?: Partial<AutoRefreshConfig>;
  onUpdate?: (event: UpdateEvent) => void;
  onError?: (error: Error) => void;
  onRefresh?: () => Promise<void>;
  enableActivityTracking?: boolean;
}

const DEFAULT_REALTIME_CONFIG: RealtimeConfig = {
  enabled: true,
  tables: ['calls', 'leads', 'clients', 'users', 'system_messages'],
  events: ['INSERT', 'UPDATE', 'DELETE'],
  debounceMs: 1000,
  maxUpdatesPerMinute: 30
};

const DEFAULT_AUTO_REFRESH_CONFIG: AutoRefreshConfig = {
  enabled: true,
  interval: 5 * 60 * 1000, // 5 minutes
  pauseOnInactive: true,
  pauseOnError: true,
  maxRetries: 3,
  backoffMultiplier: 2
};

export const useRealtimeUpdates = (options: UseRealtimeUpdatesOptions = {}) => {
  const {
    realtimeConfig = {},
    autoRefreshConfig = {},
    onUpdate,
    onError,
    onRefresh,
    enableActivityTracking = true
  } = options;

  // Merge configurations with defaults
  const effectiveRealtimeConfig = { ...DEFAULT_REALTIME_CONFIG, ...realtimeConfig };
  const effectiveAutoRefreshConfig = { ...DEFAULT_AUTO_REFRESH_CONFIG, ...autoRefreshConfig };

  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [errors, setErrors] = useState<Error[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activityTracker, setActivityTracker] = useState<ActivityTracker>({
    isVisible: true,
    isActive: true,
    lastActivity: new Date(),
    inactiveThreshold: 5 * 60 * 1000 // 5 minutes
  });

  // Refs for cleanup and management
  const channelRef = useRef<RealtimeChannel | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateQueueRef = useRef<UpdateEvent[]>([]);
  const retryCountRef = useRef(0);
  const lastUpdateTimeRef = useRef<Date>(new Date());

  // Activity tracking
  const updateActivity = useCallback(() => {
    if (!enableActivityTracking) return;

    setActivityTracker(prev => ({
      ...prev,
      isActive: true,
      lastActivity: new Date()
    }));
  }, [enableActivityTracking]);

  // Check if user is inactive
  const checkInactivity = useCallback(() => {
    if (!enableActivityTracking) return false;

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - activityTracker.lastActivity.getTime();
    const isInactive = timeSinceLastActivity > activityTracker.inactiveThreshold;

    if (isInactive !== !activityTracker.isActive) {
      setActivityTracker(prev => ({
        ...prev,
        isActive: !isInactive
      }));
    }

    return isInactive;
  }, [enableActivityTracking, activityTracker.lastActivity, activityTracker.inactiveThreshold, activityTracker.isActive]);

  // Debounced update handler
  const handleDebouncedUpdate = useCallback(() => {
    if (updateQueueRef.current.length === 0) return;

    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    // Process updates
    updates.forEach(update => {
      if (onUpdate) {
        try {
          onUpdate(update);
        } catch (error) {
          console.error('Error in update handler:', error);
          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    });

    setLastUpdate(new Date());
    setUpdateCount(prev => prev + updates.length);
  }, [onUpdate, onError]);

  // Rate limiting for updates
  const isRateLimited = useCallback(() => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentUpdates = updateQueueRef.current.filter(
      update => update.timestamp > oneMinuteAgo
    ).length;

    return recentUpdates >= effectiveRealtimeConfig.maxUpdatesPerMinute;
  }, [effectiveRealtimeConfig.maxUpdatesPerMinute]);

  // Handle real-time database changes
  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    if (isPaused || isRateLimited()) {
      return;
    }

    const updateEvent: UpdateEvent = {
      table: payload.table,
      eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      old: payload.old,
      new: payload.new,
      timestamp: new Date()
    };

    // Add to update queue
    updateQueueRef.current.push(updateEvent);

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(
      handleDebouncedUpdate,
      effectiveRealtimeConfig.debounceMs
    );
  }, [isPaused, isRateLimited, handleDebouncedUpdate, effectiveRealtimeConfig.debounceMs]);

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!effectiveRealtimeConfig.enabled || channelRef.current) {
      return;
    }

    try {
      // Create a single channel for all table subscriptions
      const channel = supabase.channel('admin-dashboard-updates');

      // Subscribe to each table
      effectiveRealtimeConfig.tables.forEach(table => {
        effectiveRealtimeConfig.events.forEach(event => {
          channel.on(
            'postgres_changes',
            {
              event,
              schema: 'public',
              table
            },
            handleRealtimeChange
          );
        });
      });

      // Handle channel status changes
      channel.on('system', {}, (payload) => {
        if (payload.type === 'connected') {
          setIsConnected(true);
          retryCountRef.current = 0;
          setErrors([]);
        } else if (payload.type === 'disconnected') {
          setIsConnected(false);
        }
      });

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('Real-time subscriptions established');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          const error = new Error('Real-time subscription failed');
          setErrors(prev => [...prev, error]);
          
          if (onError) {
            onError(error);
          }
        }
      });

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors(prev => [...prev, err]);
      
      if (onError) {
        onError(err);
      }
    }
  }, [effectiveRealtimeConfig, handleRealtimeChange, onError]);

  // Clean up real-time subscriptions
  const cleanupRealtimeSubscriptions = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-refresh with exponential backoff
  const performAutoRefresh = useCallback(async () => {
    if (!onRefresh || isPaused) {
      return;
    }

    // Check if user is inactive and should pause
    if (effectiveAutoRefreshConfig.pauseOnInactive && checkInactivity()) {
      return;
    }

    try {
      await onRefresh();
      retryCountRef.current = 0; // Reset retry count on success
      lastUpdateTimeRef.current = new Date();
    } catch (error) {
      console.error('Auto-refresh failed:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      setErrors(prev => [...prev, err]);

      if (onError) {
        onError(err);
      }

      // Implement exponential backoff
      retryCountRef.current++;
      if (retryCountRef.current < effectiveAutoRefreshConfig.maxRetries) {
        const backoffDelay = effectiveAutoRefreshConfig.interval * 
          Math.pow(effectiveAutoRefreshConfig.backoffMultiplier, retryCountRef.current - 1);
        
        setTimeout(() => {
          if (!isPaused) {
            performAutoRefresh();
          }
        }, backoffDelay);
      } else if (effectiveAutoRefreshConfig.pauseOnError) {
        setIsPaused(true);
      }
    }
  }, [
    onRefresh,
    isPaused,
    effectiveAutoRefreshConfig,
    checkInactivity,
    onError
  ]);

  // Set up auto-refresh interval
  const setupAutoRefresh = useCallback(() => {
    if (!effectiveAutoRefreshConfig.enabled || autoRefreshIntervalRef.current) {
      return;
    }

    autoRefreshIntervalRef.current = setInterval(
      performAutoRefresh,
      effectiveAutoRefreshConfig.interval
    );
  }, [effectiveAutoRefreshConfig.enabled, effectiveAutoRefreshConfig.interval, performAutoRefresh]);

  // Clean up auto-refresh
  const cleanupAutoRefresh = useCallback(() => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, []);

  // Manual pause/resume controls
  const pause = useCallback(() => {
    setIsPaused(true);
    cleanupAutoRefresh();
  }, [cleanupAutoRefresh]);

  const resume = useCallback(() => {
    setIsPaused(false);
    retryCountRef.current = 0;
    setErrors([]);
    setupAutoRefresh();
  }, [setupAutoRefresh]);

  // Force refresh
  const forceRefresh = useCallback(async () => {
    if (onRefresh) {
      try {
        await onRefresh();
        setErrors([]);
        retryCountRef.current = 0;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setErrors(prev => [...prev, err]);
        if (onError) {
          onError(err);
        }
      }
    }
  }, [onRefresh, onError]);

  // Set up activity tracking
  useEffect(() => {
    if (!enableActivityTracking) return;

    const handleActivity = () => updateActivity();
    const handleVisibilityChange = () => {
      setActivityTracker(prev => ({
        ...prev,
        isVisible: !document.hidden
      }));
    };

    // Activity event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Inactivity check interval
    const inactivityCheckInterval = setInterval(checkInactivity, 30000); // Check every 30 seconds

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(inactivityCheckInterval);
    };
  }, [enableActivityTracking, updateActivity, checkInactivity]);

  // Initialize real-time subscriptions
  useEffect(() => {
    setupRealtimeSubscriptions();
    return cleanupRealtimeSubscriptions;
  }, [setupRealtimeSubscriptions, cleanupRealtimeSubscriptions]);

  // Initialize auto-refresh
  useEffect(() => {
    if (!isPaused) {
      setupAutoRefresh();
    }
    return cleanupAutoRefresh;
  }, [isPaused, setupAutoRefresh, cleanupAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRealtimeSubscriptions();
      cleanupAutoRefresh();
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [cleanupRealtimeSubscriptions, cleanupAutoRefresh]);

  return {
    // Connection status
    isConnected,
    isPaused,
    
    // Update information
    lastUpdate,
    updateCount,
    errors,
    
    // Activity tracking
    activityTracker,
    
    // Controls
    pause,
    resume,
    forceRefresh,
    
    // Configuration
    realtimeConfig: effectiveRealtimeConfig,
    autoRefreshConfig: effectiveAutoRefreshConfig,
    
    // Statistics
    stats: {
      isConnected,
      isPaused,
      updateCount,
      errorCount: errors.length,
      lastUpdate,
      retryCount: retryCountRef.current,
      isActive: activityTracker.isActive,
      isVisible: activityTracker.isVisible
    }
  };
};

export default useRealtimeUpdates;