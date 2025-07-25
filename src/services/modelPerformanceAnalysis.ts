import { supabase } from '@/integrations/supabase/client';
import {
  ModelPerformanceMetrics,
  ModelUsageData,
  ModelComparisonData,
  StatisticalTestResult,
  ModelPerformanceTrend,
  AIAccuracyFilters,
  ModelType
} from '@/types/aiAccuracyAnalytics';

/**
 * Enhanced Model Performance Analysis Service
 * Provides advanced statistical analysis and comparison capabilities for AI model performance
 */
export class ModelPerformanceAnalysis {
  
  /**
   * Get enhanced model performance metrics with statistical analysis
   * @param startDate Start date for analysis period
   * @param endDate End date for analysis period
   * @param clientId Optional client ID for filtering
   * @param modelType Optional specific model name to filter by
   * @param modelCategory Type of model to analyze: 'llm', 'voice', or 'transcriber'
   */
  static async getEnhancedModelPerformanceMetrics(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    modelCategory: ModelType = 'llm'
  ): Promise<ModelPerformanceMetrics> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          id,
          call_llm_model,
          voice_provider,
          voice_model,
          transcriber_provider,
          transcriber_model,
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

      // Apply model-specific filtering
      if (modelType) {
        switch (modelCategory) {
          case 'llm':
            query = query.eq('call_llm_model', modelType);
            break;
          case 'voice':
            // For voice models, we need to check both provider and model
            if (modelType.includes('/')) {
              const [provider, model] = modelType.split('/');
              query = query.eq('voice_provider', provider).eq('voice_model', model);
            } else {
              // If only one value provided, try to match either provider or model
              query = query.or(`voice_provider.eq.${modelType},voice_model.eq.${modelType}`);
            }
            break;
          case 'transcriber':
            // For transcriber models, we need to check both provider and model
            if (modelType.includes('/')) {
              const [provider, model] = modelType.split('/');
              query = query.eq('transcriber_provider', provider).eq('transcriber_model', model);
            } else {
              // If only one value provided, try to match either provider or model
              query = query.or(`transcriber_provider.eq.${modelType},transcriber_model.eq.${modelType}`);
            }
            break;
        }
      }

      const { data: callsData, error } = await query;
      
      if (error) throw error;

      const calls = callsData || [];
      const totalCalls = calls.length;

      // Group calls by model based on the selected model category
      const modelGroups: { [modelName: string]: any[] } = {};
      calls.forEach(call => {
        let modelName: string;
        let provider: string | null = null;
        
        switch (modelCategory) {
          case 'llm':
            modelName = call.call_llm_model || 'Unknown';
            break;
          case 'voice':
            provider = call.voice_provider || null;
            modelName = call.voice_model || 'Unknown';
            // Combine provider and model for a unique identifier
            if (provider) {
              modelName = `${provider}/${modelName}`;
            }
            break;
          case 'transcriber':
            provider = call.transcriber_provider || null;
            modelName = call.transcriber_model || 'Unknown';
            // Combine provider and model for a unique identifier
            if (provider) {
              modelName = `${provider}/${modelName}`;
            }
            break;
          default:
            modelName = 'Unknown';
        }
        
        if (!modelGroups[modelName]) {
          modelGroups[modelName] = [];
        }
        modelGroups[modelName].push(call);
      });

