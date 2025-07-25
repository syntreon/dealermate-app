import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAccuracyAnalyticsService } from '@/services/aiAccuracyAnalyticsService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => {
  const createQueryChain = () => ({
    select: vi.fn(() => createQueryChain()),
    gte: vi.fn(() => createQueryChain()),
    lte: vi.fn(() => createQueryChain()),
    eq: vi.fn(() => createQueryChain()),
    order: vi.fn(() => Promise.resolve({ data: [], error: null }))
  });

  return {
    supabase: {
      from: vi.fn(() => createQueryChain())
    }
  };
});

describe('AIAccuracyAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnalyticsData', () => {
    it('should return analytics data structure', async () => {
      const result = await AIAccuracyAnalyticsService.getAnalyticsData();
      
      expect(result).toHaveProperty('modelPerformance');
      expect(result).toHaveProperty('accuracyTrends');
      expect(result).toHaveProperty('failurePatterns');
      expect(result).toHaveProperty('keywordAnalysis');
      expect(result).toHaveProperty('conversationQuality');
      expect(result).toHaveProperty('technicalMetrics');
    });

    it('should handle basic date filters', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = await AIAccuracyAnalyticsService.getAnalyticsData(filters);
      
      expect(result).toBeDefined();
      expect(result.modelPerformance).toBeDefined();
    });
  });

  describe('getModelPerformanceMetrics', () => {
    it('should return model performance metrics', async () => {
      const result = await AIAccuracyAnalyticsService.getModelPerformanceMetrics(
        '2024-01-01',
        '2024-01-31'
      );
      
      expect(result).toHaveProperty('totalCalls');
      expect(result).toHaveProperty('modelsUsed');
      expect(result).toHaveProperty('averageAccuracy');
      expect(result).toHaveProperty('bestPerformingModel');
      expect(result).toHaveProperty('worstPerformingModel');
      expect(result).toHaveProperty('performanceComparison');
      
      expect(Array.isArray(result.modelsUsed)).toBe(true);
      expect(Array.isArray(result.performanceComparison)).toBe(true);
    });
  });

  describe('getAccuracyTrends', () => {
    it('should return accuracy trends data', async () => {
      const result = await AIAccuracyAnalyticsService.getAccuracyTrends(
        '2024-01-01',
        '2024-01-31'
      );
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getFailurePatterns', () => {
    it('should return failure patterns data', async () => {
      const result = await AIAccuracyAnalyticsService.getFailurePatterns(
        '2024-01-01',
        '2024-01-31'
      );
      
      expect(result).toHaveProperty('commonFailures');
      expect(result).toHaveProperty('criticalFailures');
      expect(result).toHaveProperty('failuresByModel');
      expect(result).toHaveProperty('failureTrends');
      
      expect(Array.isArray(result.commonFailures)).toBe(true);
      expect(Array.isArray(result.criticalFailures)).toBe(true);
      expect(Array.isArray(result.failuresByModel)).toBe(true);
      expect(Array.isArray(result.failureTrends)).toBe(true);
    });
  });

  describe('getKeywordAnalysis', () => {
    it('should return keyword analysis data', async () => {
      const result = await AIAccuracyAnalyticsService.getKeywordAnalysis(
        '2024-01-01',
        '2024-01-31'
      );
      
      expect(result).toHaveProperty('topFailureKeywords');
      expect(result).toHaveProperty('failureCategories');
      expect(result).toHaveProperty('trendingIssues');
      
      expect(Array.isArray(result.topFailureKeywords)).toBe(true);
      expect(Array.isArray(result.failureCategories)).toBe(true);
      expect(Array.isArray(result.trendingIssues)).toBe(true);
    });
  });

  describe('getConversationQualityMetrics', () => {
    it('should return conversation quality metrics', async () => {
      const result = await AIAccuracyAnalyticsService.getConversationQualityMetrics(
        '2024-01-01',
        '2024-01-31'
      );
      
      expect(result).toHaveProperty('overallQualityScore');
      expect(result).toHaveProperty('qualityByModel');
      expect(result).toHaveProperty('sentimentDistribution');
      expect(result).toHaveProperty('qualityTrends');
      
      expect(Array.isArray(result.qualityTrends)).toBe(true);
    });
  });

  describe('getTechnicalMetrics', () => {
    it('should return technical metrics data', async () => {
      const result = await AIAccuracyAnalyticsService.getTechnicalMetrics(
        '2024-01-01',
        '2024-01-31'
      );
      
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('tokenUsageStats');
      expect(result).toHaveProperty('costEfficiencyMetrics');
      expect(result).toHaveProperty('performanceDiagnostics');
      
      expect(Array.isArray(result.performanceDiagnostics)).toBe(true);
    });
  });
});