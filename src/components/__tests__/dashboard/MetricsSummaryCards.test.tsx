import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import MetricsSummaryCards from '@/components/dashboard/MetricsSummaryCards';

// Mock the formatters
vi.mock('@/utils/formatters', () => ({
  formatCurrency: (value: number) => `$${value.toFixed(2)}`,
  formatNumber: (value: number) => value.toLocaleString(),
  formatDuration: (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trending-down-icon">TrendingDown</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>,
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="card-title">{children}</div>,
}));

// Mock auth context
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', role: 'user' },
    isAuthenticated: true,
    loading: false,
  }),
}));

const mockMetrics = {
  totalCalls: 150,
  totalLeads: 45,
  avgCallDuration: 180, // 3 minutes
  callsToday: 12,
  leadsToday: 3,
  conversionRate: 30, // 30%
  agentStatus: 'active' as const,
  systemMessages: [],
};

const renderWithProviders = (props = {}) => {
  const defaultProps = {
    metrics: mockMetrics,
    loading: false,
    ...props,
  };

  return render(
    <BrowserRouter>
      <AuthProvider>
        <MetricsSummaryCards {...defaultProps} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MetricsSummaryCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all metric cards', () => {
    renderWithProviders();
    
    expect(screen.getByText('Total Calls')).toBeInTheDocument();
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Avg Call Duration')).toBeInTheDocument();
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    renderWithProviders();
    
    expect(screen.getByText('150')).toBeInTheDocument(); // Total calls
    expect(screen.getByText('45')).toBeInTheDocument(); // Total leads
    expect(screen.getByText('3m 0s')).toBeInTheDocument(); // Avg duration
    expect(screen.getByText('30%')).toBeInTheDocument(); // Conversion rate
  });

  it('shows loading state', () => {
    renderWithProviders({ loading: true });
    
    // Should show loading skeletons or indicators
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(4); // Should still render card structure
  });

  it('handles zero values correctly', () => {
    const zeroMetrics = {
      ...mockMetrics,
      totalCalls: 0,
      totalLeads: 0,
      avgCallDuration: 0,
      conversionRate: 0,
    };

    renderWithProviders({ metrics: zeroMetrics });
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0m 0s')).toBeInTheDocument();
  });

  it('displays trend indicators when available', () => {
    const metricsWithTrends = {
      ...mockMetrics,
      callsTrend: 15, // 15% increase
      leadsTrend: -5, // 5% decrease
      durationTrend: 0, // No change
    };

    renderWithProviders({ metrics: metricsWithTrends });
    
    // Should show trend icons (mocked)
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument();
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });

  it('renders proper icons for each metric', () => {
    renderWithProviders();
    
    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('has proper card structure', () => {
    renderWithProviders();
    
    const cards = screen.getAllByTestId('card');
    const cardHeaders = screen.getAllByTestId('card-header');
    const cardContents = screen.getAllByTestId('card-content');
    const cardTitles = screen.getAllByTestId('card-title');

    expect(cards).toHaveLength(4);
    expect(cardHeaders).toHaveLength(4);
    expect(cardContents).toHaveLength(4);
    expect(cardTitles).toHaveLength(4);
  });

  it('handles missing metrics gracefully', () => {
    const incompleteMetrics = {
      totalCalls: 100,
      // Missing other metrics
    } as any;

    renderWithProviders({ metrics: incompleteMetrics });
    
    // Should not crash and should handle undefined values
    expect(screen.getByText('Total Calls')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    const largeMetrics = {
      ...mockMetrics,
      totalCalls: 1500,
      totalLeads: 450,
    };

    renderWithProviders({ metrics: largeMetrics });
    
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
  });

  it('formats duration correctly for different values', () => {
    const durationMetrics = {
      ...mockMetrics,
      avgCallDuration: 125, // 2m 5s
    };

    renderWithProviders({ metrics: durationMetrics });
    
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
  });

  it('displays conversion rate as percentage', () => {
    const conversionMetrics = {
      ...mockMetrics,
      conversionRate: 25.5,
    };

    renderWithProviders({ metrics: conversionMetrics });
    
    expect(screen.getByText('25.5%')).toBeInTheDocument();
  });
});