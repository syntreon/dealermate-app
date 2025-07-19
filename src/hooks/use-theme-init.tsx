import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to initialize theme based on user preferences
 * Handles loading theme from user preferences in database
 * Falls back to system preference if no saved preference
 */
export const useThemeInit = () => {
  const { setTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    // Only run once when the component mounts and user data is available
    if (user) {
      // Get theme from user preferences
      const userTheme = user.preferences?.displaySettings?.theme;
      
      if (userTheme) {
        // If user has a saved theme preference, apply it
        if (userTheme === 'system') {
          // For system preference, check OS theme
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', systemTheme);
          setTheme('system');
        } else {
          // Apply user's explicit theme choice
          document.documentElement.setAttribute('data-theme', userTheme);
          setTheme(userTheme);
        }
      } else {
        // Default to system theme if no preference is saved
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        setTheme('system');
      }
    }
  }, [user, setTheme]);

  // Add listener for system theme changes when using system preference
  useEffect(() => {
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (user?.preferences?.displaySettings?.theme === 'system') {
        const newTheme = event.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Add event listener for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [user]);
};
