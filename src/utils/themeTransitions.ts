/**
 * Theme transition utilities for smooth theme changes
 */

interface TransitionOptions {
  duration?: number;
  easing?: string;
  onStart?: () => void;
  onComplete?: () => void;
}

class ThemeTransitionManager {
  private static instance: ThemeTransitionManager;
  private isTransitioning = false;
  private transitionQueue: (() => void)[] = [];

  static getInstance(): ThemeTransitionManager {
    if (!ThemeTransitionManager.instance) {
      ThemeTransitionManager.instance = new ThemeTransitionManager();
    }
    return ThemeTransitionManager.instance;
  }

  /**
   * Apply smooth theme transition
   */
  async applyThemeTransition(
    themeApplyFn: () => void,
    options: TransitionOptions = {}
  ): Promise<void> {
    const {
      duration = 150, // Reduced from 300ms to 150ms for faster transitions
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
      onStart,
      onComplete
    } = options;

    // If already transitioning, queue the transition
    if (this.isTransitioning) {
      return new Promise((resolve) => {
        this.transitionQueue.push(() => {
          this.applyThemeTransition(themeApplyFn, options).then(resolve);
        });
      });
    }

    this.isTransitioning = true;

    try {
      // Prepare for transition
      this.prepareTransition(duration, easing);
      
      if (onStart) {
        onStart();
      }

      // Apply theme change
      themeApplyFn();

      // Wait for transition to complete
      await this.waitForTransition(duration);

      if (onComplete) {
        onComplete();
      }

    } finally {
      this.isTransitioning = false;
      this.cleanupTransition();
      
      // Process next item in queue
      const nextTransition = this.transitionQueue.shift();
      if (nextTransition) {
        nextTransition();
      }
    }
  }

  /**
   * Prepare DOM for smooth transition (lightweight version)
   */
  private prepareTransition(duration: number, easing: string): void {
    // Skip heavy DOM operations for faster transitions
    // The CSS already has transitions defined, so we don't need to add more
    
    // Only add transition class if not already present
    if (!document.body.classList.contains('theme-transitioning')) {
      document.body.classList.add('theme-transitioning');
    }
  }

  /**
   * Wait for transition to complete (optimized)
   */
  private waitForTransition(duration: number): Promise<void> {
    return new Promise((resolve) => {
      // Reduced buffer for faster completion
      setTimeout(resolve, duration + 10);
    });
  }

  /**
   * Clean up after transition
   */
  private cleanupTransition(): void {
    document.body.classList.remove('theme-transitioning');
    this.enableConflictingAnimations();
  }

  /**
   * Disable animations that might conflict with theme transitions
   */
  private disableConflictingAnimations(): void {
    const elements = document.querySelectorAll('.animate-pulse, .animate-spin, .animate-bounce');
    elements.forEach(el => {
      el.classList.add('theme-transition-pause');
    });
  }

  /**
   * Re-enable animations after theme transition
   */
  private enableConflictingAnimations(): void {
    const elements = document.querySelectorAll('.theme-transition-pause');
    elements.forEach(el => {
      el.classList.remove('theme-transition-pause');
    });
  }

  /**
   * Optimize chart transitions
   */
  optimizeChartTransitions(): void {
    const chartElements = document.querySelectorAll('.recharts-wrapper');
    chartElements.forEach(chart => {
      const element = chart as HTMLElement;
      element.style.transition = 'background-color 0.2s ease-out, color 0.2s ease-out';
    });
  }

  /**
   * Check if currently transitioning
   */
  isCurrentlyTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get transition queue length
   */
  getQueueLength(): number {
    return this.transitionQueue.length;
  }

  /**
   * Clear transition queue
   */
  clearQueue(): void {
    this.transitionQueue = [];
  }
}

// Export singleton instance
export const themeTransitionManager = ThemeTransitionManager.getInstance();

// Utility function for smooth theme changes
export async function smoothThemeChange(
  themeApplyFn: () => void,
  options?: TransitionOptions
): Promise<void> {
  return themeTransitionManager.applyThemeTransition(themeApplyFn, options);
}

// React hook for theme transitions
export function useThemeTransition() {
  return {
    applyTransition: (themeApplyFn: () => void, options?: TransitionOptions) =>
      themeTransitionManager.applyThemeTransition(themeApplyFn, options),
    isTransitioning: () => themeTransitionManager.isCurrentlyTransitioning(),
    optimizeCharts: () => themeTransitionManager.optimizeChartTransitions(),
    queueLength: () => themeTransitionManager.getQueueLength(),
    clearQueue: () => themeTransitionManager.clearQueue()
  };
}

// Utility to test transition performance
export function testTransitionPerformance(): Promise<{
  duration: number;
  smoothness: 'excellent' | 'good' | 'poor';
  recommendations: string[];
}> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let frameCount = 0;
    let lastFrameTime = startTime;
    const frameTimes: number[] = [];

    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: fixed;
      top: -100px;
      left: -100px;
      width: 50px;
      height: 50px;
      background-color: hsl(var(--background));
      transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    document.body.appendChild(testElement);

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      frameTimes.push(frameTime);
      lastFrameTime = currentTime;
      frameCount++;

      if (currentTime - startTime < 350) {
        requestAnimationFrame(measureFrame);
      } else {
        // Test complete
        document.body.removeChild(testElement);
        
        const totalDuration = currentTime - startTime;
        const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
        const droppedFrames = frameTimes.filter(time => time > 20).length; // 20ms = 50fps threshold
        
        let smoothness: 'excellent' | 'good' | 'poor';
        const recommendations: string[] = [];
        
        if (droppedFrames === 0 && averageFrameTime < 16.67) {
          smoothness = 'excellent';
        } else if (droppedFrames < 3 && averageFrameTime < 20) {
          smoothness = 'good';
        } else {
          smoothness = 'poor';
          recommendations.push('Consider reducing transition duration');
          recommendations.push('Check for conflicting animations');
          recommendations.push('Optimize CSS selectors for theme transitions');
        }
        
        resolve({
          duration: totalDuration,
          smoothness,
          recommendations
        });
      }
    };

    // Trigger transition
    requestAnimationFrame(() => {
      testElement.style.backgroundColor = 'hsl(var(--primary))';
      requestAnimationFrame(measureFrame);
    });
  });
}