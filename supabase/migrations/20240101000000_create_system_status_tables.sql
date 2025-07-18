-- Create system_messages table
CREATE TABLE IF NOT EXISTS system_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for platform-wide messages
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create agent_status table (per-client status tracking)
CREATE TABLE IF NOT EXISTS agent_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for platform-wide status
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
    message TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure only one status record per client (or one global if client_id is NULL)
    UNIQUE(client_id)
);

-- Insert default platform-wide agent status
INSERT INTO agent_status (client_id, status, message, updated_by) 
SELECT NULL, 'active', 'All systems operational', users.id
FROM users 
WHERE users.role IN ('admin', 'owner') 
LIMIT 1
ON CONFLICT (client_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_messages_timestamp ON system_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_messages_expires_at ON system_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_system_messages_type ON system_messages(type);
CREATE INDEX IF NOT EXISTS idx_system_messages_client_id ON system_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_system_messages_created_by ON system_messages(created_by);
CREATE INDEX IF NOT EXISTS idx_agent_status_client_id ON agent_status(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_updated_by ON agent_status(updated_by);
CREATE INDEX IF NOT EXISTS idx_agent_status_last_updated ON agent_status(last_updated DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE system_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Create policies for system_messages
CREATE POLICY "Anyone can view system messages" ON system_messages
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage system messages" ON system_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

-- Create policies for agent_status
CREATE POLICY "Anyone can view agent status" ON agent_status
    FOR SELECT USING (true);

CREATE POLICY "Only admins can update agent status" ON agent_status
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_system_messages_updated_at 
    BEFORE UPDATE ON system_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically clean up expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM system_messages 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up expired messages (runs every hour)
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- SELECT cron.schedule('cleanup-expired-messages', '0 * * * *', 'SELECT cleanup_expired_messages();');