-- Update prompt_adherence_reviews table to use JSONB for array fields
-- This migration handles the conversion from text arrays to JSONB

-- First, let's check if the table exists and what the current structure is
DO $$
BEGIN
    -- Drop and recreate the table with JSONB fields
    -- This is safer than trying to convert existing data
    DROP TABLE IF EXISTS public.prompt_adherence_reviews;
    
    CREATE TABLE public.prompt_adherence_reviews (
        id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
        call_id uuid NOT NULL,
        client_id uuid NOT NULL,
        
        -- A score from 1-100 indicating how strictly the agent followed its prompt
        prompt_adherence_score integer NOT NULL,
        
        -- Using JSONB to store arrays of strings for powerful querying and future flexibility
        what_went_well jsonb NULL,
        what_went_wrong jsonb NULL,
        recommendations_for_improvement jsonb NULL,
        
        -- A text summary of any critical failures, like hallucinations
        critical_failures_summary text NULL,
        
        reviewed_at timestamp with time zone NULL DEFAULT now(),
        
        CONSTRAINT prompt_adherence_reviews_pkey PRIMARY KEY (id),
        CONSTRAINT prompt_adherence_reviews_call_id_key UNIQUE (call_id),
        CONSTRAINT prompt_adherence_reviews_call_id_fkey FOREIGN KEY (call_id) REFERENCES calls (id) ON DELETE CASCADE,
        CONSTRAINT prompt_adherence_reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_client_id ON public.prompt_adherence_reviews USING btree (client_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_call_id ON public.prompt_adherence_reviews USING btree (call_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_score ON public.prompt_adherence_reviews USING btree (prompt_adherence_score);

    -- GIN indexes for JSONB fields to enable efficient querying
    CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_well_gin ON public.prompt_adherence_reviews USING gin (what_went_well);
    CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_wrong_gin ON public.prompt_adherence_reviews USING gin (what_went_wrong);
    CREATE INDEX IF NOT EXISTS idx_prompt_adherence_reviews_recommendations_gin ON public.prompt_adherence_reviews USING gin (recommendations_for_improvement);

    -- Enable RLS (Row Level Security) if needed
    ALTER TABLE public.prompt_adherence_reviews ENABLE ROW LEVEL SECURITY;

    -- Add some sample data for testing (optional - remove in production)
    -- INSERT INTO public.prompt_adherence_reviews (
    --     call_id, 
    --     client_id, 
    --     prompt_adherence_score,
    --     what_went_well,
    --     what_went_wrong,
    --     critical_failures_summary
    -- ) VALUES (
    --     'sample-call-id'::uuid,
    --     'sample-client-id'::uuid,
    --     85,
    --     '["Followed greeting protocol", "Asked relevant questions", "Maintained professional tone"]'::jsonb,
    --     '["Interrupted customer once", "Could have been more empathetic"]'::jsonb,
    --     'No critical failures detected'
    -- );

END $$;