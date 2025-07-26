import { useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useThemeContext } from '@/context/ThemeContext';

/**
 * Optimized theme hook with memoization for theme-dependent calculations
 */

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  border: string;
  destructive: string;
}

interface ThemeUtilities {
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  colors: ThemeColors;
  getColor: (colorName: keyof ThemeColors) => string;
  getContrastColor: (backgroundColor: string) => 'light' | 'dark';
  applyThemeClass: (baseClass: string) => string;
}

export const useOptimizedTheme = (): ThemeUtilities => {
  const { resolvedTheme } = useTheme();
  const { currentTheme, isSystemTheme } = useThemeContext();

  // Memoized theme state calculations
  const themeState = useMemo(() => ({
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: isSystemTheme
  }), [resolvedTheme, isSystemTheme]);

  // Memoized color calculations
  const colors = useMemo((): ThemeColors => {
    // These would typically be read from CSS custom properties
    // For now, we'll use the CSS variable names that will be resolved at runtime
    return {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      muted: 'hsl(var(--muted))',
      accent: 'hsl(var(--accent))',
      border: 'hsl(var(--border))',
      destructive: 'hsl(var(--destructive))'
    };
  }, [resolvedTheme]); // Only recalculate when resolved theme changes

  // Memoized color getter function
  const getColor = useCallback((colorName: keyof ThemeColors): string => {
    return colors[colorName];
  }, [colors]);

  // Memoized contrast color calculation
  const getContrastColor = useCallback((backgroundColor: string): 'light' | 'dark' => {
    // Simple heuristic based on theme
    // In a real implementation, you might parse the color and calculate luminance
    return themeState.isDark ? 'light' : 'dark';
  }, [themeState.isDark]);

  // Memoized theme class application
  const applyThemeClass = useCallback((baseClass: string): string => {
    const themePrefix = themeState.isDark ? 'dark:' : '';
    return `${baseClass} ${themePrefix}${baseClass}`;
  }, [themeState.isDark]);

  // Return memoized utilities object
  return useMemo((): ThemeUtilities => ({
    ...themeState,
    colors,
    getColor,
    getContrastColor,
    applyThemeClass
  }), [themeState, colors, getColor, getContrastColor, applyThemeClass]);
};

// Hook for theme-dependent calculations with caching
export const useThemeCalculation = <T>(
  calculation: (isDark: boolean, colors: ThemeColors) => T,
  dependencies: React.DependencyList = []
): T => {
  const { isDark, colors } = useOptimizedTheme();

  return useMemo(
    () => calculation(isDark, colors),
    [isDark, colors, ...dependencies]
  );
};

// Hook for theme-aware CSS classes
export const useThemeClasses = (classMap: {
  light?: string;
  dark?: string;
  base?: string;
}): string => {
  const { isDark } = useOptimizedTheme();

  return useMemo(() => {
    const baseClass = classMap.base || '';
    const themeClass = isDark ? (classMap.dark || '') : (classMap.light || '');
    return `${baseClass} ${themeClass}`.trim();
  }, [isDark, classMap.base, classMap.light, classMap.dark]);
};

// Hook for performance-aware theme updates
export const useThemeUpdater = () => {
  const { updateTheme, isUpdating, performanceMetrics } = useThemeContext();

  const optimizedUpdateTheme = useCallback(async (
    theme: 'light' | 'dark' | 'system',
    source?: 'topbar' | 'settings'
  ) => {
    // Don't allow updates if one is already in progress
    if (isUpdating) {
      console.warn('Theme update already in progress, skipping');
      return;
    }

    // Warn if performance is degraded
    if (performanceMetrics.averageUpdateTime > 300) {
      console.warn('Theme update performance is degraded:', performanceMetrics);
    }

    return updateTheme(theme, source);
  }, [updateTheme, isUpdating, performanceMetrics]);

  return {
    updateTheme: optimizedUpdateTheme,
    isUpdating,
    performanceMetrics
  };
};