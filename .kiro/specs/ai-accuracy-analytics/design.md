# Design Document

## Overview

The AI Accuracy Analytics feature will replace the Cost Analytics tab to provide comprehensive insights into AI model performance, conversation quality, and accuracy tracking. This feature will analyze data from multiple database tables to identify which AI models perform better, extract failure patterns from prompt adherence reviews, and provide actionable insights for system improvement.

The design leverages existing database schemas including `calls`, `lead_evaluations`, `call_intelligence`, and `prompt_adherence_reviews` to create a unified analytics dashboard that tracks AI accuracy across different dimensions.

The system will analyze three distinct types of AI models used in the call process:

1. **LLM Models** (`call_llm_model`): Large Language Models that handle conversation logic
2. **Voice Models** (`voice_provider`/`voice_model`): Text-to-Speech (TTS) models that generate voice output
3. **Transcriber Models** (`transcriber_provider`/`transcriber_model`): Speech-to-Text (STT) models that transcribe user speech

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics.tsx (Main Page)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   CallAnalytics │  │ QualityAnalytics│  │ AIAccuracyAnalytics│
│  │                 │  │                 │  │    (NEW)        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                AIAccuracyAnalyticsService                       │
├─────────────────────────────────────────────────────────────────┤
│  • Model Performance Analysis                                  │
│  • Keyword/Topic Extraction from Prompt Adherence             │
│  • Failure Pattern Analysis                                    │
│  • Cross-Model Comparison                                      │
│  • Accuracy Trend Analysis                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │
│  │    calls    │ │ lead_evaluations│ │ prompt_adherence_reviews│ │
│  │             │ │                 │ │                         │ │
│  └─────────────┘ └─────────────────┘ └─────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              call_intelligence                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Data Collection**: Service aggregates data from multiple tables based on date filters and client selection
2. **Model Analysis**: Correlates AI model information with performance metrics
3. **Keyword Extraction**: Processes JSONB fields from prompt adherence reviews to extract failure patterns
4. **Metric Calculation**: Computes accuracy scores, failure rates, and performance trends
5. **Visualization**: Transforms processed data into chart-ready formats for the UI

## Components and Interfaces

### 1. AIAccuracyAnalytics Component

**Location**: `src/components/analytics/AIAccuracyAnalytics.tsx`

**Props Interface**:
```typescript
interface AIAccuracyAnalyticsProps {
  startDate?: string;
  endDate?: string;
  clientId?: string | null;
  modelType?: 'llm' | 'voice' | 'transcriber' | null; // Added model type filter
}
```

**Key Features**:
- Model performance comparison cards for LLM, voice, and transcriber models
- Accuracy trend charts with model type filtering
- Failure pattern analysis by model type
- Keyword extraction visualization
- Interactive filtering and drill-down capabilities
- Model type tabs for switching between LLM, voice, and transcriber analysis

### 2. AIAccuracyAnalyticsService

**Location**: `src/services/aiAccuracyAnalyticsService.ts`

**Main Interface**:
```typescript
interface AIAccuracyAnalyticsData {
  modelPerformance: ModelPerformanceMetrics;
  voiceModelPerformance: ModelPerformanceMetrics; // Added for voice models
  transcriberModelPerformance: ModelPerformanceMetrics; // Added for transcriber models
  accuracyTrends: AccuracyTrendData[];
  failurePatterns: FailurePatternData;
  keywordAnalysis: KeywordAnalysisData;
  conversationQuality: ConversationQualityMetrics;
  technicalMetrics: TechnicalMetricsData;
}

interface ModelPerformanceMetrics {
  totalCalls: number;
  modelsUsed: ModelUsageData[];
  averageAccuracy: number;
  bestPerformingModel: string;
  worstPerformingModel: string;
  modelType?: 'llm' | 'voice' | 'transcriber'; // Added model type
}

interface ModelUsageData {
  modelName: string;
  provider?: string; // Added provider field
  callCount: number;
  averageAccuracy: number;
  averageQualityScore: number;
  failureRate: number;
  averageAdherenceScore: number;
  modelType: 'llm' | 'voice' | 'transcriber'; // Added model type
}

interface FailurePatternData {
  commonFailures: FailureCategory[];
  criticalFailures: CriticalFailureData[];
  failuresByModel: ModelFailureBreakdown[];
  failuresByModelType?: { // Added model type breakdown
    llm: FailureCategory[];
    voice: FailureCategory[];
    transcriber: FailureCategory[];
  };
}

interface KeywordAnalysisData {
  topFailureKeywords: KeywordFrequency[];
  failureCategories: FailureCategoryBreakdown[];
  trendingIssues: TrendingIssueData[];
  keywordsByModelType?: { // Added model type breakdown
    llm: KeywordFrequency[];
    voice: KeywordFrequency[];
    transcriber: KeywordFrequency[];
  };
}
```