      // Calculate detailed metrics for each model with statistical analysis
      const modelsUsed: (ModelUsageData & { _rawScores: { quality: number[]; adherence: number[] } })[] = 
        Object.entries(modelGroups).map(([modelName, modelCalls]) => {
          const callCount = modelCalls.length;
          const usagePercentage = totalCalls > 0 ? (callCount / totalCalls) * 100 : 0;

          // Extract scores for statistical analysis
          const qualityScores = modelCalls
            .map(call => call.lead_evaluations?.[0]?.overall_evaluation_score)
            .filter(score => score !== null && score !== undefined);
          
          const adherenceScores = modelCalls
            .map(call => call.prompt_adherence_reviews?.[0]?.prompt_adherence_score)
            .filter(score => score !== null && score !== undefined);

          // Calculate averages
          const averageQualityScore = qualityScores.length > 0 
            ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
            : 0;

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

          // Calculate average response time
          const durations = modelCalls
            .map(call => call.call_duration_seconds)
            .filter(duration => duration !== null && duration !== undefined);
          const responseTime = durations.length > 0
            ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
            : 0;

          // Extract provider and model from combined name for voice and transcriber models
          let provider: string | undefined;
          let displayName = modelName;
          
          if ((modelCategory === 'voice' || modelCategory === 'transcriber') && modelName.includes('/')) {
            const parts = modelName.split('/');
            provider = parts[0];
            displayName = parts[1];
          }
          
          return {
            modelName: displayName,
            provider,
            callCount,
            usagePercentage: Math.round(usagePercentage * 100) / 100,
            averageAccuracy: Math.round(averageAccuracy * 100) / 100,
            averageQualityScore: Math.round(averageQualityScore * 100) / 100,
            failureRate: Math.round(failureRate * 100) / 100,
            averageAdherenceScore: Math.round(averageAdherenceScore * 100) / 100,
            costEfficiency: Math.round(costEfficiency * 100) / 100,
            responseTime: Math.round(responseTime),
            modelType: modelCategory,
            _rawScores: {
              quality: qualityScores,
              adherence: adherenceScores
            }
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

      // Create enhanced performance comparison with statistical significance
      const performanceComparison: ModelComparisonData[] = this.calculateModelComparisons(modelsUsed);

      // Clean up raw scores from the final output
      const cleanedModelsUsed = modelsUsed.map(model => {
        const { _rawScores, ...cleanModel } = model;
        return cleanModel;
      });

      return {
        totalCalls,
        modelsUsed: cleanedModelsUsed,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        bestPerformingModel,
        worstPerformingModel,
        performanceComparison,
        modelType: modelCategory
      };
    } catch (error) {
      console.error('Error fetching enhanced model performance metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate model comparisons with statistical significance testing
   */
  private static calculateModelComparisons(
    modelsUsed: (ModelUsageData & { _rawScores: { quality: number[]; adherence: number[] } })[]
  ): ModelComparisonData[] {
    return modelsUsed.map(model => {
      const qualityScores = model._rawScores.quality;
      const adherenceScores = model._rawScores.adherence;
      const allScores = [...qualityScores, ...adherenceScores];
      
      // Calculate statistical significance based on sample size and variance
      const minSampleSize = 30; // Minimum for statistical significance
      const hasSignificantSample = model.callCount >= minSampleSize;
      
      // Calculate confidence intervals for accuracy scores
      const qualityVariance = this.calculateVariance(qualityScores);
      const adherenceVariance = this.calculateVariance(adherenceScores);
      
      // Statistical significance is determined by sample size, variance, and effect size
      const statisticalSignificance = hasSignificantSample && 
        qualityVariance < 0.5 && // Low variance indicates consistent performance
        adherenceVariance < 0.5;

      return {
        modelName: model.modelName,
        accuracyScore: model.averageAccuracy,
        qualityScore: model.averageQualityScore,
        adherenceScore: model.averageAdherenceScore,
        failureRate: model.failureRate,
        costPerCall: model.costEfficiency,
        statisticalSignificance,
        confidenceInterval: this.calculateConfidenceInterval(allScores, 0.95),
        sampleSize: model.callCount,
        standardDeviation: this.calculateStandardDeviation(allScores)
      };
    });
  }

  /**
   * Perform statistical significance test between two models
   */
  static performModelComparisonTest(
    model1Scores: number[], 
    model2Scores: number[]
  ): StatisticalTestResult {
    if (model1Scores.length === 0 || model2Scores.length === 0) {
      return { 
        isSignificant: false, 
        pValue: 1, 
        effectSize: 0, 
        testType: 'insufficient_data',
        confidenceLevel: 0.95
      };
    }

    // Perform Welch's t-test (unequal variances assumed)
    const mean1 = model1Scores.reduce((sum, score) => sum + score, 0) / model1Scores.length;
    const mean2 = model2Scores.reduce((sum, score) => sum + score, 0) / model2Scores.length;
    
    const var1 = this.calculateVariance(model1Scores);
    const var2 = this.calculateVariance(model2Scores);
    
    const n1 = model1Scores.length;
    const n2 = model2Scores.length;
    
    // Calculate t-statistic
    const pooledStandardError = Math.sqrt((var1 / n1) + (var2 / n2));
    const tStatistic = pooledStandardError > 0 ? (mean1 - mean2) / pooledStandardError : 0;
    
    // Calculate degrees of freedom (Welch-Satterthwaite equation)
    const df = pooledStandardError > 0 ? 
      Math.pow((var1/n1) + (var2/n2), 2) / 
      (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1)) : 0;
    
    // Approximate p-value calculation
    const pValue = this.approximatePValue(Math.abs(tStatistic), df);
    
    // Calculate Cohen's d (effect size)
    const pooledStandardDeviation = Math.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2));
    const effectSize = pooledStandardDeviation > 0 ? Math.abs(mean1 - mean2) / pooledStandardDeviation : 0;
    
    return {
      isSignificant: pValue < 0.05,
      pValue: Math.round(pValue * 1000) / 1000,
      effectSize: Math.round(effectSize * 1000) / 1000,
      testType: 'welch_t_test',
      confidenceLevel: 0.95
    };
  }

  /**
   * Calculate performance trends over time periods
   * @param startDate Start date for trend analysis
   * @param endDate End date for trend analysis
   * @param clientId Optional client ID for filtering
   * @param modelType Optional specific model name to filter by
   * @param periodType Time period for grouping: daily, weekly, or monthly
   * @param modelCategory Type of model to analyze: 'llm', 'voice', or 'transcriber'
   */
  static async getModelPerformanceTrends(
    startDate: string,
    endDate: string,
    clientId?: string,
    modelType?: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'daily',
    modelCategory: ModelType = 'llm'
  ): Promise<ModelPerformanceTrend[]> {
    try {
      let query = supabase
        .from('calls')
        .select(`
          id,
          call_llm_model,
          voice_provider,
          voice_model,
          transcriber_provider,
          transcriber_model,
          created_at,
          lead_evaluations(overall_evaluation_score),
          prompt_adherence_reviews(prompt_adherence_score, critical_failures_summary)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      // Apply model-specific filtering
      if (modelType) {
        switch (modelCategory) {
          case 'llm':
            query = query.eq('call_llm_model', modelType);
            break;
          case 'voice':
            // For voice models, we need to check both provider and model
            if (modelType.includes('/')) {
              const [provider, model] = modelType.split('/');
              query = query.eq('voice_provider', provider).eq('voice_model', model);
            } else {
              // If only one value provided, try to match either provider or model
              query = query.or(`voice_provider.eq.${modelType},voice_model.eq.${modelType}`);
            }
            break;
          case 'transcriber':
            // For transcriber models, we need to check both provider and model
            if (modelType.includes('/')) {
              const [provider, model] = modelType.split('/');
              query = query.eq('transcriber_provider', provider).eq('transcriber_model', model);
            } else {
              // If only one value provided, try to match either provider or model
              query = query.or(`transcriber_provider.eq.${modelType},transcriber_model.eq.${modelType}`);
            }
            break;
        }
      }

      const { data: callsData, error } = await query;
      
      if (error) throw error;

      const calls = callsData || [];

      // Group calls by date period and model
      const periodGroups: { [key: string]: { [modelName: string]: any[] } } = {};
      calls.forEach(call => {
        const date = new Date(call.created_at);
        const periodKey = this.getPeriodKey(date, periodType);
        
        let modelName: string;
        let provider: string | null = null;
        
        switch (modelCategory) {
          case 'llm':
            modelName = call.call_llm_model || 'Unknown';
            break;
          case 'voice':
            provider = call.voice_provider || null;
            modelName = call.voice_model || 'Unknown';
            // Combine provider and model for a unique identifier
            if (provider) {
              modelName = `${provider}/${modelName}`;
            }
            break;
          case 'transcriber':
            provider = call.transcriber_provider || null;
            modelName = call.transcriber_model || 'Unknown';
            // Combine provider and model for a unique identifier
            if (provider) {
              modelName = `${provider}/${modelName}`;
            }
            break;
          default:
            modelName = 'Unknown';
        }
        
        if (!periodGroups[periodKey]) {
          periodGroups[periodKey] = {};
        }
        
        if (!periodGroups[periodKey][modelName]) {
          periodGroups[periodKey][modelName] = [];
        }
        
        periodGroups[periodKey][modelName].push(call);
      });

      // Calculate trends for each period-model combination
      const trends: ModelPerformanceTrend[] = Object.entries(periodGroups).flatMap(([periodKey, modelGroups]) => {
        return Object.entries(modelGroups).map(([modelName, groupCalls]) => {
        // Period key and model name are already separated in the nested loops
        
        const qualityScores = groupCalls
          .map(call => call.lead_evaluations?.[0]?.overall_evaluation_score)
          .filter(score => score !== null && score !== undefined);
        
        const adherenceScores = groupCalls
          .map(call => call.prompt_adherence_reviews?.[0]?.prompt_adherence_score)
          .filter(score => score !== null && score !== undefined);

        const qualityScore = qualityScores.length > 0 
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
          : 0;

        const adherenceScore = adherenceScores.length > 0
          ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length
          : 0;

        const accuracyScore = (qualityScore + adherenceScore) / 2;

        return {
          date: periodKey,
          modelName,
          accuracyScore: Math.round(accuracyScore * 100) / 100,
          qualityScore: Math.round(qualityScore * 100) / 100,
          adherenceScore: Math.round(adherenceScore * 100) / 100,
          callCount: groupCalls.length,
          modelType: modelCategory,
          provider: modelCategory !== 'llm' ? ModelPerformanceAnalysis.extractProviderFromModelName(modelName) : undefined
        };
      });
    });

      // Calculate moving averages
      const trendsWithMovingAverage = this.calculateMovingAverages(trends, 3); // 3-period moving average

      return trendsWithMovingAverage.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching model performance trends:', error);
      throw error;
    }
  }

  /**
   * Calculate moving averages for trend data
   */
  private static calculateMovingAverages(
    trends: ModelPerformanceTrend[], 
    windowSize: number
  ): ModelPerformanceTrend[] {
    const modelGroups: { [modelName: string]: ModelPerformanceTrend[] } = {};
    
    // Group trends by model
    trends.forEach(trend => {
      if (!modelGroups[trend.modelName]) {
        modelGroups[trend.modelName] = [];
      }
      modelGroups[trend.modelName].push(trend);
    });

    // Calculate moving averages for each model
    Object.keys(modelGroups).forEach(modelName => {
      const modelTrends = modelGroups[modelName].sort((a, b) => a.date.localeCompare(b.date));
      
      for (let i = 0; i < modelTrends.length; i++) {
        const startIndex = Math.max(0, i - windowSize + 1);
        const window = modelTrends.slice(startIndex, i + 1);
        
        const movingAverage = window.reduce((sum, trend) => sum + trend.accuracyScore, 0) / window.length;
        modelTrends[i].movingAverage = Math.round(movingAverage * 100) / 100;
      }
    });

    return trends;
  }

  /**
   * Get period key based on date and period type
   */
  private static getPeriodKey(date: Date, periodType: 'daily' | 'weekly' | 'monthly'): string {
    switch (periodType) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  // Statistical helper methods
  // Helper method to extract provider from combined provider/model name
  private static extractProviderFromModelName(combinedName: string): string | undefined {
    if (!combinedName || combinedName === 'Unknown') return undefined;
    const parts = combinedName.split('/');
    return parts.length > 1 ? parts[0] : undefined;
  }

  private static calculateVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDifferences = scores.map(score => Math.pow(score - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }

  private static calculateStandardDeviation(scores: number[]): number {
    return Math.sqrt(this.calculateVariance(scores));
  }

  private static calculateConfidenceInterval(
    scores: number[], 
    confidence: number
  ): { lower: number; upper: number } {
    if (scores.length === 0) return { lower: 0, upper: 0 };
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const standardError = this.calculateStandardDeviation(scores) / Math.sqrt(scores.length);
    
    // Use t-distribution critical value (approximated for 95% confidence)
    const tValue = 1.96; // For large samples, t ≈ z
    const marginOfError = tValue * standardError;
    
    return {
      lower: Math.round((mean - marginOfError) * 100) / 100,
      upper: Math.round((mean + marginOfError) * 100) / 100
    };
  }

  private static approximatePValue(tStat: number, df: number): number {
    // Simplified approximation - in production, use a proper statistical library
    if (df >= 30) {
      // For large df, t-distribution approaches normal distribution
      return 2 * (1 - this.normalCDF(tStat));
    } else {
      // Rough approximation for smaller samples
      const criticalValue = 2.0; // Approximate critical value for p=0.05
      return tStat > criticalValue ? 0.01 : 0.1;
    }
  }

  private static normalCDF(x: number): number {
    // Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }
}