import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface DashboardMetrics {
  totalCalls: number;
  averageHandleTime: string;
  callsTransferred: number;
  totalLeads: number;
  callsGrowth?: number;
  timeGrowth?: number;
  transferGrowth?: number;
  leadsGrowth?: number;
}

export const useDashboardMetrics = (clientId?: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would be an API call
        // For now, we'll simulate an API call with a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data based on the requirements
        const mockMetrics: DashboardMetrics = {
          totalCalls: 156,
          averageHandleTime: '2m 45s',
          callsTransferred: 23,
          totalLeads: 42,
          callsGrowth: 12,
          timeGrowth: -5,
          transferGrowth: 8,
          leadsGrowth: 15
        };
        
        setMetrics(mockMetrics);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard metrics'));
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a user
    if (user) {
      fetchMetrics();
    }
    
    // In a real implementation, we might want to set up a polling interval
    // to refresh the data periodically
    
  }, [user, clientId]);

  return { metrics, isLoading, error };
};

export default useDashboardMetrics;