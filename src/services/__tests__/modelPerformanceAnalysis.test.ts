import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelPerformanceAnalysis } from '../modelPerformanceAnalysis';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

import { supabase } from '@/integrations/supabase/client';

describe('ModelPerformanceAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performModelComparisonTest', () => {
    it('should return insufficient data result for empty arrays', () => {
      const result = ModelPerformanceAnalysis.performModelComparisonTest([], []);
      
      expect(result).toEqual({
        isSignificant: false,
        pValue: 1,
        effectSize: 0,
        testType: 'insufficient_data',
        confidenceLevel: 0.95
      });
    });

    it('should calculate statistical significance for valid data', () => {
      const model1Scores = [0.8, 0.85, 0.9, 0.82, 0.88];
      const model2Scores = [0.7, 0.75, 0.72, 0.78, 0.74];
      
      const result = ModelPerformanceAnalysis.performModelComparisonTest(model1Scores, model2Scores);
      
      expect(result.testType).toBe('welch_t_test');
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.effectSize).toBeGreaterThan(0);
      expect(typeof result.isSignificant).toBe('boolean');
    });

    it('should handle identical scores', () => {
      const model1Scores = [0.8, 0.8, 0.8, 0.8, 0.8];
      const model2Scores = [0.8, 0.8, 0.8, 0.8, 0.8];
      
      const result = ModelPerformanceAnalysis.performModelComparisonTest(model1Scores, model2Scores);
      
      expect(result.effectSize).toBe(0);
      expect(result.pValue).toBeGreaterThan(0.05);
      expect(result.isSignificant).toBe(false);
    });

    it('should detect significant differences with large effect sizes', () => {
      const model1Scores = [0.9, 0.92, 0.91, 0.89, 0.93];
      const model2Scores = [0.5, 0.52, 0.51, 0.49, 0.53];
      
      const result = ModelPerformanceAnalysis.performModelComparisonTest(model1Scores, model2Scores);
      
      expect(result.effectSize).toBeGreaterThan(1); // Large effect size
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.isSignificant).toBe(true);
    });
  });

  describe('getModelPerformanceTrends', () => {
    it('should handle empty data gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await ModelPerformanceAnalysis.getModelPerformanceTrends(
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual([]);
    });

    it('should calculate trends correctly with sample data', async () => {
      const mockData = [
        {
          created_at: '2024-01-01T10:00:00Z',
          call_llm_model: 'gpt-4',
          lead_evaluations: [{ overall_evaluation_score: 80 }],
          prompt_adherence_reviews: [{ prompt_adherence_score: 85 }]
        },
        {
          created_at: '2024-01-01T11:00:00Z',
          call_llm_model: 'gpt-4',
          lead_evaluations: [{ overall_evaluation_score: 90 }],
          prompt_adherence_reviews: [{ prompt_adherence_score: 88 }]
        },
        {
          created_at: '2024-01-02T10:00:00Z',
          call_llm_model: 'gpt-3.5',
          lead_evaluations: [{ overall_evaluation_score: 70 }],
          prompt_adherence_reviews: [{ prompt_adherence_score: 75 }]
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await ModelPerformanceAnalysis.getModelPerformanceTrends(
        '2024-01-01',
        '2024-01-02',
        undefined,
        undefined,
        'daily'
      );

      expect(result).toHaveLength(2);
      expect(result[0].modelName).toBe('gpt-4');
      expect(result[0].date).toBe('2024-01-01');
      // Accuracy = (quality + adherence) / 2 = (85 + 86.5) / 2 = 85.75 for gpt-4 on 2024-01-01
      expect(result[0].accuracyScore).toBeGreaterThan(80);
      expect(result[0].callCount).toBe(2);
      
      expect(result[1].modelName).toBe('gpt-3.5');
      expect(result[1].date).toBe('2024-01-02');
      expect(result[1].accuracyScore).toBeGreaterThan(70);
      expect(result[1].callCount).toBe(1);
    });

    it('should handle different period types', async () => {
      const mockData = [
        {
          created_at: '2024-01-01T10:00:00Z',
          call_llm_model: 'gpt-4',
          lead_evaluations: [{ overall_evaluation_score: 80 }],
          prompt_adherence_reviews: [{ prompt_adherence_score: 85 }]
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      // Test weekly grouping
      const weeklyResult = await ModelPerformanceAnalysis.getModelPerformanceTrends(
        '2024-01-01',
        '2024-01-07',
        undefined,
        undefined,
        'weekly'
      );

      expect(weeklyResult).toHaveLength(1);
      expect(weeklyResult[0].date).toBe('2023-12-31'); // Week start for 2024-01-01

      // Test monthly grouping
      const monthlyResult = await ModelPerformanceAnalysis.getModelPerformanceTrends(
        '2024-01-01',
        '2024-01-31',
        undefined,
        undefined,
        'monthly'
      );

      expect(monthlyResult).toHaveLength(1);
      expect(monthlyResult[0].date).toBe('2024-01');
    });
  });

  describe('getEnhancedModelPerformanceMetrics', () => {
    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      await expect(
        ModelPerformanceAnalysis.getEnhancedModelPerformanceMetrics('2024-01-01', '2024-01-31')
      ).rejects.toThrow('Database error');
    });

    it('should calculate performance metrics correctly', async () => {
      const mockData = [
        {
          id: '1',
          call_llm_model: 'gpt-4',
          created_at: '2024-01-01T10:00:00Z',
          call_duration_seconds: 120,
          total_call_cost_usd: 0.05,
          lead_evaluations: [{ overall_evaluation_score: 80 }],
          prompt_adherence_reviews: [{ 
            prompt_adherence_score: 85, 
            critical_failures_summary: null 
          }]
        },
        {
          id: '2',
          call_llm_model: 'gpt-4',
          created_at: '2024-01-01T11:00:00Z',
          call_duration_seconds: 150,
          total_call_cost_usd: 0.06,
          lead_evaluations: [{ overall_evaluation_score: 90 }],
          prompt_adherence_reviews: [{ 
            prompt_adherence_score: 88, 
            critical_failures_summary: 'Some failure' 
          }]
        },
        {
          id: '3',
          call_llm_model: 'gpt-3.5',
          created_at: '2024-01-01T12:00:00Z',
          call_duration_seconds: 100,
          total_call_cost_usd: 0.03,
          lead_evaluations: [{ overall_evaluation_score: 70 }],
          prompt_adherence_reviews: [{ 
            prompt_adherence_score: 75, 
            critical_failures_summary: null 
          }]
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await ModelPerformanceAnalysis.getEnhancedModelPerformanceMetrics(
        '2024-01-01',
        '2024-01-31'
      );

      expect(result.totalCalls).toBe(3);
      expect(result.modelsUsed).toHaveLength(2);
      
      const gpt4Model = result.modelsUsed.find(m => m.modelName === 'gpt-4');
      expect(gpt4Model).toBeDefined();
      expect(gpt4Model!.callCount).toBe(2);
      expect(gpt4Model!.usagePercentage).toBeCloseTo(66.67, 1);
      expect(gpt4Model!.failureRate).toBe(50); // 1 out of 2 calls had failures
      
      const gpt35Model = result.modelsUsed.find(m => m.modelName === 'gpt-3.5');
      expect(gpt35Model).toBeDefined();
      expect(gpt35Model!.callCount).toBe(1);
      expect(gpt35Model!.usagePercentage).toBeCloseTo(33.33, 1);
      expect(gpt35Model!.failureRate).toBe(0);
      
      // Check performance comparison includes statistical data
      expect(result.performanceComparison).toHaveLength(2);
      expect(result.performanceComparison[0]).toHaveProperty('confidenceInterval');
      expect(result.performanceComparison[0]).toHaveProperty('sampleSize');
      expect(result.performanceComparison[0]).toHaveProperty('standardDeviation');
    });
  });

  describe('Statistical helper methods', () => {
    // Test private methods through public interface
    it('should calculate confidence intervals correctly through comparison test', () => {
      const scores = [0.8, 0.85, 0.9, 0.82, 0.88];
      const result = ModelPerformanceAnalysis.performModelComparisonTest(scores, scores);
      
      // With identical arrays, confidence interval should be tight around the mean
      expect(result.effectSize).toBe(0);
      expect(result.pValue).toBeGreaterThan(0.05);
    });

    it('should handle edge cases in statistical calculations', () => {
      // Test with single value
      const singleValue = [0.8];
      const result = ModelPerformanceAnalysis.performModelComparisonTest(singleValue, singleValue);
      
      expect(result.effectSize).toBe(0);
      expect(result.testType).toBe('welch_t_test');
    });
  });
});