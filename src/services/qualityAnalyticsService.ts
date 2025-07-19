import { supabase } from '@/integrations/supabase/client';

export interface QualityAnalyticsData {
  // KPI metrics
  overallQualityScore: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
  reviewMetrics: {
    totalCalls: number;
    callsForReview: number;
    reviewPercentage: number;
    negativeCallRate: number;
  };
  // Chart data
  qualityTrends: Array<{ date: string; score: number }>;
  scoreDistribution: Array<{ scoreRange: string; count: number }>;
  sentimentTrends: Array<{ date: string; positive: number; neutral: number; negative: number }>;
  reviewReasons: Array<{ reason: string; count: number }>;
}

export interface QualityAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

export const QualityAnalyticsService = {
  /**
   * Get comprehensive quality analytics data from lead_evaluations table
   */
  getQualityAnalyticsData: async (filters?: QualityAnalyticsFilters): Promise<QualityAnalyticsData> => {
    try {
      const { startDate, endDate, clientId } = filters || {};
      
      // Calculate default date range (last 30 days) if not provided
      const now = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(now.getDate() - 30);

      const effectiveStartDate = startDate || defaultStartDate.toISOString();
      const effectiveEndDate = endDate || now.toISOString();

      // Build query for lead_evaluations using rpc or raw query to bypass type issues
      // Since lead_evaluations is not in the generated types, we'll use a more generic approach
      let query = supabase
        .from('lead_evaluations' as any)
        .select(`
          id,
          call_id,
          client_id,
          lead_completion_score,
          clarity_politeness_score,
          clarity_politeness_rationale,
          relevance_questions_score,
          relevance_questions_rationale,
          objection_handling_score,
          objection_handling_rationale,
          naturalness_score,
          naturalness_rationale,
          lead_intent_score,
          lead_intent_rationale,
          sentiment,
          sentiment_rationale,
          failure_risk_score,
          failure_risk_rationale,
          negative_call_flag,
          human_review_required,
          review_reason,
          evaluated_at,
          overall_evaluation_score
        `)
        .gte('evaluated_at', effectiveStartDate)
        .lte('evaluated_at', effectiveEndDate);

      // Apply client filtering
      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      // Fetch data
      const { data: evaluations, error } = await query.order('evaluated_at', { ascending: true });

      if (error) {
        console.error('Error fetching quality analytics:', error);
        throw error;
      }

      // Return empty data if no evaluations found
      if (!evaluations || evaluations.length === 0) {
        return {
          overallQualityScore: 0,
          sentimentBreakdown: {
            positive: 0,
            neutral: 0,
            negative: 0,
            positivePercentage: 0,
            neutralPercentage: 0,
            negativePercentage: 0,
          },
          reviewMetrics: {
            totalCalls: 0,
            callsForReview: 0,
            reviewPercentage: 0,
            negativeCallRate: 0,
          },
          qualityTrends: [],
          scoreDistribution: [],
          sentimentTrends: [],
          reviewReasons: [],
        };
      }

      // Process the data
      const analytics = processQualityData(evaluations);
      
      return analytics;
    } catch (error) {
      console.error('Error fetching quality analytics data:', error);
      throw error;
    }
  }
};

/**
 * Process raw lead_evaluations data into analytics format
 */
