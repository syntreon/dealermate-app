import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardMetrics } from '@/types/dashboard';
import { DashboardService } from '@/services/dashboardService';

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
        // Determine if user is admin/owner (can see all data) or regular user (client-specific data)
        const isAdminUser = user && (
          user.client_id === null && 
          (user.role === 'admin' || user.role === 'owner')
        );
        
        // Use the appropriate client ID based on user role
        const effectiveClientId = isAdminUser ? null : (user?.client_id || null);
        
        console.log('Dashboard Metrics - User Role:', user?.role, 'Client ID:', user?.client_id, 'Is Admin:', isAdminUser, 'Effective Client ID:', effectiveClientId);
        
        // Fetch real metrics from database
        const dashboardMetrics = await DashboardService.getDashboardMetrics(effectiveClientId);
        
        console.log('Fetched metrics:', dashboardMetrics);
        
        setMetrics(dashboardMetrics);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
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
    
  }, [user?.id, user?.role, user?.client_id, clientId, isAuthLoading]);

  return { metrics, isLoading, error };
};

export default useDashboardMetrics;