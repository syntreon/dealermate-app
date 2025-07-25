import { supabase } from '@/integrations/supabase/client';
import { ModelPerformanceAnalysis } from './modelPerformanceAnalysis';
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
  AIAccuracyFilters
} from '@/types/aiAccuracyAnalytics';

export class AIAccuracyAnalyticsService {
  /**
   * Get comprehensive AI accuracy analytics data
   */
  static async getAnalyticsData(filters?: AIAccuracyFilters): Promise<AIAccuracyAnalyticsData> {
    try {
      const { startDate, endDate, clientId, modelType, accuracyThreshold } = filters || {};
      
      // Calculate date range if not provided
      const now = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(now.getMonth() - 1); // Default to last month
      
      const effectiveStartDate = startDate || defaultStartDate.toISOString();
      const effectiveEndDate = endDate || now.toISOString();

      // Fetch all required data in parallel
      const [
        modelPerformance,
        accuracyTrends,
        failurePatterns,
        keywordAnalysis,
        conversationQuality,
        technicalMetrics
      ] = await Promise.all([
        ModelPerformanceAnalysis.getEnhancedModelPerformanceMetrics(effectiveStartDate, effectiveEndDate, clientId, modelType),
        this.getAccuracyTrends(effectiveStartDate, effectiveEndDate, clientId, modelType),
        this.getFailurePatterns(effectiveStartDate, effectiveEndDate, clientId, modelType),
        this.getKeywordAnalysis(effectiveStartDate, effectiveEndDate, clientId, modelType),
        this.getConversationQualityMetrics(effectiveStartDate, effectiveEndDate, clientId, modelType),
        this.getTechnicalMetrics(effectiveStartDate, effectiveEndDate, clientId, modelType)
      ]);

      return {
        modelPerformance,
        accuracyTrends,
        failurePatterns,
        keywordAnalysis,
        conversationQuality,
        technicalMetrics
      };
    } catch (error) {
      console.error('Error fetching AI accuracy analytics data:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformanceMetrics(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string
  ): Promise<ModelPerformanceMetrics> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          id,
          call_llm_model,
          created_at,
          call_duration_seconds,
          total_call_cost_usd,
          lead_evaluations(overall_evaluation_score),
          prompt_adherence_reviews(prompt_adherence_score, critical_failures_summary)
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
      
      if (error) throw error;

      const calls = callsData || [];
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
      console.error('Error fetching model performance metrics:', error);
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
    modelType?: string
  ): Promise<AccuracyTrendData[]> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          created_at,
          call_llm_model,
          lead_evaluations(overall_evaluation_score),
          prompt_adherence_reviews(prompt_adherence_score, critical_failures_summary)
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

      const { data: callsData, error } = await query;
      
      if (error) throw error;

      const calls = callsData || [];

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
    modelType?: string
  ): Promise<FailurePatternData> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          id,
          call_llm_model,
          created_at,
          prompt_adherence_reviews(
            prompt_adherence_score,
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
      
      if (error) throw error;

      const calls = callsData || [];
      
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
        const modelCalls = callsData.filter(call => (call.call_llm_model || 'Unknown') === modelFailure.modelName).length;
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
    modelType?: string
  ): Promise<KeywordAnalysisData> {
    try {
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
      
      if (error) throw error;

      const calls = callsData || [];
      
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
    modelType?: string
  ): Promise<ConversationQualityMetrics> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          call_llm_model,
          created_at,
          lead_evaluations(
            overall_evaluation_score,
            sentiment,
            clarity_politeness_score,
            naturalness_score,
            relevance_questions_score,
            objection_handling_score,
            lead_intent_score
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
      
      if (error) throw error;

      const calls = callsData || [];
      
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
   * Correlate quality metrics with AI models used
   */
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
    const qualityTrends: { [date: string]: QualityTrendData } = {};

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

    return processedQualityTrends.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get technical metrics
   */
  static async getTechnicalMetrics(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string
  ): Promise<TechnicalMetricsData> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          call_llm_model,
          call_duration_seconds,
          total_call_cost_usd,
          openai_api_tokens_input,
          openai_api_tokens_output,
          openai_api_cost_usd
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
      
      if (error) throw error;

      const calls = callsData || [];
      
      // Calculate response time metrics
      const responseTimes = calls
        .map(call => call.call_duration_seconds)
        .filter(duration => duration !== null && duration !== undefined);
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Calculate token usage stats
      const inputTokens = calls
        .map(call => call.openai_api_tokens_input || 0)
        .reduce((sum, tokens) => sum + tokens, 0);
      const outputTokens = calls
        .map(call => call.openai_api_tokens_output || 0)
        .reduce((sum, tokens) => sum + tokens, 0);
      
      const averageInputTokens = calls.length > 0 ? inputTokens / calls.length : 0;
      const averageOutputTokens = calls.length > 0 ? outputTokens / calls.length : 0;
      const totalTokensUsed = inputTokens + outputTokens;

      // Calculate tokens by model
      const tokensByModel: { [modelName: string]: { input: number; output: number } } = {};
      calls.forEach(call => {
        const modelName = call.call_llm_model || 'Unknown';
        if (!tokensByModel[modelName]) {
          tokensByModel[modelName] = { input: 0, output: 0 };
        }
        tokensByModel[modelName].input += call.openai_api_tokens_input || 0;
        tokensByModel[modelName].output += call.openai_api_tokens_output || 0;
      });

      // Calculate cost efficiency metrics
      const totalCost = calls.reduce((sum, call) => sum + (call.total_call_cost_usd || 0), 0);
      const averageCostPerCall = calls.length > 0 ? totalCost / calls.length : 0;

      const costByModel: { [modelName: string]: number } = {};
      calls.forEach(call => {
        const modelName = call.call_llm_model || 'Unknown';
        if (!costByModel[modelName]) {
          costByModel[modelName] = 0;
        }
        costByModel[modelName] += call.total_call_cost_usd || 0;
      });

      // Create performance diagnostics
      const performanceDiagnostics: PerformanceDiagnostic[] = [
        {
          metric: 'Average Response Time',
          value: averageResponseTime,
          threshold: 300, // 5 minutes
          status: averageResponseTime > 300 ? 'warning' : 'good',
          recommendation: averageResponseTime > 300 
            ? 'Consider optimizing model response times' 
            : 'Response times are within acceptable range'
        },
        {
          metric: 'Average Cost Per Call',
          value: averageCostPerCall,
          threshold: 5.0, // $5 USD
          status: averageCostPerCall > 5.0 ? 'warning' : 'good',
          recommendation: averageCostPerCall > 5.0 
            ? 'Review cost optimization strategies' 
            : 'Cost efficiency is good'
        },
        {
          metric: 'Token Usage Efficiency',
          value: totalTokensUsed / calls.length,
          threshold: 10000, // 10k tokens per call
          status: (totalTokensUsed / calls.length) > 10000 ? 'warning' : 'good',
          recommendation: (totalTokensUsed / calls.length) > 10000 
            ? 'Consider optimizing prompt length and model responses' 
            : 'Token usage is efficient'
        }
      ];

      return {
        averageResponseTime: Math.round(averageResponseTime),
        tokenUsageStats: {
          averageInputTokens: Math.round(averageInputTokens),
          averageOutputTokens: Math.round(averageOutputTokens),
          totalTokensUsed,
          tokensByModel
        },
        costEfficiencyMetrics: {
          averageCostPerCall: Math.round(averageCostPerCall * 100) / 100,
          costByModel,
          costTrends: [], // Would need historical data for trends
          costVsAccuracyCorrelation: 0 // Would need correlation analysis
        },
        performanceDiagnostics
      };
    } catch (error) {
      console.error('Error fetching technical metrics:', error);
      throw error;
    }
  }

