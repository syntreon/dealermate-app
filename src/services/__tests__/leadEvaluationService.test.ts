import { LeadEvaluationService } from '../leadEvaluationService';
import { LeadEvaluation } from '@/types/leadEvaluation';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('LeadEvaluationService', () => {
  describe('transformToSummary', () => {
    const mockEvaluation: LeadEvaluation = {
      id: 'test-id',
      call_id: 'call-id',
      client_id: 'client-id',
      lead_completion_score: 4,
      clarity_politeness_score: 5,
      clarity_politeness_rationale: 'Very clear and polite',
      relevance_questions_score: 4,
      relevance_questions_rationale: 'Good questions',
      objection_handling_score: 3,
      objection_handling_rationale: 'Could improve',
      naturalness_score: 4,
      naturalness_rationale: 'Natural conversation',
      lead_intent_score: 5,
      lead_intent_rationale: 'Strong intent',
      sentiment: 'positive',
      sentiment_rationale: 'Positive interaction',
      failure_risk_score: 2,
      failure_risk_rationale: 'Low risk',
      negative_call_flag: false,
      human_review_required: false,
      review_reason: null,
      evaluated_at: new Date('2024-01-15T10:00:00Z'),
      overall_evaluation_score: 4.2
    };

    it('should transform evaluation data to summary format', () => {
      const summary = LeadEvaluationService.transformToSummary(mockEvaluation);

      expect(summary.overallScore).toBe(4.2);
      expect(summary.sentiment).toBe('positive');
      expect(summary.humanReviewRequired).toBe(false);
      expect(summary.negativeCallFlag).toBe(false);
      expect(summary.evaluatedAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(summary.cards).toHaveLength(7);
    });

    it('should create correct score cards', () => {
      const summary = LeadEvaluationService.transformToSummary(mockEvaluation);
      
      const leadCompletionCard = summary.cards.find(card => card.title === 'Lead Completion');
      expect(leadCompletionCard).toBeDefined();
      expect(leadCompletionCard?.score).toBe(4);
      expect(leadCompletionCard?.maxScore).toBe(5);
      expect(leadCompletionCard?.color).toBe('green'); // 80% score should be green

      const clarityCard = summary.cards.find(card => card.title === 'Clarity & Politeness');
      expect(clarityCard).toBeDefined();
      expect(clarityCard?.rationale).toBe('Very clear and polite');
    });

    it('should handle failure risk score correctly (inverted)', () => {
      const summary = LeadEvaluationService.transformToSummary(mockEvaluation);
      
      const failureRiskCard = summary.cards.find(card => card.title === 'Failure Risk');
      expect(failureRiskCard).toBeDefined();
      expect(failureRiskCard?.score).toBe(3); // 5 - 2 = 3 (inverted for display)
      expect(failureRiskCard?.color).toBe('yellow'); // 60% should be yellow
    });
  });

  describe('getSentimentDisplay', () => {
    it('should return correct display for positive sentiment', () => {
      const display = LeadEvaluationService.getSentimentDisplay('positive');
      expect(display.color).toBe('green');
      expect(display.label).toBe('Positive');
      expect(display.icon).toBe('😊');
    });

    it('should return correct display for negative sentiment', () => {
      const display = LeadEvaluationService.getSentimentDisplay('negative');
      expect(display.color).toBe('red');
      expect(display.label).toBe('Negative');
      expect(display.icon).toBe('😞');
    });

    it('should return correct display for neutral sentiment', () => {
      const display = LeadEvaluationService.getSentimentDisplay('neutral');
      expect(display.color).toBe('yellow');
      expect(display.label).toBe('Neutral');
      expect(display.icon).toBe('😐');
    });
  });
});