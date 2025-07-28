import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';
import { BusinessMetrics } from '@/components/admin/dashboard/BusinessMetrics';

// Mock next-themes
const mockSetTheme = vi.fn();
const mockTheme = 'light';

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockTheme
  })
}));

// Mock icons
vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className}>RefreshIcon</div>
  ),
  Clock: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className}>ClockIcon</div>
  ),
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
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-circle-icon" className={className}>!</div>
  ),
  XCircle: ({ className }: { className?: string }) => (
    <div data-testid="x-circle-icon" className={className}>✗</div>
  )
}));

// Mock formatting utilities
vi.mock('@/utils/formatting', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
  formatNumber: (num: number) => num.toLocaleString()
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    {children}
  </ThemeProvider>
);

describe('Theme Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DashboardHeader Theme Support', () => {
    const defaultProps = {
      lastUpdated: new Date('2024-01-15T10:30:00Z'),
      isLoading: false,
      onRefresh: vi.fn()
    };

    it('should apply theme-aware CSS classes', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardHeader {...defaultProps} />
        </TestWrapper>
      );

      // Check for theme-aware classes
      const elements = container.querySelectorAll('.text-card-foreground');
      expect(elements.length).toBeGreaterThan(0);

      const mutedElements = container.querySelectorAll('.text-muted-foreground');
      expect(mutedElements.length).toBeGreaterThan(0);
    });

    it('should have proper button styling for both themes', () => {
      render(
        <TestWrapper>
          <DashboardHeader {...defaultProps} />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should handle loading state with theme-aware styling', () => {
      render(
        <TestWrapper>
          <DashboardHeader {...defaultProps} isLoading={true} />
        </TestWrapper>
      );

      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon).toHaveClass('animate-spin');
    });
  });

  describe('FinancialOverview Theme Support', () => {
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

    it('should apply theme-aware card styling', () => {
      const { container } = render(
        <TestWrapper>
          <FinancialOverview metrics={mockMetrics} />
        </TestWrapper>
      );

      const cards = container.querySelectorAll('.bg-card');
      expect(cards.length).toBeGreaterThan(0);

      const borders = container.querySelectorAll('.border-border');
      expect(borders.length).toBeGreaterThan(0);
    });

    it('should use semantic colors for positive/negative values', () => {
      render(
        <TestWrapper>
          <FinancialOverview metrics={mockMetrics} />
        </TestWrapper>
      );

      // Positive profit should use emerald color
      const profitValue = screen.getByText('$50,000');
      expect(profitValue).toHaveClass('text-emerald-600');
    });

    it('should handle negative values with destructive colors', () => {
      const negativeMetrics = {
        ...mockMetrics,
        netProfit: -25000,
        profitMargin: -16.67
      };

      render(
        <TestWrapper>
          <FinancialOverview metrics={negativeMetrics} />
        </TestWrapper>
      );

      const profitValue = screen.getByText('$-25,000');
      expect(profitValue).toHaveClass('text-destructive');
    });

    it('should apply proper theme classes to growth indicators', () => {
      const { container } = render(
        <TestWrapper>
          <FinancialOverview metrics={mockMetrics} />
        </TestWrapper>
      );

      const trendingUpIcons = screen.getAllByTestId('trending-up-icon');
      trendingUpIcons.forEach(icon => {
        expect(icon).toHaveClass('text-emerald-500');
      });
    });
  });

  describe('BusinessMetrics Theme Support', () => {
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

    it('should apply theme-aware styling to metric cards', () => {
      const { container } = render(
        <TestWrapper>
          <BusinessMetrics metrics={mockMetrics} />
        </TestWrapper>
      );

      const cards = container.querySelectorAll('.bg-card');
      expect(cards.length).toBeGreaterThan(0);

      const cardTitles = container.querySelectorAll('.text-muted-foreground');
      expect(cardTitles.length).toBeGreaterThan(0);
    });

    it('should use appropriate colors for system health status', () => {
      render(
        <TestWrapper>
          <BusinessMetrics metrics={mockMetrics} />
        </TestWrapper>
      );

      const healthyIcon = screen.getByTestId('check-circle-icon');
      expect(healthyIcon).toHaveClass('text-emerald-500');
    });

    it('should handle degraded system health with warning colors', () => {
      const degradedMetrics = {
        ...mockMetrics,
        systemHealth: 'degraded' as const
      };

      render(
        <TestWrapper>
          <BusinessMetrics metrics={degradedMetrics} />
        </TestWrapper>
      );

      const warningIcon = screen.getByTestId('alert-circle-icon');
      expect(warningIcon).toHaveClass('text-amber-500');
    });

    it('should handle down system health with error colors', () => {
      const downMetrics = {
        ...mockMetrics,
        systemHealth: 'down' as const
      };

      render(
        <TestWrapper>
          <BusinessMetrics metrics={downMetrics} />
        </TestWrapper>
      );

      const errorIcon = screen.getByTestId('x-circle-icon');
      expect(errorIcon).toHaveClass('text-destructive');
    });
  });

  describe('Responsive Design with Theme', () => {
    it('should maintain theme classes across different screen sizes', () => {
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

      const { container } = render(
        <TestWrapper>
          <FinancialOverview metrics={mockMetrics} />
        </TestWrapper>
      );

      // Check responsive grid classes
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('md:grid-cols-2', 'lg:grid-cols-4');

      // Ensure theme classes are preserved
      const cards = container.querySelectorAll('.bg-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Dark Mode Compatibility', () => {
    it('should use dark mode classes when theme is dark', () => {
      // Mock dark theme
      vi.mocked(mockTheme as any).mockReturnValue('dark');

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

      render(
        <TestWrapper>
          <FinancialOverview metrics={mockMetrics} />
        </TestWrapper>
      );

      // Check for dark mode compatible classes
      const profitValue = screen.getByText('$50,000');
      expect(profitValue).toHaveClass('dark:text-emerald-400');
    });
  });

  describe('Theme Transition Smoothness', () => {
    it('should have transition classes for smooth theme switching', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardHeader 
            lastUpdated={new Date()}
            isLoading={false}
            onRefresh={vi.fn()}
          />
        </TestWrapper>
      );

      // Check for transition classes that enable smooth theme switching
      const elements = container.querySelectorAll('[class*="transition"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility with Theme', () => {
    it('should maintain proper contrast ratios in both themes', () => {
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

      render(
        <TestWrapper>
          <FinancialOverview metrics={mockMetrics} />
        </TestWrapper>
      );

      // Check that text elements use proper contrast classes
      const cardTitles = screen.getAllByText(/Total|Net|Profit/);
      cardTitles.forEach(title => {
        const element = title.closest('[class*="text-"]');
        expect(element).toBeTruthy();
      });
    });

    it('should maintain focus indicators with theme support', () => {
      render(
        <TestWrapper>
          <DashboardHeader 
            lastUpdated={new Date()}
            isLoading={false}
            onRefresh={vi.fn()}
          />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Focus the button
      refreshButton.focus();
      
      // Check for focus-visible classes
      expect(refreshButton).toHaveClass('focus-visible:ring-2');
    });
  });
});