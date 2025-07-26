import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleAIAnalyticsService } from '../simpleAIAnalyticsService';

// Mock the supabase client
let mockData: any[] = [];
let mockError: any = null;

const mockQuery = {
  select: vi.fn(() => mockQuery),
  gte: vi.fn(() => mockQuery),
  lte: vi.fn(() => mockQuery),
  eq: vi.fn(() => Promise.resolve({ data: mockData, error: mockError }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => mockQuery)
  }
}));

describe('SimpleAIAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock query chain
    Object.values(mockQuery).forEach(fn => fn.mockReturnValue(mockQuery));
  });

  describe('getSimpleAnalytics', () => {
    it('should return empty analytics when no data', async () => {
      // Set mock data to empty
      mockData = [];
      mockError = null;
      
      const result = await SimpleAIAnalyticsService.getSimpleAnalytics(
        '2024-01-01',
        '2024-01-31'
      );

      expect(result).toEqual({
        llmModels: [],
        voiceModels: [],
        transcriberModels: [],
        totalCalls: 0,
        totalCost: 0,
        overallErrorRate: 0
      });
    });

    it('should handle service call without errors', async () => {
      // Set mock data to empty for now
      mockData = [];
      mockError = null;
      
      const result = await SimpleAIAnalyticsService.getSimpleAnalytics(
        '2024-01-01',
        '2024-01-31'
      );

      // Just test that it returns the expected structure
      expect(result).toHaveProperty('llmModels');
      expect(result).toHaveProperty('voiceModels');
      expect(result).toHaveProperty('transcriberModels');
      expect(result).toHaveProperty('totalCalls');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('overallErrorRate');
    });
  });
});