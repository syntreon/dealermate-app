import React, { useEffect, useRef } from 'react';
import { useRealtimeAgentStatus } from '@/hooks/useRealtimeAgentStatus';
import { useRealtimeSystemMessages } from '@/hooks/useRealtimeSystemMessages';
import { useRealtimeDashboardMetrics } from '@/hooks/useRealtimeDashboardMetrics';
import { AgentStatus, SystemMessage } from '@/types/admin';
import { DashboardMetrics } from '@/types/dashboard';
import { toast } from 'sonner';

interface RealtimeNotificationSystemProps {
  clientId?: string | null;
  enableAgentStatusNotifications?: boolean;
  enableSystemMessageNotifications?: boolean;
  enableMetricsNotifications?: boolean;
  onAgentStatusChange?: (status: AgentStatus) => void;
  onSystemMessagesChange?: (messages: SystemMessage[]) => void;
  onMetricsChange?: (metrics: DashboardMetrics) => void;
}

/**
 * This component manages real-time notifications across the admin panel.
 * It's designed to be mounted once at the app level to provide global real-time updates.
 */
const RealtimeNotificationSystem: React.FC<RealtimeNotificationSystemProps> = ({
  clientId,
  enableAgentStatusNotifications = true,
  enableSystemMessageNotifications = true,
  enableMetricsNotifications = false, // Usually disabled to avoid spam
  onAgentStatusChange,
  onSystemMessagesChange,
  onMetricsChange
}) => {
  const lastNotificationRef = useRef<{ [key: string]: number }>({});

  // Throttle notifications to prevent spam
  const shouldShowNotification = (key: string, minInterval: number = 5000) => {
    const now = Date.now();
    const lastTime = lastNotificationRef.current[key] || 0;
    
    if (now - lastTime >= minInterval) {
      lastNotificationRef.current[key] = now;
      return true;
    }
    
    return false;
  };

  // Agent Status Notifications
  const { agentStatus, connectionStatus: agentConnectionStatus } = useRealtimeAgentStatus({
    clientId,
    enableNotifications: enableAgentStatusNotifications,
    onStatusChange: (status) => {
      if (onAgentStatusChange) {
        onAgentStatusChange(status);
      }
      
      // Show custom notifications for critical status changes
      if (enableAgentStatusNotifications && shouldShowNotification(`agent-${status.status}`, 10000)) {
        switch (status.status) {
          case 'inactive':
            toast.error('Agent is now inactive', {
              description: status.message || 'System is down or unavailable',
              duration: 10000,
            });
            break;
          case 'maintenance':
            toast.warning('Agent is under maintenance', {
              description: status.message || 'Scheduled maintenance in progress',
              duration: 8000,
            });
            break;
          case 'active':
            toast.success('Agent is now active', {
              description: status.message || 'All systems operational',
              duration: 5000,
            });
            break;
        }
      }
    }
  });

  // System Messages Notifications
  const { 
    messages: systemMessages, 
    connectionStatus: messagesConnectionStatus,
    activeMessages 
  } = useRealtimeSystemMessages({
    clientId,
    enableNotifications: enableSystemMessageNotifications,
    onMessagesChange: (messages) => {
      if (onSystemMessagesChange) {
        onSystemMessagesChange(messages);
      }
      
      // Show notifications for all system messages
      if (enableSystemMessageNotifications) {
        const activeMessages = messages.filter(msg => 
          (!msg.expires_at || msg.expires_at > new Date())
        );
        
        activeMessages.forEach(message => {
          if (shouldShowNotification(`message-${message.id}`, 30000)) {
            const duration = message.type === 'error' ? 15000 : 
                           message.type === 'warning' ? 8000 : 
                           message.type === 'success' ? 5000 : 6000;
            
            switch (message.type) {
              case 'error':
                toast.error(message.message, {
                  description: message.isGlobal ? 'System-wide alert' : 'Client-specific alert',
                  duration,
                });
                break;
              case 'warning':
                toast.warning(message.message, {
                  description: message.isGlobal ? 'System-wide notice' : 'Client-specific notice',
                  duration,
                });
                break;
              case 'success':
                toast.success(message.message, {
                  description: message.isGlobal ? 'System-wide update' : 'Client-specific update',
                  duration,
                });
                break;
              case 'info':
              default:
                toast.info(message.message, {
                  description: message.isGlobal ? 'System-wide information' : 'Client-specific information',
                  duration,
                });
                break;
            }
          }
        });
      }
    }
  });

  // Dashboard Metrics Notifications (usually disabled)
  const { 
    metrics, 
    connectionStatus: metricsConnectionStatus 
  } = useRealtimeDashboardMetrics({
    clientId,
    refreshInterval: 60000, // 1 minute
    enableNotifications: enableMetricsNotifications,
    onMetricsChange: (newMetrics) => {
      if (onMetricsChange) {
        onMetricsChange(newMetrics);
      }
      
      // Show notifications for significant metric changes
      if (enableMetricsNotifications && shouldShowNotification('metrics-update', 300000)) { // 5 minutes
        // This is usually disabled to avoid notification spam
        // But could be enabled for critical thresholds
      }
    }
  });

  // Connection Status Monitoring
  useEffect(() => {
    const connections = [
      { name: 'Agent Status', status: agentConnectionStatus },
      { name: 'System Messages', status: messagesConnectionStatus },
      { name: 'Metrics', status: metricsConnectionStatus }
    ];

    const disconnectedServices = connections.filter(conn => 
      conn.status.status === 'disconnected' || conn.status.status === 'error'
    );

    if (disconnectedServices.length > 0 && shouldShowNotification('connection-issues', 60000)) {
      toast.warning('Real-time connection issues detected', {
        description: `${disconnectedServices.map(s => s.name).join(', ')} offline`,
        duration: 8000,
      });
    }
  }, [agentConnectionStatus, messagesConnectionStatus, metricsConnectionStatus]);

  // Show connection restored notification
  useEffect(() => {
    const allConnected = [
      agentConnectionStatus,
      messagesConnectionStatus,
      metricsConnectionStatus
    ].every(status => status.status === 'connected');

    if (allConnected && shouldShowNotification('connection-restored', 30000)) {
      toast.success('Real-time connection restored', {
        description: 'All services are now online',
        duration: 3000,
      });
    }
  }, [agentConnectionStatus.status, messagesConnectionStatus.status, metricsConnectionStatus.status]);

  // This component doesn't render anything visible
  // It just manages real-time subscriptions and notifications
  return null;
};

export default RealtimeNotificationSystem;