-- Create tool_calls table
CREATE TABLE IF NOT EXISTS public.tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('tool_calls', 'tool_call_result')),
    tool_name TEXT,
    arguments JSONB,
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT tool_calls_role_content_check CHECK (
        (role = 'tool_calls' AND arguments IS NOT NULL AND result IS NULL) OR
        (role = 'tool_call_result' AND arguments IS NULL AND result IS NOT NULL)
    )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tool_calls_call_id ON public.tool_calls(call_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_client_id ON public.tool_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_role ON public.tool_calls(role);

-- Add comment to the table
COMMENT ON TABLE public.tool_calls IS 'Stores tool calls and their results for calls';

-- Add comments to columns
COMMENT ON COLUMN public.tool_calls.id IS 'Unique identifier for the tool call';
COMMENT ON COLUMN public.tool_calls.call_id IS 'Foreign key reference to the call';
COMMENT ON COLUMN public.tool_calls.client_id IS 'Foreign key reference to the client';
COMMENT ON COLUMN public.tool_calls.role IS 'Role of the entry: tool_calls or tool_call_result';
COMMENT ON COLUMN public.tool_calls.tool_name IS 'Name of the tool being called';
COMMENT ON COLUMN public.tool_calls.arguments IS 'JSON arguments for the tool call (only populated for tool_calls)';
COMMENT ON COLUMN public.tool_calls.result IS 'Result of the tool call (only populated for tool_call_result)';
COMMENT ON COLUMN public.tool_calls.created_at IS 'Timestamp when the record was created';

-- Add RLS policies
ALTER TABLE public.tool_calls ENABLE ROW LEVEL SECURITY;

-- Policy for admin users (can see all tool calls)
CREATE POLICY admin_tool_calls_policy ON public.tool_calls
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.client_id IS NULL OR users.role IN ('owner', 'admin'))
        )
    );

-- Policy for client users (can only see their client's tool calls)
CREATE POLICY client_tool_calls_policy ON public.tool_calls
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.client_id = tool_calls.client_id
        )
    );
