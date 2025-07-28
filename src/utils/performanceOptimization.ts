import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Performance optimization utilities for React components
 */

/**
 * Custom hook for debouncing values to prevent excessive re-renders
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * @param callback - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Custom hook for memoizing expensive calculations
 * @param factory - Function that returns the computed value
 * @param deps - Dependencies array
 * @returns Memoized value
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(() => {
    const startTime = performance.now();
    const result = factory();
    const endTime = performance.now();
    
    // Log expensive computations in development
    if (process.env.NODE_ENV === 'development' && endTime - startTime > 16) {
      console.warn(`Expensive computation took ${endTime - startTime}ms`);
    }
    
    return result;
  }, deps);
}

/**
 * Custom hook for stable callback references
 * @param callback - Callback function
 * @param deps - Dependencies array
 * @returns Stable callback reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Custom hook for intersection observer (useful for lazy loading)
 * @param options - Intersection observer options
 * @returns [ref, isIntersecting]
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Custom hook for measuring component render performance
 * @param componentName - Name of the component for logging
 * @returns Performance measurement functions
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    
    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = currentTime - lastRenderTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `${componentName} render #${renderCount.current} - ${timeSinceLastRender.toFixed(2)}ms since last render`
        );
      }
    }
    
    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    markRenderStart: () => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${componentName}-render-start`);
      }
    },
    markRenderEnd: () => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${componentName}-render-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      }
    }
  };
}

/**
 * Utility function for deep comparison of objects (use sparingly)
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns Whether objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Utility function for shallow comparison of objects
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns Whether objects are shallowly equal
 */
export function shallowEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

/**
 * Higher-order component for adding performance monitoring
 * @param WrappedComponent - Component to wrap
 * @param componentName - Name for performance tracking
 * @returns Enhanced component with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const EnhancedComponent = React.memo((props: P) => {
    const { markRenderStart, markRenderEnd } = useRenderPerformance(componentName);
    
    useEffect(() => {
      markRenderStart();
      return markRenderEnd;
    });
    
    return <WrappedComponent {...props} />;
  });
  
  EnhancedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return EnhancedComponent;
}

/**
 * Custom hook for virtual scrolling calculations
 * @param itemCount - Total number of items
 * @param itemHeight - Height of each item
 * @param containerHeight - Height of the container
 * @param scrollTop - Current scroll position
 * @returns Virtual scrolling calculations
 */
export function useVirtualScrolling(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
  return useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );
    
    const visibleItems = endIndex - startIndex + 1;
    const totalHeight = itemCount * itemHeight;
    const offsetY = startIndex * itemHeight;
    
    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY
    };
  }, [itemCount, itemHeight, containerHeight, scrollTop]);
}

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  /**
   * Mark the start of a performance measurement
   */
  markStart: (name: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${name}-start`);
    }
  },
  
  /**
   * Mark the end of a performance measurement and log the result
   */
  markEnd: (name: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
      }
    }
  },
  
  /**
   * Time a function execution
   */
  time: <T>(name: string, fn: () => T): T => {
    PerformanceMonitor.markStart(name);
    const result = fn();
    PerformanceMonitor.markEnd(name);
    return result;
  },
  
  /**
   * Time an async function execution
   */
  timeAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    PerformanceMonitor.markStart(name);
    const result = await fn();
    PerformanceMonitor.markEnd(name);
    return result;
  }
};

// Fix missing import
import { useState } from 'react';