import { supabase } from '@/integrations/supabase/client';
import { AIAccuracyFilters, AIAccuracyAnalyticsData } from '@/types/aiAccuracyAnalytics';

export interface FilterState {
  startDate?: string;
  endDate?: string;
  clientId?: string | null;
  modelType?: string;
  accuracyThreshold?: number;
}

export interface FilterOptions {
  availableModels: string[];
  availableClients: Array<{ id: string; name: string }>;
  dateRange: { min: string; max: string };
}

export interface DrillDownOptions {
  level: 'overview' | 'model' | 'client' | 'date' | 'failure';
  context?: {
    modelName?: string;
    clientId?: string;
    date?: string;
    failureCategory?: string;
  };
}

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class AIAccuracyFilteringService {
  /**
   * Validate filter parameters
   */
  static validateFilters(filters: FilterState): FilterValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Date validation
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (startDate > endDate) {
        errors.push('Start date cannot be after end date');
      }
      
      const daysDiff = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        warnings.push('Date range exceeds 1 year, which may impact performance');
      }
      
      if (daysDiff < 1) {
        warnings.push('Date range is less than 1 day, results may be limited');
      }
    }

    // Accuracy threshold validation
    if (filters.accuracyThreshold !== undefined) {
      if (filters.accuracyThreshold < 0 || filters.accuracyThreshold > 10) {
        errors.push('Accuracy threshold must be between 0 and 10');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available filter options based on current data
   */
  static async getFilterOptions(baseFilters?: Partial<FilterState>): Promise<FilterOptions> {
    try {
      // Build base query
      let query = supabase
        .from('calls')
        .select('call_llm_model, client_id, created_at, clients(name)')
        .not('call_llm_model', 'is', null);

      // Apply base filters if provided
      if (baseFilters?.startDate) {
        query = query.gte('created_at', baseFilters.startDate);
      }
      if (baseFilters?.endDate) {
        query = query.lte('created_at', baseFilters.endDate);
      }
      if (baseFilters?.clientId) {
        query = query.eq('client_id', baseFilters.clientId);
      }

      const { data: callsData, error } = await query;
      
      if (error) throw error;

      const calls = callsData || [];

      // Extract unique models
      const availableModels = [...new Set(
        calls
          .map(call => call.call_llm_model)
          .filter(model => model !== null)
      )].sort();

      // Extract unique clients
      const clientMap = new Map();
      calls.forEach(call => {
        if (call.client_id && !clientMap.has(call.client_id)) {
          clientMap.set(call.client_id, {
            id: call.client_id,
            name: call.clients?.name || `Client ${call.client_id}`
          });
        }
      });
      const availableClients = Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));

      // Calculate date range
      const dates = calls.map(call => call.created_at).sort();
      const dateRange = {
        min: dates[0] || new Date().toISOString(),
        max: dates[dates.length - 1] || new Date().toISOString()
      };

      return {
        availableModels,
        availableClients,
        dateRange
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        availableModels: [],
        availableClients: [],
        dateRange: { min: new Date().toISOString(), max: new Date().toISOString() }
      };
    }
  }

  /**
   * Apply filters to analytics data query
   */
  static buildFilteredQuery(filters: FilterState) {
    let query = supabase
      .from('calls')
      .select(`
        id,
        call_llm_model,
        created_at,
        client_id,
        call_duration_seconds,
        total_call_cost_usd,
        lead_evaluations(
          overall_evaluation_score,
          sentiment,
          clarity_politeness_score,
          naturalness_score,
          relevance_questions_score,
          objection_handling_score,
          lead_intent_score
        ),
        prompt_adherence_reviews(
          prompt_adherence_score,
          what_went_wrong,
          critical_failures_summary,
          recommendations_for_improvement
        )
      `);

    // Apply date filters
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Apply client filter
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    // Apply model filter
    if (filters.modelType) {
      query = query.eq('call_llm_model', filters.modelType);
    }

    return query;
  }

  /**
   * Filter data based on accuracy threshold
   */
  static applyAccuracyThresholdFilter(
    data: AIAccuracyAnalyticsData, 
    threshold?: number
  ): AIAccuracyAnalyticsData {
    if (!threshold) return data;

    // Filter model performance data
    const filteredModelsUsed = data.modelPerformance.modelsUsed.filter(
      model => model.averageAccuracy >= threshold
    );

    // Filter accuracy trends
    const filteredAccuracyTrends = data.accuracyTrends.filter(
      trend => trend.overallAccuracy >= threshold
    );

    // Filter quality trends
    const filteredQualityTrends = data.conversationQuality.qualityTrends?.filter(
      trend => trend.averageQuality >= threshold
    ) || [];

    return {
      ...data,
      modelPerformance: {
        ...data.modelPerformance,
        modelsUsed: filteredModelsUsed,
        averageAccuracy: filteredModelsUsed.length > 0 
          ? filteredModelsUsed.reduce((sum, model) => sum + model.averageAccuracy, 0) / filteredModelsUsed.length
          : 0
      },
      accuracyTrends: filteredAccuracyTrends,
      conversationQuality: {
        ...data.conversationQuality,
        qualityTrends: filteredQualityTrends
      }
    };
  }

  /**
   * Get drill-down data for detailed analysis
   */
  static async getDrillDownData(
    filters: FilterState,
    drillDownOptions: DrillDownOptions
  ): Promise<any> {
    try {
      const { level, context } = drillDownOptions;

      switch (level) {
        case 'model':
          return await this.getModelDrillDown(filters, context?.modelName);
        
        case 'client':
          return await this.getClientDrillDown(filters, context?.clientId);
        
        case 'date':
          return await this.getDateDrillDown(filters, context?.date);
        
        case 'failure':
          return await this.getFailureDrillDown(filters, context?.failureCategory);
        
        default:
          throw new Error(`Unsupported drill-down level: ${level}`);
      }
    } catch (error) {
      console.error('Error getting drill-down data:', error);
      throw error;
    }
  }

  /**
   * Get model-specific drill-down data
   */
  private static async getModelDrillDown(filters: FilterState, modelName?: string) {
    if (!modelName) throw new Error('Model name is required for model drill-down');

    const modelFilters = { ...filters, modelType: modelName };
    const query = this.buildFilteredQuery(modelFilters);
    
    const { data: callsData, error } = await query;
    if (error) throw error;

    const calls = callsData || [];

    // Calculate detailed model metrics
    const totalCalls = calls.length;
    const callsWithEvaluations = calls.filter(call => call.lead_evaluations?.length > 0);
    const callsWithAdherence = calls.filter(call => call.prompt_adherence_reviews?.length > 0);

    // Quality metrics breakdown
    const qualityMetrics = {
      clarity: callsWithEvaluations.reduce((sum, call) => 
        sum + (call.lead_evaluations[0]?.clarity_politeness_score || 0), 0) / callsWithEvaluations.length,
      naturalness: callsWithEvaluations.reduce((sum, call) => 
        sum + (call.lead_evaluations[0]?.naturalness_score || 0), 0) / callsWithEvaluations.length,
      relevance: callsWithEvaluations.reduce((sum, call) => 
        sum + (call.lead_evaluations[0]?.relevance_questions_score || 0), 0) / callsWithEvaluations.length,
      objectionHandling: callsWithEvaluations.reduce((sum, call) => 
        sum + (call.lead_evaluations[0]?.objection_handling_score || 0), 0) / callsWithEvaluations.length,
      leadIntent: callsWithEvaluations.reduce((sum, call) => 
        sum + (call.lead_evaluations[0]?.lead_intent_score || 0), 0) / callsWithEvaluations.length
    };

    // Performance over time
    const dailyPerformance = this.groupCallsByDate(calls).map(({ date, calls: dateCalls }) => ({
      date,
      callCount: dateCalls.length,
      averageQuality: dateCalls
        .filter(call => call.lead_evaluations?.length > 0)
        .reduce((sum, call) => sum + (call.lead_evaluations[0]?.overall_evaluation_score || 0), 0) / 
        dateCalls.filter(call => call.lead_evaluations?.length > 0).length || 0,
      averageAdherence: dateCalls
        .filter(call => call.prompt_adherence_reviews?.length > 0)
        .reduce((sum, call) => sum + (call.prompt_adherence_reviews[0]?.prompt_adherence_score || 0), 0) / 
        dateCalls.filter(call => call.prompt_adherence_reviews?.length > 0).length || 0
    }));

    return {
      modelName,
      totalCalls,
      qualityMetrics,
      dailyPerformance,
      sampleCalls: calls.slice(0, 10) // First 10 calls for detailed inspection
    };
  }

  /**
   * Get client-specific drill-down data
   */
  private static async getClientDrillDown(filters: FilterState, clientId?: string) {
    if (!clientId) throw new Error('Client ID is required for client drill-down');

    const clientFilters = { ...filters, clientId };
    const query = this.buildFilteredQuery(clientFilters);
    
    const { data: callsData, error } = await query;
    if (error) throw error;

    const calls = callsData || [];

    // Group by model for this client
    const modelBreakdown = this.groupCallsByModel(calls);

    // Calculate client-specific metrics
    const clientMetrics = {
      totalCalls: calls.length,
      modelsUsed: modelBreakdown.length,
      averageCallDuration: calls.reduce((sum, call) => sum + (call.call_duration_seconds || 0), 0) / calls.length,
      totalCost: calls.reduce((sum, call) => sum + (call.total_call_cost_usd || 0), 0)
    };

    return {
      clientId,
      clientMetrics,
      modelBreakdown,
      recentCalls: calls.slice(0, 20) // Most recent 20 calls
    };
  }

  /**
   * Get date-specific drill-down data
   */
  private static async getDateDrillDown(filters: FilterState, date?: string) {
    if (!date) throw new Error('Date is required for date drill-down');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateFilters = {
      ...filters,
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    };

    const query = this.buildFilteredQuery(dateFilters);
    const { data: callsData, error } = await query;
    if (error) throw error;

    const calls = callsData || [];

    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourCalls = calls.filter(call => new Date(call.created_at).getHours() === hour);
      return {
        hour,
        callCount: hourCalls.length,
        averageQuality: hourCalls
          .filter(call => call.lead_evaluations?.length > 0)
          .reduce((sum, call) => sum + (call.lead_evaluations[0]?.overall_evaluation_score || 0), 0) / 
          hourCalls.filter(call => call.lead_evaluations?.length > 0).length || 0
      };
    });

    return {
      date,
      totalCalls: calls.length,
      hourlyDistribution,
      modelBreakdown: this.groupCallsByModel(calls),
      allCalls: calls
    };
  }

  /**
   * Get failure-specific drill-down data
   */
  private static async getFailureDrillDown(filters: FilterState, failureCategory?: string) {
    if (!failureCategory) throw new Error('Failure category is required for failure drill-down');

    const query = this.buildFilteredQuery(filters);
    const { data: callsData, error } = await query;
    if (error) throw error;

    const calls = callsData || [];

    // Filter calls with the specific failure category
    const failureCalls = calls.filter(call => {
      const review = call.prompt_adherence_reviews?.[0];
      if (!review) return false;

      const whatWentWrong = this.parseJsonbArray(review.what_went_wrong) || [];
      const criticalFailures = review.critical_failures_summary || '';

      return whatWentWrong.some(item => 
        this.categorizeFailure(item) === failureCategory
      ) || this.categorizeFailure(criticalFailures) === failureCategory;
    });

    // Analyze failure patterns
    const failureExamples = failureCalls.map(call => ({
      callId: call.id,
      modelUsed: call.call_llm_model,
      createdAt: call.created_at,
      whatWentWrong: call.prompt_adherence_reviews?.[0]?.what_went_wrong,
      criticalFailures: call.prompt_adherence_reviews?.[0]?.critical_failures_summary,
      recommendations: call.prompt_adherence_reviews?.[0]?.recommendations_for_improvement
    }));

    return {
      failureCategory,
      totalFailures: failureCalls.length,
      failureRate: calls.length > 0 ? (failureCalls.length / calls.length) * 100 : 0,
      affectedModels: [...new Set(failureCalls.map(call => call.call_llm_model))],
      failureExamples: failureExamples.slice(0, 10), // First 10 examples
      modelBreakdown: this.groupCallsByModel(failureCalls)
    };
  }

  /**
   * Check if filtered data is empty and provide appropriate messaging
   */
  static getEmptyStateMessage(filters: FilterState, dataType: string): {
    title: string;
    message: string;
    suggestions: string[];
  } {
    const hasFilters = Object.values(filters).some(value => value !== undefined && value !== null);

    if (!hasFilters) {
      return {
        title: `No ${dataType} Data Available`,
        message: 'There is no data available for the selected time period.',
        suggestions: [
          'Check if calls have been made during this period',
          'Verify that AI models are properly configured',
          'Ensure evaluations are being generated for calls'
        ]
      };
    }

    const suggestions: string[] = [];
    
    if (filters.startDate && filters.endDate) {
      suggestions.push('Try expanding the date range');
    }
    
    if (filters.modelType) {
      suggestions.push('Try selecting a different AI model or remove the model filter');
    }
    
    if (filters.clientId) {
      suggestions.push('Try selecting a different client or remove the client filter');
    }
    
    if (filters.accuracyThreshold) {
      suggestions.push('Try lowering the accuracy threshold');
    }

    suggestions.push('Clear all filters to see all available data');

    return {
      title: `No ${dataType} Data Found`,
      message: 'No data matches your current filter criteria.',
      suggestions
    };
  }

  /**
   * Helper method to group calls by date
   */
  private static groupCallsByDate(calls: any[]) {
    const groups: { [date: string]: any[] } = {};
    
    calls.forEach(call => {
      const date = new Date(call.created_at).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(call);
    });

    return Object.entries(groups).map(([date, calls]) => ({ date, calls }));
  }

  /**
   * Helper method to group calls by model
   */
  private static groupCallsByModel(calls: any[]) {
    const groups: { [model: string]: any[] } = {};
    
    calls.forEach(call => {
      const model = call.call_llm_model || 'Unknown';
      if (!groups[model]) groups[model] = [];
      groups[model].push(call);
    });

    return Object.entries(groups).map(([modelName, calls]) => ({
      modelName,
      callCount: calls.length,
      calls
    }));
  }

  /**
   * Helper method to parse JSONB arrays
   */
  private static parseJsonbArray(jsonbData: any): string[] | null {
    if (!jsonbData) return null;
    
    try {
      if (typeof jsonbData === 'string') {
        return JSON.parse(jsonbData);
      }
      if (Array.isArray(jsonbData)) {
        return jsonbData;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Helper method to categorize failures
   */
  private static categorizeFailure(failureText: string): string {
    if (!failureText) return 'other';
    
    const text = failureText.toLowerCase();
    
    if (text.includes('hallucin') || text.includes('made up') || text.includes('fabricat')) {
      return 'hallucination';
    }
    if (text.includes('transcrib') || text.includes('mishear') || text.includes('audio')) {
      return 'transcriber';
    }
    if (text.includes('protocol') || text.includes('standard') || text.includes('guideline')) {
      return 'protocol';
    }
    if (text.includes('rule') || text.includes('procedure')) {
      return 'rules';
    }
    
    return 'other';
  }
}