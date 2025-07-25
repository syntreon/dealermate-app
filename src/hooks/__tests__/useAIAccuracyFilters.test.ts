import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIAccuracyFilters, useDrillDownState } from '../useAIAccuracyFilters';
import { AIAccuracyFilteringService } from '@/services/aiAccuracyFilteringService';

// Mock the service
vi.mock('@/services/aiAccuracyFilteringService', () => ({
  AIAccuracyFilteringService: {
    validateFilters: vi.fn(),
    getFilterOptions: vi.fn(),
    applyAccuracyThresholdFilter: vi.fn(),
    getDrillDownData: vi.fn(),
    getEmptyStateMessage: vi.fn()
  }
}));

describe('useAIAccuracyFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(AIAccuracyFilteringService.validateFilters).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    vi.mocked(AIAccuracyFilteringService.getFilterOptions).mockResolvedValue({
      availableModels: ['gpt-4', 'gpt-3.5-turbo'],
      availableClients: [
        { id: 'client1', name: 'Client 1' },
        { id: 'client2', name: 'Client 2' }
      ],
      dateRange: {
        min: '2024-01-01T00:00:00.000Z',
        max: '2024-01-31T23:59:59.999Z'
      }
    });
    
    vi.mocked(AIAccuracyFilteringService.applyAccuracyThresholdFilter).mockImplementation((data) => data);
    
    vi.mocked(AIAccuracyFilteringService.getEmptyStateMessage).mockReturnValue({
      title: 'No Data Found',
      message: 'No data matches your criteria',
      suggestions: ['Try adjusting filters']
    });
  });

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    expect(result.current.filters.startDate).toBeDefined();
    expect(result.current.filters.endDate).toBeDefined();
    expect(result.current.filters.clientId).toBeNull();
    expect(result.current.filters.modelType).toBeUndefined();
    expect(result.current.filters.accuracyThreshold).toBeUndefined();
  });

  it('should initialize with custom filters', () => {
    const initialFilters = {
      clientId: 'client1',
      modelType: 'gpt-4'
    };

    const { result } = renderHook(() => useAIAccuracyFilters(initialFilters));

    expect(result.current.filters.clientId).toBe('client1');
    expect(result.current.filters.modelType).toBe('gpt-4');
  });

  it('should update filters correctly', () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    act(() => {
      result.current.setFilters({ clientId: 'client1' });
    });

    expect(result.current.filters.clientId).toBe('client1');
  });

  it('should auto-adjust end date when start date is after it', () => {
    const { result } = renderHook(() => useAIAccuracyFilters({
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-31T23:59:59.999Z'
    }));

    act(() => {
      result.current.setFilters({ startDate: '2024-02-01T00:00:00.000Z' });
    });

    expect(result.current.filters.endDate).toBe('2024-02-01T00:00:00.000Z');
  });

  it('should reset filters to default', () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    act(() => {
      result.current.setFilters({ 
        clientId: 'client1', 
        modelType: 'gpt-4',
        accuracyThreshold: 8.0 
      });
    });

    expect(result.current.filters.clientId).toBe('client1');

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.clientId).toBeNull();
    expect(result.current.filters.modelType).toBeUndefined();
    expect(result.current.filters.accuracyThreshold).toBeUndefined();
  });

  it('should validate filters', () => {
    const mockValidation = {
      isValid: false,
      errors: ['Invalid date range'],
      warnings: ['Large date range']
    };

    vi.mocked(AIAccuracyFilteringService.validateFilters).mockReturnValue(mockValidation);

    const { result } = renderHook(() => useAIAccuracyFilters());

    expect(result.current.validation).toEqual(mockValidation);
  });

  it('should detect active filters', () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    // Initially should have active filters (default date range)
    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setFilters({ clientId: 'client1' });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should generate filter summary', async () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    // Wait for filter options to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setFilters({ 
        clientId: 'client1',
        modelType: 'gpt-4',
        accuracyThreshold: 8.0
      });
    });

    expect(result.current.filterSummary).toContain('Client: Client 1');
    expect(result.current.filterSummary).toContain('Model: gpt-4');
    expect(result.current.filterSummary).toContain('Accuracy ≥ 8');
  });

  it('should load filter options on mount', async () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    expect(result.current.loadingOptions).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(AIAccuracyFilteringService.getFilterOptions).toHaveBeenCalled();
    expect(result.current.loadingOptions).toBe(false);
    expect(result.current.filterOptions).toBeDefined();
  });

  it('should apply filters to data', () => {
    const mockData = {
      modelPerformance: { totalCalls: 100 },
      accuracyTrends: [],
      failurePatterns: { commonFailures: [] },
      keywordAnalysis: { topFailureKeywords: [] },
      conversationQuality: { overallQualityScore: 8.0 },
      technicalMetrics: { averageResponseTime: 1000 }
    } as any;

    const { result } = renderHook(() => useAIAccuracyFilters());

    act(() => {
      result.current.setFilters({ accuracyThreshold: 7.0 });
    });

    const filteredData = result.current.applyFilters(mockData);

    expect(AIAccuracyFilteringService.applyAccuracyThresholdFilter).toHaveBeenCalledWith(mockData, 7.0);
  });

  it('should handle drill-down operations', async () => {
    const mockDrillDownData = { modelName: 'gpt-4', totalCalls: 50 };
    vi.mocked(AIAccuracyFilteringService.getDrillDownData).mockResolvedValue(mockDrillDownData);

    const { result } = renderHook(() => useAIAccuracyFilters());

    expect(result.current.drillDownLoading).toBe(false);

    let drillDownResult;
    await act(async () => {
      drillDownResult = await result.current.drillDown({
        level: 'model',
        context: { modelName: 'gpt-4' }
      });
    });

    expect(result.current.drillDownLoading).toBe(false);
    expect(result.current.drillDownData).toEqual(mockDrillDownData);
    expect(drillDownResult).toEqual(mockDrillDownData);
    expect(AIAccuracyFilteringService.getDrillDownData).toHaveBeenCalledWith(
      result.current.filters,
      { level: 'model', context: { modelName: 'gpt-4' } }
    );
  });

  it('should handle drill-down errors', async () => {
    const mockError = new Error('Drill-down failed');
    vi.mocked(AIAccuracyFilteringService.getDrillDownData).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAIAccuracyFilters());

    await act(async () => {
      try {
        await result.current.drillDown({ level: 'model' });
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(result.current.drillDownLoading).toBe(false);
  });

  it('should get empty state message', () => {
    const { result } = renderHook(() => useAIAccuracyFilters());

    const message = result.current.getEmptyStateMessage('Analytics');

    expect(AIAccuracyFilteringService.getEmptyStateMessage).toHaveBeenCalledWith(
      result.current.filters,
      'Analytics'
    );
    expect(message).toEqual({
      title: 'No Data Found',
      message: 'No data matches your criteria',
      suggestions: ['Try adjusting filters']
    });
  });
});

