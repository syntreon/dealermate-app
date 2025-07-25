import { supabase } from '@/integrations/supabase/client';
import {
  KeywordAnalysisData,
  KeywordFrequency,
  FailureCategoryBreakdown,
  TrendingIssueData
} from '@/types/aiAccuracyAnalytics';

/**
 * Enhanced Keyword Extraction Engine for AI Accuracy Analytics
 * 
 * This service provides comprehensive keyword extraction and analysis from
 * prompt adherence review data, including failure pattern detection and
 * trending analysis for emerging issues.
 */
export class KeywordExtractionEngine {
  // Predefined failure type patterns for better categorization
  private static readonly FAILURE_PATTERNS = {
    hallucination: [
      'hallucin', 'fabricat', 'made up', 'false information', 'incorrect fact',
      'wrong detail', 'inaccurate', 'untrue', 'fictional', 'imagined',
      'non-existent', 'false claim', 'misinformation', 'invented'
    ],
    transcriber: [
      'transcrib', 'transcription', 'speech recognition', 'audio', 'hearing', 'sound quality',
      'microphone', 'voice', 'pronunciation', 'accent', 'background noise',
      'unclear speech', 'mumbled', 'distorted', 'audio quality'
    ],
    rules: [
      'rule violation', 'rule', 'policy breach', 'policy', 'guideline', 'requirement', 'compliance',
      'regulation', 'standard', 'procedure', 'mandate',
      'directive', 'specification', 'constraint', 'restriction'
    ],
    protocol: [
      'prompt adherence', 'instruction', 'protocol violation', 'protocol', 'procedure', 'workflow',
      'process', 'methodology', 'approach', 'technique', 'system',
      'framework', 'structure', 'format', 'template'
    ],
    other: [
      'general', 'miscellaneous', 'unspecified', 'various', 'multiple',
      'different', 'other', 'additional', 'further', 'extra'
    ]
  };