function processQualityData(evaluations: any[]): QualityAnalyticsData {
  const totalEvaluations = evaluations.length;

  // Calculate overall quality score (average of overall_evaluation_score)
  const validScores = evaluations.filter(e => e.overall_evaluation_score !== null);
  const overallQualityScore = validScores.length > 0 
    ? validScores.reduce((sum, e) => sum + parseFloat(e.overall_evaluation_score), 0) / validScores.length
    : 0;

  // Calculate sentiment breakdown
  const sentimentCounts = evaluations.reduce((acc, e) => {
    // Handle potential case sensitivity or different enum values
    const sentiment = e.sentiment?.toLowerCase();
    if (sentiment === 'positive' || sentiment === 'pos') {
      acc.positive = (acc.positive || 0) + 1;
    } else if (sentiment === 'negative' || sentiment === 'neg') {
      acc.negative = (acc.negative || 0) + 1;
    } else if (sentiment === 'neutral' || sentiment === 'neu') {
      acc.neutral = (acc.neutral || 0) + 1;
    } else {
      // Default unknown sentiments to neutral
      acc.neutral = (acc.neutral || 0) + 1;
    }
    return acc;
  }, { positive: 0, neutral: 0, negative: 0 });
  


  const sentimentBreakdown = {
    positive: sentimentCounts.positive || 0,
    neutral: sentimentCounts.neutral || 0,
    negative: sentimentCounts.negative || 0,
    positivePercentage: totalEvaluations > 0 ? ((sentimentCounts.positive || 0) / totalEvaluations) * 100 : 0,
    neutralPercentage: totalEvaluations > 0 ? ((sentimentCounts.neutral || 0) / totalEvaluations) * 100 : 0,
    negativePercentage: totalEvaluations > 0 ? ((sentimentCounts.negative || 0) / totalEvaluations) * 100 : 0
  };

  // Calculate review metrics
  const callsForReview = evaluations.filter(e => e.human_review_required).length;
  const negativeCallsCount = evaluations.filter(e => e.negative_call_flag).length;
  
  const reviewMetrics = {
    totalCalls: totalEvaluations,
    callsForReview,
    reviewPercentage: totalEvaluations > 0 ? (callsForReview / totalEvaluations) * 100 : 0,
    negativeCallRate: totalEvaluations > 0 ? (negativeCallsCount / totalEvaluations) * 100 : 0
  };

  // Generate quality trends (daily averages)
  const qualityTrends = generateDailyQualityTrends(evaluations);

  // Generate score distribution
  const scoreDistribution = generateScoreDistribution(evaluations);

  // Generate sentiment trends (daily counts)
  const sentimentTrends = generateDailySentimentTrends(evaluations);

  // Generate review reasons
  const reviewReasons = generateReviewReasons(evaluations);

  return {
    overallQualityScore: Math.round(overallQualityScore * 10) / 10, // Round to 1 decimal place
    sentimentBreakdown: {
      ...sentimentBreakdown,
      positivePercentage: Math.round(sentimentBreakdown.positivePercentage * 10) / 10,
      neutralPercentage: Math.round(sentimentBreakdown.neutralPercentage * 10) / 10,
      negativePercentage: Math.round(sentimentBreakdown.negativePercentage * 10) / 10
    },
    reviewMetrics: {
      ...reviewMetrics,
      reviewPercentage: Math.round(reviewMetrics.reviewPercentage * 10) / 10,
      negativeCallRate: Math.round(reviewMetrics.negativeCallRate * 10) / 10
    },
    qualityTrends,
    scoreDistribution,
    sentimentTrends,
    reviewReasons
  };
}

/**
 * Generate daily quality score trends
 */
