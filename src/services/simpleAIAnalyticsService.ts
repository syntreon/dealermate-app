import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type for calls with joined evaluation data
type CallWithEvaluations = {
  id: string;
  call_llm_model?: string;
  voice_provider?: string;
  voice_model?: string;
  transcriber_provider?: string;
  transcriber_model?: string;
  vapi_llm_cost_usd?: number;
  tts_cost?: number;
  transcriber_cost?: number;
  total_call_cost_usd?: number;
  lead_evaluations?: Array<{
    overall_evaluation_score?: number;
  }>;
  prompt_adherence_reviews?: Array<{
    prompt_adherence_score: number;
    critical_failures_summary?: string;
  }>;
};

// Simple interfaces for what we actually need
export interface SimpleModelMetrics {
  modelName: string;
  modelType: 'llm' | 'voice' | 'transcriber';
  provider?: string;
  totalCalls: number;
  errorRate: number; // % of calls with critical failures
  avgQualityScore: number; // from lead_evaluations
  avgAdherenceScore: number; // from prompt_adherence_reviews
  avgCostPerCall: number;
  totalCost: number;
}

export interface SimpleAIAnalytics {
  llmModels: SimpleModelMetrics[];
  voiceModels: SimpleModelMetrics[];
  transcriberModels: SimpleModelMetrics[];
  totalCalls: number;
  totalCost: number;
  overallErrorRate: number;
}

export class SimpleAIAnalyticsService {
  
