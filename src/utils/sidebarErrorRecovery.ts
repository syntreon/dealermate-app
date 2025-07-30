import { sidebarStateService } from '@/services/sidebarStateService';
import type { SidebarMode } from '@/hooks/useSidebarStatePersistence';

/**
 * Sidebar Error Recovery Utilities
 * 
 * Provides error recovery mechanisms for sidebar state persistence failures
 */

// Error types
export enum SidebarErrorType {
  STORAGE_UNAVAILABLE = 'storage_unavailable',
  CORRUPTED_DATA = 'corrupted_data',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SYNC_FAILURE = 'sync_failure',
  UNKNOWN = 'unknown',
}

// Error recovery strategies
export enum RecoveryStrategy {
  FALLBACK_TO_DEFAULT = 'fallback_to_default',
  CLEAR_AND_RESET = 'clear_and_reset',
  RETRY_WITH_DELAY = 'retry_with_delay',
  DISABLE_PERSISTENCE = 'disable_persistence',
}

interface SidebarError {
  type: SidebarErrorType;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}

interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  fallbackMode?: SidebarMode;
  message: string;
}

/**
 * Sidebar Error Recovery Manager
 */
class SidebarErrorRecovery {
  private errorHistory: SidebarError[] = [];
  private maxErrorHistory = 10;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  /**
   * Log an error for tracking and analysis
   */
  logError(type: SidebarErrorType, message: string, context?: Record<string, any>): void {
    const error: SidebarError = {
      type,
      message,
      timestamp: Date.now(),
      context,
    };

    this.errorHistory.unshift(error);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Sidebar Error Recovery] ${type}: ${message}`, context);
    }
  }

  /**
   * Determine error type from exception
   */
  private determineErrorType(error: Error): SidebarErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('quota') || message.includes('storage')) {
      return SidebarErrorType.QUOTA_EXCEEDED;
    }
    
    if (message.includes('json') || message.includes('parse')) {
      return SidebarErrorType.CORRUPTED_DATA;
    }
    
    if (message.includes('storage') || message.includes('localstorage')) {
      return SidebarErrorType.STORAGE_UNAVAILABLE;
    }
    
    return SidebarErrorType.UNKNOWN;
  }

  /**
   * Attempt to recover from a sidebar error
   */
  async recoverFromError(error: Error, operation: string): Promise<RecoveryResult> {
    const errorType = this.determineErrorType(error);
    
    this.logError(errorType, error.message, { operation });

    // Check retry count
    const retryKey = `${errorType}_${operation}`;
    const currentRetries = this.retryAttempts.get(retryKey) || 0;

    switch (errorType) {
      case SidebarErrorType.STORAGE_UNAVAILABLE:
        return this.handleStorageUnavailable();

      case SidebarErrorType.CORRUPTED_DATA:
        return this.handleCorruptedData();

      case SidebarErrorType.QUOTA_EXCEEDED:
        return this.handleQuotaExceeded();

      case SidebarErrorType.SYNC_FAILURE:
        if (currentRetries < this.maxRetries) {
          return this.handleSyncFailure(retryKey, currentRetries);
        }
        return this.fallbackToDefault('Max sync retries exceeded');

      default:
        return this.handleUnknownError(error);
    }
  }

  /**
   * Handle storage unavailable error
   */
  private handleStorageUnavailable(): RecoveryResult {
    return {
      success: true,
      strategy: RecoveryStrategy.DISABLE_PERSISTENCE,
      fallbackMode: 'collapsed',
      message: 'Storage unavailable - running without persistence',
    };
  }

  /**
   * Handle corrupted data error
   */
  private handleCorruptedData(): RecoveryResult {
    try {
      // Clear corrupted data
      sidebarStateService.resetAllData();
      
      return {
        success: true,
        strategy: RecoveryStrategy.CLEAR_AND_RESET,
        fallbackMode: 'collapsed',
        message: 'Corrupted data cleared - reset to defaults',
      };
    } catch (clearError) {
      return this.fallbackToDefault('Failed to clear corrupted data');
    }
  }

  /**
   * Handle quota exceeded error
   */
  private handleQuotaExceeded(): RecoveryResult {
    try {
      // Try to free up space by clearing old data
      this.clearOldData();
      
      return {
        success: true,
        strategy: RecoveryStrategy.CLEAR_AND_RESET,
        fallbackMode: 'collapsed',
        message: 'Storage quota exceeded - cleared old data',
      };
    } catch (clearError) {
      return this.fallbackToDefault('Failed to clear storage quota');
    }
  }

  /**
   * Handle sync failure with retry
   */
  private async handleSyncFailure(retryKey: string, currentRetries: number): Promise<RecoveryResult> {
    this.retryAttempts.set(retryKey, currentRetries + 1);
    
    // Wait before retry (exponential backoff)
    const delay = Math.pow(2, currentRetries) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      success: true,
      strategy: RecoveryStrategy.RETRY_WITH_DELAY,
      message: `Retrying sync operation (attempt ${currentRetries + 1})`,
    };
  }

  /**
   * Handle unknown error
   */
  private handleUnknownError(error: Error): RecoveryResult {
    return this.fallbackToDefault(`Unknown error: ${error.message}`);
  }

  /**
   * Fallback to default state
   */
  private fallbackToDefault(reason: string): RecoveryResult {
    return {
      success: true,
      strategy: RecoveryStrategy.FALLBACK_TO_DEFAULT,
      fallbackMode: 'collapsed',
      message: `Fallback to default: ${reason}`,
    };
  }

  /**
   * Clear old data to free up storage space
   */
  private clearOldData(): void {
    try {
      // Clear old error logs
      this.errorHistory = [];
      
      // Reset retry attempts
      this.retryAttempts.clear();
      
      // Clear any other old data from localStorage
      const keysToCheck = [
        'admin-sidebar-analytics',
        'admin-sidebar-preferences',
      ];
      
      keysToCheck.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            // Remove data older than 7 days
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parsed.timestamp && parsed.timestamp < weekAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear old data:', error);
    }
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): SidebarError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  /**
   * Check if system is in a healthy state
   */
  isHealthy(): boolean {
    // Consider unhealthy if too many recent errors
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp < 5 * 60 * 1000 // 5 minutes
    );
    
    return recentErrors.length < 3;
  }

  /**
   * Get recovery recommendations
   */
  getRecoveryRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.isHealthy()) {
      recommendations.push('System experiencing frequent errors - consider clearing all data');
    }
    
    const storageErrors = this.errorHistory.filter(
      error => error.type === SidebarErrorType.STORAGE_UNAVAILABLE
    );
    
    if (storageErrors.length > 0) {
      recommendations.push('Storage issues detected - check browser settings and available space');
    }
    
    const quotaErrors = this.errorHistory.filter(
      error => error.type === SidebarErrorType.QUOTA_EXCEEDED
    );
    
    if (quotaErrors.length > 0) {
      recommendations.push('Storage quota exceeded - clear browser data or use incognito mode');
    }
    
    return recommendations;
  }

  /**
   * Export error data for debugging
   */
  exportErrorData(): string {
    return JSON.stringify({
      errorHistory: this.errorHistory,
      retryAttempts: Array.from(this.retryAttempts.entries()),
      isHealthy: this.isHealthy(),
      recommendations: this.getRecoveryRecommendations(),
      exportedAt: Date.now(),
    }, null, 2);
  }
}

// Create singleton instance
export const sidebarErrorRecovery = new SidebarErrorRecovery();

/**
 * Wrapper function for safe sidebar operations with error recovery
 */
export async function withErrorRecovery<T>(
  operation: () => T | Promise<T>,
  operationName: string,
  fallbackValue: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const recovery = await sidebarErrorRecovery.recoverFromError(
      error instanceof Error ? error : new Error(String(error)),
      operationName
    );
    
    if (recovery.success) {
      console.info(`[Sidebar Recovery] ${recovery.message}`);
      
      // If we have a fallback mode, return it
      if (recovery.fallbackMode) {
        return { mode: recovery.fallbackMode } as T;
      }
    }
    
    return fallbackValue;
  }
}

export default sidebarErrorRecovery;