function generateDailyQualityTrends(evaluations: any[]): Array<{ date: string; score: number }> {
  const dailyScores: { [key: string]: { total: number; count: number } } = {};

  // Filter out duplicates by id and ensure valid scores
  const uniqueEvaluations = evaluations.filter((evaluation, index, arr) => {
    return evaluation.overall_evaluation_score !== null && 
           evaluation.overall_evaluation_score !== undefined &&
           !isNaN(parseFloat(evaluation.overall_evaluation_score)) &&
           evaluation.evaluated_at &&
           arr.findIndex(e => e.id === evaluation.id) === index; // Remove duplicates by id
  });

  uniqueEvaluations.forEach(evaluation => {
    const date = new Date(evaluation.evaluated_at).toISOString().split('T')[0];
    if (!dailyScores[date]) {
      dailyScores[date] = { total: 0, count: 0 };
    }
    dailyScores[date].total += parseFloat(evaluation.overall_evaluation_score);
    dailyScores[date].count += 1;
  });

  return Object.entries(dailyScores)
    .map(([date, data]) => ({
      date,
      score: Math.round((data.total / data.count) * 10) / 10
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate score distribution by ranges
 */
function generateScoreDistribution(evaluations: any[]): Array<{ scoreRange: string; count: number }> {
  const ranges = [
    { range: '9-10', min: 9, max: 10 },
    { range: '8-9', min: 8, max: 9 },
    { range: '7-8', min: 7, max: 8 },
    { range: '6-7', min: 6, max: 7 },
    { range: '5-6', min: 5, max: 6 },
    { range: '<5', min: 0, max: 5 }
  ];

  // Filter out duplicates by id and ensure valid scores
  const uniqueEvaluations = evaluations.filter((evaluation, index, arr) => {
    return evaluation.overall_evaluation_score !== null && 
           evaluation.overall_evaluation_score !== undefined &&
           !isNaN(parseFloat(evaluation.overall_evaluation_score)) &&
           arr.findIndex(e => e.id === evaluation.id) === index; // Remove duplicates by id
  });

  const distribution = ranges.map(({ range, min, max }) => {
    const count = uniqueEvaluations.filter(e => {
      const score = parseFloat(e.overall_evaluation_score);
      if (isNaN(score)) return false;
      if (range === '<5') return score < 5;
      return score >= min && score < max;
    }).length;

    return { scoreRange: range, count };
  });

  return distribution;
}

/**
 * Generate daily sentiment trends
 */
function generateDailySentimentTrends(evaluations: any[]): Array<{ date: string; positive: number; neutral: number; negative: number }> {
  const dailySentiment: { [key: string]: { positive: number; neutral: number; negative: number } } = {};

  // Filter out duplicates by id and ensure valid dates
  const uniqueEvaluations = evaluations.filter((evaluation, index, arr) => {
    return evaluation.evaluated_at &&
           arr.findIndex(e => e.id === evaluation.id) === index; // Remove duplicates by id
  });

  uniqueEvaluations.forEach(evaluation => {
    const date = new Date(evaluation.evaluated_at).toISOString().split('T')[0];
    if (!dailySentiment[date]) {
      dailySentiment[date] = { positive: 0, neutral: 0, negative: 0 };
    }
    
    // Handle case sensitivity and null/undefined values
    const sentiment = (evaluation.sentiment || '').toLowerCase();
    if (sentiment === 'positive' || sentiment === 'pos') {
      dailySentiment[date].positive += 1;
    } else if (sentiment === 'negative' || sentiment === 'neg') {
      dailySentiment[date].negative += 1;
    } else if (sentiment === 'neutral' || sentiment === 'neu') {
      dailySentiment[date].neutral += 1;
    } else {
      // Default unknown sentiments to neutral
      dailySentiment[date].neutral += 1;
    }
  });

  return Object.entries(dailySentiment)
    .map(([date, sentiments]) => ({
      date,
      ...sentiments
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate review reasons breakdown
 */
function generateReviewReasons(evaluations: any[]): Array<{ reason: string; count: number }> {
  const reviewReasons: { [key: string]: number } = {};

  // Filter out duplicates by id first, then filter for review requirements
  const uniqueEvaluations = evaluations.filter((evaluation, index, arr) => {
    return arr.findIndex(e => e.id === evaluation.id) === index; // Remove duplicates by id
  });

  uniqueEvaluations
    // Stricter filter: ensure review_reason is a non-empty string after trimming
    .filter(e => e.human_review_required && typeof e.review_reason === 'string' && e.review_reason.trim() !== '')
    .forEach(evaluation => {
      const reason = evaluation.review_reason.trim();
      reviewReasons[reason] = (reviewReasons[reason] || 0) + 1;
    });

  return Object.entries(reviewReasons)
    .map(([reason, count]) => ({ reason, count }))
    .filter(item => item.reason && item.reason !== 'null' && item.reason.trim() !== '') // Final guard against invalid reasons
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .slice(0, 10); // Limit to top 10 reasons
}