  /**
   * Get basic AI analytics - the core metrics we actually need
   */
  static async getSimpleAnalytics(
    startDate: string,
    endDate: string,
    clientId?: string
  ): Promise<SimpleAIAnalytics> {
    try {
      // Single query to get all the data we need with proper cost fields
      let query = supabase
        .from('calls')
        .select(`
          id,
          call_llm_model,
          voice_provider,
          voice_model,
          transcriber_provider,
          transcriber_model,
          vapi_llm_cost_usd,
          tts_cost,
          transcriber_cost,
          total_call_cost_usd,
          lead_evaluations(overall_evaluation_score),
          prompt_adherence_reviews(prompt_adherence_score, critical_failures_summary)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data: calls, error } = await query;

      if (error) {
        console.error('Error fetching calls data:', error);
        throw error;
      }

      if (!calls || calls.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Process LLM models
      const llmModels = this.processLLMModels(calls);
      
      // Process Voice models
      const voiceModels = this.processVoiceModels(calls);
      
      // Process Transcriber models
      const transcriberModels = this.processTranscriberModels(calls);

      // Calculate totals
      const totalCalls = calls.length;
      
      // Calculate total cost from AI-specific costs (excluding post-processing OpenAI costs)
      const totalCost = calls.reduce((sum, call) => {
        const llmCost = call.vapi_llm_cost_usd || 0;
        const ttsCost = call.tts_cost || 0;
        const transcriberCost = call.transcriber_cost || 0;
        return sum + llmCost + ttsCost + transcriberCost;
      }, 0);
      
      const totalErrors = calls.filter(call => 
        call.prompt_adherence_reviews?.[0]?.critical_failures_summary
      ).length;
      const overallErrorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;

      return {
        llmModels,
        voiceModels,
        transcriberModels,
        totalCalls,
        totalCost: Math.round(totalCost * 100) / 100,
        overallErrorRate: Math.round(overallErrorRate * 100) / 100
      };

    } catch (error) {
      console.error('Error in getSimpleAnalytics:', error);
      throw error;
    }
  }

  private static processLLMModels(calls: CallWithEvaluations[]): SimpleModelMetrics[] {
    const modelGroups: { [key: string]: any[] } = {};
    
    // Group calls by LLM model
    calls.forEach(call => {
      const modelName = call.call_llm_model || 'Unknown';
      if (!modelGroups[modelName]) {
        modelGroups[modelName] = [];
      }
      modelGroups[modelName].push(call);
    });

    return Object.entries(modelGroups).map(([modelName, modelCalls]) => {
      return this.calculateModelMetrics(modelName, 'llm', modelCalls);
    }).sort((a, b) => b.totalCalls - a.totalCalls);
  }

  private static processVoiceModels(calls: CallWithEvaluations[]): SimpleModelMetrics[] {
    const modelGroups: { [key: string]: any[] } = {};
    
    // Group calls by voice provider + model
    calls.forEach(call => {
      if (!call.voice_provider && !call.voice_model) return;
      
      const key = `${call.voice_provider || 'Unknown'}-${call.voice_model || 'Unknown'}`;
      if (!modelGroups[key]) {
        modelGroups[key] = [];
      }
      modelGroups[key].push(call);
    });

    return Object.entries(modelGroups).map(([key, modelCalls]) => {
      const [provider, model] = key.split('-');
      return this.calculateModelMetrics(model, 'voice', modelCalls, provider);
    }).sort((a, b) => b.totalCalls - a.totalCalls);
  }

  private static processTranscriberModels(calls: CallWithEvaluations[]): SimpleModelMetrics[] {
    const modelGroups: { [key: string]: any[] } = {};
    
    // Group calls by transcriber provider + model
    calls.forEach(call => {
      if (!call.transcriber_provider && !call.transcriber_model) return;
      
      const key = `${call.transcriber_provider || 'Unknown'}-${call.transcriber_model || 'Unknown'}`;
      if (!modelGroups[key]) {
        modelGroups[key] = [];
      }
      modelGroups[key].push(call);
    });

    return Object.entries(modelGroups).map(([key, modelCalls]) => {
      const [provider, model] = key.split('-');
      return this.calculateModelMetrics(model, 'transcriber', modelCalls, provider);
    }).sort((a, b) => b.totalCalls - a.totalCalls);
  }

  private static calculateModelMetrics(
    modelName: string, 
    modelType: 'llm' | 'voice' | 'transcriber', 
    calls: CallWithEvaluations[],
    provider?: string
  ): SimpleModelMetrics {
    const totalCalls = calls.length;
    
    // Calculate error rate (calls with critical failures)
    const errorCount = calls.filter(call => 
      call.prompt_adherence_reviews?.[0]?.critical_failures_summary
    ).length;
    const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

    // Calculate average quality score (from lead_evaluations)
    const qualityScores = calls
      .map(call => call.lead_evaluations?.[0]?.overall_evaluation_score)
      .filter(score => score !== null && score !== undefined);
    const avgQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    // Calculate average adherence score (from prompt_adherence_reviews)
    const adherenceScores = calls
      .map(call => call.prompt_adherence_reviews?.[0]?.prompt_adherence_score)
      .filter(score => score !== null && score !== undefined);
    const avgAdherenceScore = adherenceScores.length > 0
      ? adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length
      : 0;

    // Calculate cost metrics based on model type
    let totalCost = 0;
    calls.forEach(call => {
      switch (modelType) {
        case 'llm':
          totalCost += call.vapi_llm_cost_usd || 0;
          break;
        case 'voice':
          totalCost += call.tts_cost || 0;
          break;
        case 'transcriber':
          totalCost += call.transcriber_cost || 0;
          break;
      }
    });

    const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

    return {
      modelName,
      modelType,
      provider,
      totalCalls,
      errorRate: Math.round(errorRate * 100) / 100,
      avgQualityScore: Math.round(avgQualityScore * 100) / 100,
      avgAdherenceScore: Math.round(avgAdherenceScore * 100) / 100,
      avgCostPerCall: Math.round(avgCostPerCall * 10000) / 10000, // More precision for small costs
      totalCost: Math.round(totalCost * 100) / 100
    };
  }

  private static getEmptyAnalytics(): SimpleAIAnalytics {
    return {
      llmModels: [],
      voiceModels: [],
      transcriberModels: [],
      totalCalls: 0,
      totalCost: 0,
      overallErrorRate: 0
    };
  }
}