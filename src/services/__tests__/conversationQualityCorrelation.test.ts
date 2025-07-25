import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAccuracyAnalyticsService } from '../aiAccuracyAnalyticsService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn()
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('AIAccuracyAnalyticsService - Conversation Quality Correlation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCallsData = [
    {
      id: '1',
      call_llm_model: 'gpt-4',
      created_at: '2024-01-15T10:00:00Z',
      lead_evaluations: [{
        overall_evaluation_score: 8.5,
        sentiment: 'positive',
        clarity_politeness_score: 8.0,
        naturalness_score: 9.0,
        relevance_questions_score: 8.5,
        objection_handling_score: 7.5,
        lead_intent_score: 8.0
      }]
    },
    {
      id: '2',
      call_llm_model: 'gpt-3.5-turbo',
      created_at: '2024-01-15T11:00:00Z',
      lead_evaluations: [{
        overall_evaluation_score: 7.0,
        sentiment: 'neutral',
        clarity_politeness_score: 7.5,
        naturalness_score: 6.5,
        relevance_questions_score: 7.0,
        objection_handling_score: 6.5,
        lead_intent_score: 7.5
      }]
    },
    {
      id: '3',
      call_llm_model: 'gpt-4',
      created_at: '2024-01-16T09:00:00Z',
      lead_evaluations: [{
        overall_evaluation_score: 9.0,
        sentiment: 'positive',
        clarity_politeness_score: 9.5,
        naturalness_score: 8.5,
        relevance_questions_score: 9.0,
        objection_handling_score: 8.5,
        lead_intent_score: 9.0
      }]
    },
    {
      id: '4',
      call_llm_model: 'gpt-3.5-turbo',
      created_at: '2024-01-16T10:00:00Z',
      lead_evaluations: [{
        overall_evaluation_score: 6.5,
        sentiment: 'negative',
        clarity_politeness_score: 6.0,
        naturalness_score: 7.0,
        relevance_questions_score: 6.5,
        objection_handling_score: 6.0,
        lead_intent_score: 6.5
      }]
    }
  ];

  describe('getConversationQualityMetrics', () => {
    it('should return enhanced conversation quality metrics with correlation data', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockCallsData, error: null }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-15T00:00:00Z',
        '2024-01-16T23:59:59Z'
      );

      // Debug logging
      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('Quality by model:', result.qualityByModel);
      console.log('GPT-4 quality:', result.qualityByModel['gpt-4']);

      expect(result).toHaveProperty('overallQualityScore');
      expect(result).toHaveProperty('qualityByModel');
      expect(result).toHaveProperty('sentimentDistribution');
      expect(result).toHaveProperty('qualityTrends');
      expect(result).toHaveProperty('qualityDimensionsByModel');
      expect(result).toHaveProperty('modelQualityComparison');
      expect(result).toHaveProperty('qualityCorrelationMatrix');
      expect(result).toHaveProperty('qualityThresholdAnalysis');

      // Verify quality by model calculation
      expect(result.qualityByModel['gpt-4']).toBeCloseTo(8.75); // (8.5 + 9.0) / 2
      expect(result.qualityByModel['gpt-3.5-turbo']).toBeCloseTo(6.75); // (7.0 + 6.5) / 2

      // Verify overall quality score
      expect(result.overallQualityScore).toBeCloseTo(7.75); // (8.5 + 7.0 + 9.0 + 6.5) / 4
    });

    it('should handle empty data gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-15T00:00:00Z',
        '2024-01-16T23:59:59Z'
      );

      expect(result).toHaveProperty('overallQualityScore');
      expect(result).toHaveProperty('qualityByModel');
      expect(result).toHaveProperty('sentimentDistribution');
      expect(result).toHaveProperty('qualityTrends');
      expect(result.overallQualityScore).toBe(0);
      expect(Object.keys(result.qualityByModel)).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(
        AIAccuracyAnalyticsService.getConversationQualityMetrics(
          '2024-01-15T00:00:00Z',
          '2024-01-16T23:59:59Z'
        )
      ).rejects.toThrow('Database error');
    });

    it('should calculate quality dimensions by model correctly', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockCallsData, error: null }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-15T00:00:00Z',
        '2024-01-16T23:59:59Z'
      );

      expect(result.qualityDimensionsByModel).toBeDefined();
      expect(result.qualityDimensionsByModel!['gpt-4']).toBeDefined();
      expect(result.qualityDimensionsByModel!['gpt-3.5-turbo']).toBeDefined();

      // Verify GPT-4 dimensions (average of calls 1 and 3)
      const gpt4Dimensions = result.qualityDimensionsByModel!['gpt-4'];
      expect(gpt4Dimensions.clarityPoliteness).toBeCloseTo(8.75); // (8.0 + 9.5) / 2
      expect(gpt4Dimensions.naturalness).toBeCloseTo(8.75); // (9.0 + 8.5) / 2
    });

    it('should provide model quality comparison with statistical metrics', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockCallsData, error: null }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-15T00:00:00Z',
        '2024-01-16T23:59:59Z'
      );

      expect(result.modelQualityComparison).toBeDefined();
      expect(result.modelQualityComparison!.length).toBe(2);

      const gpt4Comparison = result.modelQualityComparison!.find(m => m.modelName === 'gpt-4');
      expect(gpt4Comparison).toBeDefined();
      expect(gpt4Comparison!.averageQualityScore).toBeCloseTo(8.75);
      expect(gpt4Comparison!.sampleSize).toBe(2);
      expect(gpt4Comparison!.standardDeviation).toBeGreaterThanOrEqual(0);
      expect(gpt4Comparison!.confidenceInterval).toBeDefined();
    });

    it('should calculate quality correlation matrix', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockCallsData, error: null }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-15T00:00:00Z',
        '2024-01-16T23:59:59Z'
      );

      expect(result.qualityCorrelationMatrix).toBeDefined();
      expect(result.qualityCorrelationMatrix!.clarityVsNaturalness).toBeGreaterThanOrEqual(-1);
      expect(result.qualityCorrelationMatrix!.clarityVsNaturalness).toBeLessThanOrEqual(1);
      expect(result.qualityCorrelationMatrix!.clarityVsRelevance).toBeGreaterThanOrEqual(-1);
      expect(result.qualityCorrelationMatrix!.clarityVsRelevance).toBeLessThanOrEqual(1);
    });

    it('should provide quality threshold analysis', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data: mockCallsData, error: null }),
        eq: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-15T00:00:00Z',
        '2024-01-16T23:59:59Z'
      );

      expect(result.qualityThresholdAnalysis).toBeDefined();
      expect(result.qualityThresholdAnalysis!.thresholdPerformance).toBeDefined();
      expect(result.qualityThresholdAnalysis!.modelRankings).toBeDefined();
      expect(result.qualityThresholdAnalysis!.qualityDistribution).toBeDefined();

      // Verify model rankings are sorted by average score
      const rankings = result.qualityThresholdAnalysis!.modelRankings;
      expect(rankings.length).toBe(2);
      expect(rankings[0].averageScore).toBeGreaterThanOrEqual(rankings[1].averageScore);
    });
  });
});