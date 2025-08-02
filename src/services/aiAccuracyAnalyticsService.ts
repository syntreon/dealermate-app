import { supabase } from '@/integrations/supabase/client';
import {
  AIAccuracyAnalyticsData,
  ModelPerformanceMetrics,
  ModelUsageData,
  ModelComparisonData,
  FailurePatternData,
  FailureCategory,
  CriticalFailureData,
  ModelFailureBreakdown,
  FailureTrendData,
  KeywordAnalysisData,
  KeywordFrequency,
  FailureCategoryBreakdown,
  TrendingIssueData,
  AccuracyTrendData,
  ConversationQualityMetrics,
  QualityTrendData,
  TechnicalMetricsData,
  TokenUsageStats,
  CostEfficiencyMetrics,
  CostTrendData,
  PerformanceDiagnostic,
  AIAccuracyFilters,
  QualityDataPoint,
  QualityDimensions,
  ModelQualityComparison,
  QualityCorrelationMatrix,
  QualityThresholdAnalysis,
  ResponseTimeTrend,
  TokenDistributionByModel,
  CostByModel,
  CostAccuracyPoint,
  CorrelationAnalysis
} from '@/types/aiAccuracyAnalytics';

export class AIAccuracyAnalyticsService {

  private static async _getFilteredCallsData(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ) {
    let query = supabase
      .from('calls')
      .select(`
        id,
        call_llm_model,
        created_at,
        call_duration_seconds,
        total_call_cost_usd,
        lead_evaluations(overall_evaluation_score),
        prompt_adherence_reviews(prompt_adherence_score, critical_failures_summary, what_went_wrong, recommendations_for_improvement),
        call_logs(extracted_keywords)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (modelType) {
      query = query.eq('call_llm_model', modelType);
    }

    if (callType === 'live') {
      query = query.eq('is_test_call', false);
    } else if (callType === 'test') {
      query = query.eq('is_test_call', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching calls data:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformanceMetrics(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ): Promise<ModelPerformanceMetrics> {
    try {
      const calls = await this._getFilteredCallsData(startDate, endDate, clientId, modelType, callType);
      const totalCalls = calls.length;

      // Group calls by model
      const modelGroups: { [modelName: string]: any[] } = {};
      calls.forEach(call => {
        const modelName = call.call_llm_model || 'Unknown';
        if (!modelGroups[modelName]) {
          modelGroups[modelName] = [];
        }
        modelGroups[modelName].push(call);
      });

      // Calculate metrics for each model
      const modelsUsed: ModelUsageData[] = Object.entries(modelGroups).map(([modelName, modelCalls]) => {
        const callCount = modelCalls.length;
        const usagePercentage = totalCalls > 0 ? (callCount / totalCalls) * 100 : 0;

        // Calculate average quality score
        const qualityScores = modelCalls
          .map(call => call.lead_evaluations?.[0]?.overall_evaluation_score)
          .filter(score => score !== null && score !== undefined);
        const averageQualityScore = qualityScores.length > 0
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
          : 0;

        // Calculate average adherence score
        const adherenceScores = modelCalls
          .map(call => call.prompt_adherence_reviews?.[0]?.prompt_adherence_score)
          .filter(score => score !== null && score !== undefined);
        const averageAdherenceScore = adherenceScores.length > 0
          ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length
          : 0;

        // Calculate failure rate
        const failuresCount = modelCalls.filter(call =>
          call.prompt_adherence_reviews?.[0]?.critical_failures_summary
        ).length;
        const failureRate = callCount > 0 ? (failuresCount / callCount) * 100 : 0;

        // Calculate cost efficiency
        const totalCost = modelCalls.reduce((sum, call) => sum + (call.total_call_cost_usd || 0), 0);
        const costEfficiency = callCount > 0 ? totalCost / callCount : 0;

        // Calculate average accuracy (combination of quality and adherence)
        const averageAccuracy = (averageQualityScore + averageAdherenceScore) / 2;

        // Calculate average response time (using call duration as proxy)
        const durations = modelCalls
          .map(call => call.call_duration_seconds)
          .filter(duration => duration !== null && duration !== undefined);
        const responseTime = durations.length > 0
          ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
          : 0;

        return {
          modelName,
          callCount,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          averageAccuracy: Math.round(averageAccuracy * 100) / 100,
          averageQualityScore: Math.round(averageQualityScore * 100) / 100,
          failureRate: Math.round(failureRate * 100) / 100,
          averageAdherenceScore: Math.round(averageAdherenceScore * 100) / 100,
          costEfficiency: Math.round(costEfficiency * 100) / 100,
          responseTime: Math.round(responseTime)
        };
      });

      // Calculate overall metrics
      const averageAccuracy = modelsUsed.length > 0
        ? modelsUsed.reduce((sum, model) => sum + model.averageAccuracy, 0) / modelsUsed.length
        : 0;

      const bestPerformingModel = modelsUsed.length > 0
        ? modelsUsed.reduce((best, current) =>
          current.averageAccuracy > best.averageAccuracy ? current : best
        ).modelName
        : 'N/A';

      const worstPerformingModel = modelsUsed.length > 0
        ? modelsUsed.reduce((worst, current) =>
          current.averageAccuracy < worst.averageAccuracy ? current : worst
        ).modelName
        : 'N/A';

      // Create performance comparison data
      const performanceComparison: ModelComparisonData[] = modelsUsed.map(model => ({
        modelName: model.modelName,
        accuracyScore: model.averageAccuracy,
        qualityScore: model.averageQualityScore,
        adherenceScore: model.averageAdherenceScore,
        failureRate: model.failureRate,
        costPerCall: model.costEfficiency,
        statisticalSignificance: model.callCount >= 30 // Basic threshold for statistical significance
      }));

      return {
        totalCalls,
        modelsUsed,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        bestPerformingModel,
        worstPerformingModel,
        performanceComparison
      };
    } catch (error) {
      console.error('[AIAccuracyAnalyticsService][getModelPerformanceMetrics] Error fetching model performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get accuracy trends over time
   */
  static async getAccuracyTrends(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ): Promise<AccuracyTrendData[]> {
    try {
      const calls = await this._getFilteredCallsData(startDate, endDate, clientId, modelType, callType);

      // Group calls by date
      const dateGroups: { [date: string]: any[] } = {};
      calls.forEach(call => {
        const date = new Date(call.created_at).toISOString().split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(call);
      });

      // Calculate trends for each date
      const trends: AccuracyTrendData[] = Object.entries(dateGroups).map(([date, dateCalls]) => {
        const modelAccuracies: { [modelName: string]: number } = {};
        let totalQualityScore = 0;
        let totalAdherenceScore = 0;
        let qualityCount = 0;
        let adherenceCount = 0;
        let failureCount = 0;

        dateCalls.forEach(call => {
          const modelName = call.call_llm_model || 'Unknown';

          // Track model-specific accuracy
          if (!modelAccuracies[modelName]) {
            modelAccuracies[modelName] = 0;
          }

          const qualityScore = call.lead_evaluations?.[0]?.overall_evaluation_score;
          const adherenceScore = call.prompt_adherence_reviews?.[0]?.prompt_adherence_score;

          if (qualityScore !== null && qualityScore !== undefined) {
            totalQualityScore += qualityScore;
            qualityCount++;
          }

          if (adherenceScore !== null && adherenceScore !== undefined) {
            totalAdherenceScore += adherenceScore;
            adherenceCount++;
          }

          // Calculate model accuracy (average of quality and adherence)
          const modelAccuracy = ((qualityScore || 0) + (adherenceScore || 0)) / 2;
          modelAccuracies[modelName] = modelAccuracy;

          // Count failures
          if (call.prompt_adherence_reviews?.[0]?.critical_failures_summary) {
            failureCount++;
          }
        });

        const overallAccuracy = qualityCount > 0 && adherenceCount > 0
          ? ((totalQualityScore / qualityCount) + (totalAdherenceScore / adherenceCount)) / 2
          : 0;

        return {
          date,
          overallAccuracy: Math.round(overallAccuracy * 100) / 100,
          modelAccuracies,
          qualityScore: qualityCount > 0 ? Math.round((totalQualityScore / qualityCount) * 100) / 100 : 0,
          adherenceScore: adherenceCount > 0 ? Math.round((totalAdherenceScore / adherenceCount) * 100) / 100 : 0,
          failureCount
        };
      });

      return trends.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching accuracy trends:', error);
      throw error;
    }
  }  /**
   
* Get failure patterns analysis
   */
  static async getFailurePatterns(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ): Promise<FailurePatternData> {
    try {
      const calls = await this._getFilteredCallsData(startDate, endDate, clientId, modelType);

      // Process failure data
      const failureCategories: { [category: string]: FailureCategory } = {};
      const criticalFailures: { [description: string]: CriticalFailureData } = {};
      const modelFailures: { [modelName: string]: ModelFailureBreakdown } = {};
      const failureTrends: { [date: string]: FailureTrendData } = {};

      calls.forEach(call => {
        const review = call.prompt_adherence_reviews?.[0];
        if (!review) return;

        const modelName = call.call_llm_model || 'Unknown';
        const date = new Date(call.created_at).toISOString().split('T')[0];

        // Initialize model failure tracking
        if (!modelFailures[modelName]) {
          modelFailures[modelName] = {
            modelName,
            totalFailures: 0,
            failureRate: 0,
            failureCategories: {}
          };
        }

        // Initialize date failure tracking
        if (!failureTrends[date]) {
          failureTrends[date] = {
            date,
            totalFailures: 0,
            failuresByModel: {},
            criticalFailures: 0
          };
        }

        // Process what went wrong
        if (review.what_went_wrong) {
          const wrongItems = this.parseJsonbArray(review.what_went_wrong);
          wrongItems?.forEach(item => {
            const category = this.categorizeFailure(item);

            if (!failureCategories[category]) {
              failureCategories[category] = {
                category,
                count: 0,
                percentage: 0,
                severity: this.getFailureSeverity(category),
                examples: []
              };
            }

            failureCategories[category].count++;
            if (failureCategories[category].examples.length < 3) {
              failureCategories[category].examples.push(item);
            }

            // Track model-specific failures
            modelFailures[modelName].totalFailures++;
            modelFailures[modelName].failureCategories[category] =
              (modelFailures[modelName].failureCategories[category] || 0) + 1;

            // Track date-specific failures
            failureTrends[date].totalFailures++;
            failureTrends[date].failuresByModel[modelName] =
              (failureTrends[date].failuresByModel[modelName] || 0) + 1;
          });
        }

        // Process critical failures
        if (review.critical_failures_summary) {
          const criticalFailure = review.critical_failures_summary;

          if (!criticalFailures[criticalFailure]) {
            criticalFailures[criticalFailure] = {
              description: criticalFailure,
              count: 0,
              affectedModels: [],
              firstOccurrence: call.created_at,
              lastOccurrence: call.created_at
            };
          }

          criticalFailures[criticalFailure].count++;
          if (!criticalFailures[criticalFailure].affectedModels.includes(modelName)) {
            criticalFailures[criticalFailure].affectedModels.push(modelName);
          }

          // Update occurrence dates
          if (new Date(call.created_at) < new Date(criticalFailures[criticalFailure].firstOccurrence)) {
            criticalFailures[criticalFailure].firstOccurrence = call.created_at;
          }
          if (new Date(call.created_at) > new Date(criticalFailures[criticalFailure].lastOccurrence)) {
            criticalFailures[criticalFailure].lastOccurrence = call.created_at;
          }

          failureTrends[date].criticalFailures++;
        }
      });

      // Calculate percentages and failure rates
      const totalFailures = Object.values(failureCategories).reduce((sum, cat) => sum + cat.count, 0);
      Object.values(failureCategories).forEach(category => {
        category.percentage = totalFailures > 0 ? Math.round((category.count / totalFailures) * 100) : 0;
      });

      // Calculate model failure rates
      const failuresByModel = Object.values(modelFailures).map(modelFailure => {
        const modelCalls = calls.filter(call => (call.call_llm_model || 'Unknown') === modelFailure.modelName).length;
        return {
          ...modelFailure,
          failureRate: modelCalls > 0 ? Math.round((modelFailure.totalFailures / modelCalls) * 100) : 0
        };
      });

      return {
        commonFailures: Object.values(failureCategories).sort((a, b) => b.count - a.count),
        criticalFailures: Object.values(criticalFailures).sort((a, b) => b.count - a.count),
        failuresByModel,
        failureTrends: Object.values(failureTrends).sort((a, b) => a.date.localeCompare(b.date))
      };
    } catch (error) {
      console.error('Error fetching failure patterns:', error);
      throw error;
    }
  }

  /**
   * Get keyword analysis from failure data
   */
  static async getKeywordAnalysis(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ): Promise<KeywordAnalysisData> {
    try {
      const calls = await this._getFilteredCallsData(startDate, endDate, clientId, modelType);

      const keywordFrequency: { [keyword: string]: KeywordFrequency } = {};
      const categoryBreakdown: { [category: string]: FailureCategoryBreakdown } = {};
      const trendingIssues: { [issue: string]: TrendingIssueData } = {};

      calls.forEach(call => {
        const review = call.prompt_adherence_reviews?.[0];
        if (!review) return;

        const modelName = call.call_llm_model || 'Unknown';

        // Process failure descriptions
        const allFailureText = [
          ...(this.parseJsonbArray(review.what_went_wrong) || []),
          review.critical_failures_summary || '',
          ...(this.parseJsonbArray(review.recommendations_for_improvement) || [])
        ].join(' ');

        // Extract keywords using simple text processing
        const keywords = this.extractKeywords(allFailureText);

        keywords.forEach(keyword => {
          const category = this.categorizeKeyword(keyword);

          if (!keywordFrequency[keyword]) {
            keywordFrequency[keyword] = {
              keyword,
              frequency: 0,
              category,
              trend: 'stable' // Would need historical data to determine actual trend
            };
          }
          keywordFrequency[keyword].frequency++;

          // Update category breakdown
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = {
              category,
              count: 0,
              percentage: 0,
              keywords: []
            };
          }
          categoryBreakdown[category].count++;
          if (!categoryBreakdown[category].keywords.includes(keyword)) {
            categoryBreakdown[category].keywords.push(keyword);
          }

          // Track trending issues
          if (!trendingIssues[keyword]) {
            trendingIssues[keyword] = {
              issue: keyword,
              frequency: 0,
              trend: 'stable',
              affectedModels: []
            };
          }
          trendingIssues[keyword].frequency++;
          if (!trendingIssues[keyword].affectedModels.includes(modelName)) {
            trendingIssues[keyword].affectedModels.push(modelName);
          }
        });
      });

      // Calculate percentages
      const totalCategoryCount = Object.values(categoryBreakdown).reduce((sum, cat) => sum + cat.count, 0);
      Object.values(categoryBreakdown).forEach(category => {
        category.percentage = totalCategoryCount > 0 ? Math.round((category.count / totalCategoryCount) * 100) : 0;
      });

      return {
        topFailureKeywords: Object.values(keywordFrequency)
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 20), // Top 20 keywords
        failureCategories: Object.values(categoryBreakdown)
          .sort((a, b) => b.count - a.count),
        trendingIssues: Object.values(trendingIssues)
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 10) // Top 10 trending issues
      };
    } catch (error) {
      console.error('Error fetching keyword analysis:', error);
      throw error;
    }
  }

  /**
   * Get conversation quality metrics with enhanced correlation analysis
   */
  static async getConversationQualityMetrics(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ): Promise<ConversationQualityMetrics> {
    try {
      const calls = await this._getFilteredCallsData(startDate, endDate, clientId, modelType);

      // Enhanced quality correlation analysis
      const qualityCorrelation = await this.correlateQualityWithModels(calls);
      const qualityAggregation = this.aggregateQualityScores(calls);
      const qualityTrends = this.analyzeQualityTrendsOverTime(calls);

      return {
        overallQualityScore: qualityAggregation.overallQualityScore,
        qualityByModel: qualityCorrelation.qualityByModel,
        sentimentDistribution: qualityAggregation.sentimentDistribution,
        qualityTrends: qualityTrends,
        // Enhanced correlation data
        qualityDimensionsByModel: qualityCorrelation.qualityDimensionsByModel,
        modelQualityComparison: qualityCorrelation.modelQualityComparison,
        qualityCorrelationMatrix: qualityCorrelation.correlationMatrix,
        qualityThresholdAnalysis: qualityCorrelation.thresholdAnalysis
      };
    } catch (error) {
      console.error('Error fetching conversation quality metrics:', error);
      throw error;
    }
  }

  /**
   * Get technical metrics data including response times, token usage, and cost efficiency
   */
  static async getTechnicalMetrics(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    callType?: 'all' | 'live' | 'test'
  ): Promise<TechnicalMetricsData> {
    try {
      const calls = await this._getFilteredCallsData(startDate, endDate, clientId, modelType);
      if (calls.length === 0) {
        return this.getEmptyTechnicalMetricsData();
      }

      // Calculate technical metrics
      const responseTimeStats = this.calculateResponseTimeStats(calls);
      const tokenUsageStats = this.calculateTokenUsageStats(calls);
      const costEfficiencyMetrics = this.calculateCostEfficiencyMetrics(calls);
      const metrics: TechnicalMetricsData = {
        averageResponseTime: responseTimeStats.avg,
        responseTimeStats,
        responseTimeTrend: this.calculateResponseTimeTrends(calls),
        tokenUsageStats,
        tokenDistributionByModel: this.calculateTokenDistributionByModel(calls),
        costEfficiencyMetrics,
        costTrend: this.calculateCostTrends(calls),
        costByModel: this.calculateCostByModel(calls),
        costAccuracyCorrelation: this.calculateCostAccuracyCorrelation(calls),
        performanceDiagnostics: [], // This will be populated below
        correlationAnalysis: [this.calculateCorrelationAnalysis(calls)],
        performanceInsights: [], // This will be populated below
      };

      metrics.performanceDiagnostics = this.generatePerformanceDiagnostics(metrics);
      metrics.performanceInsights = this.generatePerformanceInsights(metrics.performanceDiagnostics);

      return metrics;
    } catch (error) {
      console.error('Error fetching technical metrics:', error);
      throw error;
    }
  }

  private static async correlateQualityWithModels(calls: any[]): Promise<{
    qualityByModel: { [modelName: string]: number };
    qualityDimensionsByModel: { [modelName: string]: QualityDimensions };
    modelQualityComparison: ModelQualityComparison[];
    correlationMatrix: QualityCorrelationMatrix;
    thresholdAnalysis: QualityThresholdAnalysis;
  }> {
    const modelQualityData: { [modelName: string]: QualityDataPoint[] } = {};

    // Collect quality data points for each model
    calls.forEach(call => {
      const evaluation = call.lead_evaluations?.[0];
      if (!evaluation) return;

      const modelName = call.call_llm_model || 'Unknown';

      if (!modelQualityData[modelName]) {
        modelQualityData[modelName] = [];
      }

      const qualityPoint: QualityDataPoint = {
        overallScore: evaluation.overall_evaluation_score || 0,
        clarityPoliteness: evaluation.clarity_politeness_score || 0,
        naturalness: evaluation.naturalness_score || 0,
        relevanceQuestions: evaluation.relevance_questions_score || 0,
        objectionHandling: evaluation.objection_handling_score || 0,
        leadIntent: evaluation.lead_intent_score || 0,
        sentiment: evaluation.sentiment || 'neutral',
        timestamp: call.created_at
      };

      modelQualityData[modelName].push(qualityPoint);
    });

    // Calculate quality metrics by model
    const qualityByModel: { [modelName: string]: number } = {};
    const qualityDimensionsByModel: { [modelName: string]: QualityDimensions } = {};
    const modelQualityComparison: ModelQualityComparison[] = [];

    Object.entries(modelQualityData).forEach(([modelName, dataPoints]) => {
      if (dataPoints.length === 0) return;

      // Calculate average quality score
      const avgOverallScore = dataPoints.reduce((sum, point) => sum + point.overallScore, 0) / dataPoints.length;
      qualityByModel[modelName] = Math.round(avgOverallScore * 100) / 100;

      // Calculate quality dimensions
      const dimensions: QualityDimensions = {
        clarityPoliteness: dataPoints.reduce((sum, point) => sum + point.clarityPoliteness, 0) / dataPoints.length,
        naturalness: dataPoints.reduce((sum, point) => sum + point.naturalness, 0) / dataPoints.length,
        relevanceQuestions: dataPoints.reduce((sum, point) => sum + point.relevanceQuestions, 0) / dataPoints.length,
        objectionHandling: dataPoints.reduce((sum, point) => sum + point.objectionHandling, 0) / dataPoints.length,
        leadIntent: dataPoints.reduce((sum, point) => sum + point.leadIntent, 0) / dataPoints.length,
        sentimentDistribution: this.calculateSentimentDistribution(dataPoints)
      };

      qualityDimensionsByModel[modelName] = {
        clarityPoliteness: Math.round(dimensions.clarityPoliteness * 100) / 100,
        naturalness: Math.round(dimensions.naturalness * 100) / 100,
        relevanceQuestions: Math.round(dimensions.relevanceQuestions * 100) / 100,
        objectionHandling: Math.round(dimensions.objectionHandling * 100) / 100,
        leadIntent: Math.round(dimensions.leadIntent * 100) / 100,
        sentimentDistribution: dimensions.sentimentDistribution
      };

      // Calculate statistical metrics for comparison
      const standardDeviation = this.calculateStandardDeviation(dataPoints.map(p => p.overallScore));
      const confidenceInterval = this.calculateConfidenceInterval(dataPoints.map(p => p.overallScore));

      modelQualityComparison.push({
        modelName,
        averageQualityScore: avgOverallScore,
        sampleSize: dataPoints.length,
        standardDeviation,
        confidenceInterval,
        qualityConsistency: this.calculateQualityConsistency(dataPoints),
        strengthAreas: this.identifyStrengthAreas(dimensions),
        improvementAreas: this.identifyImprovementAreas(dimensions)
      });
    });

    // Calculate correlation matrix between quality dimensions
    const correlationMatrix = this.calculateQualityCorrelationMatrix(Object.values(modelQualityData).flat());

    // Analyze quality thresholds
    const thresholdAnalysis = this.analyzeQualityThresholds(modelQualityData);

    return {
      qualityByModel,
      qualityDimensionsByModel,
      modelQualityComparison: modelQualityComparison.sort((a, b) => b.averageQualityScore - a.averageQualityScore),
      correlationMatrix,
      thresholdAnalysis
    };
  }

  /**
   * Aggregate quality scores across different evaluation dimensions
   */
  private static aggregateQualityScores(calls: any[]): {
    overallQualityScore: number;
    sentimentDistribution: { [sentiment: string]: number };
    dimensionAverages: QualityDimensions;
  } {
    let totalQualityScore = 0;
    let qualityCount = 0;
    const sentimentDistribution: { [sentiment: string]: number } = {};
    const dimensionTotals = {
      clarityPoliteness: 0,
      naturalness: 0,
      relevanceQuestions: 0,
      objectionHandling: 0,
      leadIntent: 0
    };
    const dimensionCounts = {
      clarityPoliteness: 0,
      naturalness: 0,
      relevanceQuestions: 0,
      objectionHandling: 0,
      leadIntent: 0
    };

    calls.forEach(call => {
      const evaluation = call.lead_evaluations?.[0];
      if (!evaluation) return;

      // Overall quality score
      if (evaluation.overall_evaluation_score !== null) {
        totalQualityScore += evaluation.overall_evaluation_score;
        qualityCount++;
      }

      // Sentiment distribution
      if (evaluation.sentiment) {
        sentimentDistribution[evaluation.sentiment] = (sentimentDistribution[evaluation.sentiment] || 0) + 1;
      }

      // Individual dimensions
      if (evaluation.clarity_politeness_score !== null) {
        dimensionTotals.clarityPoliteness += evaluation.clarity_politeness_score;
        dimensionCounts.clarityPoliteness++;
      }
      if (evaluation.naturalness_score !== null) {
        dimensionTotals.naturalness += evaluation.naturalness_score;
        dimensionCounts.naturalness++;
      }
      if (evaluation.relevance_questions_score !== null) {
        dimensionTotals.relevanceQuestions += evaluation.relevance_questions_score;
        dimensionCounts.relevanceQuestions++;
      }
      if (evaluation.objection_handling_score !== null) {
        dimensionTotals.objectionHandling += evaluation.objection_handling_score;
        dimensionCounts.objectionHandling++;
      }
      if (evaluation.lead_intent_score !== null) {
        dimensionTotals.leadIntent += evaluation.lead_intent_score;
        dimensionCounts.leadIntent++;
      }
    });

    const overallQualityScore = qualityCount > 0 ? totalQualityScore / qualityCount : 0;

    const dimensionAverages: QualityDimensions = {
      clarityPoliteness: dimensionCounts.clarityPoliteness > 0 ? dimensionTotals.clarityPoliteness / dimensionCounts.clarityPoliteness : 0,
      naturalness: dimensionCounts.naturalness > 0 ? dimensionTotals.naturalness / dimensionCounts.naturalness : 0,
      relevanceQuestions: dimensionCounts.relevanceQuestions > 0 ? dimensionTotals.relevanceQuestions / dimensionCounts.relevanceQuestions : 0,
      objectionHandling: dimensionCounts.objectionHandling > 0 ? dimensionTotals.objectionHandling / dimensionCounts.objectionHandling : 0,
      leadIntent: dimensionCounts.leadIntent > 0 ? dimensionTotals.leadIntent / dimensionCounts.leadIntent : 0,
      sentimentDistribution
    };

    return {
      overallQualityScore: Math.round(overallQualityScore * 100) / 100,
      sentimentDistribution,
      dimensionAverages
    };
  }

  /**
   * Analyze quality trends over time with model breakdown
   */
  private static analyzeQualityTrendsOverTime(calls: any[]): QualityTrendData[] {
    // Define a temporary type for intermediate calculations to avoid type errors
    type TempQualityTrend = QualityTrendData & {
      qualityCount: number;
      modelQualityCounts: { [modelName: string]: number };
    };

    const qualityTrends: { [date: string]: TempQualityTrend } = {};

    calls.forEach(call => {
      const evaluation = call.lead_evaluations?.[0];
      if (!evaluation) return;

      const modelName = call.call_llm_model || 'Unknown';
      const date = new Date(call.created_at).toISOString().split('T')[0];

      if (!qualityTrends[date]) {
        qualityTrends[date] = {
          date,
          averageQuality: 0,
          sentimentScores: {},
          modelQuality: {},
          qualityCount: 0,
          modelQualityCounts: {}
        };
      }

      // Track overall quality for the date
      if (evaluation.overall_evaluation_score !== null) {
        qualityTrends[date].averageQuality += evaluation.overall_evaluation_score;
        qualityTrends[date].qualityCount = (qualityTrends[date].qualityCount || 0) + 1;
      }

      // Track sentiment for the date
      if (evaluation.sentiment) {
        qualityTrends[date].sentimentScores[evaluation.sentiment] =
          (qualityTrends[date].sentimentScores[evaluation.sentiment] || 0) + 1;
      }

      // Track model-specific quality for the date
      if (!qualityTrends[date].modelQuality[modelName]) {
        qualityTrends[date].modelQuality[modelName] = 0;
        qualityTrends[date].modelQualityCounts = qualityTrends[date].modelQualityCounts || {};
        qualityTrends[date].modelQualityCounts[modelName] = 0;
      }

      if (evaluation.overall_evaluation_score !== null) {
        qualityTrends[date].modelQuality[modelName] += evaluation.overall_evaluation_score;
        qualityTrends[date].modelQualityCounts[modelName]++;
      }
    });

    // Calculate final averages
    const processedQualityTrends = Object.values(qualityTrends).map(trend => {
      // Calculate average quality for the date
      const averageQuality = trend.qualityCount > 0 ? trend.averageQuality / trend.qualityCount : 0;

      // Calculate model-specific averages
      const modelQuality: { [modelName: string]: number } = {};
      Object.keys(trend.modelQuality).forEach(modelName => {
        const count = trend.modelQualityCounts?.[modelName] || 1;
        modelQuality[modelName] = count > 0 ? trend.modelQuality[modelName] / count : 0;
      });

      return {
        date: trend.date,
        averageQuality: Math.round(averageQuality * 100) / 100,
        sentimentScores: trend.sentimentScores,
        modelQuality
      };
    });

    // Sort trends by date ascending
    return processedQualityTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private static calculateSentimentDistribution(dataPoints: QualityDataPoint[]): { [sentiment: string]: number } {
    const distribution: { [sentiment: string]: number } = {};
    const total = dataPoints.length;

    dataPoints.forEach(point => {
      distribution[point.sentiment] = (distribution[point.sentiment] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(distribution).forEach(sentiment => {
      distribution[sentiment] = Math.round((distribution[sentiment] / total) * 100);
    });

    return distribution;
  }

  /**
   * Calculate correlation matrix between quality dimensions
   */
  private static calculateQualityCorrelationMatrix(dataPoints: QualityDataPoint[]): QualityCorrelationMatrix {
    if (dataPoints.length === 0) {
      return {
        clarityVsNaturalness: 0,
        clarityVsRelevance: 0,
        clarityVsObjection: 0,
        clarityVsLeadIntent: 0,
        naturalnessVsRelevance: 0,
        naturalnessVsObjection: 0,
        naturalnessVsLeadIntent: 0,
        relevanceVsObjection: 0,
        relevanceVsLeadIntent: 0,
        objectionVsLeadIntent: 0
      };
    }

    const correlations = {
      clarityVsNaturalness: this.calculateCorrelation(
        dataPoints.map(p => p.clarityPoliteness),
        dataPoints.map(p => p.naturalness)
      ),
      clarityVsRelevance: this.calculateCorrelation(
        dataPoints.map(p => p.clarityPoliteness),
        dataPoints.map(p => p.relevanceQuestions)
      ),
      clarityVsObjection: this.calculateCorrelation(
        dataPoints.map(p => p.clarityPoliteness),
        dataPoints.map(p => p.objectionHandling)
      ),
      clarityVsLeadIntent: this.calculateCorrelation(
        dataPoints.map(p => p.clarityPoliteness),
        dataPoints.map(p => p.leadIntent)
      ),
      naturalnessVsRelevance: this.calculateCorrelation(
        dataPoints.map(p => p.naturalness),
        dataPoints.map(p => p.relevanceQuestions)
      ),
      naturalnessVsObjection: this.calculateCorrelation(
        dataPoints.map(p => p.naturalness),
        dataPoints.map(p => p.objectionHandling)
      ),
      naturalnessVsLeadIntent: this.calculateCorrelation(
        dataPoints.map(p => p.naturalness),
        dataPoints.map(p => p.leadIntent)
      ),
      relevanceVsObjection: this.calculateCorrelation(
        dataPoints.map(p => p.relevanceQuestions),
        dataPoints.map(p => p.objectionHandling)
      ),
      relevanceVsLeadIntent: this.calculateCorrelation(
        dataPoints.map(p => p.relevanceQuestions),
        dataPoints.map(p => p.leadIntent)
      ),
      objectionVsLeadIntent: this.calculateCorrelation(
        dataPoints.map(p => p.objectionHandling),
        dataPoints.map(p => p.leadIntent)
      )
    };

    // Round all correlations
    Object.keys(correlations).forEach(key => {
      correlations[key as keyof QualityCorrelationMatrix] = Math.round(correlations[key as keyof QualityCorrelationMatrix] * 100) / 100;
    });

    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Analyze quality thresholds across models
   */
  private static analyzeQualityThresholds(modelQualityData: { [modelName: string]: QualityDataPoint[] }): QualityThresholdAnalysis {
    const thresholds = [6.0, 7.0, 8.0, 9.0];
    const thresholdAnalysis: QualityThresholdAnalysis = {
      thresholdPerformance: {},
      modelRankings: [],
      qualityDistribution: {}
    };

    // Analyze threshold performance for each model
    Object.entries(modelQualityData).forEach(([modelName, dataPoints]) => {
      if (dataPoints.length === 0) return;

      thresholdAnalysis.thresholdPerformance[modelName] = {};

      thresholds.forEach(threshold => {
        const aboveThreshold = dataPoints.filter(point => point.overallScore >= threshold).length;
        const percentage = Math.round((aboveThreshold / dataPoints.length) * 100);
        thresholdAnalysis.thresholdPerformance[modelName][threshold] = percentage;
      });

      // Calculate quality distribution
      const scores = dataPoints.map(point => point.overallScore);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      thresholdAnalysis.modelRankings.push({
        modelName,
        averageScore: Math.round(avgScore * 100) / 100,
        sampleSize: dataPoints.length,
        aboveExcellent: thresholdAnalysis.thresholdPerformance[modelName][9.0] || 0,
        aboveGood: thresholdAnalysis.thresholdPerformance[modelName][8.0] || 0
      });

      // Quality distribution buckets
      const distribution = {
        excellent: scores.filter(s => s >= 9.0).length,
        good: scores.filter(s => s >= 8.0 && s < 9.0).length,
        satisfactory: scores.filter(s => s >= 7.0 && s < 8.0).length,
        needsImprovement: scores.filter(s => s < 7.0).length
      };

      thresholdAnalysis.qualityDistribution[modelName] = {
        excellent: Math.round((distribution.excellent / scores.length) * 100),
        good: Math.round((distribution.good / scores.length) * 100),
        satisfactory: Math.round((distribution.satisfactory / scores.length) * 100),
        needsImprovement: Math.round((distribution.needsImprovement / scores.length) * 100)
      };
    });

    // Sort model rankings by average score
    thresholdAnalysis.modelRankings.sort((a, b) => b.averageScore - a.averageScore);

    return thresholdAnalysis;
  }

  // Helper methods
  private static parseJsonbArray(jsonbData: any): string[] | null {
    if (!jsonbData) return null;

    if (Array.isArray(jsonbData)) {
      return jsonbData.filter(item => typeof item === 'string');
    }

    if (typeof jsonbData === 'string') {
      try {
        const parsed = JSON.parse(jsonbData);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === 'string');
        }
      } catch (e) {
        // If JSON parsing fails, treat as plain text and split by common delimiters
        const items = jsonbData
          .split(/(?:Rule:|CRITICAL FAILURE:|Guiding Principle:|Systemic Change:|Training\/Fine-tuning:|Refinement:|Error Recovery:)/)
          .map(item => item.trim())
          .filter(item => item.length > 0);

        if (items.length > 1) {
          return items;
        }

        return [jsonbData];
      }
    }

    return null;
  }

  private static categorizeFailure(failureText: string): string {
    const text = failureText.toLowerCase();

    if (text.includes('hallucin') || text.includes('made up') || text.includes('fabricat')) {
      return 'hallucination';
    }
    if (text.includes('transcrib') || text.includes('speech') || text.includes('audio')) {
      return 'transcriber';
    }
    if (text.includes('rule') || text.includes('protocol') || text.includes('guideline')) {
      return 'rules';
    }
    if (text.includes('prompt') || text.includes('instruction') || text.includes('adherence')) {
      return 'protocol';
    }

    return 'other';
  }

  private static getFailureSeverity(category: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (category) {
      case 'hallucination':
        return 'critical';
      case 'rules':
        return 'high';
      case 'protocol':
        return 'high';
      case 'transcriber':
        return 'medium';
      default:
        return 'low';
    }
  }

  private static extractKeywords(text: string): string[] {
    if (!text) return [];

    // Simple keyword extraction - split by common delimiters and filter meaningful words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Remove duplicates and return
    return [...new Set(words)];
  }

  private static isStopWord(word: string): boolean {
    const stopWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
    ];
    return stopWords.includes(word);
  }

  private static categorizeKeyword(keyword: string): 'hallucination' | 'transcriber' | 'rules' | 'protocol' | 'other' {
    const word = keyword.toLowerCase();

    if (word.includes('hallucin') || word.includes('fabricat') || word.includes('made') || word.includes('invent')) {
      return 'hallucination';
    }
    if (word.includes('transcrib') || word.includes('speech') || word.includes('audio') || word.includes('hear')) {
      return 'transcriber';
    }
    if (word.includes('rule') || word.includes('guideline') || word.includes('policy')) {
      return 'rules';
    }
    if (word.includes('protocol') || word.includes('procedure') || word.includes('process') || word.includes('prompt')) {
      return 'protocol';
    }

    return 'other';
  }

  /**
   * Create empty technical metrics data structure for when no data is available
   */
  private static getEmptyTechnicalMetricsData(): TechnicalMetricsData {
    return {
      averageResponseTime: 0,
      responseTimeStats: { avg: 0, median: 0, p95: 0, p99: 0 },
      responseTimeTrend: [],
      tokenUsageStats: {
        totalTokensUsed: 0,
        averageInputTokens: 0,
        averageOutputTokens: 0,
        totalTokens: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        input: 0,
        output: 0,
        tokensByModel: {}
      },
      tokenDistributionByModel: [],
      costEfficiencyMetrics: {
        averageCostPerCall: 0,
        avgCostPerCall: 0,
        avgCostPer1kTokens: 0,
        costAccuracyRatio: 0,
        costByModel: {},
        costTrends: [],
        costVsAccuracyCorrelation: 0
      },
      costTrend: [],
      costByModel: [],
      costAccuracyCorrelation: [],
      performanceDiagnostics: [],
      correlationAnalysis: [],
      performanceInsights: []
    };
  }

  /**
   * Calculate percentile value from an array of numbers
   */
  private static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const index = (percentile / 100) * (values.length - 1);
    if (Math.floor(index) === index) {
      return values[index];
    }
    const lower = Math.floor(index);
    const upper = lower + 1;
    const weight = index - lower;
    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  /**
   * Calculate response time statistics
   */
  private static calculateResponseTimeStats(calls: any[]): { avg: number; median: number; p95: number; p99: number } {
    const responseTimes = calls.map(call => call.call_duration_seconds).filter(rt => typeof rt === 'number');
    if (responseTimes.length === 0) return { avg: 0, median: 0, p95: 0, p99: 0 };

    const sum = responseTimes.reduce((a, b) => a + b, 0);
    const avg = sum / responseTimes.length;
    const median = this.calculatePercentile(responseTimes, 50);
    const p95 = this.calculatePercentile(responseTimes, 95);
    const p99 = this.calculatePercentile(responseTimes, 99);

    return { avg, median, p95, p99 };
  }

  /**
   * Calculate response time trends by day
   */
  private static calculateResponseTimeTrends(calls: any[]): ResponseTimeTrend[] {
    const dailyMetrics: { [key: string]: { responseTimes: number[] } } = {};

    calls.forEach(call => {
      if (call.call_duration_seconds === null || call.call_duration_seconds === undefined) return;
      const date = new Date(call.created_at).toISOString().split('T')[0];
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { responseTimes: [] };
      }
      dailyMetrics[date].responseTimes.push(call.call_duration_seconds);
    });

    return Object.entries(dailyMetrics).map(([date, metrics]) => {
      const average = metrics.responseTimes.length > 0 ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length : 0;
      const p95 = metrics.responseTimes.length > 0 ? this.calculatePercentile(metrics.responseTimes, 95) : 0;
      return {
        date,
        average,
        p95,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate token usage statistics
   */
  private static calculateTokenUsageStats(calls: any[]): TokenUsageStats {
    const tokens = calls.map(c => c.total_tokens).filter(t => typeof t === 'number');
    if (tokens.length === 0) return {
      totalTokensUsed: 0,
      averageInputTokens: 0,
      averageOutputTokens: 0,
      totalTokens: 0,
      avgInputTokens: 0,
      avgOutputTokens: 0,
      input: 0,
      output: 0,
      tokensByModel: {}
    };
    const totalTokens = tokens.reduce((sum, t) => sum + t, 0);
    return {
      totalTokensUsed: totalTokens,
      averageInputTokens: totalTokens / tokens.length,
      averageOutputTokens: totalTokens / tokens.length,
      totalTokens: totalTokens,
      avgInputTokens: totalTokens / tokens.length,
      avgOutputTokens: totalTokens / tokens.length,
      input: totalTokens,
      output: totalTokens,
      tokensByModel: {}
    };
  }

  /**
   * Calculate token distribution by model
   */
  private static calculateTokenDistributionByModel(calls: any[]): TokenDistributionByModel[] {
    return []; // Placeholder
  }

  /**
   * Calculate cost efficiency metrics
   */
  private static calculateCostEfficiencyMetrics(calls: any[]): CostEfficiencyMetrics {
    return {
      averageCostPerCall: 0,
      avgCostPerCall: 0,
      avgCostPer1kTokens: 0,
      costAccuracyRatio: 0,
      costByModel: {},
      costTrends: [],
      costVsAccuracyCorrelation: 0
    }; // Placeholder
  }

  /**
   * Calculate cost trends over time
   */
  private static calculateCostTrends(calls: any[]): CostTrendData[] {
    return []; // Placeholder
  }

  /**
   * Calculate cost by model
   */
  private static calculateCostByModel(calls: any[]): CostByModel[] {
    const costs: { [model: string]: { totalCost: number, count: number } } = {};
    calls.forEach(call => {
      const model = call.model || 'Unknown';
      const cost = call.total_call_cost_usd;
      if (typeof cost === 'number') {
        if (!costs[model]) {
          costs[model] = { totalCost: 0, count: 0 };
        }
        costs[model].totalCost += cost;
        costs[model].count++;
      }
    });
    return Object.entries(costs).map(([model, data]) => ({
      model,
      totalCost: data.totalCost,
      averageCost: data.count > 0 ? data.totalCost / data.count : 0
    }));
  }

  /**
   * Calculate cost vs accuracy correlation
   */
  private static calculateCostAccuracyCorrelation(calls: any[]): CostAccuracyPoint[] {
    return []; // Placeholder
  }


  /**
   * Generate performance diagnostics based on metrics
   */
  private static generatePerformanceDiagnostics(metrics: TechnicalMetricsData): PerformanceDiagnostic[] {
    const diagnostics: PerformanceDiagnostic[] = [];

    if (metrics.responseTimeStats.p95 > 30) {
      diagnostics.push({
        metric: 'High Response Time (p95)',
        value: metrics.responseTimeStats.p95,
        status: 'warning',
        remediation: 'Investigate slow API responses or long-running tool calls.',
        impact: 'User experience degradation.'
      });
    }

    if (metrics.costEfficiencyMetrics.avgCostPerCall > 1.0) {
      diagnostics.push({
        metric: 'High Average Cost Per Call',
        value: metrics.costEfficiencyMetrics.avgCostPerCall,
        status: 'warning',
        remediation: 'Review token usage, prompt engineering, and model selection.',
        impact: 'Increased operational costs.'
      });
    }

    return diagnostics;
  }

  /**
   * Calculate correlation analysis between different metrics
   */
  private static calculateCorrelationAnalysis(calls: any[]): CorrelationAnalysis {
    const validCalls = calls.filter(call =>
      call.lead_evaluations?.[0]?.overall_evaluation_score !== null &&
      call.call_duration_seconds !== null &&
      call.total_call_cost_usd !== null
    );

    if (validCalls.length < 2) {
      return {
        responseTimeVsQuality: 0,
        tokenUsageVsQuality: 0,
        costVsQuality: 0,
      };
    }

    const qualityScores = validCalls.map(call => call.lead_evaluations[0].overall_evaluation_score);
    const responseTimes = validCalls.map(call => call.call_duration_seconds);
    const tokenUsages = validCalls.map(call => (call.openai_api_tokens_input || 0) + (call.openai_api_tokens_output || 0));
    const costs = validCalls.map(call => call.total_call_cost_usd);

    return {
      responseTimeVsQuality: this.calculateCorrelation(qualityScores, responseTimes),
      tokenUsageVsQuality: this.calculateCorrelation(qualityScores, tokenUsages),
      costVsQuality: this.calculateCorrelation(qualityScores, costs),
    };
  }

  /**
   * Generate performance insights based on metrics
   */
  private static generatePerformanceInsights(diagnostics: PerformanceDiagnostic[]): string[] {
    const insights: string[] = [];

    if (diagnostics.length === 0) {
      insights.push("All performance metrics are within optimal ranges.");
      return insights;
    }

    const criticalIssues = diagnostics.filter(d => d.status === 'critical').length;
    const warningIssues = diagnostics.filter(d => d.status === 'warning').length;

    if (criticalIssues > 0) {
      insights.push(`${criticalIssues} critical performance issues require immediate attention.`);
    }

    if (warningIssues > 0) {
      insights.push(`${warningIssues} performance warnings detected that may benefit from optimization.`);
    }

    if (criticalIssues === 0 && warningIssues === 0) {
      insights.push("System performance is operating within acceptable parameters.");
    }

    return insights;
  }

  /**
   * Calculate standard deviation of an array of numbers
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const meanSquaredDifference = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(meanSquaredDifference);
  }

  /**
   * Calculate 95% confidence interval for an array of numbers
   */
  private static calculateConfidenceInterval(values: number[]): { lower: number; upper: number } {
    if (values.length === 0) return { lower: 0, upper: 0 };

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const standardDeviation = this.calculateStandardDeviation(values);
    const standardError = standardDeviation / Math.sqrt(values.length);
    const marginOfError = 1.96 * standardError; // 95% confidence interval

    return { lower: mean - marginOfError, upper: mean + marginOfError };
  }

  /**
   * Calculate quality consistency score based on variance of scores
   */
  private static calculateQualityConsistency(dataPoints: QualityDataPoint[]): number {
    if (dataPoints.length === 0) return 0;

    const scores = dataPoints.map(p => p.overallScore);
    const standardDeviation = this.calculateStandardDeviation(scores);

    // Convert to consistency score (0-100, where lower standard deviation = higher consistency)
    // Using inverse relationship: consistency = 100 / (1 + standardDeviation)
    return Math.min(100, 100 / (1 + standardDeviation));
  }

  /**
   * Identify strength areas based on quality dimensions
   */
  private static identifyStrengthAreas(dimensions: QualityDimensions): string[] {
    const strengths: string[] = [];

    if (dimensions.accuracy >= 4.0) strengths.push('Accuracy');
    if (dimensions.completeness >= 4.0) strengths.push('Completeness');
    if (dimensions.relevance >= 4.0) strengths.push('Relevance');
    if (dimensions.clarity >= 4.0) strengths.push('Clarity');
    if (dimensions.professionalism >= 4.0) strengths.push('Professionalism');

    return strengths;
  }

  /**
   * Identify improvement areas based on quality dimensions
   */
  private static identifyImprovementAreas(dimensions: QualityDimensions): string[] {
    const improvements: string[] = [];

    if (dimensions.accuracy < 4.0) improvements.push('Accuracy');
    if (dimensions.completeness < 4.0) improvements.push('Completeness');
    if (dimensions.relevance < 4.0) improvements.push('Relevance');
    if (dimensions.clarity < 4.0) improvements.push('Clarity');
    if (dimensions.professionalism < 4.0) improvements.push('Professionalism');

    return improvements;
  }
}