### 3. Updated Analytics.tsx

**Changes Required**:
- Replace "Cost Analytics" tab with "AI Accuracy" tab
- Update tab options array
- Add new TabsContent for AI Accuracy Analytics
- Maintain existing mobile responsiveness and filtering

## Data Models

### Core Data Structures

#### 1. Model Performance Analysis
```typescript
interface ModelPerformanceMetrics {
  totalCalls: number;
  modelsUsed: ModelUsageData[];
  averageAccuracy: number;
  bestPerformingModel: string;
  worstPerformingModel: string;
  performanceComparison: ModelComparisonData[];
  modelType?: 'llm' | 'voice' | 'transcriber'; // Added model type
}

interface ModelUsageData {
  modelName: string;
  provider?: string; // Added provider field
  callCount: number;
  usagePercentage: number;
  averageAccuracy: number;
  averageQualityScore: number;
  failureRate: number;
  averageAdherenceScore: number;
  costEfficiency: number;
  responseTime: number;
  modelType: 'llm' | 'voice' | 'transcriber'; // Added model type
}
```

#### 2. Failure Pattern Analysis
```typescript
interface FailurePatternData {
  commonFailures: FailureCategory[];
  criticalFailures: CriticalFailureData[];
  failuresByModel: ModelFailureBreakdown[];
  failureTrends: FailureTrendData[];
  failuresByModelType?: { // Added model type breakdown
    llm: FailureCategory[];
    voice: FailureCategory[];
    transcriber: FailureCategory[];
  };
}

interface FailureCategory {
  category: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  examples: string[];
}

interface KeywordFrequency {
  keyword: string;
  frequency: number;
  category: 'hallucination' | 'transcriber' | 'rules' | 'protocol' | 'other';
  trend: 'increasing' | 'decreasing' | 'stable';
}
```

#### 3. Accuracy Trends
```typescript
interface AccuracyTrendData {
  date: string;
  overallAccuracy: number;
  modelAccuracies: { [modelName: string]: number };
  qualityScore: number;
  adherenceScore: number;
  failureCount: number;
  modelType?: 'llm' | 'voice' | 'transcriber'; // Added model type
}
```

### Database Query Patterns

#### 1. LLM Model Performance Query
```sql
SELECT 
  c.call_llm_model,
  COUNT(*) as call_count,
  AVG(le.overall_evaluation_score) as avg_quality_score,
  AVG(par.prompt_adherence_score) as avg_adherence_score,
  COUNT(CASE WHEN par.critical_failures_summary IS NOT NULL THEN 1 END) as failure_count
FROM calls c
LEFT JOIN lead_evaluations le ON c.id = le.call_id
LEFT JOIN prompt_adherence_reviews par ON c.id = par.call_id
WHERE c.created_at BETWEEN ? AND ?
GROUP BY c.call_llm_model
```

#### 1.1 Voice Model Performance Query
```sql
SELECT 
  c.voice_provider,
  c.voice_model,
  COUNT(*) as call_count,
  AVG(le.overall_evaluation_score) as avg_quality_score,
  AVG(par.prompt_adherence_score) as avg_adherence_score,
  COUNT(CASE WHEN par.critical_failures_summary IS NOT NULL THEN 1 END) as failure_count
FROM calls c
LEFT JOIN lead_evaluations le ON c.id = le.call_id
LEFT JOIN prompt_adherence_reviews par ON c.id = par.call_id
WHERE c.created_at BETWEEN ? AND ?
GROUP BY c.voice_provider, c.voice_model
```

