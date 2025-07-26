import { ThemeType } from '@/services/themeService';

/**
 * Theme validation and sanitization utilities
 */

export interface ThemeValidationResult {
  isValid: boolean;
  sanitizedTheme: ThemeType;
  errors: string[];
  warnings: string[];
}

export interface UserPreferences {
  displaySettings?: {
    theme?: string | ThemeType;
    dashboardLayout?: string;
  };
  notifications?: any;
  language?: string;
  timezone?: string;
}

export class ThemeValidator {
  private static readonly VALID_THEMES: ThemeType[] = ['light', 'dark', 'system'];
  private static readonly DEFAULT_THEME: ThemeType = 'system';

  /**
   * Validate a theme value
   */
  static validateTheme(theme: unknown): ThemeValidationResult {
    const result: ThemeValidationResult = {
      isValid: false,
      sanitizedTheme: this.DEFAULT_THEME,
      errors: [],
      warnings: []
    };

    // Check if theme is provided
    if (theme === null || theme === undefined) {
      result.warnings.push('Theme is null or undefined, using default');
      result.sanitizedTheme = this.DEFAULT_THEME;
      result.isValid = true;
      return result;
    }

    // Check if theme is a string
    if (typeof theme !== 'string') {
      result.errors.push(`Theme must be a string, got ${typeof theme}`);
      result.sanitizedTheme = this.DEFAULT_THEME;
      return result;
    }

    // Trim and lowercase for comparison
    const normalizedTheme = theme.trim().toLowerCase();

    // Check if theme is empty
    if (normalizedTheme === '') {
      result.warnings.push('Theme is empty string, using default');
      result.sanitizedTheme = this.DEFAULT_THEME;
      result.isValid = true;
      return result;
    }

    // Check if theme is valid
    if (!this.VALID_THEMES.includes(normalizedTheme as ThemeType)) {
      result.errors.push(`Invalid theme value: "${theme}". Valid themes are: ${this.VALID_THEMES.join(', ')}`);
      result.sanitizedTheme = this.DEFAULT_THEME;
      return result;
    }

    // Theme is valid
    result.isValid = true;
    result.sanitizedTheme = normalizedTheme as ThemeType;
    return result;
  }

  /**
   * Sanitize user preferences from database
   */
  static sanitizeUserPreferences(preferences: unknown): {
    sanitized: UserPreferences;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitized: UserPreferences = {};

    // Handle null/undefined preferences
    if (!preferences || typeof preferences !== 'object') {
      warnings.push('Preferences is not an object, using defaults');
      return { sanitized: { displaySettings: { theme: this.DEFAULT_THEME } }, errors, warnings };
    }

    const prefs = preferences as any;

    // Sanitize display settings
    if (prefs.displaySettings) {
      if (typeof prefs.displaySettings === 'object') {
        sanitized.displaySettings = {};

        // Validate theme
        if (prefs.displaySettings.theme !== undefined) {
          const themeValidation = ThemeValidator.validateTheme(prefs.displaySettings.theme);
          sanitized.displaySettings.theme = themeValidation.sanitizedTheme;
          errors.push(...themeValidation.errors);
          warnings.push(...themeValidation.warnings);
        } else {
          sanitized.displaySettings.theme = this.DEFAULT_THEME;
          warnings.push('No theme specified in displaySettings, using default');
        }

        // Validate dashboard layout
        if (prefs.displaySettings.dashboardLayout !== undefined) {
          if (typeof prefs.displaySettings.dashboardLayout === 'string') {
            const layout = prefs.displaySettings.dashboardLayout.trim();
            if (['compact', 'detailed'].includes(layout)) {
              sanitized.displaySettings.dashboardLayout = layout;
            } else {
              warnings.push(`Invalid dashboard layout: "${layout}", using default`);
            }
          } else {
            warnings.push('Dashboard layout must be a string, ignoring');
          }
        }
      } else {
        errors.push('displaySettings must be an object, ignoring');
        sanitized.displaySettings = { theme: this.DEFAULT_THEME };
      }
    } else {
      sanitized.displaySettings = { theme: this.DEFAULT_THEME };
      warnings.push('No displaySettings found, using defaults');
    }

    // Sanitize other preference fields (preserve them if they exist)
    if (prefs.notifications && typeof prefs.notifications === 'object') {
      sanitized.notifications = prefs.notifications;
    }

    if (typeof prefs.language === 'string' && prefs.language.trim() !== '') {
      sanitized.language = prefs.language.trim();
    }

    if (typeof prefs.timezone === 'string' && prefs.timezone.trim() !== '') {
      sanitized.timezone = prefs.timezone.trim();
    }

    return { sanitized, errors, warnings };
  }

