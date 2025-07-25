import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeywordExtractionEngine } from '../keywordExtractionEngine';

// Mock Supabase client
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

describe('KeywordExtractionEngine', () => {
  describe('parseJsonbData', () => {
    it('should handle null and undefined input', () => {
      expect(KeywordExtractionEngine.parseJsonbData(null)).toEqual([]);
      expect(KeywordExtractionEngine.parseJsonbData(undefined)).toEqual([]);
    });

    it('should handle array input correctly', () => {
      const input = ['Error 1', 'Error 2', 'Error 3'];
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });

    it('should filter out empty strings from arrays', () => {
      const input = ['Error 1', '', '   ', 'Error 2'];
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result).toEqual(['Error 1', 'Error 2']);
    });

    it('should parse JSON string arrays', () => {
      const input = '["Rule violation", "Protocol error", "Adherence issue"]';
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result).toEqual(['Rule violation', 'Protocol error', 'Adherence issue']);
    });

    it('should handle single JSON string', () => {
      const input = '"Single error message"';
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result).toEqual(['Single error message']);
    });

    it('should parse delimited text with failure indicators', () => {
      const input = 'Rule: First issue CRITICAL FAILURE: Second issue Error: Third issue';
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result.length).toBeGreaterThan(1);
      expect(result).toContain('First issue');
    });

    it('should parse numbered lists', () => {
      const input = '1. First error\\n2. Second error\\n3. Third error';
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result.length).toBeGreaterThan(1);
    });

    it('should parse bullet points', () => {
      const input = '• First error\\n• Second error\\n- Third error';
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result.length).toBeGreaterThan(1);
    });

    it('should handle object input by extracting string values', () => {
      const input = {
        error1: 'First error',
        error2: 'Second error',
        nested: ['Third error', 'Fourth error']
      };
      const result = KeywordExtractionEngine.parseJsonbData(input);
      expect(result).toContain('First error');
      expect(result).toContain('Second error');
      expect(result).toContain('Third error');
      expect(result).toContain('Fourth error');
    });
  });

  describe('categorizeFailureType', () => {
    it('should categorize hallucination failures correctly', () => {
      expect(KeywordExtractionEngine.categorizeFailureType('Agent hallucinated information')).toBe('hallucination');
      expect(KeywordExtractionEngine.categorizeFailureType('Made up false details')).toBe('hallucination');
      expect(KeywordExtractionEngine.categorizeFailureType('Fabricated response')).toBe('hallucination');
    });

    it('should categorize transcriber failures correctly', () => {
      expect(KeywordExtractionEngine.categorizeFailureType('Speech recognition error')).toBe('transcriber');
      expect(KeywordExtractionEngine.categorizeFailureType('Audio quality issues')).toBe('transcriber');
      expect(KeywordExtractionEngine.categorizeFailureType('Transcription problems')).toBe('transcriber');
    });

    it('should categorize rule violations correctly', () => {
      expect(KeywordExtractionEngine.categorizeFailureType('Rule violation occurred')).toBe('rules');
      expect(KeywordExtractionEngine.categorizeFailureType('Policy breach detected')).toBe('rules');
      expect(KeywordExtractionEngine.categorizeFailureType('Guideline not followed')).toBe('rules');
    });

    it('should categorize protocol failures correctly', () => {
      expect(KeywordExtractionEngine.categorizeFailureType('Prompt adherence issue')).toBe('protocol');
      expect(KeywordExtractionEngine.categorizeFailureType('Instruction not followed')).toBe('protocol');
      expect(KeywordExtractionEngine.categorizeFailureType('Protocol violation')).toBe('protocol');
    });

    it('should default to other for unrecognized failures', () => {
      expect(KeywordExtractionEngine.categorizeFailureType('Random error message')).toBe('other');
      expect(KeywordExtractionEngine.categorizeFailureType('')).toBe('other');
      expect(KeywordExtractionEngine.categorizeFailureType(null as any)).toBe('other');
    });

    it('should handle mixed content and choose the most relevant category', () => {
      const mixedText = 'The agent had a transcription error but also hallucinated some information';
      // Should prioritize hallucination as it's more critical
      expect(KeywordExtractionEngine.categorizeFailureType(mixedText)).toBe('hallucination');
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from simple text', () => {
      const text = 'The agent failed to follow the greeting protocol correctly';
      const keywords = KeywordExtractionEngine.extractKeywords(text, 5);

      expect(keywords).toContain('agent');
      expect(keywords).toContain('failed');
      expect(keywords).toContain('follow');
      expect(keywords).toContain('greeting');
      expect(keywords).toContain('protocol');
    });

    it('should filter out stop words', () => {
      const text = 'The agent and the customer were talking about the issue';
      const keywords = KeywordExtractionEngine.extractKeywords(text, 10);

      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('were');
      expect(keywords).toContain('agent');
      expect(keywords).toContain('customer');
      expect(keywords).toContain('talking');
      expect(keywords).toContain('issue');
    });

    it('should filter out short words', () => {
      const text = 'AI is a big issue in the system';
      const keywords = KeywordExtractionEngine.extractKeywords(text, 10);

      expect(keywords).not.toContain('AI'); // Too short
      expect(keywords).not.toContain('is'); // Stop word
      expect(keywords).not.toContain('a'); // Too short
      expect(keywords).toContain('big');
      expect(keywords).toContain('issue');
      expect(keywords).toContain('system');
    });

    it('should handle empty or null input', () => {
      expect(KeywordExtractionEngine.extractKeywords('')).toEqual([]);
      expect(KeywordExtractionEngine.extractKeywords(null as any)).toEqual([]);
      expect(KeywordExtractionEngine.extractKeywords(undefined as any)).toEqual([]);
    });

    it('should limit results to maxKeywords parameter', () => {
      const longText = 'agent failed protocol greeting customer service issue problem error system response handling quality assurance testing validation verification';
      const keywords = KeywordExtractionEngine.extractKeywords(longText, 5);

      expect(keywords.length).toBeLessThanOrEqual(5);
    });

    it('should handle special characters and punctuation', () => {
      const text = 'Agent failed! Protocol error... System issue?';
      const keywords = KeywordExtractionEngine.extractKeywords(text, 10);



      expect(keywords).toContain('agent');
      expect(keywords).toContain('failed');
      expect(keywords).toContain('protocol');
      expect(keywords).toContain('error');
      expect(keywords).toContain('system');
      expect(keywords).toContain('issue');
    });
  });

  describe('detectFailurePatterns', () => {
    it('should detect common patterns in failure texts', () => {
      const failureTexts = [
        'Agent failed to follow greeting protocol',
        'Protocol violation in greeting sequence',
        'Greeting not performed correctly',
        'System error during processing',
        'Processing error occurred'
      ];

      const patterns = KeywordExtractionEngine.detectFailurePatterns(failureTexts, 2);

      expect(patterns.length).toBeGreaterThan(0);

      // Should find patterns that occur at least twice
      const greetingPattern = patterns.find(p => p.pattern.includes('greeting'));
      expect(greetingPattern).toBeDefined();
      expect(greetingPattern?.frequency).toBeGreaterThanOrEqual(2);

      const errorPattern = patterns.find(p => p.pattern.includes('error'));
      expect(errorPattern).toBeDefined();
      expect(errorPattern?.frequency).toBeGreaterThanOrEqual(2);
    });

    it('should categorize patterns correctly', () => {
      const failureTexts = [
        'Agent hallucinated customer information',
        'Hallucination detected in response',
        'Rule violation occurred',
        'Policy breach detected'
      ];

      const patterns = KeywordExtractionEngine.detectFailurePatterns(failureTexts, 1);

      const hallucinationPattern = patterns.find(p => p.category === 'hallucination');
      expect(hallucinationPattern).toBeDefined();

      const rulesPattern = patterns.find(p => p.category === 'rules');
      expect(rulesPattern).toBeDefined();
    });

    it('should assign appropriate severity levels', () => {
      const failureTexts = [
        'Critical hallucination error',
        'Minor protocol issue',
        'Severe system failure'
      ];

      const patterns = KeywordExtractionEngine.detectFailurePatterns(failureTexts, 1);

      const criticalPattern = patterns.find(p => p.pattern.includes('critical'));
      expect(criticalPattern?.severity).toBe('critical');

      const minorPattern = patterns.find(p => p.pattern.includes('minor'));
      expect(minorPattern?.severity).toBe('medium');
    });

    it('should handle empty input gracefully', () => {
      expect(KeywordExtractionEngine.detectFailurePatterns([])).toEqual([]);
      expect(KeywordExtractionEngine.detectFailurePatterns([null as any])).toEqual([]);
    });

    it('should filter patterns by minimum occurrence', () => {
      const failureTexts = [
        'Common error message',
        'Common error message',
        'Common error message',
        'Rare error message'
      ];

      const patterns = KeywordExtractionEngine.detectFailurePatterns(failureTexts, 3);

      // Should only include patterns that occur 3+ times
      expect(patterns.every(p => p.frequency >= 3)).toBe(true);

      const rarePattern = patterns.find(p => p.pattern.includes('rare'));
      expect(rarePattern).toBeUndefined();
    });
  });

  describe('analyzeTrends', () => {
    it('should detect increasing trends', () => {
      const historicalData = [
        { date: '2024-01-01', keywords: ['error', 'issue'] },
        { date: '2024-01-02', keywords: ['error', 'problem'] }
      ];

      const currentData = [
        { date: '2024-01-08', keywords: ['error', 'issue', 'failure'] },
        { date: '2024-01-09', keywords: ['error', 'issue', 'failure', 'critical'] },
        { date: '2024-01-10', keywords: ['error', 'issue', 'failure', 'critical'] }
      ];

      const trends = KeywordExtractionEngine.analyzeTrends(historicalData, currentData);

      const errorTrend = trends.find(t => t.keyword === 'error');
      expect(errorTrend?.trend).toBe('increasing');
      expect(errorTrend?.changeRate).toBeGreaterThan(0);

      const failureTrend = trends.find(t => t.keyword === 'failure');
      expect(failureTrend?.trend).toBe('increasing');
      expect(failureTrend?.changeRate).toBe(100); // New keyword
    });

    it('should detect decreasing trends', () => {
      const historicalData = [
        { date: '2024-01-01', keywords: ['error', 'issue', 'problem'] },
        { date: '2024-01-02', keywords: ['error', 'issue', 'problem'] },
        { date: '2024-01-03', keywords: ['error', 'issue', 'problem'] }
      ];

      const currentData = [
        { date: '2024-01-08', keywords: ['error'] },
        { date: '2024-01-09', keywords: ['error'] }
      ];

      const trends = KeywordExtractionEngine.analyzeTrends(historicalData, currentData);

      const issueTrend = trends.find(t => t.keyword === 'issue');
      expect(issueTrend?.trend).toBe('decreasing');
      expect(issueTrend?.changeRate).toBeLessThan(0);

      const problemTrend = trends.find(t => t.keyword === 'problem');
      expect(problemTrend?.trend).toBe('decreasing');
      expect(problemTrend?.changeRate).toBe(-100); // Completely resolved
    });

    it('should detect stable trends', () => {
      const historicalData = [
        { date: '2024-01-01', keywords: ['error', 'issue'] },
        { date: '2024-01-02', keywords: ['error', 'issue'] }
      ];

      const currentData = [
        { date: '2024-01-08', keywords: ['error', 'issue'] },
        { date: '2024-01-09', keywords: ['error', 'issue'] }
      ];

      const trends = KeywordExtractionEngine.analyzeTrends(historicalData, currentData);

      const errorTrend = trends.find(t => t.keyword === 'error');
      expect(errorTrend?.trend).toBe('stable');
      expect(Math.abs(errorTrend?.changeRate || 0)).toBeLessThan(20);
    });

    it('should handle empty data gracefully', () => {
      expect(KeywordExtractionEngine.analyzeTrends([], [])).toEqual([]);

      const historicalData = [{ date: '2024-01-01', keywords: ['error'] }];
      expect(KeywordExtractionEngine.analyzeTrends(historicalData, [])).toEqual([]);

      const currentData = [{ date: '2024-01-08', keywords: ['error'] }];
      expect(KeywordExtractionEngine.analyzeTrends([], currentData)).toEqual([]);
    });

    it('should sort trends by change rate magnitude', () => {
      const historicalData = [
        { date: '2024-01-01', keywords: ['error', 'issue', 'problem'] }
      ];

      const currentData = [
        { date: '2024-01-08', keywords: ['error', 'error', 'critical', 'critical', 'critical'] }
      ];

      const trends = KeywordExtractionEngine.analyzeTrends(historicalData, currentData);

      // Should be sorted by absolute change rate (highest first)
      for (let i = 0; i < trends.length - 1; i++) {
        expect(Math.abs(trends[i].changeRate)).toBeGreaterThanOrEqual(Math.abs(trends[i + 1].changeRate));
      }
    });
  });

  describe('performKeywordAnalysis', () => {
    beforeEach(() => {
      // Reset all mocks
      vi.clearAllMocks();
    });

    it('should handle database errors gracefully', async () => {
      // Import the mocked supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock the chain to return an error
      const mockLte = vi.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      // Override the from method
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(
        KeywordExtractionEngine.performKeywordAnalysis('2024-01-01', '2024-01-31')
      ).rejects.toThrow('Database error');
    });

    it('should handle empty database results', async () => {
      // Import the mocked supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock the chain to return empty data
      const mockLte = vi.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      // Override the from method
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await KeywordExtractionEngine.performKeywordAnalysis('2024-01-01', '2024-01-31');

      expect(result.topFailureKeywords).toEqual([]);
      expect(result.failureCategories).toEqual([]);
      expect(result.trendingIssues).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{"incomplete": "json"';
      const result = KeywordExtractionEngine.parseJsonbData(malformedJson);

      // Should fall back to text parsing
      expect(result).toEqual([malformedJson]);
    });

    it('should handle very long text inputs', () => {
      const longText = 'error '.repeat(1000) + 'system failure';
      const keywords = KeywordExtractionEngine.extractKeywords(longText, 10);

      expect(keywords.length).toBeLessThanOrEqual(10);
      expect(keywords).toContain('error');
      expect(keywords).toContain('system');
      expect(keywords).toContain('failure');
    });

    it('should handle special Unicode characters', () => {
      const unicodeText = 'Agent failed with émoji 🚨 and special chars: àáâãäå';
      const keywords = KeywordExtractionEngine.extractKeywords(unicodeText, 10);

      expect(keywords).toContain('agent');
      expect(keywords).toContain('failed');
    });

    it('should handle mixed language content', () => {
      const mixedText = 'Agent error mensaje de error système erreur';
      const keywords = KeywordExtractionEngine.extractKeywords(mixedText, 10);

      expect(keywords).toContain('agent');
      expect(keywords).toContain('error');
      expect(keywords).toContain('mensaje');
      expect(keywords).toContain('système');
      expect(keywords).toContain('erreur');
    });
  });
});