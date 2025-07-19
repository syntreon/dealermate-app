import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardMetrics, SystemMessage, AgentStatus } from '@/types/dashboard';
import { SystemStatusService } from '@/services/systemStatusService';

export const useDashboardMetrics = (clientId?: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would be an API call
        // For now, we'll simulate an API call with a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Determine if user is admin/owner (can see all data) or regular user (client-specific data)
        const isAdminUser = user && (
          user.client_id === null && 
          (user.role === 'admin' || user.role === 'owner' || user.is_admin)
        );
        
        // Mock data - different values for admin vs client users
        let mockMetrics: DashboardMetrics;
        
        if (isAdminUser) {
          // Admin/Owner sees aggregated data from ALL clients
          mockMetrics = {
            totalCalls: 1247, // Higher numbers for all clients combined
            averageHandleTime: '3m 12s',
            callsTransferred: 189,
            totalLeads: 324,
            callsGrowth: 18,
            timeGrowth: -3,
            transferGrowth: 12,
            leadsGrowth: 22,
            agentStatus: {
              status: 'active',
              lastUpdated: new Date(),
              message: 'All systems operational - Platform-wide status'
            },
            systemMessages: [
              {
                id: '1',
                type: 'info',
                message: 'Platform maintenance scheduled for tonight at 2:00 AM EST',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
              },
              {
                id: '2',
                type: 'success',
                message: 'New multi-client analytics dashboard is now available',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                expiresAt: null
              },
              {
                id: '3',
                type: 'warning',
                message: 'Client ABC Corp approaching monthly call limit',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
              }
            ]
          };
        } else {
          // Regular client user sees only their client's data
          mockMetrics = {
            totalCalls: 156,
            averageHandleTime: '2m 45s',
            callsTransferred: 23,
            totalLeads: 42,
            callsGrowth: 12,
            timeGrowth: -5,
            transferGrowth: 8,
            leadsGrowth: 15,
            agentStatus: {
              status: 'active',
              lastUpdated: new Date(),
              message: 'All systems operational'
            },
            systemMessages: [
              {
                id: '1',
                type: 'info',
                message: 'System maintenance scheduled for tonight at 2:00 AM EST',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
              },
              {
                id: '2',
                type: 'success',
                message: 'New lead capture feature is now available',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                expiresAt: null
              }
            ]
          };
        }
        
        console.log('Dashboard Metrics - User Role:', user?.role, 'Client ID:', user?.client_id, 'Is Admin:', isAdminUser);
        console.log('Fetched metrics:', mockMetrics);
        
        setMetrics(mockMetrics);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard metrics'));
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if auth is done loading and we have a user.
    if (!isAuthLoading && user && user.id && user.role) {
      fetchMetrics();
    }
    
    // If auth is done and there's no user, stop loading.
    if (!isAuthLoading && !user) {
      setIsLoading(false);
    }
    
  }, [user?.id, user?.role, user?.client_id, clientId, isAuthLoading]); // Add isAuthLoading to dependencies

  return { metrics, isLoading, error };
};

export default useDashboardMetrics;