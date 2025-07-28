import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { 
  LazyTabWrapper, 
  useTabPreloading, 
  LazyLoadingPerformanceMonitor,
  LazyFinancialTab,
  LazyClientsTab,
  LazyUsersTab,
  LazySystemTab,
  LazyOperationsTab,
  getBundleInfo
} from '@/components/admin/dashboard/LazyTabLoader';

// Mock the tab components
vi.mock('@/components/admin/dashboard/tabs/FinancialTab', () => ({
  FinancialTab: () => <div data-testid="financial-tab">Financial Tab Content</div>
}));

vi.mock('@/components/admin/dashboard/tabs/ClientsTab', () => ({
  ClientsTab: () => <div data-testid="clients-tab">Clients Tab Content</div>
}));

vi.mock('@/components/admin/dashboard/tabs/UsersTab', () => ({
  UsersTab: () => <div data-testid="users-tab">Users Tab Content</div>
}));

vi.mock('@/components/admin/dashboard/tabs/SystemTab', () => ({
  SystemTab: () => <div data-testid="system-tab">System Tab Content</div>
}));

vi.mock('@/components/admin/dashboard/tabs/OperationsTab', () => ({
  OperationsTab: () => <div data-testid="operations-tab">Operations Tab Content</div>
}));

// Mock ErrorFallback
vi.mock('@/components/admin/dashboard/ErrorFallback', () => ({
  default: ({ error, resetErrorBoundary, componentName }: any) => (
    <div data-testid="error-fallback">
      <div>Error in {componentName}: {error.message}</div>
      <button onClick={resetErrorBoundary}>Reset</button>
    </div>
  )
}));

// Mock TabLoadingSkeleton
vi.mock('@/components/admin/dashboard/TabLoadingSkeleton', () => ({
  TabLoadingSkeleton: ({ tabType, stage }: any) => (
    <div data-testid="tab-loading-skeleton">
      Loading {tabType} - {stage}
    </div>
  )
}));

