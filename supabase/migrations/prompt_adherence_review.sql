-- This table stores a detailed, qualitative review of the AI's performance 
-- against its prompt, including a quantitative score for trend analysis.

CREATE TABLE public.prompt_adherence_reviews (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    call_id uuid NOT NULL,
    client_id uuid NOT NULL,
    
    -- A score from 1-5 indicating how strictly the agent followed its prompt.
    prompt_adherence_score integer NOT NULL,
    
    -- An array of strings detailing what the agent did correctly.
    what_went_well text[] NULL,
    
    -- An array of strings detailing where the agent deviated from its prompt.
    what_went_wrong text[] NULL,
    
    -- An array of actionable suggestions to improve the agent's prompt.
    recommendations_for_improvement text[] NULL,
    
    -- A text summary of any critical failures, like hallucinations.
    critical_failures_summary text NULL,
    
    reviewed_at timestamp with time zone NULL DEFAULT now(),
    
    CONSTRAINT prompt_adherence_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT prompt_adherence_reviews_call_id_key UNIQUE (call_id),
    CONSTRAINT prompt_adherence_reviews_call_id_fkey FOREIGN KEY (call_id) REFERENCES calls (id) ON DELETE CASCADE,
    CONSTRAINT prompt_adherence_reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_client_id ON public.prompt_adherence_reviews USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_call_id ON public.prompt_adherence_reviews USING btree (call_id);
CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_score ON public.prompt_adherence_reviews USING btree (prompt_adherence_score);

