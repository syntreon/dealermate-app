import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';

// Mock the icons
vi.mock('lucide-react', () => ({
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className}>RefreshIcon</div>
  ),
  Clock: ({ className }: { className?: string }) => (
    <div data-testid="clock-icon" className={className}>ClockIcon</div>
  )
}));

describe('DashboardHeader', () => {
  const defaultProps = {
    lastUpdated: new Date('2024-01-15T10:30:00Z'),
    isLoading: false,
    onRefresh: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('should display last updated time', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/10:30:00/)).toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    render(<DashboardHeader {...defaultProps} isLoading={true} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('should show refresh button when not loading', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).not.toBeDisabled();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<DashboardHeader {...defaultProps} onRefresh={onRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should not call onRefresh when button is disabled (loading)', () => {
    const onRefresh = vi.fn();
    render(<DashboardHeader {...defaultProps} onRefresh={onRefresh} isLoading={true} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('should show "Never updated" when lastUpdated is null', () => {
    render(<DashboardHeader {...defaultProps} lastUpdated={null} />);
    
    expect(screen.getByText('Last updated: Never')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toHaveAttribute('type', 'button');
  });

  it('should display refresh icon', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
  });

  it('should display clock icon', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('should have proper CSS classes for theme support', () => {
    render(<DashboardHeader {...defaultProps} />);
    
    const header = screen.getByText('Admin Dashboard').closest('div');
    expect(header).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('should handle different date formats correctly', () => {
    const testDate = new Date('2024-12-25T15:45:30Z');
    render(<DashboardHeader {...defaultProps} lastUpdated={testDate} />);
    
    expect(screen.getByText(/15:45:30/)).toBeInTheDocument();
  });

  it('should show spinning animation when loading', () => {
    render(<DashboardHeader {...defaultProps} isLoading={true} />);
    
    const refreshIcon = screen.getByTestId('refresh-icon');
    expect(refreshIcon).toHaveClass('animate-spin');
  });

  it('should not show spinning animation when not loading', () => {
    render(<DashboardHeader {...defaultProps} isLoading={false} />);
    
    const refreshIcon = screen.getByTestId('refresh-icon');
    expect(refreshIcon).not.toHaveClass('animate-spin');
  });
});