import { supabase } from '@/integrations/supabase/client';
import { LeadEvaluation, LeadEvaluationSummary, LeadEvaluationCard } from '@/types/leadEvaluation';

export class LeadEvaluationService {
  /**
   * Get lead evaluation data for a specific call
   */
  static async getEvaluationByCallId(callId: string): Promise<LeadEvaluation | null> {
    try {
      const { data, error } = await supabase
        .from('lead_evaluations' as any)
        .select('*')
        .eq('call_id', callId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No evaluation found for this call
          return null;
        }
        console.error('Error fetching lead evaluation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getEvaluationByCallId:', error);
      throw error;
    }
  }

  /**
   * Get lead evaluations for multiple calls in batch
   * 
   * @param callIds - Array of call IDs to get evaluations for
   * @returns Map of call ID to evaluation summary
   */
  static async getEvaluationsByCallIds(callIds: string[]): Promise<Map<string, { overallScore: number | null; sentiment: 'positive' | 'neutral' | 'negative' }>> {
    try {
      if (callIds.length === 0) return new Map();
      
      const { data, error } = await supabase
        .from('lead_evaluations' as any)
        .select('call_id, overall_evaluation_score, sentiment')
        .in('call_id', callIds);

      if (error) {
        console.error('Error fetching lead evaluations:', error);
        return new Map();
      }

      const evaluationMap = new Map<string, { overallScore: number | null; sentiment: 'positive' | 'neutral' | 'negative' }>();
      data?.forEach(item => {
        if (item.call_id) {
          evaluationMap.set(item.call_id, {
            overallScore: item.overall_evaluation_score,
            sentiment: item.sentiment
          });
        }
      });

      return evaluationMap;
    } catch (error) {
      console.error('Exception in getEvaluationsByCallIds:', error);
      return new Map();
    }
  }

  /**
   * Transform lead evaluation data into a summary format for display
   */
  static transformToSummary(evaluation: LeadEvaluation): LeadEvaluationSummary {
    const cards: LeadEvaluationCard[] = [
      {
        title: 'Lead Completion',
        score: evaluation.lead_completion_score,
        maxScore: 5,
        color: this.getScoreColor(evaluation.lead_completion_score, 5)
      },
      {
        title: 'Clarity & Politeness',
        score: evaluation.clarity_politeness_score,
        rationale: evaluation.clarity_politeness_rationale,
        maxScore: 5,
        color: this.getScoreColor(evaluation.clarity_politeness_score, 5)
      },
      {
        title: 'Question Relevance',
        score: evaluation.relevance_questions_score,
        rationale: evaluation.relevance_questions_rationale,
        maxScore: 5,
        color: this.getScoreColor(evaluation.relevance_questions_score, 5)
      },
      {
        title: 'Objection Handling',
        score: evaluation.objection_handling_score,
        rationale: evaluation.objection_handling_rationale,
        maxScore: 5,
        color: this.getScoreColor(evaluation.objection_handling_score, 5)
      },
      {
        title: 'Naturalness',
        score: evaluation.naturalness_score,
        rationale: evaluation.naturalness_rationale,
        maxScore: 5,
        color: this.getScoreColor(evaluation.naturalness_score, 5)
      },
      {
        title: 'Lead Intent',
        score: evaluation.lead_intent_score,
        rationale: evaluation.lead_intent_rationale,
        maxScore: 5,
        color: this.getScoreColor(evaluation.lead_intent_score, 5)
      },
      {
        title: 'Failure Risk',
        score: evaluation.failure_risk_score,
        rationale: evaluation.failure_risk_rationale,
        maxScore: 5,
        color: this.getScoreColor(5 - evaluation.failure_risk_score, 5) // Invert for display (lower risk = better)
      }
    ];

    return {
      overallScore: evaluation.overall_evaluation_score,
      sentiment: evaluation.sentiment,
      summary: evaluation.sentiment_rationale,
      humanReviewRequired: evaluation.human_review_required,
      negativeCallFlag: evaluation.negative_call_flag,
      evaluatedAt: new Date(evaluation.evaluated_at),
      cards
    };
  }

  /**
   * Get color based on score performance
   */
  private static getScoreColor(score: number, maxScore: number): 'green' | 'yellow' | 'red' | 'blue' | 'purple' {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'yellow';
    return 'red';
  }

  /**
   * Get sentiment color and icon
   */
  static getSentimentDisplay(sentiment: 'positive' | 'neutral' | 'negative') {
    switch (sentiment) {
      case 'positive':
        return { color: 'green', icon: '😊', label: 'Positive' };
      case 'negative':
        return { color: 'red', icon: '😞', label: 'Negative' };
      default:
        return { color: 'yellow', icon: '😐', label: 'Neutral' };
    }
  }
}