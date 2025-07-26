import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/hooks/useAuthSession';
import { themeRecoveryManager } from '@/utils/themeRecovery';
import { ThemeValidator, sanitizeUserPreferences } from '@/utils/themeValidation';
import { themePerformanceMonitor } from '@/utils/themePerformance';
// Removed smoothThemeChange import for instant theme switching
import { themeBackgroundSync } from '@/utils/themeBackgroundSync';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeChangeEvent {
  theme: ThemeType;
  source: 'topbar' | 'settings' | 'system';
  timestamp: Date;
}

class ThemeService {
  private listeners: ((event: ThemeChangeEvent) => void)[] = [];
  private pendingUpdates = new Map<string, Promise<void>>();
  private retryAttempts = new Map<string, number>();
  private themeCache = new Map<string, { theme: ThemeType; timestamp: Date }>();
  private debouncedUpdates = new Map<string, NodeJS.Timeout>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly DEBOUNCE_DELAY = 500; // 500ms debounce

  /**
   * Subscribe to theme change events
   */
  subscribe(listener: (event: ThemeChangeEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit theme change event to all listeners
   */
  private emit(event: ThemeChangeEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }

  /**
   * Update theme instantly with background database sync
   */
  updateTheme(
    userId: string,
    theme: ThemeType,
    source: 'topbar' | 'settings' | 'system',
    currentUser: UserData,
    onUserUpdate?: (updatedUser: UserData) => void,
    setNextTheme?: (theme: ThemeType) => void
  ): void {
    // Validate theme before processing
    const validation = ThemeValidator.validateTheme(theme);
    if (!validation.isValid) {
      console.error(`Theme validation failed:`, validation.errors);
      return; // Don't throw, just return silently
    }

    const sanitizedTheme = validation.sanitizedTheme;

    try {
      // 1. Apply theme to UI INSTANTLY
      if (setNextTheme) {
        setNextTheme(sanitizedTheme);
      }

      // 2. Update cache immediately
      this.themeCache.set(userId, {
        theme: sanitizedTheme,
        timestamp: new Date()
      });

      // 3. Emit theme change event immediately
      this.emit({
        theme: sanitizedTheme,
        source,
        timestamp: new Date()
      });

      // 4. Update user context immediately (optimistic)
      if (onUserUpdate) {
        const { sanitized: currentSanitized } = sanitizeUserPreferences(currentUser.preferences);
        const updatedPreferences = {
          ...currentSanitized,
          displaySettings: {
            ...(currentSanitized.displaySettings || {}),
            theme: sanitizedTheme
          }
        };

        const updatedUser = {
          ...currentUser,
          preferences: updatedPreferences
        };
        onUserUpdate(updatedUser);
      }

      // 5. Background database sync (non-blocking)
      themeBackgroundSync.saveThemePreference(userId, sanitizedTheme);
      
      console.log(`Theme updated instantly: ${sanitizedTheme}`);

    } catch (error) {
      console.error('Instant theme update failed:', error);
      // Don't throw - just log the error and continue
    }
  }

// Removed complex theme update methods - using instant update only

  /**
   * Internal method to perform theme update with debounced database persistence
   */
  private async _performThemeUpdateWithDebounce(
    userId: string,
    theme: ThemeType,
    source: 'topbar' | 'settings' | 'system',
    currentUser: UserData,
    onUserUpdate?: (updatedUser: UserData) => void,
    setNextTheme?: (theme: ThemeType) => void,
    debounceKey: string
  ): Promise<void> {
    try {
      // Apply theme immediately to UI (optimistic update) - non-blocking
      if (setNextTheme) {
        // Don't await the transition - let it happen in background
        smoothThemeChange(() => {
          setNextTheme(theme);
        }, {
          duration: 300,
          onStart: () => {
            console.log(`Starting theme transition to ${theme}`);
          },
          onComplete: () => {
            console.log(`Theme transition to ${theme} completed`);
          }
        }).catch(error => {
          console.error('Theme transition failed:', error);
        });
      }

      // Sanitize current preferences and prepare updated preferences
      const { sanitized: currentSanitized } = sanitizeUserPreferences(currentUser.preferences);
      const updatedPreferences = {
        ...currentSanitized,
        displaySettings: {
          ...(currentSanitized.displaySettings || {}),
          theme: theme
        }
      };

      // Optimistic update - update user context immediately
      if (onUserUpdate) {
        const updatedUser = {
          ...currentUser,
          preferences: updatedPreferences
        };
        onUserUpdate(updatedUser);
      }

      // Update cache immediately
      this.themeCache.set(userId, {
        theme,
        timestamp: new Date()
      });

      // Emit theme change event immediately
      this.emit({
        theme,
        source,
        timestamp: new Date()
      });

      // Use background sync for database persistence (much faster)
      themeBackgroundSync.saveThemePreference(userId, theme);
      
      console.log(`Theme preference queued for background sync: ${theme}`);

    } catch (error) {
      console.error('Theme update failed:', error);
      
      // Attempt theme recovery
      try {
        const recoveredTheme = await themeRecoveryManager.recoverTheme(
          userId,
          theme,
          error as Error,
          {
            onRecovery: (recoveredTheme) => {
              console.log(`Theme recovered successfully: ${recoveredTheme}`);
              if (setNextTheme) {
                setNextTheme(recoveredTheme);
              }
            },
            onFailure: (recoveryError) => {
              console.error('Theme recovery failed:', recoveryError);
            }
          }
        );

        // Update cache with recovered theme
        this.themeCache.set(userId, {
          theme: recoveredTheme,
          timestamp: new Date()
        });

        // Apply recovered theme
        if (setNextTheme) {
          setNextTheme(recoveredTheme);
        }

        // Update user context with recovered theme
        if (onUserUpdate) {
          const updatedPreferences = {
            ...currentUser.preferences,
            displaySettings: {
              ...(currentUser.preferences?.displaySettings || {}),
              theme: recoveredTheme
            }
          };
          
          const updatedUser = {
            ...currentUser,
            preferences: updatedPreferences
          };
          onUserUpdate(updatedUser);
        }

        // Emit recovery event
        this.emit({
          theme: recoveredTheme,
          source: 'system', // Mark as system recovery
          timestamp: new Date()
        });

      } catch (recoveryError) {
        // Recovery failed, revert to original theme
        const originalTheme = currentUser.preferences?.displaySettings?.theme || 'system';
        if (setNextTheme) {
          setNextTheme(originalTheme);
        }
        
        if (onUserUpdate) {
          onUserUpdate(currentUser);
        }

        throw new Error(`Theme update and recovery both failed: ${error}. Recovery error: ${recoveryError}`);
      }
    }
  }

  /**
   * Internal method to perform the actual theme update (legacy method for compatibility)
   */
  private async _performThemeUpdate(
    userId: string,
    theme: ThemeType,
    source: 'topbar' | 'settings' | 'system',
    currentUser: UserData,
    onUserUpdate?: (updatedUser: UserData) => void,
    setNextTheme?: (theme: ThemeType) => void
  ): Promise<void> {
    const updateKey = `${userId}-${theme}`;
    
    try {
      // Optimistic update - apply theme with smooth transition
      if (setNextTheme) {
        await smoothThemeChange(() => {
          setNextTheme(theme);
        }, {
          duration: 300,
          onStart: () => {
            console.log(`Starting theme transition to ${theme}`);
          },
          onComplete: () => {
            console.log(`Theme transition to ${theme} completed`);
          }
        });
      }

      // Sanitize current preferences and prepare updated preferences
      const { sanitized: currentSanitized } = sanitizeUserPreferences(currentUser.preferences);
      const updatedPreferences = {
        ...currentSanitized,
        displaySettings: {
          ...(currentSanitized.displaySettings || {}),
          theme: theme
        }
      };

      // Optimistic update - update user context immediately
      if (onUserUpdate) {
        const updatedUser = {
          ...currentUser,
          preferences: updatedPreferences
        };
        onUserUpdate(updatedUser);
      }

      // Update cache
      this.themeCache.set(userId, {
        theme,
        timestamp: new Date()
      });

      // Emit theme change event
      this.emit({
        theme,
        source,
        timestamp: new Date()
      });

      // Persist to database with retry logic
      await this._persistThemeToDatabase(userId, updatedPreferences, updateKey);

    } catch (error) {
      console.error('Theme update failed:', error);
      
      // Attempt theme recovery
      try {
        const recoveredTheme = await themeRecoveryManager.recoverTheme(
          userId,
          theme,
          error as Error,
          {
            onRecovery: (recoveredTheme) => {
              console.log(`Theme recovered successfully: ${recoveredTheme}`);
              if (setNextTheme) {
                setNextTheme(recoveredTheme);
              }
            },
            onFailure: (recoveryError) => {
              console.error('Theme recovery failed:', recoveryError);
            }
          }
        );

        // Update cache with recovered theme
        this.themeCache.set(userId, {
          theme: recoveredTheme,
          timestamp: new Date()
        });

        // Apply recovered theme
        if (setNextTheme) {
          setNextTheme(recoveredTheme);
        }

        // Update user context with recovered theme
        if (onUserUpdate) {
          const updatedPreferences = {
            ...currentUser.preferences,
            displaySettings: {
              ...(currentUser.preferences?.displaySettings || {}),
              theme: recoveredTheme
            }
          };
          
          const updatedUser = {
            ...currentUser,
            preferences: updatedPreferences
          };
          onUserUpdate(updatedUser);
        }

        // Emit recovery event
        this.emit({
          theme: recoveredTheme,
          source: 'system', // Mark as system recovery
          timestamp: new Date()
        });

      } catch (recoveryError) {
        // Recovery failed, revert to original theme
        const originalTheme = currentUser.preferences?.displaySettings?.theme || 'system';
        if (setNextTheme) {
          setNextTheme(originalTheme);
        }
        
        if (onUserUpdate) {
          onUserUpdate(currentUser);
        }

        throw new Error(`Theme update and recovery both failed: ${error}. Recovery error: ${recoveryError}`);
      }
    }
  }

  /**
   * Persist theme preference to database with retry logic
   */
  private async _persistThemeToDatabase(
    userId: string,
    preferences: any,
    updateKey: string
  ): Promise<void> {
    const endTiming = themePerformanceMonitor.startTiming('database-persist', { userId, updateKey });
    const currentRetries = this.retryAttempts.get(updateKey) || 0;

    try {
      const { error } = await supabase
        .from('users')
        .update({ preferences })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Success - reset retry count
      this.retryAttempts.delete(updateKey);
      endTiming();
    } catch (error) {
      console.error(`Database update failed (attempt ${currentRetries + 1}):`, error);

      if (currentRetries < this.MAX_RETRIES) {
        // Increment retry count
        this.retryAttempts.set(updateKey, currentRetries + 1);
        
        // Wait with exponential backoff
        const delay = this.RETRY_DELAY * Math.pow(2, currentRetries);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the database update
        return this._persistThemeToDatabase(userId, preferences, updateKey);
      } else {
        // Max retries exceeded
        endTiming();
        throw new Error(`Failed to persist theme after ${this.MAX_RETRIES} attempts: ${error}`);
      }
    }
  }

  /**
   * Get current theme from user preferences with validation and caching
   */
  getCurrentTheme(user: UserData): ThemeType {
    // Check cache first
    const cached = this.themeCache.get(user.id);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_DURATION) {
      return cached.theme;
    }

    // Check local storage for immediate access (faster than database)
    const localTheme = themeBackgroundSync.getThemePreference(user.id);
    if (localTheme) {
      // Update cache with local storage value
      this.themeCache.set(user.id, {
        theme: localTheme,
        timestamp: new Date()
      });
      return localTheme;
    }

    // Fallback to database preferences
    const { sanitized, errors, warnings } = sanitizeUserPreferences(user.preferences);
    
    // Log validation issues
    if (errors.length > 0) {
      console.error(`Theme validation errors for user ${user.id}:`, errors);
    }
    if (warnings.length > 0) {
      console.warn(`Theme validation warnings for user ${user.id}:`, warnings);
    }

    const validatedTheme = sanitized.displaySettings?.theme || 'system';

    // Update cache and local storage
    this.themeCache.set(user.id, {
      theme: validatedTheme,
      timestamp: new Date()
    });
    
    // Save to local storage for future fast access
    themeBackgroundSync.saveThemePreference(user.id, validatedTheme);

    return validatedTheme;
  }

  /**
   * Check if there are any pending theme updates for a user
   */
  hasPendingUpdates(userId: string): boolean {
    return Array.from(this.pendingUpdates.keys()).some(key => key.startsWith(userId));
  }

  /**
   * Clear all pending updates (useful for cleanup)
   */
  clearPendingUpdates(): void {
    this.pendingUpdates.clear();
    this.retryAttempts.clear();
    
    // Clear debounced updates
    this.debouncedUpdates.forEach(timeoutId => clearTimeout(timeoutId));
    this.debouncedUpdates.clear();
  }

  /**
   * Clear theme cache for a specific user or all users
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.themeCache.delete(userId);
    } else {
      this.themeCache.clear();
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; entries: Array<{ userId: string; theme: ThemeType; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.themeCache.entries()).map(([userId, data]) => ({
      userId,
      theme: data.theme,
      age: now - data.timestamp.getTime()
    }));

    return {
      size: this.themeCache.size,
      entries
    };
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [userId, data] of this.themeCache.entries()) {
      if ((now - data.timestamp.getTime()) >= this.CACHE_DURATION) {
        this.themeCache.delete(userId);
      }
    }
  }
}

// Export singleton instance
export const themeService = new ThemeService();