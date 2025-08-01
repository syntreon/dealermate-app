import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { themeService } from '@/services/themeService';
import { themeRecoveryManager } from '@/utils/themeRecovery';
import { ThemeValidator } from '@/utils/themeValidation';

/**
 * Theme initialization provider to ensure theme is only initialized once
 * regardless of how many layouts are mounted
 */

interface ThemeInitContextValue {
  isInitialized: boolean;
  currentUserId: string | null;
}

const ThemeInitContext = createContext<ThemeInitContextValue | undefined>(undefined);

interface ThemeInitProviderProps {
  children: React.ReactNode;
}

export const ThemeInitProvider: React.FC<ThemeInitProviderProps> = ({ children }) => {
  const { setTheme } = useTheme();
  const { user } = useAuth();
  const isInitializedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;

  /**
   * Safely detect system theme with error handling
   */
  const detectSystemTheme = (): 'dark' | 'light' | null => {
    try {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return null;
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      if (mediaQuery.media === 'not all') {
        return null;
      }

      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.error('Failed to detect system theme:', error);
      return null;
    }
  };

  /**
   * Apply theme instantly with minimal error handling
   */
  const applyTheme = (theme: 'light' | 'dark' | 'system', fallbackTheme: 'light' | 'dark' = 'light') => {
    let actualTheme = theme;
    
    // Simple theme resolution - no complex recovery
    if (theme === 'system') {
      const systemTheme = detectSystemTheme();
      actualTheme = systemTheme || fallbackTheme;
    }

    // Validate final theme value
    if (!['light', 'dark'].includes(actualTheme)) {
      actualTheme = fallbackTheme;
    }

    // Apply theme to DOM instantly
    document.documentElement.setAttribute('data-theme', actualTheme);
    setTheme(theme); // Keep original theme preference (including 'system')
    
    console.log(`Theme initialized: ${theme} (resolved to ${actualTheme})`);
  };

  // Initialize theme only once per user
  useEffect(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only initialize if user is available and either:
    // 1. Never initialized before, OR
    // 2. User has changed
    if (user && (!isInitializedRef.current || currentUserIdRef.current !== user.id)) {
      console.log(`Initializing theme for user ${user.id} (previous: ${currentUserIdRef.current}) - isInitialized: ${isInitializedRef.current}`);
      
      try {
        // Get theme from user preferences
        const userTheme = user.preferences?.displaySettings?.theme;
        
        if (userTheme && ['light', 'dark', 'system'].includes(userTheme)) {
          // Apply user's saved theme preference
          applyTheme(userTheme);
        } else {
          // Default to system theme if no valid preference is saved
          applyTheme('system');
        }

        // Mark as initialized for this user
        isInitializedRef.current = true;
        currentUserIdRef.current = user.id;
        
      } catch (error) {
        console.error('Error during theme initialization:', error);
        // Final fallback - apply light theme directly
        applyTheme('light');
      }
    } else if (user && isInitializedRef.current && currentUserIdRef.current === user.id) {
      console.log(`Theme already initialized for user ${user.id}, skipping`);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user?.id]); // Only depend on user.id

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      isInitializedRef.current = false;
      currentUserIdRef.current = null;
      console.log('User logged out, resetting theme initialization');
    }
  }, [user?.id]); // Only depend on user ID, not the whole user object

  // Subscribe to theme service events for synchronization
  useEffect(() => {
    const unsubscribe = themeService.subscribe((event) => {
      // Only respond to theme changes from other sources to avoid loops
      if (user && event.source !== 'system') {
        try {
          // Apply the theme change from the service
          if (event.theme === 'system') {
            const systemTheme = detectSystemTheme();
            if (systemTheme) {
              document.documentElement.setAttribute('data-theme', systemTheme);
            }
          } else {
            document.documentElement.setAttribute('data-theme', event.theme);
          }
        } catch (error) {
          console.error('Error applying theme from service event:', error);
        }
      }
    });

    return unsubscribe;
  }, [user?.id]);

  const contextValue: ThemeInitContextValue = {
    isInitialized: isInitializedRef.current,
    currentUserId: currentUserIdRef.current
  };

  return (
    <ThemeInitContext.Provider value={contextValue}>
      {children}
    </ThemeInitContext.Provider>
  );
};

export const useThemeInitContext = (): ThemeInitContextValue => {
  const context = useContext(ThemeInitContext);
  if (context === undefined) {
    throw new Error('useThemeInitContext must be used within a ThemeInitProvider');
  }
  return context;
};