describe('useDrillDownState', () => {
  it('should initialize with overview level', () => {
    const { result } = renderHook(() => useDrillDownState());

    expect(result.current.currentLevel).toBe('overview');
    expect(result.current.drillDownStack).toHaveLength(0);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.breadcrumbs).toHaveLength(0);
  });

  it('should push drill-down levels', () => {
    const { result } = renderHook(() => useDrillDownState());

    act(() => {
      result.current.pushDrillDown({
        level: 'model',
        context: { modelName: 'gpt-4' }
      });
    });

    expect(result.current.currentLevel).toBe('model');
    expect(result.current.drillDownStack).toHaveLength(1);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.breadcrumbs).toHaveLength(1);
    expect(result.current.breadcrumbs[0].level).toBe('model');
    expect(result.current.breadcrumbs[0].context).toEqual({ modelName: 'gpt-4' });
    expect(result.current.breadcrumbs[0].isLast).toBe(true);
  });

  it('should pop drill-down levels', () => {
    const { result } = renderHook(() => useDrillDownState());

    act(() => {
      result.current.pushDrillDown({ level: 'model' });
      result.current.pushDrillDown({ level: 'client' });
    });

    expect(result.current.currentLevel).toBe('client');
    expect(result.current.drillDownStack).toHaveLength(2);

    act(() => {
      result.current.popDrillDown();
    });

    expect(result.current.currentLevel).toBe('model');
    expect(result.current.drillDownStack).toHaveLength(1);
  });

  it('should reset drill-down state', () => {
    const { result } = renderHook(() => useDrillDownState());

    act(() => {
      result.current.pushDrillDown({ level: 'model' });
      result.current.pushDrillDown({ level: 'client' });
    });

    expect(result.current.drillDownStack).toHaveLength(2);

    act(() => {
      result.current.resetDrillDown();
    });

    expect(result.current.currentLevel).toBe('overview');
    expect(result.current.drillDownStack).toHaveLength(0);
    expect(result.current.canGoBack).toBe(false);
  });

  it('should generate breadcrumbs correctly', () => {
    const { result } = renderHook(() => useDrillDownState());

    act(() => {
      result.current.pushDrillDown({
        level: 'model',
        context: { modelName: 'gpt-4' }
      });
      result.current.pushDrillDown({
        level: 'client',
        context: { clientId: 'client1' }
      });
    });

    const breadcrumbs = result.current.breadcrumbs;
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].level).toBe('model');
    expect(breadcrumbs[0].isLast).toBe(false);
    expect(breadcrumbs[1].level).toBe('client');
    expect(breadcrumbs[1].isLast).toBe(true);
  });

  it('should handle popping from empty stack', () => {
    const { result } = renderHook(() => useDrillDownState());

    act(() => {
      result.current.popDrillDown();
    });

    expect(result.current.currentLevel).toBe('overview');
    expect(result.current.drillDownStack).toHaveLength(0);
  });
});