import { useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { themeService } from '@/services/themeService';
import { themeRecoveryManager } from '@/utils/themeRecovery';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Custom hook to initialize theme based on user preferences
 * Handles loading theme from user preferences in database
 * Falls back to system preference if no saved preference
 * Includes error handling and retry mechanisms
 */
// Global flag to prevent multiple initializations
let isThemeInitialized = false;
let lastInitializedUserId: string | null = null;

export const useThemeInit = () => {
  const { setTheme, theme: currentTheme } = useTheme();
  const { user } = useAuth();
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasInitializedRef = useRef(false);

  /**
   * Safely detect system theme with error handling
   * @returns 'dark' | 'light' | null (null indicates detection failure)
   */
  const detectSystemTheme = useCallback((): 'dark' | 'light' | null => {
    try {
      // Check if matchMedia is available
      if (typeof window === 'undefined' || !window.matchMedia) {
        console.warn('matchMedia not available, falling back to light theme');
        return null;
      }

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Check if the media query is valid
      if (mediaQuery.media === 'not all') {
        console.warn('prefers-color-scheme not supported, falling back to light theme');
        return null;
      }

      return mediaQuery.matches ? 'dark' : 'light';
    } catch (error) {
      console.error('Failed to detect system theme:', error);
      return null;
    }
  }, []);

  /**
   * Apply theme with error handling and recovery
   */
  const applyTheme = useCallback(async (theme: 'light' | 'dark' | 'system', fallbackTheme: 'light' | 'dark' = 'light') => {
    try {
      let actualTheme = theme;
      
      // Validate theme first
      if (!themeRecoveryManager.validateTheme(theme)) {
        console.warn(`Theme validation failed for ${theme}, attempting recovery`);
        
        if (user) {
          actualTheme = await themeRecoveryManager.recoverTheme(
            user.id,
            theme,
            new Error(`Theme validation failed for ${theme}`),
            { fallbackTheme }
          );
        } else {
          actualTheme = fallbackTheme;
        }
      } else if (theme === 'system') {
        const systemTheme = detectSystemTheme();
        if (systemTheme === null) {
          // System detection failed, use recovery
          if (user) {
            actualTheme = await themeRecoveryManager.recoverTheme(
              user.id,
              theme,
              new Error('System theme detection failed'),
              { fallbackTheme }
            );
          } else {
            actualTheme = fallbackTheme;
          }
        } else {
          actualTheme = systemTheme;
        }
      }

      // Validate final theme value
      if (!['light', 'dark'].includes(actualTheme)) {
        console.error(`Invalid theme value after recovery: ${actualTheme}, using fallback: ${fallbackTheme}`);
        actualTheme = fallbackTheme;
      }

      // Apply theme to DOM
      document.documentElement.setAttribute('data-theme', actualTheme);
      setTheme(theme); // Keep original theme preference (including 'system')
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error('Failed to apply theme:', error);
      
      // Retry with exponential backoff
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current++;
        const delay = RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
        
        console.log(`Retrying theme application (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}) in ${delay}ms`);
        
        timeoutRef.current = setTimeout(() => {
          applyTheme(theme, fallbackTheme);
        }, delay);
      } else {
        // All retries failed, apply fallback theme directly
        console.error('All theme application attempts failed, applying fallback theme');
        try {
          document.documentElement.setAttribute('data-theme', fallbackTheme);
          setTheme(fallbackTheme);
        } catch (fallbackError) {
          console.error('Even fallback theme application failed:', fallbackError);
        }
      }
    }
  }, [setTheme, detectSystemTheme, user]);

  useEffect(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only initialize if:
    // 1. User is available
    // 2. Theme hasn't been initialized globally OR user has changed
    // 3. This hook instance hasn't already initialized
    if (user && (!isThemeInitialized || lastInitializedUserId !== user.id) && !hasInitializedRef.current) {
      try {
        console.log(`Initializing theme for user ${user.id}`);
        
        // Get theme from user preferences
        const userTheme = user.preferences?.displaySettings?.theme;
        
        if (userTheme && ['light', 'dark', 'system'].includes(userTheme)) {
          // Apply user's saved theme preference
          applyTheme(userTheme);
        } else {
          // Default to system theme if no valid preference is saved
          applyTheme('system');
        }

        // Mark as initialized
        isThemeInitialized = true;
        lastInitializedUserId = user.id;
        hasInitializedRef.current = true;
        
      } catch (error) {
        console.error('Error during theme initialization:', error);
        // Final fallback - apply light theme directly
        applyTheme('light');
      }
    } else if (user && isThemeInitialized && lastInitializedUserId === user.id) {
      // Theme already initialized for this user, just mark this instance as initialized
      hasInitializedRef.current = true;
      console.log(`Theme already initialized for user ${user.id}, skipping`);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user?.id, applyTheme]); // Only depend on user.id, not the entire user object

  // Add listener for system theme changes when using system preference
  useEffect(() => {
    let mediaQuery: MediaQueryList | null = null;

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      try {
        if (user?.preferences?.displaySettings?.theme === 'system') {
          const newTheme = event.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      } catch (error) {
        console.error('Error handling system theme change:', error);
        // Fallback to light theme if error occurs
        try {
          document.documentElement.setAttribute('data-theme', 'light');
        } catch (fallbackError) {
          console.error('Failed to apply fallback theme during system change:', fallbackError);
        }
      }
    };

    try {
      // Only set up listener if matchMedia is available
      if (typeof window !== 'undefined' && window.matchMedia) {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Check if media query is valid
        if (mediaQuery.media !== 'not all') {
          // Add event listener for system theme changes
          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
          } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleSystemThemeChange);
          }
        } else {
          console.warn('prefers-color-scheme media query not supported');
        }
      }
    } catch (error) {
      console.error('Failed to set up system theme change listener:', error);
    }

    // Cleanup
    return () => {
      try {
        if (mediaQuery) {
          if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
          } else {
            // Fallback for older browsers
            mediaQuery.removeListener(handleSystemThemeChange);
          }
        }
      } catch (error) {
        console.error('Error during system theme listener cleanup:', error);
      }
    };
  }, [user]);

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
  }, [user?.id, detectSystemTheme]); // Only depend on user.id

  // Reset initialization when user logs out
  useEffect(() => {
    if (!user) {
      isThemeInitialized = false;
      lastInitializedUserId = null;
      hasInitializedRef.current = false;
      console.log('User logged out, resetting theme initialization');
    }
  }, [user]);
};

// Export function to reset theme initialization (useful for testing or manual reset)
export const resetThemeInitialization = () => {
  isThemeInitialized = false;
  lastInitializedUserId = null;
  console.log('Theme initialization reset manually');
};