  // Common stop words to filter out during keyword extraction
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i',
    'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'able'
  ]);

  /**
   * Enhanced JSONB parsing for prompt adherence review data
   * Handles various JSONB formats and structures
   */
  static parseJsonbData(jsonbData: any): string[] {
    if (!jsonbData) return [];

    try {
      // Handle already parsed arrays
      if (Array.isArray(jsonbData)) {
        return jsonbData
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map(item => item.trim());
      }

      // Handle string data that might be JSON
      if (typeof jsonbData === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(jsonbData);
          if (Array.isArray(parsed)) {
            return parsed
              .filter(item => typeof item === 'string' && item.trim().length > 0)
              .map(item => item.trim());
          }
          // If parsed but not an array, treat as single item
          if (typeof parsed === 'string') {
            return [parsed.trim()];
          }
        } catch (jsonError) {
          // JSON parsing failed, try alternative parsing strategies
          return this.parseDelimitedText(jsonbData);
        }
      }

      // Handle object data
      if (typeof jsonbData === 'object' && jsonbData !== null) {
        const values: string[] = [];
        
        // Extract string values from object properties
        Object.values(jsonbData).forEach(value => {
          if (typeof value === 'string' && value.trim().length > 0) {
            values.push(value.trim());
          } else if (Array.isArray(value)) {
            values.push(...this.parseJsonbData(value));
          }
        });
        
        return values;
      }

      return [];
    } catch (error) {
      console.warn('Error parsing JSONB data:', error);
      return [];
    }
  }

  /**
   * Parse delimited text using various strategies
   */
  private static parseDelimitedText(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    const cleanText = text.trim();
    
    // Strategy 1: Split by common failure indicators
    const failureIndicators = [
      'Rule:', 'CRITICAL FAILURE:', 'Guiding Principle:', 'Systemic Change:',
      'Training/Fine-tuning:', 'Refinement:', 'Error Recovery:', 'Issue:',
      'Problem:', 'Failure:', 'Error:', 'Warning:', 'Alert:'
    ];
    
    for (const indicator of failureIndicators) {
      if (cleanText.includes(indicator)) {
        const parts = cleanText
          .split(new RegExp(`(?:${failureIndicators.join('|')})`, 'gi'))
          .map(part => part.trim())
          .filter(part => part.length > 0);
        
        if (parts.length > 1) {
          return parts;
        }
      }
    }

    // Strategy 2: Split by numbered lists (handle escaped newlines)
    const numberedListPattern = /\d+\.\s+/g;
    const textWithRealNewlines = cleanText.replace(/\\n/g, '\n');
    if (numberedListPattern.test(textWithRealNewlines)) {
      const parts = textWithRealNewlines
        .split(numberedListPattern)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (parts.length > 1) {
        return parts;
      }
    }

    // Strategy 3: Split by bullet points (handle escaped newlines)
    const bulletPattern = /[•\-*]\s+/g;
    if (bulletPattern.test(textWithRealNewlines)) {
      const parts = textWithRealNewlines
        .split(bulletPattern)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (parts.length > 1) {
        return parts;
      }
    }

    // Strategy 4: Split by line breaks for multi-line content
    const lines = cleanText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length > 1) {
      return lines;
    }

    // Strategy 5: Split by sentences for long text
    if (cleanText.length > 100) {
      return cleanText
        .split(/[.!?]+/)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 10);
    }

    // Fallback: return as single item
    return [cleanText];
  }

  /**
   * Enhanced keyword categorization system for failure types
   */
  static categorizeFailureType(text: string): 'hallucination' | 'transcriber' | 'rules' | 'protocol' | 'other' {
    if (!text || typeof text !== 'string') return 'other';

    const normalizedText = text.toLowerCase().trim();
    
    // Check each category with weighted scoring
    const categoryScores: { [key: string]: number } = {
      hallucination: 0,
      transcriber: 0,
      rules: 0,
      protocol: 0,
      other: 0
    };

    // Score based on pattern matching
    Object.entries(this.FAILURE_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (normalizedText.includes(pattern.toLowerCase())) {
          categoryScores[category] += 1;
          
          // Give extra weight for exact matches
          if (normalizedText === pattern.toLowerCase()) {
            categoryScores[category] += 2;
          }
          
          // Give extra weight for patterns at the beginning of text
          if (normalizedText.startsWith(pattern.toLowerCase())) {
            categoryScores[category] += 1;
          }
        }
      });
    });

    // Find the category with the highest score
    const maxScore = Math.max(...Object.values(categoryScores));
    if (maxScore === 0) return 'other';

    const bestCategory = Object.entries(categoryScores)
      .find(([_, score]) => score === maxScore)?.[0];

    return (bestCategory as 'hallucination' | 'transcriber' | 'rules' | 'protocol' | 'other') || 'other';
  }

  /**
   * Advanced keyword extraction with NLP-like processing
   */
  static extractKeywords(text: string, maxKeywords: number = 20): string[] {
    if (!text || typeof text !== 'string') return [];

    // Normalize and clean the text, preserving accented characters
    const cleanText = text
      .toLowerCase()
      // Remove common punctuation marks but preserve letters, numbers, spaces, apostrophes, and hyphens
      .replace(/[!@#$%^&*()_+=\[\]{}|\\:";'<>?,./`~]/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return [];

    // Extract potential keywords
    const words = cleanText.split(/\s+/);
    
    // Filter and process words
    const processedWords = words
      .filter(word => word.length >= 3) // Minimum length
      .filter(word => !this.STOP_WORDS.has(word)) // Remove stop words
      .filter(word => !/^\d+$/.test(word)); // Remove pure numbers

    // Count frequency
    const frequency: { [word: string]: number } = {};
    processedWords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Extract phrases (2-3 word combinations) from original words
    const phrases = this.extractPhrases(cleanText, 2, 3);
    phrases.forEach(phrase => {
      frequency[phrase] = (frequency[phrase] || 0) + 1; // Same weight as individual words
    });

    // Separate individual words and phrases
    const individualWords = Object.entries(frequency).filter(([word]) => !word.includes(' '));
    const phrasesFiltered = Object.entries(frequency).filter(([word]) => word.includes(' '));
    
    // Sort individual words by frequency
    const sortedWords = individualWords.sort(([, a], [, b]) => b - a);
    
    // Sort phrases by frequency  
    const sortedPhrases = phrasesFiltered.sort(([, a], [, b]) => b - a);
    
    // Prioritize individual words, then add phrases if space allows
    const wordCount = Math.min(maxKeywords, sortedWords.length);
    const phraseCount = Math.max(0, maxKeywords - wordCount);
    
    const result = [
      ...sortedWords.slice(0, wordCount).map(([word]) => word),
      ...sortedPhrases.slice(0, phraseCount).map(([phrase]) => phrase)
    ];

    return result;
  }

  /**
   * Basic word stemming for better keyword matching
   */
  private static stemWord(word: string): string {
    // Simple suffix removal rules
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment'];
    
    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        return word.slice(0, -suffix.length);
      }
    }
    
    return word;
  }

  /**
   * Extract meaningful phrases from text
   */
  private static extractPhrases(text: string, minLength: number, maxLength: number): string[] {
    const words = text.split(/\s+/);
    const phrases: string[] = [];

    for (let length = minLength; length <= maxLength; length++) {
      for (let i = 0; i <= words.length - length; i++) {
        const phrase = words.slice(i, i + length).join(' ');
        
        // Filter out phrases with too many stop words
        const phraseWords = phrase.split(/\s+/);
        const stopWordCount = phraseWords.filter(word => this.STOP_WORDS.has(word)).length;
        
        if (stopWordCount < phraseWords.length / 2) {
          phrases.push(phrase);
        }
      }
    }

    return phrases;
  }

  /**
   * Build failure pattern detection algorithms
   */
  static detectFailurePatterns(
    failureTexts: string[],
    minOccurrence: number = 2
  ): { pattern: string; frequency: number; category: string; severity: string }[] {
    if (!failureTexts || failureTexts.length === 0) return [];

    const patternFrequency: { [pattern: string]: number } = {};
    const patternCategories: { [pattern: string]: string } = {};

    // Extract patterns from all failure texts
    failureTexts.forEach(text => {
      // Handle null/undefined text
      if (!text || typeof text !== 'string') return;
      
      const keywords = this.extractKeywords(text, 10);
      const category = this.categorizeFailureType(text);

      keywords.forEach(keyword => {
        patternFrequency[keyword] = (patternFrequency[keyword] || 0) + 1;
        patternCategories[keyword] = category;
      });

      // Also check for exact phrase patterns
      const phrases = this.extractPhrases(text.toLowerCase(), 2, 4);
      phrases.forEach(phrase => {
        if (phrase.length > 10) { // Only meaningful phrases
          patternFrequency[phrase] = (patternFrequency[phrase] || 0) + 1;
          patternCategories[phrase] = category;
        }
      });
    });

    // Filter and rank patterns
    return Object.entries(patternFrequency)
      .filter(([, frequency]) => frequency >= minOccurrence)
      .map(([pattern, frequency]) => ({
        pattern,
        frequency,
        category: patternCategories[pattern] || 'other',
        severity: this.getPatternSeverity(pattern, patternCategories[pattern])
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Determine pattern severity based on content and category
   */
  private static getPatternSeverity(pattern: string, category: string): string {
    const criticalKeywords = ['critical', 'severe', 'major', 'fatal', 'emergency'];
    const highKeywords = ['important', 'significant', 'serious', 'urgent'];
    const mediumKeywords = ['moderate', 'noticeable', 'minor', 'slight'];

    const lowerPattern = pattern.toLowerCase();

    if (category === 'hallucination' || criticalKeywords.some(kw => lowerPattern.includes(kw))) {
      return 'critical';
    }
    
    if (category === 'rules' || highKeywords.some(kw => lowerPattern.includes(kw))) {
      return 'high';
    }
    
    if (mediumKeywords.some(kw => lowerPattern.includes(kw))) {
      return 'medium';
    }

    // Default severity based on category
    switch (category) {
      case 'hallucination': return 'critical';
      case 'rules': return 'high';
      case 'protocol': return 'medium';
      case 'transcriber': return 'medium';
      default: return 'low';
    }
  }

  /**
   * Add trending analysis for emerging issues
   */
  static analyzeTrends(
    historicalData: { date: string; keywords: string[] }[],
    currentData: { date: string; keywords: string[] }[],
    trendWindow: number = 7
  ): { keyword: string; trend: 'increasing' | 'decreasing' | 'stable'; changeRate: number }[] {
    if (!historicalData.length || !currentData.length) return [];

    // Calculate keyword frequencies for historical and current periods
    const historicalFreq = this.calculateKeywordFrequencies(historicalData);
    const currentFreq = this.calculateKeywordFrequencies(currentData);

    // Analyze trends
    const trends: { keyword: string; trend: 'increasing' | 'decreasing' | 'stable'; changeRate: number }[] = [];
    
    // Get all unique keywords
    const allKeywords = new Set([
      ...Object.keys(historicalFreq),
      ...Object.keys(currentFreq)
    ]);

    allKeywords.forEach(keyword => {
      const historicalCount = historicalFreq[keyword] || 0;
      const currentCount = currentFreq[keyword] || 0;
      
      // Calculate change rate
      let changeRate = 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

      if (historicalCount === 0 && currentCount > 0) {
        changeRate = 100; // New issue
        trend = 'increasing';
      } else if (historicalCount > 0 && currentCount === 0) {
        changeRate = -100; // Resolved issue
        trend = 'decreasing';
      } else if (historicalCount > 0) {
        changeRate = ((currentCount - historicalCount) / historicalCount) * 100;
        
        if (changeRate > 20) {
          trend = 'increasing';
        } else if (changeRate < -20) {
          trend = 'decreasing';
        } else {
          trend = 'stable';
        }
      }

      // Only include keywords with significant frequency or change
      if (currentCount >= 2 || Math.abs(changeRate) >= 20) {
        trends.push({
          keyword,
          trend,
          changeRate: Math.round(changeRate * 100) / 100
        });
      }
    });

    return trends.sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate));
  }

  /**
   * Calculate keyword frequencies from time-series data
   */
  private static calculateKeywordFrequencies(
    data: { date: string; keywords: string[] }[]
  ): { [keyword: string]: number } {
    const frequency: { [keyword: string]: number } = {};
    
    data.forEach(entry => {
      entry.keywords.forEach(keyword => {
        frequency[keyword] = (frequency[keyword] || 0) + 1;
      });
    });

    return frequency;
  }

  /**
   * Comprehensive keyword analysis combining all features
   */
  static async performKeywordAnalysis(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string
  ): Promise<KeywordAnalysisData> {
    try {
      // Fetch prompt adherence review data
      let query = supabase
        .from('calls')
        .select(`
          call_llm_model,
          created_at,
          prompt_adherence_reviews(
            what_went_wrong,
            critical_failures_summary,
            recommendations_for_improvement
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (modelType) {
        query = query.eq('call_llm_model', modelType);
      }

      const { data: callsData, error } = await query;
      
      if (error) {
        console.error('Database error in performKeywordAnalysis:', error);
        throw error;
      }

      const calls = callsData || [];
      
      // Process all failure texts
      const allFailureTexts: string[] = [];
      const keywordsByDate: { [date: string]: string[] } = {};
      const categoryBreakdown: { [category: string]: FailureCategoryBreakdown } = {};
      const modelKeywords: { [model: string]: { [keyword: string]: number } } = {};

      calls.forEach(call => {
        const review = call.prompt_adherence_reviews?.[0];
        if (!review) return;

        const modelName = call.call_llm_model || 'Unknown';
        const date = new Date(call.created_at).toISOString().split('T')[0];

        // Collect all failure texts
        const failureTexts = [
          ...this.parseJsonbData(review.what_went_wrong),
          ...(review.critical_failures_summary ? [review.critical_failures_summary] : []),
          ...this.parseJsonbData(review.recommendations_for_improvement)
        ];

        allFailureTexts.push(...failureTexts);

        // Extract keywords for each failure text
        failureTexts.forEach(text => {
          const keywords = this.extractKeywords(text, 5);
          
          // Track by date
          if (!keywordsByDate[date]) {
            keywordsByDate[date] = [];
          }
          keywordsByDate[date].push(...keywords);

          // Track by model
          if (!modelKeywords[modelName]) {
            modelKeywords[modelName] = {};
          }
          keywords.forEach(keyword => {
            modelKeywords[modelName][keyword] = (modelKeywords[modelName][keyword] || 0) + 1;
          });

          // Categorize and track
          const category = this.categorizeFailureType(text);
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = {
              category,
              count: 0,
              percentage: 0,
              keywords: []
            };
          }
          categoryBreakdown[category].count++;
          categoryBreakdown[category].keywords.push(...keywords);
        });
      });

      // Generate comprehensive keyword frequency analysis
      const keywordFrequency: { [keyword: string]: KeywordFrequency } = {};
      
      allFailureTexts.forEach(text => {
        const keywords = this.extractKeywords(text, 10);
        const category = this.categorizeFailureType(text);
        
        keywords.forEach(keyword => {
          if (!keywordFrequency[keyword]) {
            keywordFrequency[keyword] = {
              keyword,
              frequency: 0,
              category,
              trend: 'stable' // Would need historical data for actual trend analysis
            };
          }
          keywordFrequency[keyword].frequency++;
        });
      });

      // Calculate category percentages
      const totalCategoryCount = Object.values(categoryBreakdown).reduce((sum, cat) => sum + cat.count, 0);
      Object.values(categoryBreakdown).forEach(category => {
        category.percentage = totalCategoryCount > 0 ? Math.round((category.count / totalCategoryCount) * 100) : 0;
        // Remove duplicates from keywords
        category.keywords = [...new Set(category.keywords)];
      });

      // Generate trending issues (simplified without historical comparison)
      const trendingIssues: TrendingIssueData[] = Object.values(keywordFrequency)
        .filter(kf => kf.frequency >= 3) // Only frequent issues
        .map(kf => ({
          issue: kf.keyword,
          frequency: kf.frequency,
          trend: kf.trend,
          affectedModels: Object.keys(modelKeywords).filter(model => 
            modelKeywords[model][kf.keyword] > 0
          )
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      return {
        topFailureKeywords: Object.values(keywordFrequency)
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 20),
        failureCategories: Object.values(categoryBreakdown)
          .sort((a, b) => b.count - a.count),
        trendingIssues
      };

    } catch (error) {
      console.error('Error performing keyword analysis:', error);
      throw error;
    }
  }
}