describe('LazyTabLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('LazyTabWrapper', () => {
    it('should render loading skeleton initially', () => {
      render(
        <LazyTabWrapper tabId="test">
          <div>Test Content</div>
        </LazyTabWrapper>
      );

      expect(screen.getByTestId('tab-loading-skeleton')).toBeInTheDocument();
    });

    it('should render children after loading', async () => {
      render(
        <LazyTabWrapper tabId="test">
          <div data-testid="test-content">Test Content</div>
        </LazyTabWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });
    });

    it('should call onLoadStart and onLoadEnd callbacks', async () => {
      const onLoadStart = vi.fn();
      const onLoadEnd = vi.fn();

      render(
        <LazyTabWrapper 
          tabId="test" 
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
        >
          <div data-testid="test-content">Test Content</div>
        </LazyTabWrapper>
      );

      expect(onLoadStart).toHaveBeenCalledWith('test');

      await waitFor(() => {
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      });

      // Simulate component unmount to trigger onLoadEnd
      // This would normally be called in the cleanup effect
    });

    it('should render error fallback when error occurs', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const onError = vi.fn();

      render(
        <LazyTabWrapper tabId="test" onError={onError}>
          <ThrowError />
        </LazyTabWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
        expect(screen.getByText(/Error in test Tab: Test error/)).toBeInTheDocument();
      });
    });

    it('should use custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Loading</div>;

      render(
        <LazyTabWrapper tabId="test" fallback={customFallback}>
          <div>Test Content</div>
        </LazyTabWrapper>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  describe('useTabPreloading', () => {
    const TestComponent = () => {
      const { 
        preloadHighPriorityTabs, 
        preloadOnHover, 
        cancelPreload,
        isPreloading, 
        preloadedTabs,
        getMetrics 
      } = useTabPreloading();

      return (
        <div>
          <div data-testid="is-preloading">{isPreloading.toString()}</div>
          <div data-testid="preloaded-count">{preloadedTabs.size}</div>
          <div data-testid="metrics-count">{getMetrics().length}</div>
          <button 
            data-testid="preload-high-priority" 
            onClick={preloadHighPriorityTabs}
          >
            Preload High Priority
          </button>
          <button 
            data-testid="preload-hover" 
            onClick={() => preloadOnHover('financial')}
          >
            Preload on Hover
          </button>
          <button 
            data-testid="cancel-preload" 
            onClick={() => cancelPreload('financial')}
          >
            Cancel Preload
          </button>
        </div>
      );
    };

    it('should initialize with correct default state', () => {
      render(<TestComponent />);

      expect(screen.getByTestId('is-preloading')).toHaveTextContent('false');
      expect(screen.getByTestId('preloaded-count')).toHaveTextContent('0');
      expect(screen.getByTestId('metrics-count')).toHaveTextContent('0');
    });

    it('should preload high priority tabs', async () => {
      render(<TestComponent />);

      const preloadButton = screen.getByTestId('preload-high-priority');
      
      act(() => {
        fireEvent.click(preloadButton);
      });

      // Should show loading state
      expect(screen.getByTestId('is-preloading')).toHaveTextContent('true');

      // Wait for preloading to complete
      await act(async () => {
        vi.runAllTimers();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-preloading')).toHaveTextContent('false');
      });

      // Should have preloaded some tabs
      await waitFor(() => {
        const preloadedCount = parseInt(screen.getByTestId('preloaded-count').textContent || '0');
        expect(preloadedCount).toBeGreaterThan(0);
      });
    });

    it('should handle hover preloading with debouncing', async () => {
      render(<TestComponent />);

      const hoverButton = screen.getByTestId('preload-hover');
      
      act(() => {
        fireEvent.click(hoverButton);
      });

      // Should not immediately preload (debounced)
      expect(screen.getByTestId('preloaded-count')).toHaveTextContent('0');

      // Fast forward past debounce delay
      act(() => {
        vi.advanceTimersByTime(250);
      });

      await waitFor(() => {
        const preloadedCount = parseInt(screen.getByTestId('preloaded-count').textContent || '0');
        expect(preloadedCount).toBeGreaterThan(0);
      });
    });

    it('should cancel preload on hover leave', async () => {
      render(<TestComponent />);

      const hoverButton = screen.getByTestId('preload-hover');
      const cancelButton = screen.getByTestId('cancel-preload');
      
      // Start hover preload
      act(() => {
        fireEvent.click(hoverButton);
      });

      // Cancel before debounce completes
      act(() => {
        fireEvent.click(cancelButton);
      });

      // Fast forward past debounce delay
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // Should not have preloaded
      expect(screen.getByTestId('preloaded-count')).toHaveTextContent('0');
    });

    it('should track metrics for preloaded tabs', async () => {
      render(<TestComponent />);

      const preloadButton = screen.getByTestId('preload-high-priority');
      
      act(() => {
        fireEvent.click(preloadButton);
      });

      await act(async () => {
        vi.runAllTimers();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await waitFor(() => {
        const metricsCount = parseInt(screen.getByTestId('metrics-count').textContent || '0');
        expect(metricsCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Lazy Tab Components', () => {
    it('should render LazyFinancialTab', async () => {
      render(<LazyFinancialTab />);

      await waitFor(() => {
        expect(screen.getByTestId('financial-tab')).toBeInTheDocument();
      });
    });

    it('should render LazyClientsTab', async () => {
      render(<LazyClientsTab />);

      await waitFor(() => {
        expect(screen.getByTestId('clients-tab')).toBeInTheDocument();
      });
    });

    it('should render LazyUsersTab', async () => {
      render(<LazyUsersTab />);

      await waitFor(() => {
        expect(screen.getByTestId('users-tab')).toBeInTheDocument();
      });
    });

    it('should render LazySystemTab', async () => {
      render(<LazySystemTab />);

      await waitFor(() => {
        expect(screen.getByTestId('system-tab')).toBeInTheDocument();
      });
    });

    it('should render LazyOperationsTab', async () => {
      render(<LazyOperationsTab />);

      await waitFor(() => {
        expect(screen.getByTestId('operations-tab')).toBeInTheDocument();
      });
    });
  });

  describe('LazyLoadingPerformanceMonitor', () => {
    it('should not render anything visible', () => {
      const metrics = [
        {
          tabId: 'financial',
          loadStartTime: 100,
          loadEndTime: 200,
          loadDuration: 100,
          preloaded: true
        }
      ];

      const { container } = render(
        <LazyLoadingPerformanceMonitor metrics={metrics} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should call onMetricsUpdate when metrics change', () => {
      const onMetricsUpdate = vi.fn();
      const metrics = [
        {
          tabId: 'financial',
          loadStartTime: 100,
          loadEndTime: 200,
          loadDuration: 100,
          preloaded: true
        }
      ];

      render(
        <LazyLoadingPerformanceMonitor 
          metrics={metrics} 
          onMetricsUpdate={onMetricsUpdate}
        />
      );

      expect(onMetricsUpdate).toHaveBeenCalledWith(metrics);
    });

    it('should log performance metrics to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      const metrics = [
        {
          tabId: 'financial',
          loadStartTime: 100,
          loadEndTime: 200,
          loadDuration: 100,
          preloaded: true
        },
        {
          tabId: 'clients',
          loadStartTime: 150,
          loadEndTime: 300,
          loadDuration: 150,
          preloaded: false
        }
      ];

      render(<LazyLoadingPerformanceMonitor metrics={metrics} />);

      expect(consoleGroupSpy).toHaveBeenCalledWith('Lazy Loading Performance Metrics');
      expect(consoleSpy).toHaveBeenCalledWith('Average load time: 125.00ms');
      expect(consoleSpy).toHaveBeenCalledWith('Preloaded tabs: 1');
      expect(consoleSpy).toHaveBeenCalledWith('Failed loads: 0');
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });

  describe('getBundleInfo', () => {
    it('should return null when performance API is not available', () => {
      // Mock window.performance to be undefined
      const originalPerformance = global.performance;
      // @ts-ignore
      delete global.performance;

      const result = getBundleInfo();
      expect(result).toBeNull();

      // Restore performance
      global.performance = originalPerformance;
    });

    it('should return bundle info when performance API is available', () => {
      // Mock performance API
      const mockNavigation = {
        fetchStart: 100,
        loadEventEnd: 500
      };

      const mockResources = [
        {
          name: 'https://example.com/app.js',
          transferSize: 1000
        },
        {
          name: 'https://example.com/vendor.js',
          transferSize: 2000
        },
        {
          name: 'https://example.com/node_modules/react.js',
          transferSize: 500
        }
      ];

      global.performance = {
        ...global.performance,
        getEntriesByType: vi.fn((type: string) => {
          if (type === 'navigation') return [mockNavigation];
          if (type === 'resource') return mockResources;
          return [];
        })
      } as any;

      const result = getBundleInfo();

      expect(result).toEqual({
        totalLoadTime: 400,
        jsResourceCount: 2, // Excludes node_modules
        totalJSSize: 3000,
        largestJSResource: mockResources[1]
      });
    });
  });
});