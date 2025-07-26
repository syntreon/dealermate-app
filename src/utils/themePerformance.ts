/**
 * Theme performance monitoring utilities
 */

interface PerformanceEntry {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  recentOperations: PerformanceEntry[];
  slowOperations: PerformanceEntry[];
}

class ThemePerformanceMonitor {
  private static instance: ThemePerformanceMonitor;
  private entries: PerformanceEntry[] = [];
  private readonly MAX_ENTRIES = 100;
  private readonly SLOW_THRESHOLD = 50; // ms - reduced threshold since we've optimized

  static getInstance(): ThemePerformanceMonitor {
    if (!ThemePerformanceMonitor.instance) {
      ThemePerformanceMonitor.instance = new ThemePerformanceMonitor();
    }
    return ThemePerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operation: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordEntry({
        operation,
        startTime,
        endTime,
        duration,
        metadata
      });
    };
  }

  /**
   * Record a performance entry
   */
  private recordEntry(entry: PerformanceEntry): void {
    this.entries.push(entry);
    
    // Keep only the most recent entries
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift();
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && entry.duration > this.SLOW_THRESHOLD) {
      console.warn(`Slow theme operation detected: ${entry.operation} took ${entry.duration.toFixed(2)}ms`, entry.metadata);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (this.entries.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        recentOperations: [],
        slowOperations: []
      };
    }

    const durations = this.entries.map(entry => entry.duration);
    const recentOperations = this.entries.slice(-10);
    const slowOperations = this.entries.filter(entry => entry.duration > this.SLOW_THRESHOLD);

    return {
      totalOperations: this.entries.length,
      averageDuration: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      recentOperations,
      slowOperations
    };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    status: 'excellent' | 'good' | 'moderate' | 'poor';
    summary: string;
    recommendations: string[];
    metrics: PerformanceMetrics;
  } {
    const metrics = this.getMetrics();
    
    let status: 'excellent' | 'good' | 'moderate' | 'poor';
    let summary: string;
    const recommendations: string[] = [];

    if (metrics.averageDuration < 50) {
      status = 'excellent';
      summary = 'Theme operations are performing excellently';
    } else if (metrics.averageDuration < 100) {
      status = 'good';
      summary = 'Theme operations are performing well';
    } else if (metrics.averageDuration < 300) {
      status = 'moderate';
      summary = 'Theme operations have moderate performance';
      recommendations.push('Consider optimizing theme-dependent calculations');
    } else {
      status = 'poor';
      summary = 'Theme operations are performing poorly';
      recommendations.push('Optimize theme service database operations');
      recommendations.push('Reduce unnecessary re-renders in components');
      recommendations.push('Consider implementing more aggressive caching');
    }

    if (metrics.slowOperations.length > metrics.totalOperations * 0.2) {
      recommendations.push('High number of slow operations detected - investigate bottlenecks');
    }

    return {
      status,
      summary,
      recommendations,
      metrics
    };
  }

  /**
   * Clear performance data
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Export performance data for analysis
   */
  exportData(): PerformanceEntry[] {
    return [...this.entries];
  }
}

// Export singleton instance
export const themePerformanceMonitor = ThemePerformanceMonitor.getInstance();

// Decorator for timing theme operations
export function timed(operation: string, metadata?: Record<string, any>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endTiming = themePerformanceMonitor.startTiming(operation, {
        ...metadata,
        method: propertyName,
        args: args.length
      });

      try {
        const result = await method.apply(this, args);
        return result;
      } finally {
        endTiming();
      }
    };

    return descriptor;
  };
}

// Utility function for manual timing
export function timeOperation<T>(
  operation: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const endTiming = themePerformanceMonitor.startTiming(operation, metadata);
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => endTiming());
  } else {
    endTiming();
    return Promise.resolve(result);
  }
}

// React hook for performance monitoring
export function useThemePerformanceMonitor() {
  return {
    getMetrics: () => themePerformanceMonitor.getMetrics(),
    getReport: () => themePerformanceMonitor.getPerformanceReport(),
    clear: () => themePerformanceMonitor.clear(),
    exportData: () => themePerformanceMonitor.exportData()
  };
}