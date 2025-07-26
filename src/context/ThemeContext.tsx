import React, { createContext, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { themeService, ThemeType } from '@/services/themeService';

/**
 * Performance-optimized theme context to minimize re-renders
 */

interface ThemeContextValue {
  currentTheme: ThemeType;
  isSystemTheme: boolean;
  resolvedTheme: 'light' | 'dark';
  updateTheme: (theme: ThemeType, source?: 'topbar' | 'settings') => Promise<void>;
  isUpdating: boolean;
  lastUpdateTime: Date | null;
  performanceMetrics: {
    updateCount: number;
    averageUpdateTime: number;
    lastUpdateDuration: number;
  };
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();
  
  // Performance tracking
  const updateCountRef = useRef(0);
  const updateTimesRef = useRef<number[]>([]);
  const lastUpdateTimeRef = useRef<Date | null>(null);
  const lastUpdateDurationRef = useRef(0);
  const isUpdatingRef = useRef(false);

  // Memoized current theme calculation
  const currentTheme = useMemo((): ThemeType => {
    if (!user) return 'system';
    return themeService.getCurrentTheme(user);
  }, [user?.id, user?.preferences?.displaySettings?.theme]); // Only depend on specific properties

  // Memoized system theme detection
  const isSystemTheme = useMemo(() => currentTheme === 'system', [currentTheme]);

  // Memoized resolved theme calculation
  const memoizedResolvedTheme = useMemo((): 'light' | 'dark' => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      return resolvedTheme;
    }
    // Fallback to light if resolvedTheme is not available
    return 'light';
  }, [resolvedTheme]);

  // Memoized performance metrics
  const performanceMetrics = useMemo(() => {
    const updateTimes = updateTimesRef.current;
    const averageUpdateTime = updateTimes.length > 0 
      ? updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length 
      : 0;

    return {
      updateCount: updateCountRef.current,
      averageUpdateTime,
      lastUpdateDuration: lastUpdateDurationRef.current
    };
  }, [updateCountRef.current, lastUpdateDurationRef.current]);

  // Optimized theme update function with performance monitoring
  const updateTheme = useCallback(async (
    newTheme: ThemeType, 
    source: 'topbar' | 'settings' = 'settings'
  ): Promise<void> => {
    if (!user || isUpdatingRef.current) return;

    const startTime = performance.now();
    isUpdatingRef.current = true;

    try {
      await themeService.updateTheme(
        user.id,
        newTheme,
        source,
        user,
        undefined, // Don't update user context here to avoid re-renders
        setTheme
      );

      // Update performance metrics
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      updateCountRef.current++;
      lastUpdateDurationRef.current = duration;
      lastUpdateTimeRef.current = new Date();
      
      // Keep only last 10 update times for average calculation
      updateTimesRef.current.push(duration);
      if (updateTimesRef.current.length > 10) {
        updateTimesRef.current.shift();
      }

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Theme update completed in ${duration.toFixed(2)}ms`, {
          theme: newTheme,
          source,
          updateCount: updateCountRef.current,
          averageTime: updateTimesRef.current.reduce((sum, time) => sum + time, 0) / updateTimesRef.current.length
        });
      }

    } catch (error) {
      console.error('Theme update failed:', error);
      throw error;
    } finally {
      isUpdatingRef.current = false;
    }
  }, [user?.id, setTheme]); // Minimal dependencies

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo((): ThemeContextValue => ({
    currentTheme,
    isSystemTheme,
    resolvedTheme: memoizedResolvedTheme,
    updateTheme,
    isUpdating: isUpdatingRef.current,
    lastUpdateTime: lastUpdateTimeRef.current,
    performanceMetrics
  }), [
    currentTheme,
    isSystemTheme,
    memoizedResolvedTheme,
    updateTheme,
    performanceMetrics
  ]);

  // Performance monitoring effect
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const metrics = performanceMetrics;
        if (metrics.updateCount > 0) {
          console.log('Theme Performance Metrics:', {
            totalUpdates: metrics.updateCount,
            averageUpdateTime: `${metrics.averageUpdateTime.toFixed(2)}ms`,
            lastUpdateDuration: `${metrics.lastUpdateDuration.toFixed(2)}ms`,
            lastUpdateTime: lastUpdateTimeRef.current?.toLocaleTimeString()
          });
        }
      }, 30000); // Log every 30 seconds

      return () => clearInterval(interval);
    }
  }, [performanceMetrics]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Performance monitoring hook
export const useThemePerformance = () => {
  const { performanceMetrics, lastUpdateTime } = useThemeContext();
  
  return useMemo(() => ({
    ...performanceMetrics,
    lastUpdateTime,
    isPerformant: performanceMetrics.averageUpdateTime < 100, // Consider < 100ms as performant
    getPerformanceReport: () => ({
      status: performanceMetrics.averageUpdateTime < 100 ? 'good' : 
              performanceMetrics.averageUpdateTime < 300 ? 'moderate' : 'poor',
      recommendations: performanceMetrics.averageUpdateTime > 300 ? [
        'Consider reducing theme-dependent calculations',
        'Check for unnecessary re-renders in components',
        'Optimize theme service database operations'
      ] : []
    })
  }), [performanceMetrics, lastUpdateTime]);
};