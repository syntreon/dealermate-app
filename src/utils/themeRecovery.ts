import { ThemeType } from '@/services/themeService';

/**
 * Theme recovery utilities for handling theme loading failures
 */

export interface ThemeRecoveryOptions {
  fallbackTheme?: ThemeType;
  maxRetries?: number;
  retryDelay?: number;
  onRecovery?: (recoveredTheme: ThemeType) => void;
  onFailure?: (error: Error) => void;
}

export class ThemeRecoveryManager {
  private static instance: ThemeRecoveryManager;
  private recoveryAttempts = new Map<string, number>();
  private readonly DEFAULT_FALLBACK: ThemeType = 'light';
  private readonly MAX_RECOVERY_ATTEMPTS = 3;

  static getInstance(): ThemeRecoveryManager {
    if (!ThemeRecoveryManager.instance) {
      ThemeRecoveryManager.instance = new ThemeRecoveryManager();
    }
    return ThemeRecoveryManager.instance;
  }

  /**
   * Attempt to recover from theme loading failure
   */
  async recoverTheme(
    userId: string,
    failedTheme: ThemeType,
    error: Error,
    options: ThemeRecoveryOptions = {}
  ): Promise<ThemeType> {
    const {
      fallbackTheme = this.DEFAULT_FALLBACK,
      maxRetries = this.MAX_RECOVERY_ATTEMPTS,
      retryDelay = 1000,
      onRecovery,
      onFailure
    } = options;

    const attemptKey = `${userId}-${failedTheme}`;
    const currentAttempts = this.recoveryAttempts.get(attemptKey) || 0;

    console.warn(`Theme recovery attempt ${currentAttempts + 1} for user ${userId}, theme ${failedTheme}:`, error);

    // If we've exceeded max retries, use fallback
    if (currentAttempts >= maxRetries) {
      console.error(`Max recovery attempts exceeded for theme ${failedTheme}, using fallback: ${fallbackTheme}`);
      this.recoveryAttempts.delete(attemptKey);
      
      if (onFailure) {
        onFailure(new Error(`Failed to recover theme ${failedTheme} after ${maxRetries} attempts`));
      }
      
      return fallbackTheme;
    }

    // Increment attempt counter
    this.recoveryAttempts.set(attemptKey, currentAttempts + 1);

    try {
      // Wait before retry
      if (currentAttempts > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, currentAttempts)));
      }

      // Try to detect system theme if the failed theme was 'system'
      if (failedTheme === 'system') {
        const systemTheme = this.detectSystemTheme();
        if (systemTheme) {
          console.log(`Successfully recovered system theme: ${systemTheme}`);
          this.recoveryAttempts.delete(attemptKey);
          
          if (onRecovery) {
            onRecovery(systemTheme);
          }
          
          return systemTheme;
        }
      }

      // For light/dark themes, try to apply them directly
      if (failedTheme === 'light' || failedTheme === 'dark') {
        // Test if we can apply the theme
        const testElement = document.createElement('div');
        testElement.setAttribute('data-theme', failedTheme);
        document.body.appendChild(testElement);
        
        // Check if theme was applied successfully
        const computedStyle = window.getComputedStyle(testElement);
        const hasThemeStyles = computedStyle.getPropertyValue('--background') !== '';
        
        document.body.removeChild(testElement);
        
        if (hasThemeStyles) {
          console.log(`Successfully recovered theme: ${failedTheme}`);
          this.recoveryAttempts.delete(attemptKey);
          
          if (onRecovery) {
            onRecovery(failedTheme);
          }
          
          return failedTheme;
        }
      }

      // If we get here, recovery failed, try again
      throw new Error(`Theme ${failedTheme} still not working after recovery attempt`);

    } catch (recoveryError) {
      console.error(`Recovery attempt ${currentAttempts + 1} failed:`, recoveryError);
      
      // Recursive retry
      return this.recoverTheme(userId, failedTheme, recoveryError as Error, options);
    }
  }

  /**
   * Detect system theme with enhanced error handling
   */
  private detectSystemTheme(): ThemeType | null {
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
      console.error('System theme detection failed:', error);
      return null;
    }
  }

  /**
   * Validate theme configuration
   */
  validateTheme(theme: ThemeType): boolean {
    try {
      // Check if theme value is valid
      if (!['light', 'dark', 'system'].includes(theme)) {
        return false;
      }

      // For system theme, check if detection is possible
      if (theme === 'system') {
        return this.detectSystemTheme() !== null;
      }

      // For light/dark themes, check if CSS variables are available
      const testElement = document.createElement('div');
      testElement.setAttribute('data-theme', theme);
      testElement.style.display = 'none';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const hasRequiredVars = computedStyle.getPropertyValue('--background') !== '';
      
      document.body.removeChild(testElement);
      
      return hasRequiredVars;
    } catch (error) {
      console.error('Theme validation failed:', error);
      return false;
    }
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): { activeRecoveries: number; totalAttempts: number } {
    const totalAttempts = Array.from(this.recoveryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0);
    
    return {
      activeRecoveries: this.recoveryAttempts.size,
      totalAttempts
    };
  }

  /**
   * Clear recovery attempts for a user
   */
  clearRecoveryAttempts(userId: string): void {
    const keysToDelete = Array.from(this.recoveryAttempts.keys()).filter(key => key.startsWith(userId));
    keysToDelete.forEach(key => this.recoveryAttempts.delete(key));
  }

  /**
   * Reset all recovery attempts
   */
  resetRecoveryAttempts(): void {
    this.recoveryAttempts.clear();
  }
}

// Export singleton instance
export const themeRecoveryManager = ThemeRecoveryManager.getInstance();