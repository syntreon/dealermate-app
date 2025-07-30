import type { SidebarMode, SidebarState } from '@/hooks/useSidebarStatePersistence';

// Storage keys
const STORAGE_KEYS = {
  SIDEBAR_STATE: 'admin-sidebar-state',
  SIDEBAR_PREFERENCES: 'admin-sidebar-preferences',
  SIDEBAR_ANALYTICS: 'admin-sidebar-analytics',
} as const;

// Analytics data structure
interface SidebarAnalytics {
  modeUsage: Record<SidebarMode, number>;
  sessionCount: number;
  lastUsed: number;
  totalInteractions: number;
}

// User preferences
interface SidebarPreferences {
  rememberState: boolean;
  defaultMode: SidebarMode;
  hoverDelay: number;
  transitionSpeed: 'fast' | 'normal' | 'slow';
  autoCollapse: boolean;
  autoCollapseDelay: number;
}

// Default preferences
const DEFAULT_PREFERENCES: SidebarPreferences = {
  rememberState: true,
  defaultMode: 'collapsed',
  hoverDelay: 150,
  transitionSpeed: 'normal',
  autoCollapse: false,
  autoCollapseDelay: 30000, // 30 seconds
};

// Default analytics
const DEFAULT_ANALYTICS: SidebarAnalytics = {
  modeUsage: {
    expanded: 0,
    collapsed: 0,
    'expand-on-hover': 0,
  },
  sessionCount: 0,
  lastUsed: Date.now(),
  totalInteractions: 0,
};

/**
 * Sidebar State Service
 * 
 * Provides comprehensive state management for the admin sidebar including:
 * - State persistence across browser sessions
 * - User preferences management
 * - Usage analytics tracking
 * - Error recovery mechanisms
 * - Cross-tab synchronization
 */
