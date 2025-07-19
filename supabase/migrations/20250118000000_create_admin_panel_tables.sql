-- Migration: Create admin panel production tables
-- This migration creates the missing tables needed for the admin panel production feature

-- Create audit_logs table for tracking all administrative actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_invitations table for managing user invitation workflow
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'user', 'client_admin', 'client_user')),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create client_metrics_cache table for performance optimization
CREATE TABLE IF NOT EXISTS client_metrics_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL,
    metric_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metric_data JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(client_id, metric_type, metric_period, period_start)
);

-- Create scheduled_exports table for recurring export functionality
CREATE TABLE IF NOT EXISTS scheduled_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    export_type TEXT NOT NULL, -- 'clients', 'users', 'calls', 'leads', 'audit_logs'
    export_format TEXT NOT NULL DEFAULT 'csv' CHECK (export_format IN ('csv', 'xlsx', 'json')),
    filters JSONB DEFAULT '{}',
    schedule_cron TEXT NOT NULL, -- Cron expression for scheduling
    email_recipients TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for system-wide exports
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create export_history table to track export executions
CREATE TABLE IF NOT EXISTS export_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scheduled_export_id UUID REFERENCES scheduled_exports(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    export_format TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    record_count INTEGER,
    file_size_bytes BIGINT,
    file_url TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- Create indexes for user_invitations table
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_client_id ON user_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by ON user_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);

-- Create indexes for client_metrics_cache table
CREATE INDEX IF NOT EXISTS idx_client_metrics_cache_client_id ON client_metrics_cache(client_id);
CREATE INDEX IF NOT EXISTS idx_client_metrics_cache_type_period ON client_metrics_cache(metric_type, metric_period);
CREATE INDEX IF NOT EXISTS idx_client_metrics_cache_expires_at ON client_metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_client_metrics_cache_calculated_at ON client_metrics_cache(calculated_at DESC);

-- Create indexes for scheduled_exports table
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_created_by ON scheduled_exports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_client_id ON scheduled_exports(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_is_active ON scheduled_exports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run_at ON scheduled_exports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_export_type ON scheduled_exports(export_type);

-- Create indexes for export_history table
CREATE INDEX IF NOT EXISTS idx_export_history_scheduled_export_id ON export_history(scheduled_export_id);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON export_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_created_by ON export_history(created_by);

-- Add missing performance indexes for existing tables
-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_plan ON clients(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_clients_joined_at ON clients(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_last_active_at ON clients(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_clients_contact_email ON clients(contact_email);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users USING gin(to_tsvector('english', email));
CREATE INDEX IF NOT EXISTS idx_users_full_name_search ON users USING gin(to_tsvector('english', full_name));

-- Calls table indexes
CREATE INDEX IF NOT EXISTS idx_calls_client_id ON calls(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_start_time ON calls(call_start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calls_call_end_time ON calls(call_end_time DESC);
CREATE INDEX IF NOT EXISTS idx_calls_call_duration_seconds ON calls(call_duration_seconds);
CREATE INDEX IF NOT EXISTS idx_calls_caller_phone_number ON calls(caller_phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_to_phone_number ON calls(to_phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_transfer_flag ON calls(transfer_flag);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_total_call_cost_usd ON calls(total_call_cost_usd);

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_call_id ON leads(call_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone_number ON leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_sent_to_client_at ON leads(sent_to_client_at);
CREATE INDEX IF NOT EXISTS idx_leads_appointment_confirmed_at ON leads(appointment_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_leads_full_name_search ON leads USING gin(to_tsvector('english', coalesce(full_name, first_name || ' ' || last_name)));

-- Lead evaluations table indexes (if it exists)
CREATE INDEX IF NOT EXISTS idx_lead_evaluations_client_id ON lead_evaluations(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_evaluations_call_id ON lead_evaluations(call_id);
CREATE INDEX IF NOT EXISTS idx_lead_evaluations_sentiment ON lead_evaluations(sentiment);
CREATE INDEX IF NOT EXISTS idx_lead_evaluations_evaluated_at ON lead_evaluations(evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_evaluations_human_review_required ON lead_evaluations(human_review_required);

-- Cost events table indexes (if it exists)
CREATE INDEX IF NOT EXISTS idx_cost_events_client_id ON cost_events(client_id);
CREATE INDEX IF NOT EXISTS idx_cost_events_call_id ON cost_events(call_id);
CREATE INDEX IF NOT EXISTS idx_cost_events_event_type ON cost_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cost_events_timestamp ON cost_events(timestamp DESC);

-- Enable RLS on new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_invitations_updated_at 
    BEFORE UPDATE ON user_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_exports_updated_at 
    BEFORE UPDATE ON scheduled_exports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE user_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM client_metrics_cache 
    WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Add comments to tables for documentation
COMMENT ON TABLE audit_logs IS 'Tracks all administrative actions for compliance and security';
COMMENT ON TABLE user_invitations IS 'Manages user invitation workflow with token-based authentication';
COMMENT ON TABLE client_metrics_cache IS 'Caches calculated client metrics for performance optimization';
COMMENT ON TABLE scheduled_exports IS 'Manages recurring data export schedules';
COMMENT ON TABLE export_history IS 'Tracks execution history of data exports';

-- Add comments to key columns
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (create, update, delete, login, etc.)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before the change (for updates)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values after the change (for creates/updates)';
COMMENT ON COLUMN user_invitations.invitation_token IS 'Secure token for invitation acceptance';
COMMENT ON COLUMN client_metrics_cache.metric_data IS 'Cached metric calculations in JSON format';
COMMENT ON COLUMN scheduled_exports.schedule_cron IS 'Cron expression defining export schedule';
COMMENT ON COLUMN scheduled_exports.filters IS 'JSON filters to apply to export data';