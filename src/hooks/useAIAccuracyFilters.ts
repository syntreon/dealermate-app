import { useState, useEffect, useCallback, useMemo } from 'react';
import { AIAccuracyFilteringService, FilterState, FilterOptions, DrillDownOptions } from '@/services/aiAccuracyFilteringService';
import { AIAccuracyAnalyticsData } from '@/types/aiAccuracyAnalytics';

export interface UseAIAccuracyFiltersReturn {
  // Filter state
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  // Filter options
  filterOptions: FilterOptions | null;
  loadingOptions: boolean;
  
  // Validation
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Real-time application
  applyFilters: (data: AIAccuracyAnalyticsData) => AIAccuracyAnalyticsData;
  
  // Drill-down functionality
  drillDown: (options: DrillDownOptions) => Promise<any>;
  drillDownLoading: boolean;
  drillDownData: any;
  
  // Empty state handling
  getEmptyStateMessage: (dataType: string) => {
    title: string;
    message: string;
    suggestions: string[];
  };
  
  // Utility functions
  hasActiveFilters: boolean;
  filterSummary: string;
}

export const useAIAccuracyFilters = (
  initialFilters?: Partial<FilterState>
): UseAIAccuracyFiltersReturn => {
  // Initialize default date range (last 30 days)
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const [filters, setFiltersState] = useState<FilterState>(() => ({
    ...getDefaultDateRange(),
    clientId: null,
    ...initialFilters
  }));

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // Validate filters whenever they change
  const validation = useMemo(() => {
    return AIAccuracyFilteringService.validateFilters(filters);
  }, [filters]);

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.clientId !== null ||
      filters.modelType !== undefined ||
      filters.accuracyThreshold !== undefined
    );
  }, [filters]);

  // Generate filter summary
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate).toLocaleDateString();
      const end = new Date(filters.endDate).toLocaleDateString();
      parts.push(`${start} - ${end}`);
    }
    
    if (filters.clientId) {
      const client = filterOptions?.availableClients.find(c => c.id === filters.clientId);
      parts.push(`Client: ${client?.name || filters.clientId}`);
    }
    
    if (filters.modelType) {
      parts.push(`Model: ${filters.modelType}`);
    }
    
    if (filters.accuracyThreshold !== undefined) {
      parts.push(`Accuracy ≥ ${filters.accuracyThreshold}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'All data';
  }, [filters, filterOptions]);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      const options = await AIAccuracyFilteringService.getFilterOptions(filters);
      setFilterOptions(options);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoadingOptions(false);
    }
  }, [filters]);

  // Update filters with validation
  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      
      // Auto-adjust end date if start date is after it
      if (newFilters.startDate && updatedFilters.endDate) {
        const startDate = new Date(newFilters.startDate);
        const endDate = new Date(updatedFilters.endDate);
        
        if (startDate > endDate) {
          updatedFilters.endDate = newFilters.startDate;
        }
      }
      
      return updatedFilters;
    });
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFiltersState({
      ...getDefaultDateRange(),
      clientId: null,
      modelType: undefined,
      accuracyThreshold: undefined
    });
  }, []);

  // Apply filters to data
  const applyFilters = useCallback((data: AIAccuracyAnalyticsData): AIAccuracyAnalyticsData => {
    return AIAccuracyFilteringService.applyAccuracyThresholdFilter(data, filters.accuracyThreshold);
  }, [filters.accuracyThreshold]);

  // Drill-down functionality
  const drillDown = useCallback(async (options: DrillDownOptions) => {
    try {
      setDrillDownLoading(true);
      const data = await AIAccuracyFilteringService.getDrillDownData(filters, options);
      setDrillDownData(data);
      return data;
    } catch (error) {
      console.error('Error performing drill-down:', error);
      throw error;
    } finally {
      setDrillDownLoading(false);
    }
  }, [filters]);

  // Get empty state message
  const getEmptyStateMessage = useCallback((dataType: string) => {
    return AIAccuracyFilteringService.getEmptyStateMessage(filters, dataType);
  }, [filters]);

  // Load filter options on mount and when base filters change
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  return {
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    loadingOptions,
    validation,
    applyFilters,
    drillDown,
    drillDownLoading,
    drillDownData,
    getEmptyStateMessage,
    hasActiveFilters,
    filterSummary
  };
};

// Additional hook for managing drill-down state
export const useDrillDownState = () => {
  const [drillDownStack, setDrillDownStack] = useState<DrillDownOptions[]>([]);
  const [currentLevel, setCurrentLevel] = useState<DrillDownOptions['level']>('overview');

  const pushDrillDown = useCallback((options: DrillDownOptions) => {
    setDrillDownStack(prev => [...prev, options]);
    setCurrentLevel(options.level);
  }, []);

  const popDrillDown = useCallback(() => {
    setDrillDownStack(prev => {
      const newStack = prev.slice(0, -1);
      setCurrentLevel(newStack.length > 0 ? newStack[newStack.length - 1].level : 'overview');
      return newStack;
    });
  }, []);

  const resetDrillDown = useCallback(() => {
    setDrillDownStack([]);
    setCurrentLevel('overview');
  }, []);

  const canGoBack = drillDownStack.length > 0;
  const breadcrumbs = drillDownStack.map((item, index) => ({
    level: item.level,
    context: item.context,
    isLast: index === drillDownStack.length - 1
  }));

  return {
    currentLevel,
    drillDownStack,
    pushDrillDown,
    popDrillDown,
    resetDrillDown,
    canGoBack,
    breadcrumbs
  };
};