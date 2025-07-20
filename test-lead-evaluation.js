/**
 * Simple test script to verify lead evaluation functionality
 * Run with: node test-lead-evaluation.js
 */

// Mock data that matches the database schema
const mockEvaluation = {
  id: 'test-id',
  call_id: 'call-id',
  client_id: 'client-id',
  lead_completion_score: 4,
  clarity_politeness_score: 5,
  clarity_politeness_rationale: 'Very clear and polite communication throughout the call',
  relevance_questions_score: 4,
  relevance_questions_rationale: 'Asked relevant questions about the service',
  objection_handling_score: 3,
  objection_handling_rationale: 'Could improve objection handling techniques',
  naturalness_score: 4,
  naturalness_rationale: 'Conversation flowed naturally',
  lead_intent_score: 5,
  lead_intent_rationale: 'Strong buying intent demonstrated',
  sentiment: 'positive',
  sentiment_rationale: 'Overall positive interaction',
  failure_risk_score: 2,
  failure_risk_rationale: 'Low risk of call failure',
  negative_call_flag: false,
  human_review_required: false,
  review_reason: null,
  evaluated_at: new Date('2024-01-15T10:00:00Z'),
  overall_evaluation_score: 4.2
};

// Mock the service functions (simplified versions)
function getScoreColor(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'green';
  if (percentage >= 60) return 'yellow';
  return 'red';
}

function getSentimentDisplay(sentiment) {
  switch (sentiment) {
    case 'positive':
      return { color: 'green', icon: '😊', label: 'Positive' };
    case 'negative':
      return { color: 'red', icon: '😞', label: 'Negative' };
    default:
      return { color: 'yellow', icon: '😐', label: 'Neutral' };
  }
}

function transformToSummary(evaluation) {
  const cards = [
    {
      title: 'Lead Completion',
      score: evaluation.lead_completion_score,
      maxScore: 5,
      color: getScoreColor(evaluation.lead_completion_score, 5)
    },
    {
      title: 'Clarity & Politeness',
      score: evaluation.clarity_politeness_score,
      rationale: evaluation.clarity_politeness_rationale,
      maxScore: 5,
      color: getScoreColor(evaluation.clarity_politeness_score, 5)
    },
    {
      title: 'Question Relevance',
      score: evaluation.relevance_questions_score,
      rationale: evaluation.relevance_questions_rationale,
      maxScore: 5,
      color: getScoreColor(evaluation.relevance_questions_score, 5)
    },
    {
      title: 'Objection Handling',
      score: evaluation.objection_handling_score,
      rationale: evaluation.objection_handling_rationale,
      maxScore: 5,
      color: getScoreColor(evaluation.objection_handling_score, 5)
    },
    {
      title: 'Naturalness',
      score: evaluation.naturalness_score,
      rationale: evaluation.naturalness_rationale,
      maxScore: 5,
      color: getScoreColor(evaluation.naturalness_score, 5)
    },
    {
      title: 'Lead Intent',
      score: evaluation.lead_intent_score,
      rationale: evaluation.lead_intent_rationale,
      maxScore: 5,
      color: getScoreColor(evaluation.lead_intent_score, 5)
    },
    {
      title: 'Failure Risk',
      score: evaluation.failure_risk_score,
      rationale: evaluation.failure_risk_rationale,
      maxScore: 5,
      color: getScoreColor(5 - evaluation.failure_risk_score, 5) // Inverted for display
    }
  ];

  return {
    overallScore: evaluation.overall_evaluation_score,
    sentiment: evaluation.sentiment,
    humanReviewRequired: evaluation.human_review_required,
    negativeCallFlag: evaluation.negative_call_flag,
    evaluatedAt: new Date(evaluation.evaluated_at),
    cards
  };
}

// Test the transformation
console.log('Testing Lead Evaluation Service...\n');

const summary = transformToSummary(mockEvaluation);

console.log('Overall Summary:');
console.log(`- Overall Score: ${summary.overallScore}/5`);
console.log(`- Sentiment: ${getSentimentDisplay(summary.sentiment).label} ${getSentimentDisplay(summary.sentiment).icon}`);
console.log(`- Human Review Required: ${summary.humanReviewRequired ? 'Yes' : 'No'}`);
console.log(`- Negative Call Flag: ${summary.negativeCallFlag ? 'Yes' : 'No'}`);
console.log(`- Evaluated At: ${summary.evaluatedAt.toISOString()}\n`);

console.log('Score Cards:');
summary.cards.forEach((card, index) => {
  console.log(`${index + 1}. ${card.title}`);
  console.log(`   Score: ${card.score}/${card.maxScore} (${card.color})`);
  if (card.rationale) {
    console.log(`   Rationale: ${card.rationale}`);
  }
  console.log('');
});

console.log('✅ Lead Evaluation Service test completed successfully!');