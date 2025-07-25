/**
 * Integration tests for AI Accuracy Analytics Service
 * These tests are designed to work with actual database data
 * Run manually when testing with real data
 */

import { describe, it, expect } from 'vitest';
import { AIAccuracyAnalyticsService } from '@/services/aiAccuracyAnalyticsService';

describe.skip('AIAccuracyAnalyticsService Integration Tests', () => {
  const testFilters = {
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.999Z'
  };

  it('should fetch real model performance data', async () => {
    const result = await AIAccuracyAnalyticsService.getModelPerformanceMetrics(
      testFilters.startDate,
      testFilters.endDate
    );

    console.log('Model Performance Results:', JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(typeof result.totalCalls).toBe('number');
    expect(Array.isArray(result.modelsUsed)).toBe(true);
    expect(typeof result.averageAccuracy).toBe('number');
  });

  it('should fetch real accuracy trends', async () => {
    const result = await AIAccuracyAnalyticsService.getAccuracyTrends(
      testFilters.startDate,
      testFilters.endDate
    );

    console.log('Accuracy Trends Results:', JSON.stringify(result.slice(0, 3), null, 2));
    
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch real failure patterns', async () => {
    const result = await AIAccuracyAnalyticsService.getFailurePatterns(
      testFilters.startDate,
      testFilters.endDate
    );

    console.log('Failure Patterns Results:', JSON.stringify({
      commonFailuresCount: result.commonFailures.length,
      criticalFailuresCount: result.criticalFailures.length,
      failuresByModelCount: result.failuresByModel.length
    }, null, 2));
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.commonFailures)).toBe(true);
    expect(Array.isArray(result.criticalFailures)).toBe(true);
  });

  it('should fetch complete analytics data', async () => {
    const result = await AIAccuracyAnalyticsService.getAnalyticsData(testFilters);

    console.log('Complete Analytics Summary:', {
      totalCalls: result.modelPerformance.totalCalls,
      modelsCount: result.modelPerformance.modelsUsed.length,
      trendsCount: result.accuracyTrends.length,
      failureCategoriesCount: result.failurePatterns.commonFailures.length,
      keywordsCount: result.keywordAnalysis.topFailureKeywords.length,
      overallQuality: result.conversationQuality.overallQualityScore,
      avgResponseTime: result.technicalMetrics.averageResponseTime
    });

    expect(result).toBeDefined();
    expect(result.modelPerformance).toBeDefined();
    expect(result.accuracyTrends).toBeDefined();
    expect(result.failurePatterns).toBeDefined();
    expect(result.keywordAnalysis).toBeDefined();
    expect(result.conversationQuality).toBeDefined();
    expect(result.technicalMetrics).toBeDefined();
  });
});