#### 1.2 Transcriber Model Performance Query
```sql
SELECT 
  c.transcriber_provider,
  c.transcriber_model,
  COUNT(*) as call_count,
  AVG(le.overall_evaluation_score) as avg_quality_score,
  AVG(par.prompt_adherence_score) as avg_adherence_score,
  COUNT(CASE WHEN par.critical_failures_summary IS NOT NULL THEN 1 END) as failure_count
FROM calls c
LEFT JOIN lead_evaluations le ON c.id = le.call_id
LEFT JOIN prompt_adherence_reviews par ON c.id = par.call_id
WHERE c.created_at BETWEEN ? AND ?
GROUP BY c.transcriber_provider, c.transcriber_model
```

#### 2. Keyword Extraction Query
```sql
SELECT 
  par.what_went_wrong,
  par.critical_failures_summary,
  par.recommendations_for_improvement,
  c.call_llm_model,
  c.voice_provider,
  c.voice_model,
  c.transcriber_provider,
  c.transcriber_model
FROM prompt_adherence_reviews par
JOIN calls c ON par.call_id = c.id
WHERE par.reviewed_at BETWEEN ? AND ?
  AND (par.what_went_wrong IS NOT NULL 
       OR par.critical_failures_summary IS NOT NULL)
```

## Error Handling

### Service Layer Error Handling
- Graceful degradation when data is unavailable
- Fallback to cached data when possible
- Clear error messages for different failure scenarios
- Retry logic for transient database errors

### UI Error Handling
- Loading states for all data fetching operations
- Empty states when no data is available
- Error boundaries to prevent component crashes
- User-friendly error messages with actionable guidance

## Testing Strategy

### Unit Tests
- Service layer methods for data aggregation
- Keyword extraction algorithms
- Model performance calculations
- Data transformation functions

### Integration Tests
- Database query performance
- Service integration with Supabase
- Component rendering with various data states
- Filter functionality across date ranges and clients

### Performance Tests
- Large dataset handling (1000+ calls)
- Query optimization for complex joins
- Chart rendering performance
- Memory usage during data processing

### User Acceptance Tests
- Admin user can view all client data
- Regular users see only their client data
- Filtering works correctly across all metrics
- Charts update properly when filters change
- Mobile responsiveness maintained

## Implementation Phases

### Phase 1: Core Service Implementation
- Create AIAccuracyAnalyticsService
- Implement basic model performance analysis for all model types (LLM, voice, transcriber)
- Set up database queries for accuracy metrics across all model types
- Create data transformation utilities with model type awareness

### Phase 2: Keyword Extraction Engine
- Implement JSONB parsing for prompt adherence data
- Create keyword categorization system
- Build failure pattern detection algorithms
- Add trending analysis capabilities

### Phase 3: UI Component Development
- Create AIAccuracyAnalytics component with model type tabs
- Implement performance metric cards for each model type
- Add interactive charts and visualizations with model type filtering
- Ensure mobile responsiveness
- Create model type selector interface

### Phase 4: Integration and Polish
- Update Analytics.tsx to include new tab
- Add comprehensive error handling
- Implement loading states and empty states
- Performance optimization and testing

### Phase 5: Advanced Features
- Add model comparison tools
- Implement automated insights generation
- Create exportable reports
- Add real-time accuracy monitoring

## Security Considerations

- Respect existing client data isolation patterns
- Ensure admin users can access cross-client data appropriately
- Validate all input parameters to prevent injection attacks
- Implement proper authentication checks before data access
- Log access to sensitive accuracy metrics for audit purposes

## Performance Considerations

- Implement query optimization for large datasets
- Use database indexes effectively for time-based queries
- Cache frequently accessed model performance data
- Implement pagination for large result sets
- Optimize chart rendering for smooth user experience
- Consider data aggregation strategies for historical trends