class SidebarStateService {
  private storageAvailable: boolean;
  private syncListeners: Set<(state: SidebarState) => void> = new Set();

  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
    this.initializeCrossTabSync();
    this.incrementSessionCount();
  }

  /**
   * Check if localStorage is available
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = '__sidebar_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn('localStorage is not available - sidebar state will not persist');
      return false;
    }
  }

  /**
   * Initialize cross-tab synchronization
   */
  private initializeCrossTabSync(): void {
    if (!this.storageAvailable) return;

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.SIDEBAR_STATE && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          this.notifySyncListeners(newState);
        } catch (error) {
          console.warn('Failed to sync sidebar state across tabs:', error);
        }
      }
    });
  }

  /**
   * Increment session count for analytics
   */
  private incrementSessionCount(): void {
    if (!this.storageAvailable) return;

    try {
      const analytics = this.getAnalytics();
      analytics.sessionCount += 1;
      analytics.lastUsed = Date.now();
      this.saveAnalytics(analytics);
    } catch (error) {
      console.warn('Failed to increment session count:', error);
    }
  }

  /**
   * Save sidebar state to localStorage
   */
  saveState(state: SidebarState): boolean {
    if (!this.storageAvailable) return false;

    try {
      const dataToSave = {
        mode: state.mode,
        timestamp: Date.now(),
        version: '1.1',
        sessionId: this.getSessionId(),
      };

      localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify(dataToSave));
      
      // Track usage analytics
      this.trackModeUsage(state.mode);
      
      return true;
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
      return false;
    }
  }

  /**
   * Load sidebar state from localStorage
   */
  loadState(): Partial<SidebarState> | null {
    if (!this.storageAvailable) return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      
      // Validate data structure
      if (!this.validateStateData(parsed)) {
        this.clearState();
        return null;
      }

      // Check if data is expired (30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (parsed.timestamp && parsed.timestamp < thirtyDaysAgo) {
        this.clearState();
        return null;
      }

      return {
        mode: parsed.mode,
      };
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
      this.clearState(); // Clean up corrupted data
      return null;
    }
  }

  /**
   * Validate state data structure
   */
  private validateStateData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const validModes: SidebarMode[] = ['expanded', 'collapsed', 'expand-on-hover'];
    return validModes.includes(data.mode);
  }

  /**
   * Clear stored state
   */
  clearState(): boolean {
    if (!this.storageAvailable) return false;

    try {
      localStorage.removeItem(STORAGE_KEYS.SIDEBAR_STATE);
      return true;
    } catch (error) {
      console.error('Failed to clear sidebar state:', error);
      return false;
    }
  }

  /**
   * Save user preferences
   */
  savePreferences(preferences: Partial<SidebarPreferences>): boolean {
    if (!this.storageAvailable) return false;

    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_PREFERENCES, JSON.stringify({
        ...updated,
        timestamp: Date.now(),
        version: '1.0',
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to save sidebar preferences:', error);
      return false;
    }
  }

  /**
   * Load user preferences
   */
  getPreferences(): SidebarPreferences {
    if (!this.storageAvailable) return DEFAULT_PREFERENCES;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_PREFERENCES);
      if (!saved) return DEFAULT_PREFERENCES;

      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
      console.warn('Failed to load sidebar preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Track mode usage for analytics
   */
  private trackModeUsage(mode: SidebarMode): void {
    if (!this.storageAvailable) return;

    try {
      const analytics = this.getAnalytics();
      analytics.modeUsage[mode] += 1;
      analytics.totalInteractions += 1;
      analytics.lastUsed = Date.now();
      this.saveAnalytics(analytics);
    } catch (error) {
      console.warn('Failed to track mode usage:', error);
    }
  }

  /**
   * Get usage analytics
   */
  getAnalytics(): SidebarAnalytics {
    if (!this.storageAvailable) return DEFAULT_ANALYTICS;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_ANALYTICS);
      if (!saved) return DEFAULT_ANALYTICS;

      const parsed = JSON.parse(saved);
      return { ...DEFAULT_ANALYTICS, ...parsed };
    } catch (error) {
      console.warn('Failed to load sidebar analytics:', error);
      return DEFAULT_ANALYTICS;
    }
  }

  /**
   * Save analytics data
   */
  private saveAnalytics(analytics: SidebarAnalytics): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_ANALYTICS, JSON.stringify({
        ...analytics,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save sidebar analytics:', error);
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    const key = '__sidebar_session_id__';
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        sessionStorage.setItem(key, sessionId);
      } catch {
        // Fallback if sessionStorage is not available
        sessionId = `fallback_${Date.now()}`;
      }
    }
    
    return sessionId;
  }

  /**
   * Add listener for cross-tab synchronization
   */
  addSyncListener(listener: (state: SidebarState) => void): () => void {
    this.syncListeners.add(listener);
    
    // Return cleanup function
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  /**
   * Notify sync listeners of state changes
   */
  private notifySyncListeners(state: SidebarState): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.warn('Error in sidebar sync listener:', error);
      }
    });
  }

  /**
   * Reset all sidebar data (useful for debugging or user reset)
   */
  resetAllData(): boolean {
    if (!this.storageAvailable) return false;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Also clear session storage
      try {
        sessionStorage.removeItem('__sidebar_session_id__');
      } catch {
        // Ignore if sessionStorage is not available
      }
      
      return true;
    } catch (error) {
      console.error('Failed to reset sidebar data:', error);
      return false;
    }
  }

  /**
   * Get diagnostic information
   */
  getDiagnostics() {
    return {
      storageAvailable: this.storageAvailable,
      sessionId: this.getSessionId(),
      preferences: this.getPreferences(),
      analytics: this.getAnalytics(),
      currentState: this.loadState(),
      syncListeners: this.syncListeners.size,
    };
  }

  /**
   * Export all sidebar data (for backup or migration)
   */
  exportData() {
    if (!this.storageAvailable) return null;

    try {
      const data = {
        state: this.loadState(),
        preferences: this.getPreferences(),
        analytics: this.getAnalytics(),
        exportedAt: Date.now(),
        version: '1.0',
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export sidebar data:', error);
      return null;
    }
  }

  /**
   * Import sidebar data (for backup restoration or migration)
   */
  importData(jsonData: string): boolean {
    if (!this.storageAvailable) return false;

    try {
      const data = JSON.parse(jsonData);
      
      // Validate import data
      if (!data || typeof data !== 'object' || !data.version) {
        throw new Error('Invalid import data format');
      }

      // Import preferences
      if (data.preferences) {
        this.savePreferences(data.preferences);
      }

      // Import state
      if (data.state && data.state.mode) {
        this.saveState({
          mode: data.state.mode,
          isHovered: false,
          width: data.state.mode === 'expanded' ? 256 : 64,
          isTransitioning: false,
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to import sidebar data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const sidebarStateService = new SidebarStateService();

// Export types for use in other files
export type { SidebarPreferences, SidebarAnalytics };

export default sidebarStateService;