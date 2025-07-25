import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelComparisonVisualizations from '../ModelComparisonVisualizations';
import { ModelUsageData, AccuracyTrendData, ModelComparisonData } from '@/types/aiAccuracyAnalytics';

// Mock Recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('ModelComparisonVisualizations', () => {
  const mockModelsUsed: ModelUsageData[] = [
    {
      modelName: 'gpt-4',
      callCount: 100,
      usagePercentage: 60,
      averageAccuracy: 8.5,
      averageQualityScore: 8.2,
      failureRate: 5,
      averageAdherenceScore: 8.8,
      costEfficiency: 0.05,
      responseTime: 2.5
    },
    {
      modelName: 'gpt-3.5-turbo',
      callCount: 67,
      usagePercentage: 40,
      averageAccuracy: 7.8,
      averageQualityScore: 7.5,
      failureRate: 8,
      averageAdherenceScore: 8.1,
      costEfficiency: 0.03,
      responseTime: 1.8
    }
  ];

  const mockAccuracyTrends: AccuracyTrendData[] = [
    {
      date: '2024-01-15',
      overallAccuracy: 8.2,
      modelAccuracies: { 'gpt-4': 8.5, 'gpt-3.5-turbo': 7.9 },
      qualityScore: 8.0,
      adherenceScore: 8.4,
      failureCount: 2
    },
    {
      date: '2024-01-16',
      overallAccuracy: 8.1,
      modelAccuracies: { 'gpt-4': 8.3, 'gpt-3.5-turbo': 7.9 },
      qualityScore: 7.9,
      adherenceScore: 8.3,
      failureCount: 3
    }
  ];

  const mockPerformanceComparison: ModelComparisonData[] = [
    {
      modelName: 'gpt-4',
      accuracyScore: 8.5,
      qualityScore: 8.2,
      adherenceScore: 8.8,
      failureRate: 5,
      costPerCall: 0.05,
      statisticalSignificance: true
    },
    {
      modelName: 'gpt-3.5-turbo',
      accuracyScore: 7.8,
      qualityScore: 7.5,
      adherenceScore: 8.1,
      failureRate: 8,
      costPerCall: 0.03,
      statisticalSignificance: true
    }
  ];

  it('should render all visualization components', () => {
    render(
      <ModelComparisonVisualizations
        modelsUsed={mockModelsUsed}
        accuracyTrends={mockAccuracyTrends}
        performanceComparison={mockPerformanceComparison}
      />
    );

    // Check for main section titles
    expect(screen.getByText('Model Performance Comparison')).toBeInTheDocument();
    expect(screen.getByText('Accuracy Trends Over Time')).toBeInTheDocument();
    expect(screen.getByText('Model Usage Distribution')).toBeInTheDocument();
    expect(screen.getByText('Performance Summary')).toBeInTheDocument();

    // Check for chart components
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('should display model information in performance summary', () => {
    render(
      <ModelComparisonVisualizations
        modelsUsed={mockModelsUsed}
        accuracyTrends={mockAccuracyTrends}
        performanceComparison={mockPerformanceComparison}
      />
    );

    // Check for model names
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
    expect(screen.getByText('gpt-3.5-turbo')).toBeInTheDocument();

    // Check for call counts
    expect(screen.getByText('100 calls (60.0%)')).toBeInTheDocument();
    expect(screen.getByText('67 calls (40.0%)')).toBeInTheDocument();

    // Check for accuracy scores
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText('7.8')).toBeInTheDocument();
  });

  it('should show empty state when no data is provided', () => {
    render(
      <ModelComparisonVisualizations
        modelsUsed={[]}
        accuracyTrends={[]}
        performanceComparison={[]}
      />
    );

    // Check for empty state messages
    expect(screen.getByText('No model performance data available')).toBeInTheDocument();
    expect(screen.getByText('No accuracy trend data available')).toBeInTheDocument();
    expect(screen.getByText('No usage distribution data available')).toBeInTheDocument();
  });

  it('should display correct badges and indicators', () => {
    render(
      <ModelComparisonVisualizations
        modelsUsed={mockModelsUsed}
        accuracyTrends={mockAccuracyTrends}
        performanceComparison={mockPerformanceComparison}
      />
    );

    // Check for model count badge
    expect(screen.getByText('2 models')).toBeInTheDocument();

    // Check for data points badge
    expect(screen.getByText('2 data points')).toBeInTheDocument();

    // Check for performance indicators (at least one should be present)
    expect(screen.getByText('Above Target')).toBeInTheDocument();
  });
});