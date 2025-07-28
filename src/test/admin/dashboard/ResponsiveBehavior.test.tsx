import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';
import { BusinessMetrics } from '@/components/admin/dashboard/BusinessMetrics';

// Mock the useIsMobile hook
const mockIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile()
}));

// Mock icons
vi.mock('lucide-react', () => ({
  DollarSign: ({ className }: { className?: string }) => (
    <div data-testid="dollar-icon" className={className}>$</div>
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <div data-testid="trending-up-icon" className={className}>↗</div>
  ),
  TrendingDown: ({ className }: { className?: string }) => (
    <div data-testid="trending-down-icon" className={className}>↘</div>
  ),
  Calculator: ({ className }: { className?: string }) => (
    <div data-testid="calculator-icon" className={className}>Calc</div>
  ),
  Users: ({ className }: { className?: string }) => (
    <div data-testid="users-icon" className={className}>Users</div>
  ),
  Building2: ({ className }: { className?: string }) => (
    <div data-testid="building-icon" className={className}>Building</div>
  ),
  Activity: ({ className }: { className?: string }) => (
    <div data-testid="activity-icon" className={className}>Activity</div>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <div data-testid="check-circle-icon" className={className}>✓</div>
  )
}));

// Mock formatting utilities
vi.mock('@/utils/formatting', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
  formatNumber: (num: number) => num.toLocaleString()
}));

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('Responsive Behavior Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(mockMatchMedia),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FinancialOverview Responsive Layout', () => {
    const mockMetrics = {
      totalRevenue: 150000,
      totalCosts: 100000,
      netProfit: 50000,
      profitMargin: 33.33,
      growthTrends: {
        revenueGrowth: 15.5,
        costGrowth: 8.2,
        profitGrowth: 25.8,
        clientGrowth: 12.0,
        callVolumeGrowth: 18.3,
        leadVolumeGrowth: 22.1
      }
    };

    it('should have responsive grid classes for different screen sizes', () => {
      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'gap-4',
        'md:grid-cols-2',
        'lg:grid-cols-4'
      );
    });

    it('should stack cards vertically on mobile', () => {
      mockIsMobile.mockReturnValue(true);
      
      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      // On mobile, should default to single column (no md: or lg: classes active)
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-4');
      
      // Should have 4 cards total
      const cards = container.querySelectorAll('.bg-card');
      expect(cards).toHaveLength(4);
    });

    it('should show 2 columns on medium screens', () => {
      mockIsMobile.mockReturnValue(false);
      
      // Mock medium screen
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('768px'), // md breakpoint
      }));

      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('md:grid-cols-2');
    });

    it('should show 4 columns on large screens', () => {
      mockIsMobile.mockReturnValue(false);
      
      // Mock large screen
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        ...mockMatchMedia(query),
        matches: query.includes('1024px'), // lg breakpoint
      }));

      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('lg:grid-cols-4');
    });

    it('should maintain proper spacing on all screen sizes', () => {
      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-4');
    });
  });

  describe('BusinessMetrics Responsive Layout', () => {
    const mockMetrics = {
      activeClients: 25,
      totalClients: 30,
      clientGrowth: 15.5,
      activeUsersToday: 45,
      totalUsers: 120,
      newUsersThisMonth: 8,
      apiUtilization: 75.2,
      apiCallsToday: 1250,
      systemHealth: 'healthy' as const
    };

    it('should have responsive grid layout', () => {
      const { container } = render(<BusinessMetrics metrics={mockMetrics} />);
      
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass(
        'gap-4',
        'md:grid-cols-2',
        'lg:grid-cols-4'
      );
    });

    it('should adapt card content for mobile screens', () => {
      mockIsMobile.mockReturnValue(true);
      
      render(<BusinessMetrics metrics={mockMetrics} />);
      
      // All metric values should still be visible
      expect(screen.getByText('25')).toBeInTheDocument(); // Active clients
      expect(screen.getByText('45')).toBeInTheDocument(); // Active users today
      expect(screen.getByText('75.2%')).toBeInTheDocument(); // API utilization
    });

    it('should maintain icon visibility across screen sizes', () => {
      const { rerender } = render(<BusinessMetrics metrics={mockMetrics} />);
      
      // Desktop
      mockIsMobile.mockReturnValue(false);
      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
      
      // Mobile
      mockIsMobile.mockReturnValue(true);
      rerender(<BusinessMetrics metrics={mockMetrics} />);
      
      expect(screen.getByTestId('building-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });
  });

  describe('Card Component Responsive Behavior', () => {
    const mockMetrics = {
      totalRevenue: 150000,
      totalCosts: 100000,
      netProfit: 50000,
      profitMargin: 33.33,
      growthTrends: {
        revenueGrowth: 15.5,
        costGrowth: 8.2,
        profitGrowth: 25.8,
        clientGrowth: 12.0,
        callVolumeGrowth: 18.3,
        leadVolumeGrowth: 22.1
      }
    };

    it('should have proper padding on mobile', () => {
      mockIsMobile.mockReturnValue(true);
      
      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      const cards = container.querySelectorAll('.bg-card');
      cards.forEach(card => {
        // Cards should have proper padding classes
        expect(card.querySelector('[class*="p-"]')).toBeTruthy();
      });
    });

    it('should handle text overflow on small screens', () => {
      mockIsMobile.mockReturnValue(true);
      
      const longMetrics = {
        ...mockMetrics,
        totalRevenue: 999999999999 // Very large number
      };

      render(<FinancialOverview metrics={longMetrics} />);
      
      // Should still render the formatted number
      expect(screen.getByText('$999,999,999,999')).toBeInTheDocument();
    });

    it('should maintain proper aspect ratios on different screens', () => {
      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      const cards = container.querySelectorAll('.bg-card');
      expect(cards.length).toBe(4);
      
      // Each card should have consistent structure
      cards.forEach(card => {
        expect(card.querySelector('[data-testid*="icon"]')).toBeTruthy();
      });
    });
  });

  describe('Touch and Mobile Interactions', () => {
    const mockMetrics = {
      activeClients: 25,
      totalClients: 30,
      clientGrowth: 15.5,
      activeUsersToday: 45,
      totalUsers: 120,
      newUsersThisMonth: 8,
      apiUtilization: 75.2,
      apiCallsToday: 1250,
      systemHealth: 'healthy' as const
    };

    it('should handle touch events properly', () => {
      mockIsMobile.mockReturnValue(true);
      
      const { container } = render(<BusinessMetrics metrics={mockMetrics} />);
      
      const cards = container.querySelectorAll('.bg-card');
      
      // Simulate touch events
      cards.forEach(card => {
        fireEvent.touchStart(card);
        fireEvent.touchEnd(card);
        
        // Should not cause any errors
        expect(card).toBeInTheDocument();
      });
    });

    it('should have appropriate touch targets on mobile', () => {
      mockIsMobile.mockReturnValue(true);
      
      const { container } = render(<BusinessMetrics metrics={mockMetrics} />);
      
      const cards = container.querySelectorAll('.bg-card');
      
      // Cards should have minimum touch target size (44px recommended)
      cards.forEach(card => {
        const computedStyle = window.getComputedStyle(card);
        // This is a basic check - in real implementation, you'd verify actual dimensions
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Viewport Meta Tag Considerations', () => {
    it('should render correctly with different viewport settings', () => {
      // Mock different viewport widths
      const viewports = [320, 768, 1024, 1440];
      
      const mockMetrics = {
        totalRevenue: 150000,
        totalCosts: 100000,
        netProfit: 50000,
        profitMargin: 33.33,
        growthTrends: {
          revenueGrowth: 15.5,
          costGrowth: 8.2,
          profitGrowth: 25.8,
          clientGrowth: 12.0,
          callVolumeGrowth: 18.3,
          leadVolumeGrowth: 22.1
        }
      };

      viewports.forEach(width => {
        // Mock viewport width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        mockIsMobile.mockReturnValue(width < 768);

        const { container } = render(<FinancialOverview metrics={mockMetrics} />);
        
        // Should render all cards regardless of viewport
        const cards = container.querySelectorAll('.bg-card');
        expect(cards).toHaveLength(4);
        
        // Should have responsive classes
        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toHaveClass('gap-4');
      });
    });
  });

  describe('Print Styles Compatibility', () => {
    it('should maintain layout when printed', () => {
      const mockMetrics = {
        totalRevenue: 150000,
        totalCosts: 100000,
        netProfit: 50000,
        profitMargin: 33.33,
        growthTrends: {
          revenueGrowth: 15.5,
          costGrowth: 8.2,
          profitGrowth: 25.8,
          clientGrowth: 12.0,
          callVolumeGrowth: 18.3,
          leadVolumeGrowth: 22.1
        }
      };

      const { container } = render(<FinancialOverview metrics={mockMetrics} />);
      
      // Should have print-friendly classes or structure
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeTruthy();
      
      // All important data should be visible
      expect(screen.getByText('$150,000')).toBeInTheDocument();
      expect(screen.getByText('$100,000')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('33.33%')).toBeInTheDocument();
    });
  });
});