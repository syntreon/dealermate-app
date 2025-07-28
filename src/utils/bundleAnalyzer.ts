/**
 * Bundle size monitoring and optimization utilities
 */

interface BundleMetrics {
  totalSize: number;
  chunkSizes: Record<string, number>;
  loadTimes: Record<string, number>;
  cacheHitRate: number;
}

class BundleAnalyzer {
  private metrics: BundleMetrics = {
    totalSize: 0,
    chunkSizes: {},
    loadTimes: {},
    cacheHitRate: 0,
  };

  private performanceObserver: PerformanceObserver | null = null;

  constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming);
          } else if (entry.entryType === 'resource') {
            this.trackResourceTiming(entry as PerformanceResourceTiming);
          }
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource'] 
      });
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming) {
    const loadTime = entry.loadEventEnd - entry.loadEventStart;
    this.metrics.loadTimes['initial'] = loadTime;
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Navigation timing:', {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        loadComplete: loadTime,
        firstPaint: entry.loadEventStart - entry.fetchStart,
      });
    }
  }

  private trackResourceTiming(entry: PerformanceResourceTiming) {
    if (entry.name.includes('.js') || entry.name.includes('.css')) {
      const resourceName = this.extractResourceName(entry.name);
      const loadTime = entry.responseEnd - entry.requestStart;
      
      this.metrics.loadTimes[resourceName] = loadTime;
      this.metrics.chunkSizes[resourceName] = entry.transferSize || 0;

      // Track cache hits
      if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
        this.updateCacheHitRate(true);
      } else {
        this.updateCacheHitRate(false);
      }
    }
  }

  private extractResourceName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('-')[0] || filename;
  }

  private updateCacheHitRate(isHit: boolean) {
    const totalRequests = Object.keys(this.metrics.loadTimes).length;
    const currentHits = this.metrics.cacheHitRate * (totalRequests - 1);
    this.metrics.cacheHitRate = (currentHits + (isHit ? 1 : 0)) / totalRequests;
  }

  /**
   * Get current bundle metrics
   */
  getMetrics(): BundleMetrics {
    return { ...this.metrics };
  }

  /**
   * Log bundle size warnings for large chunks
   */
  checkBundleSize() {
    const LARGE_CHUNK_THRESHOLD = 500 * 1024; // 500KB
    const SLOW_LOAD_THRESHOLD = 3000; // 3 seconds

    Object.entries(this.metrics.chunkSizes).forEach(([chunk, size]) => {
      if (size > LARGE_CHUNK_THRESHOLD) {
        console.warn(`Large chunk detected: ${chunk} (${(size / 1024).toFixed(2)}KB)`);
      }
    });

    Object.entries(this.metrics.loadTimes).forEach(([resource, time]) => {
      if (time > SLOW_LOAD_THRESHOLD) {
        console.warn(`Slow loading resource: ${resource} (${time.toFixed(2)}ms)`);
      }
    });

    if (this.metrics.cacheHitRate < 0.7) {
      console.warn(`Low cache hit rate: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%`);
    }
  }

  /**
   * Generate bundle optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    // Check for large chunks
    const largeChunks = Object.entries(metrics.chunkSizes)
      .filter(([, size]) => size > 300 * 1024)
      .map(([chunk]) => chunk);

    if (largeChunks.length > 0) {
      recommendations.push(
        `Consider splitting large chunks: ${largeChunks.join(', ')}`
      );
    }

    // Check for slow loading resources
    const slowResources = Object.entries(metrics.loadTimes)
      .filter(([, time]) => time > 2000)
      .map(([resource]) => resource);

    if (slowResources.length > 0) {
      recommendations.push(
        `Optimize slow loading resources: ${slowResources.join(', ')}`
      );
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < 0.8) {
      recommendations.push(
        'Improve caching strategy - consider longer cache headers for static assets'
      );
    }

    // Check total bundle size
    const totalSize = Object.values(metrics.chunkSizes).reduce((sum, size) => sum + size, 0);
    if (totalSize > 2 * 1024 * 1024) { // 2MB
      recommendations.push(
        'Total bundle size is large - consider implementing more aggressive code splitting'
      );
    }

    return recommendations;
  }

  /**
   * Clean up performance observer
   */
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
  }
}

// Create singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Development helper to log bundle metrics
if (process.env.NODE_ENV === 'development') {
  // Log metrics after initial load
  setTimeout(() => {
    bundleAnalyzer.checkBundleSize();
    const recommendations = bundleAnalyzer.getOptimizationRecommendations();
    if (recommendations.length > 0) {
      console.group('Bundle Optimization Recommendations:');
      recommendations.forEach(rec => console.log(`• ${rec}`));
      console.groupEnd();
    }
  }, 5000);
}

export default bundleAnalyzer;