CREATE TABLE public.call_intelligence (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Basic Classification
  inquiry_type TEXT NOT NULL,  -- 'general', 'purchase', 'service', 'parts', 'test_drive', 'finance', 'trade_in', 'other'
  inquiry_subtype TEXT,        -- More specific classification
  is_urgent BOOLEAN DEFAULT false,
  is_high_intent BOOLEAN DEFAULT false,
  
  -- Vehicle Information (stored directly since no vehicles table)
  vehicle_interest JSONB,  -- {make: 'Honda', model: 'Civic', year: '2023', trim: 'Touring', price_range: '20-30k'}
  
  -- Customer Intent
  intent_strength NUMERIC(3,2),  -- 0.0 to 1.0
  purchase_timeline TEXT,        -- 'immediate', '1-3_months', '3-6_months', '6+_months'
  budget_range TEXT,             -- '$0-10k', '$10-20k', etc.
  financing_needed BOOLEAN,
  trade_in_available BOOLEAN,
  
  -- Caller Information
  is_new_customer BOOLEAN,
  is_returning_customer BOOLEAN,
  customer_sentiment TEXT,       -- 'positive', 'neutral', 'negative'
  customer_engagement_level NUMERIC(3,2),  -- 0.0 to 1.0
  
  -- Business Intelligence
  sales_opportunity_score NUMERIC(3,2),  -- 0.0 to 1.0
  service_opportunity_score NUMERIC(3,2),-- 0.0 to 1.0
  parts_opportunity_score NUMERIC(3,2),  -- 0.0 to 1.0
  recommended_next_actions TEXT[],        -- Array of recommended actions
  
  -- AI Analysis Metadata
  ai_confidence_score NUMERIC(3,2),      -- 0.0 to 1.0
  analysis_version TEXT,                 -- Version of your analysis model
  raw_analysis JSONB,                    -- Raw output from AI analysis
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_inquiry_type CHECK (
    inquiry_type IN ('general', 'purchase', 'service', 'parts', 'test_drive', 'finance', 'trade_in', 'other')
  )
);

-- Indexes for performance
CREATE INDEX idx_call_intel_call_id ON public.call_intelligence(call_id);
CREATE INDEX idx_call_intel_lead_id ON public.call_intelligence(lead_id);
CREATE INDEX idx_call_intel_client_id ON public.call_intelligence(client_id);
CREATE INDEX idx_call_intel_inquiry_type ON public.call_intelligence(inquiry_type);
CREATE INDEX idx_call_intel_created_at ON public.call_intelligence(created_at);
CREATE INDEX idx_call_intel_vehicle_interest ON public.call_intelligence USING GIN (vehicle_interest jsonb_path_ops);