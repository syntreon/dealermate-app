export interface LeadEvaluation {
  id: string;
  call_id: string;
  client_id: string;
  lead_completion_score: number;
  clarity_politeness_score: number;
  clarity_politeness_rationale: string | null;
  relevance_questions_score: number;
  relevance_questions_rationale: string | null;
  objection_handling_score: number;
  objection_handling_rationale: string | null;
  naturalness_score: number;
  naturalness_rationale: string | null;
  lead_intent_score: number;
  lead_intent_rationale: string | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_rationale: string | null;
  failure_risk_score: number;
  failure_risk_rationale: string | null;
  negative_call_flag: boolean;
  human_review_required: boolean;
  review_reason: string | null;
  evaluated_at: Date;
  overall_evaluation_score: number | null;
}

export interface LeadEvaluationCard {
  title: string;
  score: number;
  rationale?: string | null;
  maxScore?: number;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}

export interface LeadEvaluationSummary {
  overallScore: number | null;
  sentiment: 'positive' | 'neutral' | 'negative';
  humanReviewRequired: boolean;
  negativeCallFlag: boolean;
  evaluatedAt: Date;
  cards: LeadEvaluationCard[];
}