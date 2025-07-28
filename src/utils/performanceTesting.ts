/**
 * Performance testing utilities for React components
 */

export interface PerformanceTestResult {
  componentName: string;
  renderTime: number;
  memoryUsage: number;
  renderCount: number;
  timestamp: number;
}

export interface PerformanceBenchmark {
  name: string;
  target: number;
  unit: 'ms' | 'MB' | 'count';
  description: string;
}

/**
 * Performance benchmarks for different component types
 */
export const PERFORMANCE_BENCHMARKS: Record<string, PerformanceBenchmark[]> = {
  table: [
    { name: 'Initial Render', target: 100, unit: 'ms', description: 'Time to first render' },
    { name: 'Re-render', target: 16, unit: 'ms', description: 'Time for subsequent renders' },
    { name: 'Memory Usage', target: 50, unit: 'MB', description: 'Memory consumption' },
  ],
  dashboard: [
    { name: 'Initial Render', target: 200, unit: 'ms', description: 'Time to first render' },
    { name: 'Re-render', target: 32, unit: 'ms', description: 'Time for subsequent renders' },
    { name: 'Memory Usage', target: 100, unit: 'MB', description: 'Memory consumption' },
  ],
  virtualized: [
    { name: 'Initial Render', target: 50, unit: 'ms', description: 'Time to first render' },
    { name: 'Re-render', target: 8, unit: 'ms', description: 'Time for subsequent renders' },
    { name: 'Memory Usage', target: 30, unit: 'MB', description: 'Memory consumption' },
  ]
};

/**
 * Performance test runner for components
 */
export class PerformanceTester {
  private results: PerformanceTestResult[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupPerformanceObservers();
  }

  private setupPerformanceObservers() {
    if (typeof PerformanceObserver !== 'undefined') {
      // Observe render timing
      const renderObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('render')) {
            console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      renderObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(renderObserver);
    }
  }

  /**
   * Start a performance test for a component
   */
  startTest(componentName: string): string {
    const testId = `${componentName}-${Date.now()}`;
    
    if (typeof performance !== 'undefined') {
      performance.mark(`${testId}-start`);
    }
    
    return testId;
  }

  /**
   * End a performance test and record results
   */
  endTest(testId: string, componentName: string): PerformanceTestResult {
    const endTime = Date.now();
    let renderTime = 0;
    let memoryUsage = 0;

    if (typeof performance !== 'undefined') {
      performance.mark(`${testId}-end`);
      performance.measure(testId, `${testId}-start`, `${testId}-end`);
      
      const measure = performance.getEntriesByName(testId)[0];
      if (measure) {
        renderTime = measure.duration;
      }
    }

    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    const result: PerformanceTestResult = {
      componentName,
      renderTime,
      memoryUsage,
      renderCount: 1,
      timestamp: endTime
    };

    this.results.push(result);
    return result;
  }

  /**
   * Get performance results for a component
   */
  getResults(componentName?: string): PerformanceTestResult[] {
    if (componentName) {
      return this.results.filter(r => r.componentName === componentName);
    }
    return [...this.results];
  }

  /**
   * Clear all performance results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Generate a performance report
   */
  generateReport(componentName?: string): string {
    const results = this.getResults(componentName);
    
    if (results.length === 0) {
      return 'No performance data available';
    }

    const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
    const avgMemoryUsage = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length;
    const totalRenders = results.reduce((sum, r) => sum + r.renderCount, 0);

    return `
Performance Report${componentName ? ` for ${componentName}` : ''}
=====================================
Average Render Time: ${avgRenderTime.toFixed(2)}ms
Average Memory Usage: ${avgMemoryUsage.toFixed(2)}MB
Total Renders: ${totalRenders}
Test Count: ${results.length}
    `.trim();
  }

  /**
   * Check if performance meets benchmarks
   */
  checkBenchmarks(componentName: string, componentType: keyof typeof PERFORMANCE_BENCHMARKS): {
    passed: boolean;
    results: Array<{ benchmark: PerformanceBenchmark; actual: number; passed: boolean }>;
  } {
    const results = this.getResults(componentName);
    const benchmarks = PERFORMANCE_BENCHMARKS[componentType] || [];
    
    if (results.length === 0) {
      return { passed: false, results: [] };
    }

    const latest = results[results.length - 1];
    const benchmarkResults = benchmarks.map(benchmark => {
      let actual = 0;
      let passed = false;

      switch (benchmark.name) {
        case 'Initial Render':
        case 'Re-render':
          actual = latest.renderTime;
          passed = actual <= benchmark.target;
          break;
        case 'Memory Usage':
          actual = latest.memoryUsage;
          passed = actual <= benchmark.target;
          break;
      }

      return { benchmark, actual, passed };
    });

    const allPassed = benchmarkResults.every(r => r.passed);

    return { passed: allPassed, results: benchmarkResults };
  }

  /**
   * Cleanup performance observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Global performance tester instance
 */
export const performanceTester = new PerformanceTester();

/**
 * React hook for component performance testing
 */
export function usePerformanceTesting(componentName: string, componentType: keyof typeof PERFORMANCE_BENCHMARKS = 'table') {
  const [testResults, setTestResults] = React.useState<PerformanceTestResult[]>([]);
  const [benchmarkResults, setBenchmarkResults] = React.useState<{
    passed: boolean;
    results: Array<{ benchmark: PerformanceBenchmark; actual: number; passed: boolean }>;
  } | null>(null);

  const startTest = React.useCallback(() => {
    return performanceTester.startTest(componentName);
  }, [componentName]);

  const endTest = React.useCallback((testId: string) => {
    const result = performanceTester.endTest(testId, componentName);
    setTestResults(prev => [...prev, result]);
    
    // Check benchmarks
    const benchmarks = performanceTester.checkBenchmarks(componentName, componentType);
    setBenchmarkResults(benchmarks);
    
    return result;
  }, [componentName, componentType]);

  const clearResults = React.useCallback(() => {
    performanceTester.clearResults();
    setTestResults([]);
    setBenchmarkResults(null);
  }, []);

  const generateReport = React.useCallback(() => {
    return performanceTester.generateReport(componentName);
  }, [componentName]);

  return {
    testResults,
    benchmarkResults,
    startTest,
    endTest,
    clearResults,
    generateReport
  };
}

/**
 * Performance testing utilities for Jest tests
 */
export const testUtils = {
  /**
   * Test component render performance
   */
  async testRenderPerformance<T>(
    renderFn: () => T,
    maxRenderTime: number = 100
  ): Promise<{ result: T; renderTime: number; passed: boolean }> {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    return {
      result,
      renderTime,
      passed: renderTime <= maxRenderTime
    };
  },

  /**
   * Test component memory usage
   */
  testMemoryUsage(maxMemoryMB: number = 50): { memoryUsage: number; passed: boolean } {
    let memoryUsage = 0;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
    }
    
    return {
      memoryUsage,
      passed: memoryUsage <= maxMemoryMB
    };
  },

  /**
   * Create performance test data
   */
  createTestData(count: number): Array<{ id: number; name: string; value: number }> {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 1000
    }));
  }
};

// Fix missing React import
import React from 'react';