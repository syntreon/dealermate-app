/**
 * Error Recovery Service
 * Provides centralized error handling, recovery mechanisms, and error reporting
 */

interface ErrorContext {
  section: string;
  component: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

interface RecoveryStrategy {
  name: string;
  description: string;
  action: () => Promise<boolean>;
  priority: number;
}

class ErrorRecoveryService {
  private errorHistory: ErrorReport[] = [];
  private maxHistorySize = 50;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  /**
   * Report an error with context information
   */
  reportError(error: Error, context: Partial<ErrorContext>): ErrorReport {
    const fullContext: ErrorContext = {
      section: context.section || 'Unknown',
      component: context.component || 'Unknown',
      userId: context.userId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    const report: ErrorReport = {
      error,
      context: fullContext,
      severity: this.determineSeverity(error),
      recoverable: this.isRecoverable(error),
    };

    this.addToHistory(report);
    this.logError(report);

    // Report to external service if available
    this.reportToExternalService(report);

    return report;
  }

  /**
   * Get recovery strategies for a specific error
   */
  getRecoveryStrategies(error: Error, context: ErrorContext): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];

    // Network error strategies
    if (this.isNetworkError(error)) {
      strategies.push({
        name: 'retry-request',
        description: 'Retry the failed request',
        action: () => this.retryLastRequest(),
        priority: 1,
      });

      strategies.push({
        name: 'check-connection',
        description: 'Check internet connection',
        action: () => this.checkNetworkConnection(),
        priority: 2,
      });
    }

    // Database error strategies
    if (this.isDatabaseError(error)) {
      strategies.push({
        name: 'refresh-session',
        description: 'Refresh authentication session',
        action: () => this.refreshAuthSession(),
        priority: 1,
      });

      strategies.push({
        name: 'clear-cache',
        description: 'Clear local cache',
        action: () => this.clearLocalCache(),
        priority: 2,
      });
    }

    // Permission error strategies
    if (this.isPermissionError(error)) {
      strategies.push({
        name: 'refresh-permissions',
        description: 'Refresh user permissions',
        action: () => this.refreshUserPermissions(),
        priority: 1,
      });
    }

    // Generic strategies
    strategies.push({
      name: 'reload-component',
      description: 'Reload the current component',
      action: () => this.reloadComponent(context.component),
      priority: 3,
    });

    strategies.push({
      name: 'navigate-back',
      description: 'Navigate to previous page',
      action: () => this.navigateBack(),
      priority: 4,
    });

    strategies.push({
      name: 'reload-page',
      description: 'Reload the entire page',
      action: () => this.reloadPage(),
      priority: 5,
    });

    return strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Attempt automatic recovery for an error
   */
  async attemptRecovery(error: Error, context: ErrorContext): Promise<boolean> {
    const errorKey = this.getErrorKey(error, context);
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (attempts >= this.maxRetries) {
      console.warn('Max retry attempts reached for error:', error.message);
      return false;
    }

    this.retryAttempts.set(errorKey, attempts + 1);

    const strategies = this.getRecoveryStrategies(error, context);
    
    for (const strategy of strategies) {
      try {
        console.log(`Attempting recovery strategy: ${strategy.name}`);
        const success = await strategy.action();
        
        if (success) {
          console.log(`Recovery successful with strategy: ${strategy.name}`);
          this.retryAttempts.delete(errorKey);
          return true;
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
      }
    }

    return false;
  }

  /**
   * Get error statistics and patterns
   */
  getErrorStatistics() {
    const stats = {
      totalErrors: this.errorHistory.length,
      errorsBySeverity: {} as Record<string, number>,
      errorsBySection: {} as Record<string, number>,
      errorsByComponent: {} as Record<string, number>,
      recentErrors: this.errorHistory.slice(-10),
      mostCommonErrors: this.getMostCommonErrors(),
    };

    this.errorHistory.forEach(report => {
      stats.errorsBySeverity[report.severity] = (stats.errorsBySeverity[report.severity] || 0) + 1;
      stats.errorsBySection[report.context.section] = (stats.errorsBySection[report.context.section] || 0) + 1;
      stats.errorsByComponent[report.context.component] = (stats.errorsByComponent[report.context.component] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  // Private methods

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    
    if (message.includes('database') || message.includes('sql')) {
      return 'critical';
    }
    
    return 'low';
  }

  private isRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Non-recoverable errors
    if (message.includes('syntax') || message.includes('reference')) {
      return false;
    }
    
    // Recoverable errors
    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return true;
    }
    
    return true; // Assume recoverable by default
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('timeout');
  }

  private isDatabaseError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('database') || message.includes('sql') || message.includes('supabase');
  }

  private isPermissionError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden');
  }

  private getErrorKey(error: Error, context: ErrorContext): string {
    return `${context.section}-${context.component}-${error.name}-${error.message}`;
  }

  private addToHistory(report: ErrorReport): void {
    this.errorHistory.push(report);
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private logError(report: ErrorReport): void {
    const logLevel = report.severity === 'critical' ? 'error' : 
                    report.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel]('Error Report:', {
      error: report.error.message,
      section: report.context.section,
      component: report.context.component,
      severity: report.severity,
      recoverable: report.recoverable,
      timestamp: report.context.timestamp,
    });
  }

  private reportToExternalService(report: ErrorReport): void {
    // Report to external error tracking service if available
    if (typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.captureException(report.error, {
        tags: {
          section: report.context.section,
          component: report.context.component,
          severity: report.severity,
        },
        extra: report.context,
      });
    }
  }

  private getMostCommonErrors(): Array<{ message: string; count: number }> {
    const errorCounts = new Map<string, number>();
    
    this.errorHistory.forEach(report => {
      const key = report.error.message;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });
    
    return Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Recovery strategy implementations

  private async retryLastRequest(): Promise<boolean> {
    // This would need to be implemented based on your specific request handling
    console.log('Retrying last request...');
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  }

  private async checkNetworkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async refreshAuthSession(): Promise<boolean> {
    try {
      // This would integrate with your auth system
      console.log('Refreshing auth session...');
      return true;
    } catch {
      return false;
    }
  }

  private async clearLocalCache(): Promise<boolean> {
    try {
      localStorage.clear();
      sessionStorage.clear();
      return true;
    } catch {
      return false;
    }
  }

  private async refreshUserPermissions(): Promise<boolean> {
    try {
      // This would refresh user permissions from the server
      console.log('Refreshing user permissions...');
      return true;
    } catch {
      return false;
    }
  }

  private async reloadComponent(componentName: string): Promise<boolean> {
    try {
      console.log(`Reloading component: ${componentName}`);
      // This would trigger a component reload
      return true;
    } catch {
      return false;
    }
  }

  private async navigateBack(): Promise<boolean> {
    try {
      window.history.back();
      return true;
    } catch {
      return false;
    }
  }

  private async reloadPage(): Promise<boolean> {
    try {
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const errorRecoveryService = new ErrorRecoveryService();

// Export types for use in components
export type { ErrorContext, ErrorReport, RecoveryStrategy };