  // Helper methods for conversation quality correlation

  /**
   * Calculate sentiment distribution for quality data points
   */
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
   * Calculate standard deviation for quality scores
   */
  private static calculateStandardDeviation(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDifferences = scores.map(score => Math.pow(score - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / scores.length;
    
    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  /**
   * Calculate confidence interval for quality scores
   */
  private static calculateConfidenceInterval(scores: number[], confidenceLevel: number = 0.95): { lower: number; upper: number } {
    if (scores.length === 0) return { lower: 0, upper: 0 };
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const standardDeviation = this.calculateStandardDeviation(scores);
    const standardError = standardDeviation / Math.sqrt(scores.length);
    
    // Using t-distribution approximation (1.96 for 95% confidence)
    const tValue = 1.96;
    const marginOfError = tValue * standardError;
    
    return {
      lower: Math.round((mean - marginOfError) * 100) / 100,
      upper: Math.round((mean + marginOfError) * 100) / 100
    };
  }

  /**
   * Calculate quality consistency score
   */
  private static calculateQualityConsistency(dataPoints: QualityDataPoint[]): number {
    if (dataPoints.length === 0) return 0;
    
    const scores = dataPoints.map(point => point.overallScore);
    const standardDeviation = this.calculateStandardDeviation(scores);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Consistency is inverse of coefficient of variation (lower variation = higher consistency)
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;
    const consistency = Math.max(0, 1 - coefficientOfVariation);
    
    return Math.round(consistency * 100) / 100;
  }

  /**
   * Identify strength areas based on quality dimensions
   */
  private static identifyStrengthAreas(dimensions: QualityDimensions): string[] {
    const dimensionScores = [
      { name: 'Clarity & Politeness', score: dimensions.clarityPoliteness },
      { name: 'Naturalness', score: dimensions.naturalness },
      { name: 'Relevance & Questions', score: dimensions.relevanceQuestions },
      { name: 'Objection Handling', score: dimensions.objectionHandling },
      { name: 'Lead Intent', score: dimensions.leadIntent }
    ];

    // Consider top 2 dimensions as strengths if they're above 7.5
    return dimensionScores
      .filter(dim => dim.score >= 7.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(dim => dim.name);
  }

  /**
   * Identify improvement areas based on quality dimensions
   */
  private static identifyImprovementAreas(dimensions: QualityDimensions): string[] {
    const dimensionScores = [
      { name: 'Clarity & Politeness', score: dimensions.clarityPoliteness },
      { name: 'Naturalness', score: dimensions.naturalness },
      { name: 'Relevance & Questions', score: dimensions.relevanceQuestions },
      { name: 'Objection Handling', score: dimensions.objectionHandling },
      { name: 'Lead Intent', score: dimensions.leadIntent }
    ];

    // Consider bottom 2 dimensions as improvement areas if they're below 7.0
    return dimensionScores
      .filter(dim => dim.score < 7.0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map(dim => dim.name);
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
}