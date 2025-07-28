import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinancialOverview } from '@/components/admin/dashboard/FinancialOverview';

// Mock the icons
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
  )
}));

// Mock the formatCurrency utility
vi.mock('@/utils/formatting', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`
}));

describe('FinancialOverview', () => {
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

  it('should render all financial metric cards', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Costs')).toBeInTheDocument();
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
    expect(screen.getByText('Profit Margin')).toBeInTheDocument();
  });

  it('should display formatted currency values', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('$150,000')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('should display profit margin as percentage', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('33.33%')).toBeInTheDocument();
  });

  it('should show positive growth trends with up arrows', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    const trendingUpIcons = screen.getAllByTestId('trending-up-icon');
    expect(trendingUpIcons.length).toBeGreaterThan(0);
    
    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getByText('+25.8%')).toBeInTheDocument();
  });

  it('should show negative growth trends with down arrows', () => {
    const negativeGrowthMetrics = {
      ...mockMetrics,
      growthTrends: {
        ...mockMetrics.growthTrends,
        revenueGrowth: -5.2,
        profitGrowth: -10.1
      }
    };

    render(<FinancialOverview metrics={negativeGrowthMetrics} />);
    
    const trendingDownIcons = screen.getAllByTestId('trending-down-icon');
    expect(trendingDownIcons.length).toBeGreaterThan(0);
    
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
    expect(screen.getByText('-10.1%')).toBeInTheDocument();
  });

  it('should handle zero values correctly', () => {
    const zeroMetrics = {
      totalRevenue: 0,
      totalCosts: 0,
      netProfit: 0,
      profitMargin: 0,
      growthTrends: {
        revenueGrowth: 0,
        costGrowth: 0,
        profitGrowth: 0,
        clientGrowth: 0,
        callVolumeGrowth: 0,
        leadVolumeGrowth: 0
      }
    };

    render(<FinancialOverview metrics={zeroMetrics} />);
    
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle negative profit correctly', () => {
    const negativeMetrics = {
      ...mockMetrics,
      netProfit: -25000,
      profitMargin: -16.67
    };

    render(<FinancialOverview metrics={negativeMetrics} />);
    
    expect(screen.getByText('$-25,000')).toBeInTheDocument();
    expect(screen.getByText('-16.67%')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for positive values', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    const profitValue = screen.getByText('$50,000');
    expect(profitValue).toHaveClass('text-emerald-600');
  });

  it('should apply correct CSS classes for negative values', () => {
    const negativeMetrics = {
      ...mockMetrics,
      netProfit: -25000
    };

    render(<FinancialOverview metrics={negativeMetrics} />);
    
    const profitValue = screen.getByText('$-25,000');
    expect(profitValue).toHaveClass('text-destructive');
  });

  it('should render all required icons', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    expect(screen.getAllByTestId('dollar-icon')).toHaveLength(3); // Revenue, Costs, Profit
    expect(screen.getByTestId('calculator-icon')).toBeInTheDocument(); // Profit Margin
  });

  it('should have proper responsive grid layout', () => {
    const { container } = render(<FinancialOverview metrics={mockMetrics} />);
    
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('gap-4', 'md:grid-cols-2', 'lg:grid-cols-4');
  });

  it('should handle very large numbers', () => {
    const largeMetrics = {
      ...mockMetrics,
      totalRevenue: 1500000000, // 1.5 billion
      totalCosts: 1200000000,   // 1.2 billion
      netProfit: 300000000      // 300 million
    };

    render(<FinancialOverview metrics={largeMetrics} />);
    
    expect(screen.getByText('$1,500,000,000')).toBeInTheDocument();
    expect(screen.getByText('$1,200,000,000')).toBeInTheDocument();
    expect(screen.getByText('$300,000,000')).toBeInTheDocument();
  });

  it('should handle decimal values in growth trends', () => {
    const decimalMetrics = {
      ...mockMetrics,
      growthTrends: {
        ...mockMetrics.growthTrends,
        revenueGrowth: 15.567,
        profitGrowth: -8.234
      }
    };

    render(<FinancialOverview metrics={decimalMetrics} />);
    
    expect(screen.getByText('+15.57%')).toBeInTheDocument();
    expect(screen.getByText('-8.23%')).toBeInTheDocument();
  });

  it('should have proper theme-aware styling', () => {
    const { container } = render(<FinancialOverview metrics={mockMetrics} />);
    
    const cards = container.querySelectorAll('.bg-card');
    expect(cards.length).toBeGreaterThan(0);
    
    const textElements = container.querySelectorAll('.text-card-foreground');
    expect(textElements.length).toBeGreaterThan(0);
  });

  it('should display growth trend labels correctly', () => {
    render(<FinancialOverview metrics={mockMetrics} />);
    
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });
});