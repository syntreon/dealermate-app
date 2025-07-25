import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAccuracyFilteringService, FilterState } from '../aiAccuracyFilteringService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('AIAccuracyFilteringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFilters', () => {
    it('should validate date range correctly', () => {
      const validFilters: FilterState = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z'
      };

      const result = AIAccuracyFilteringService.validateFilters(validFilters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid date range', () => {
      const invalidFilters: FilterState = {
        startDate: '2024-01-31T00:00:00.000Z',
        endDate: '2024-01-01T23:59:59.999Z'
      };

      const result = AIAccuracyFilteringService.validateFilters(invalidFilters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date cannot be after end date');
    });

    it('should warn about large date ranges', () => {
      const largeRangeFilters: FilterState = {
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z'
      };

      const result = AIAccuracyFilteringService.validateFilters(largeRangeFilters);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Date range exceeds 1 year, which may impact performance');
    });

    it('should warn about small date ranges', () => {
      const smallRangeFilters: FilterState = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-01T12:00:00.000Z'
      };

      const result = AIAccuracyFilteringService.validateFilters(smallRangeFilters);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Date range is less than 1 day, results may be limited');
    });

    it('should validate accuracy threshold', () => {
      const invalidThresholdFilters: FilterState = {
        accuracyThreshold: 15
      };

      const result = AIAccuracyFilteringService.validateFilters(invalidThresholdFilters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Accuracy threshold must be between 0 and 10');
    });

    it('should accept valid accuracy threshold', () => {
      const validThresholdFilters: FilterState = {
        accuracyThreshold: 7.5
      };

      const result = AIAccuracyFilteringService.validateFilters(validThresholdFilters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getFilterOptions', () => {
    it('should fetch available filter options', async () => {
      const mockData = [
        {
          call_llm_model: 'gpt-4',
          client_id: 'client1',
          created_at: '2024-01-01T00:00:00.000Z',
          clients: { name: 'Test Client 1' }
        },
        {
          call_llm_model: 'gpt-3.5-turbo',
          client_id: 'client2',
          created_at: '2024-01-15T00:00:00.000Z',
          clients: { name: 'Test Client 2' }
        }
      ];

      // Mock the Supabase query chain - the query ends after .not() when no base filters
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };

      // Since there are no base filters, the query ends after .not()
      // We need to make .not() return a promise-like object
      mockQuery.not.mockResolvedValue({ data: mockData, error: null });
      mockQuery.select.mockReturnValue(mockQuery);

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyFilteringService.getFilterOptions();

      expect(result.availableModels).toEqual(['gpt-3.5-turbo', 'gpt-4']);
      expect(result.availableClients).toEqual([
        { id: 'client1', name: 'Test Client 1' },
        { id: 'client2', name: 'Test Client 2' }
      ]);
      expect(result.dateRange.min).toBe('2024-01-01T00:00:00.000Z');
      expect(result.dateRange.max).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should handle empty data gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };

      mockQuery.not.mockResolvedValue({ data: [], error: null });
      mockQuery.select.mockReturnValue(mockQuery);

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyFilteringService.getFilterOptions();

      expect(result.availableModels).toEqual([]);
      expect(result.availableClients).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };

      mockQuery.not.mockResolvedValue({ data: null, error: new Error('Database error') });
      mockQuery.select.mockReturnValue(mockQuery);

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyFilteringService.getFilterOptions();

      expect(result.availableModels).toEqual([]);
      expect(result.availableClients).toEqual([]);
    });
  });

  describe('buildFilteredQuery', () => {
    it('should build query with all filters', () => {
      const filters: FilterState = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        clientId: 'client1',
        modelType: 'gpt-4'
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      AIAccuracyFilteringService.buildFilteredQuery(filters);

      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', filters.startDate);
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', filters.endDate);
      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', filters.clientId);
      expect(mockQuery.eq).toHaveBeenCalledWith('call_llm_model', filters.modelType);
    });

    it('should build query with partial filters', () => {
      const filters: FilterState = {
        startDate: '2024-01-01T00:00:00.000Z'
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      AIAccuracyFilteringService.buildFilteredQuery(filters);

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', filters.startDate);
      expect(mockQuery.lte).not.toHaveBeenCalled();
      expect(mockQuery.eq).not.toHaveBeenCalled();
    });
  });

  describe('applyAccuracyThresholdFilter', () => {
    const mockData = {
      modelPerformance: {
        totalCalls: 100,
        modelsUsed: [
          { modelName: 'gpt-4', averageAccuracy: 8.5, callCount: 50 },
          { modelName: 'gpt-3.5-turbo', averageAccuracy: 6.5, callCount: 50 }
        ],
        averageAccuracy: 7.5,
        bestPerformingModel: 'gpt-4',
        worstPerformingModel: 'gpt-3.5-turbo',
        performanceComparison: []
      },
      accuracyTrends: [
        { date: '2024-01-01', overallAccuracy: 8.0, modelAccuracies: {}, qualityScore: 8.0, adherenceScore: 8.0, failureCount: 0 },
        { date: '2024-01-02', overallAccuracy: 6.0, modelAccuracies: {}, qualityScore: 6.0, adherenceScore: 6.0, failureCount: 2 }
      ],
      failurePatterns: {
        commonFailures: [],
        criticalFailures: [],
        failuresByModel: [],
        failureTrends: []
      },
      keywordAnalysis: {
        topFailureKeywords: [],
        failureCategories: [],
        trendingIssues: []
      },
      conversationQuality: {
        overallQualityScore: 7.5,
        qualityByModel: {},
        sentimentDistribution: {},
        qualityTrends: [
          { date: '2024-01-01', averageQuality: 8.0, sentimentScores: {}, modelQuality: {} },
          { date: '2024-01-02', averageQuality: 6.0, sentimentScores: {}, modelQuality: {} }
        ]
      },
      technicalMetrics: {
        averageResponseTime: 1000,
        tokenUsageStats: {
          averageInputTokens: 100,
          averageOutputTokens: 200,
          totalTokensUsed: 30000,
          tokensByModel: {}
        },
        costEfficiencyMetrics: {
          averageCostPerCall: 0.05,
          costByModel: {},
          costTrends: [],
          costVsAccuracyCorrelation: 0.7
        },
        performanceDiagnostics: []
      }
    };

    it('should filter data by accuracy threshold', () => {
      const threshold = 7.0;
      const result = AIAccuracyFilteringService.applyAccuracyThresholdFilter(mockData, threshold);

      expect(result.modelPerformance.modelsUsed).toHaveLength(1);
      expect(result.modelPerformance.modelsUsed[0].modelName).toBe('gpt-4');
      expect(result.accuracyTrends).toHaveLength(1);
      expect(result.accuracyTrends[0].date).toBe('2024-01-01');
      expect(result.conversationQuality.qualityTrends).toHaveLength(1);
    });

    it('should return original data when no threshold is provided', () => {
      const result = AIAccuracyFilteringService.applyAccuracyThresholdFilter(mockData);

      expect(result).toEqual(mockData);
    });

    it('should handle empty results when threshold is too high', () => {
      const threshold = 10.0;
      const result = AIAccuracyFilteringService.applyAccuracyThresholdFilter(mockData, threshold);

      expect(result.modelPerformance.modelsUsed).toHaveLength(0);
      expect(result.modelPerformance.averageAccuracy).toBe(0);
      expect(result.accuracyTrends).toHaveLength(0);
      expect(result.conversationQuality.qualityTrends).toHaveLength(0);
    });
  });

  describe('getEmptyStateMessage', () => {
    it('should return appropriate message for no filters', () => {
      const filters: FilterState = {};
      const result = AIAccuracyFilteringService.getEmptyStateMessage(filters, 'Analytics');

      expect(result.title).toBe('No Analytics Data Available');
      expect(result.message).toBe('There is no data available for the selected time period.');
      expect(result.suggestions).toContain('Check if calls have been made during this period');
    });

    it('should return appropriate message with filters', () => {
      const filters: FilterState = {
        clientId: 'client1',
        modelType: 'gpt-4',
        accuracyThreshold: 8.0
      };
      const result = AIAccuracyFilteringService.getEmptyStateMessage(filters, 'Analytics');

      expect(result.title).toBe('No Analytics Data Found');
      expect(result.message).toBe('No data matches your current filter criteria.');
      expect(result.suggestions).toContain('Try selecting a different AI model or remove the model filter');
      expect(result.suggestions).toContain('Try selecting a different client or remove the client filter');
      expect(result.suggestions).toContain('Try lowering the accuracy threshold');
      expect(result.suggestions).toContain('Clear all filters to see all available data');
    });

    it('should provide date-specific suggestions', () => {
      const filters: FilterState = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z'
      };
      const result = AIAccuracyFilteringService.getEmptyStateMessage(filters, 'Analytics');

      expect(result.suggestions).toContain('Try expanding the date range');
    });
  });

  describe('helper methods', () => {
    describe('parseJsonbArray', () => {
      it('should parse JSON string arrays', () => {
        const jsonString = '["item1", "item2", "item3"]';
        const result = (AIAccuracyFilteringService as any).parseJsonbArray(jsonString);
        
        expect(result).toEqual(['item1', 'item2', 'item3']);
      });

      it('should handle array inputs', () => {
        const arrayInput = ['item1', 'item2', 'item3'];
        const result = (AIAccuracyFilteringService as any).parseJsonbArray(arrayInput);
        
        expect(result).toEqual(['item1', 'item2', 'item3']);
      });

      it('should handle null/undefined inputs', () => {
        expect((AIAccuracyFilteringService as any).parseJsonbArray(null)).toBeNull();
        expect((AIAccuracyFilteringService as any).parseJsonbArray(undefined)).toBeNull();
      });

      it('should handle invalid JSON', () => {
        const invalidJson = 'invalid json string';
        const result = (AIAccuracyFilteringService as any).parseJsonbArray(invalidJson);
        
        expect(result).toBeNull();
      });
    });

    describe('categorizeFailure', () => {
      it('should categorize hallucination failures', () => {
        const result = (AIAccuracyFilteringService as any).categorizeFailure('The AI hallucinated information');
        expect(result).toBe('hallucination');
      });

      it('should categorize transcriber failures', () => {
        const result = (AIAccuracyFilteringService as any).categorizeFailure('Transcriber misheard the customer');
        expect(result).toBe('transcriber');
      });

      it('should categorize rule violations', () => {
        const result = (AIAccuracyFilteringService as any).categorizeFailure('Violated company rules');
        expect(result).toBe('rules');
      });

      it('should categorize protocol violations', () => {
        const result = (AIAccuracyFilteringService as any).categorizeFailure('Did not follow protocol');
        expect(result).toBe('protocol');
      });

      it('should default to other category', () => {
        const result = (AIAccuracyFilteringService as any).categorizeFailure('Some other issue');
        expect(result).toBe('other');
      });

      it('should handle empty input', () => {
        const result = (AIAccuracyFilteringService as any).categorizeFailure('');
        expect(result).toBe('other');
      });
    });

    describe('groupCallsByDate', () => {
      it('should group calls by date correctly', () => {
        const calls = [
          { id: '1', created_at: '2024-01-01T10:00:00.000Z' },
          { id: '2', created_at: '2024-01-01T15:00:00.000Z' },
          { id: '3', created_at: '2024-01-02T10:00:00.000Z' }
        ];

        const result = (AIAccuracyFilteringService as any).groupCallsByDate(calls);

        expect(result).toHaveLength(2);
        expect(result[0].date).toBe('2024-01-01');
        expect(result[0].calls).toHaveLength(2);
        expect(result[1].date).toBe('2024-01-02');
        expect(result[1].calls).toHaveLength(1);
      });
    });

    describe('groupCallsByModel', () => {
      it('should group calls by model correctly', () => {
        const calls = [
          { id: '1', call_llm_model: 'gpt-4' },
          { id: '2', call_llm_model: 'gpt-4' },
          { id: '3', call_llm_model: 'gpt-3.5-turbo' },
          { id: '4', call_llm_model: null }
        ];

        const result = (AIAccuracyFilteringService as any).groupCallsByModel(calls);

        expect(result).toHaveLength(3);
        
        const gpt4Group = result.find(g => g.modelName === 'gpt-4');
        expect(gpt4Group.callCount).toBe(2);
        
        const gpt35Group = result.find(g => g.modelName === 'gpt-3.5-turbo');
        expect(gpt35Group.callCount).toBe(1);
        
        const unknownGroup = result.find(g => g.modelName === 'Unknown');
        expect(unknownGroup.callCount).toBe(1);
      });
    });
  });
});