  /**
   * Validate theme compatibility with current environment
   */
  static validateThemeCompatibility(theme: ThemeType): {
    isCompatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if running in browser environment
    if (typeof window === 'undefined') {
      issues.push('Not running in browser environment');
      return { isCompatible: false, issues, recommendations };
    }

    // Check for system theme support
    if (theme === 'system') {
      if (!window.matchMedia) {
        issues.push('matchMedia API not available for system theme detection');
        recommendations.push('Use explicit light or dark theme instead');
      } else {
        try {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          if (mediaQuery.media === 'not all') {
            issues.push('prefers-color-scheme media query not supported');
            recommendations.push('Use explicit light or dark theme instead');
          }
        } catch (error) {
          issues.push('Error testing system theme support');
          recommendations.push('Use explicit light or dark theme instead');
        }
      }
    }

    // Check for CSS custom properties support
    try {
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test-var', 'test');
      const hasCustomPropsSupport = testElement.style.getPropertyValue('--test-var') === 'test';
      
      if (!hasCustomPropsSupport) {
        issues.push('CSS custom properties not supported');
        recommendations.push('Theme system may not work properly in this browser');
      }
    } catch (error) {
      issues.push('Error testing CSS custom properties support');
    }

    // Check for theme CSS variables
    try {
      const testElement = document.createElement('div');
      testElement.setAttribute('data-theme', theme === 'system' ? 'light' : theme);
      testElement.style.display = 'none';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const hasThemeVars = computedStyle.getPropertyValue('--background') !== '';
      
      document.body.removeChild(testElement);
      
      if (!hasThemeVars) {
        issues.push(`Theme CSS variables not found for ${theme} theme`);
        recommendations.push('Check if theme CSS is properly loaded');
      }
    } catch (error) {
      issues.push('Error testing theme CSS variables');
    }

    return {
      isCompatible: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Get theme validation report
   */
  static getValidationReport(theme: ThemeType, preferences: unknown): {
    theme: ThemeValidationResult;
    preferences: ReturnType<typeof ThemeValidator.sanitizeUserPreferences>;
    compatibility: ReturnType<typeof ThemeValidator.validateThemeCompatibility>;
    overall: {
      isValid: boolean;
      criticalErrors: string[];
      warnings: string[];
    };
  } {
    const themeValidation = this.validateTheme(theme);
    const preferencesValidation = this.sanitizeUserPreferences(preferences);
    const compatibilityValidation = this.validateThemeCompatibility(themeValidation.sanitizedTheme);

    const criticalErrors = [
      ...themeValidation.errors,
      ...preferencesValidation.errors,
      ...compatibilityValidation.issues
    ];

    const warnings = [
      ...themeValidation.warnings,
      ...preferencesValidation.warnings,
      ...compatibilityValidation.recommendations
    ];

    return {
      theme: themeValidation,
      preferences: preferencesValidation,
      compatibility: compatibilityValidation,
      overall: {
        isValid: criticalErrors.length === 0,
        criticalErrors,
        warnings
      }
    };
  }
}

// Export convenience functions
export const validateTheme = ThemeValidator.validateTheme;
export const sanitizeUserPreferences = ThemeValidator.sanitizeUserPreferences;
export const validateThemeCompatibility = ThemeValidator.validateThemeCompatibility;
export const getThemeValidationReport = ThemeValidator.getValidationReport;