-- This is a future concept, do not run this migration
-- CORE PRINCIPLE: Each table owns specific domains
-- prompt_adherence_reviews = Technical compliance (rule following)
-- lead_evaluations = Business performance (lead quality, customer experience) 
-- NEW: call_metadata = Shared technical metrics (no business logic)

-- 1. TECHNICAL TELEMETRY (Technical metrics only - no business logic)
CREATE TABLE public.call_telemetry (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  call_id UUID NOT NULL,
  client_id UUID NOT NULL,
  
  -- Model & Infrastructure
  model_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  
  -- Performance Metrics (Pure Technical)
  total_tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost_usd DECIMAL(10,6),
  response_latency_ms INTEGER,
  conversation_duration_seconds INTEGER,
  
  -- Tool Performance
  tool_calls_made JSONB, -- [{"tool": "checkTime", "latency_ms": 120, "success": true}]
  tool_success_rate DECIMAL(3,2),
  
  -- Context Management
  context_window_used INTEGER,
  context_utilization_percent DECIMAL(5,2),
  
  -- Error Tracking (Technical errors only)
  technical_error_count INTEGER DEFAULT 0,
  technical_error_types JSONB, -- ["timeout", "token_limit", "tool_failure"]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT call_telemetry_pkey PRIMARY KEY (id),
  CONSTRAINT call_telemetry_call_id_key UNIQUE (call_id),
  CONSTRAINT call_telemetry_call_id_fkey FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- 2. EVALUATION ORCHESTRATION (Links evaluations together)
CREATE TABLE public.evaluation_summary (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  call_id UUID NOT NULL,
  client_id UUID NOT NULL,
  
  -- Evaluation Status
  technical_review_completed BOOLEAN DEFAULT FALSE,
  business_review_completed BOOLEAN DEFAULT FALSE,
  
  -- Cross-Evaluation Insights (Derived from both tables)
  technical_business_alignment_score DECIMAL(3,2), -- How well technical compliance translated to business success
  overall_call_success BOOLEAN, -- Combined success indicator
  
  -- Priority & Action Items
  requires_immediate_attention BOOLEAN DEFAULT FALSE,
  attention_reason TEXT, -- "Critical failure with customer satisfaction impact"
  improvement_priority INTEGER, -- 1-5 (1=urgent, 5=low)
  
  -- Aggregated Scores (Calculated, not duplicated)
  composite_score DECIMAL(3,2), -- Weighted combination of technical + business
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT evaluation_summary_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_summary_call_id_key UNIQUE (call_id),
  CONSTRAINT evaluation_summary_call_id_fkey FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- 3. CROSS-EVALUATION INSIGHTS (Relationships between evaluations)
CREATE TABLE public.evaluation_correlations (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  call_id UUID NOT NULL,
  
  -- Correlation Analysis
  technical_compliance_vs_lead_quality JSONB, -- {"correlation": 0.85, "insights": ["High compliance led to better lead capture"]}
  rule_failures_impact_on_sentiment JSONB, -- Which rule violations affected customer sentiment most
  cost_efficiency_vs_outcomes JSONB, -- Cost per successful lead analysis
  
  -- Pattern Recognition
  failure_cascade JSONB, -- How technical failures led to business failures
  success_patterns JSONB, -- What combination of factors led to success
  
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT evaluation_correlations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluation_correlations_call_id_key UNIQUE (call_id)
);

-- 4. ACTIONABLE INSIGHTS (AI-generated recommendations)
CREATE TABLE public.improvement_recommendations (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  client_id UUID NOT NULL,
  call_id UUID NULL, -- NULL for system-wide recommendations
  
  -- Recommendation Details
  recommendation_type TEXT NOT NULL, -- "prompt_fix", "training_data", "system_config"
  priority INTEGER NOT NULL, -- 1-5
  
  title TEXT NOT NULL, -- "Fix date calculation logic"
  description TEXT NOT NULL,
  
  -- Evidence Base
  based_on_calls INTEGER, -- How many calls this recommendation is based on
  confidence_score DECIMAL(3,2), -- How confident we are in this recommendation
  
  -- Implementation
  implementation_effort TEXT, -- "low", "medium", "high"
  expected_improvement JSONB, -- {"compliance_score": "+0.5", "lead_quality": "+10%"}
  
  -- Status
  status TEXT DEFAULT 'pending', -- "pending", "in_progress", "implemented", "rejected"
  implemented_at TIMESTAMP WITH TIME ZONE,
  results_after_implementation JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT improvement_recommendations_pkey PRIMARY KEY (id)
);

-- 5. PERFORMANCE TRACKING (Aggregated metrics without duplication)
CREATE TABLE public.performance_snapshots (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  client_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Volume Metrics
  total_calls INTEGER DEFAULT 0,
  
  -- Technical Performance (from prompt_adherence_reviews + call_telemetry)
  avg_compliance_score DECIMAL(3,2),
  critical_failure_rate DECIMAL(5,2),
  avg_response_latency_ms INTEGER,
  total_cost_usd DECIMAL(10,2),
  
  -- Business Performance (from lead_evaluations)
  avg_lead_completion_score DECIMAL(3,2),
  avg_overall_evaluation_score DECIMAL(3,2),
  positive_sentiment_rate DECIMAL(5,2),
  human_review_required_rate DECIMAL(5,2),
  
  -- Cross-Evaluation Metrics (calculated)
  technical_business_alignment DECIMAL(3,2), -- How well technical performance predicts business success
  cost_per_quality_lead DECIMAL(8,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT performance_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT performance_snapshots_client_date_unique UNIQUE (client_id, snapshot_date)
);

-- INDEXES
CREATE INDEX idx_call_telemetry_client_model ON public.call_telemetry(client_id, model_version);
CREATE INDEX idx_evaluation_summary_priority ON public.evaluation_summary(improvement_priority, requires_immediate_attention);
CREATE INDEX idx_improvement_recommendations_priority ON public.improvement_recommendations(client_id, priority, status);
CREATE INDEX idx_performance_snapshots_date ON public.performance_snapshots(client_id, snapshot_date DESC);

-- FUNCTIONS TO CALCULATE CROSS-EVALUATION METRICS
-- Function to calculate composite score
CREATE OR REPLACE FUNCTION calculate_composite_score(p_call_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  technical_score DECIMAL(3,2);
  business_score DECIMAL(3,2);
  composite DECIMAL(3,2);
BEGIN
  -- Get technical score (compliance)
  SELECT prompt_adherence_score::DECIMAL / 5.0 
  INTO technical_score
  FROM prompt_adherence_reviews 
  WHERE call_id = p_call_id;
  
  -- Get business score (lead evaluation)
  SELECT overall_evaluation_score / 5.0 
  INTO business_score
  FROM lead_evaluations 
  WHERE call_id = p_call_id;
  
  -- Calculate weighted composite (60% business, 40% technical)
  composite := COALESCE(business_score * 0.6 + technical_score * 0.4, 0);
  
  RETURN LEAST(composite, 1.0); -- Cap at 1.0
END;
$$ LANGUAGE plpgsql;

-- Function to update evaluation summary after both reviews complete
CREATE OR REPLACE FUNCTION update_evaluation_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO evaluation_summary (call_id, client_id, technical_review_completed, composite_score)
  VALUES (NEW.call_id, NEW.client_id, TRUE, calculate_composite_score(NEW.call_id))
  ON CONFLICT (call_id) 
  DO UPDATE SET 
    technical_review_completed = TRUE,
    composite_score = calculate_composite_score(NEW.call_id),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update evaluation summary after lead evaluation
CREATE OR REPLACE FUNCTION update_evaluation_summary_business()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO evaluation_summary (call_id, client_id, business_review_completed, composite_score)
  VALUES (NEW.call_id, NEW.client_id, TRUE, calculate_composite_score(NEW.call_id))
  ON CONFLICT (call_id) 
  DO UPDATE SET 
    business_review_completed = TRUE,
    composite_score = calculate_composite_score(NEW.call_id),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
CREATE TRIGGER prompt_adherence_summary_trigger
  AFTER INSERT ON prompt_adherence_reviews
  FOR EACH ROW EXECUTE FUNCTION update_evaluation_summary();

CREATE TRIGGER lead_evaluation_summary_trigger
  AFTER INSERT ON lead_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_evaluation_summary_business();

-- UNIFIED DASHBOARD VIEWS
-- Master view combining all evaluation data
CREATE VIEW public.unified_call_analysis AS
SELECT 
  c.id as call_id,
  c.client_id,
  
  -- Technical Metrics
  par.prompt_adherence_score,
  par.critical_failures_summary,
  ct.model_version,
  ct.total_cost_usd,
  ct.response_latency_ms,
  
  -- Business Metrics  
  le.lead_completion_score,
  le.overall_evaluation_score,
  le.sentiment,
  le.human_review_required,
  
  -- Unified Metrics
  es.composite_score,
  es.technical_business_alignment_score,
  es.requires_immediate_attention,
  
  c.created_at
FROM calls c
LEFT JOIN prompt_adherence_reviews par ON c.id = par.call_id
LEFT JOIN lead_evaluations le ON c.id = le.call_id  
LEFT JOIN call_telemetry ct ON c.id = ct.call_id
LEFT JOIN evaluation_summary es ON c.id = es.call_id;

-- Performance trends view
CREATE VIEW public.performance_trends AS
SELECT 
  client_id,
  snapshot_date,
  
  -- Technical trends
  avg_compliance_score,
  critical_failure_rate,
  avg_response_latency_ms,
  
  -- Business trends
  avg_lead_completion_score,
  positive_sentiment_rate,
  
  -- Efficiency trends
  cost_per_quality_lead,
  technical_business_alignment
  
FROM performance_snapshots
ORDER BY client_id, snapshot_date DESC;