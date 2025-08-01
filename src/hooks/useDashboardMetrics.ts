import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardMetrics } from '@/types/dashboard';
import { DashboardService } from '@/services/dashboardService';

// Simple cache to prevent multiple calls
const metricsCache = new Map<string, { data: DashboardMetrics; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const useDashboardMetrics = (clientId?: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const lastFetchRef = useRef<string>('');

  useEffect(() => {
    console.log('useDashboardMetrics useEffect triggered - user?.id:', user?.id, 'user?.role:', user?.role, 'user?.client_id:', user?.client_id, 'clientId:', clientId, 'isAuthLoading:', isAuthLoading);
    
    const fetchMetrics = async () => {
      if (!user?.id) return;
      
      // Create cache key
      const isAdminUser = user && (
        user.client_id === null && 
        (user.role === 'admin' || user.role === 'owner')
      );
      const effectiveClientId = isAdminUser ? clientId : (user?.client_id || null);
      const cacheKey = `${user.id}_${effectiveClientId || 'null'}_${user.role}`;
      
      // Prevent duplicate calls
      if (lastFetchRef.current === cacheKey) {
        console.log('Dashboard Metrics - Skipping duplicate fetch for:', cacheKey);
        return;
      }
      
      // Check cache first
      const cached = metricsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Dashboard Metrics - Using cached data for:', cacheKey);
        setMetrics(cached.data);
        setIsLoading(false);
        return;
      }
      
      lastFetchRef.current = cacheKey;
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Dashboard Metrics - User Role:', user?.role, 'Client ID:', user?.client_id, 'Is Admin:', isAdminUser, 'Passed Client ID:', clientId, 'Effective Client ID:', effectiveClientId);
        
        // Fetch real metrics from database
        const dashboardMetrics = await DashboardService.getDashboardMetrics(effectiveClientId);
        
        console.log('Fetched metrics:', dashboardMetrics);
        
        // Cache the result
        metricsCache.set(cacheKey, {
          data: dashboardMetrics,
          timestamp: Date.now()
        });
        
        setMetrics(dashboardMetrics);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard metrics'));
        lastFetchRef.current = ''; // Reset on error to allow retry
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
    
  }, [user?.id, user?.role, user?.client_id, clientId, isAuthLoading]); // Only depend on specific user properties, not the whole user object

  return { metrics, isLoading, error };
};

export default useDashboardMetrics;