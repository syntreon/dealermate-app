-- Migration: Create comprehensive Row Level Security (RLS) policies
-- This migration implements RLS policies for all tables with proper role-based access control

-- First, ensure RLS is enabled on all relevant tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

DROP POLICY IF EXISTS "calls_select_policy" ON calls;
DROP POLICY IF EXISTS "calls_insert_policy" ON calls;
DROP POLICY IF EXISTS "calls_update_policy" ON calls;
DROP POLICY IF EXISTS "calls_delete_policy" ON calls;

DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;

-- Helper function to check if user is admin or owner
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.role = 'admin' OR users.role = 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's client_id
CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT client_id FROM users 
        WHERE users.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to specific client
CREATE OR REPLACE FUNCTION user_has_client_access(target_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
            users.role IN ('admin', 'owner') OR 
            users.client_id = target_client_id OR
            users.client_id IS NULL
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CLIENTS TABLE RLS POLICIES
-- Admins and owners can see all clients, others can only see their own client
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (
        is_admin_or_owner() OR 
        id = get_user_client_id()
    );

-- Only admins and owners can create clients
CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (is_admin_or_owner());

-- Admins and owners can update all clients, client_admins can update their own client
CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (
        is_admin_or_owner() OR 
        (id = get_user_client_id() AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'client_admin'
        ))
    );

-- Only admins and owners can delete clients
CREATE POLICY "clients_delete_policy" ON clients
    FOR DELETE USING (is_admin_or_owner());

-- USERS TABLE RLS POLICIES
-- Admins and owners can see all users, others can see users from their client + themselves
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        is_admin_or_owner() OR 
        id = auth.uid() OR
        client_id = get_user_client_id()
    );

-- Admins, owners, and client_admins can create users
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'client_admin'
            AND users.client_id = NEW.client_id
        )
    );

-- Users can update themselves, admins/owners can update all, client_admins can update their client users
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        id = auth.uid() OR
        is_admin_or_owner() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'client_admin'
            AND users.client_id = OLD.client_id
        )
    );

-- Only admins and owners can delete users (except self-deletion)
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE USING (
        is_admin_or_owner() OR
        id = auth.uid()
    );

-- CALLS TABLE RLS POLICIES
-- Users can only see calls from their client, admins/owners see all
CREATE POLICY "calls_select_policy" ON calls
    FOR SELECT USING (
        is_admin_or_owner() OR 
        user_has_client_access(client_id)
    );

-- System can insert calls (typically from API), admins can insert for testing
CREATE POLICY "calls_insert_policy" ON calls
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        user_has_client_access(client_id)
    );

-- Admins can update all calls, client users can update their client's calls
CREATE POLICY "calls_update_policy" ON calls
    FOR UPDATE USING (
        is_admin_or_owner() OR 
        user_has_client_access(client_id)
    );

-- Only admins and owners can delete calls
CREATE POLICY "calls_delete_policy" ON calls
    FOR DELETE USING (is_admin_or_owner());

-- LEADS TABLE RLS POLICIES
-- Users can only see leads from their client, admins/owners see all
CREATE POLICY "leads_select_policy" ON leads
    FOR SELECT USING (
        is_admin_or_owner() OR 
        user_has_client_access(client_id)
    );

-- System can insert leads (typically from call processing), admins can insert for testing
CREATE POLICY "leads_insert_policy" ON leads
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        user_has_client_access(client_id)
    );

-- Users can update leads from their client, admins can update all
CREATE POLICY "leads_update_policy" ON leads
    FOR UPDATE USING (
        is_admin_or_owner() OR 
        user_has_client_access(client_id)
    );

-- Only admins and owners can delete leads
CREATE POLICY "leads_delete_policy" ON leads
    FOR DELETE USING (is_admin_or_owner());

-- AUDIT_LOGS TABLE RLS POLICIES
-- Admins and owners can see all audit logs, others can see logs related to their client
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT USING (
        is_admin_or_owner() OR 
        (client_id IS NOT NULL AND user_has_client_access(client_id)) OR
        user_id = auth.uid()
    );

-- Only system and admins can insert audit logs
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        user_id = auth.uid()
    );

-- Audit logs are immutable - no updates allowed
CREATE POLICY "audit_logs_update_policy" ON audit_logs
    FOR UPDATE USING (false);

-- Only admins and owners can delete audit logs (for cleanup)
CREATE POLICY "audit_logs_delete_policy" ON audit_logs
    FOR DELETE USING (is_admin_or_owner());

-- USER_INVITATIONS TABLE RLS POLICIES
-- Admins and owners can see all invitations, client_admins can see their client's invitations
CREATE POLICY "user_invitations_select_policy" ON user_invitations
    FOR SELECT USING (
        is_admin_or_owner() OR
        (client_id IS NOT NULL AND user_has_client_access(client_id)) OR
        invited_by = auth.uid()
    );

-- Admins, owners, and client_admins can create invitations
CREATE POLICY "user_invitations_insert_policy" ON user_invitations
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'client_admin'
            AND users.client_id = NEW.client_id
        )
    );

-- Only the inviter and admins can update invitations
CREATE POLICY "user_invitations_update_policy" ON user_invitations
    FOR UPDATE USING (
        is_admin_or_owner() OR
        invited_by = auth.uid()
    );

-- Only admins and the inviter can delete invitations
CREATE POLICY "user_invitations_delete_policy" ON user_invitations
    FOR DELETE USING (
        is_admin_or_owner() OR
        invited_by = auth.uid()
    );

-- CLIENT_METRICS_CACHE TABLE RLS POLICIES
-- Users can only see metrics cache for their client, admins see all
CREATE POLICY "client_metrics_cache_select_policy" ON client_metrics_cache
    FOR SELECT USING (
        is_admin_or_owner() OR 
        user_has_client_access(client_id)
    );

-- System and admins can insert cache entries
CREATE POLICY "client_metrics_cache_insert_policy" ON client_metrics_cache
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        user_has_client_access(client_id)
    );

-- System and admins can update cache entries
CREATE POLICY "client_metrics_cache_update_policy" ON client_metrics_cache
    FOR UPDATE USING (
        is_admin_or_owner() OR
        user_has_client_access(client_id)
    );

-- System and admins can delete expired cache entries
CREATE POLICY "client_metrics_cache_delete_policy" ON client_metrics_cache
    FOR DELETE USING (
        is_admin_or_owner() OR
        user_has_client_access(client_id)
    );

-- SCHEDULED_EXPORTS TABLE RLS POLICIES
-- Users can see exports for their client, admins see all
CREATE POLICY "scheduled_exports_select_policy" ON scheduled_exports
    FOR SELECT USING (
        is_admin_or_owner() OR
        (client_id IS NOT NULL AND user_has_client_access(client_id)) OR
        created_by = auth.uid()
    );

-- Admins, owners, and client_admins can create scheduled exports
CREATE POLICY "scheduled_exports_insert_policy" ON scheduled_exports
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('client_admin', 'admin', 'owner')
            AND (NEW.client_id IS NULL OR users.client_id = NEW.client_id OR users.client_id IS NULL)
        )
    );

-- Users can update their own exports, admins can update all
CREATE POLICY "scheduled_exports_update_policy" ON scheduled_exports
    FOR UPDATE USING (
        is_admin_or_owner() OR
        created_by = auth.uid() OR
        (client_id IS NOT NULL AND user_has_client_access(client_id) AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'client_admin'
        ))
    );

-- Users can delete their own exports, admins can delete all
CREATE POLICY "scheduled_exports_delete_policy" ON scheduled_exports
    FOR DELETE USING (
        is_admin_or_owner() OR
        created_by = auth.uid()
    );

-- EXPORT_HISTORY TABLE RLS POLICIES
-- Users can see export history for their client, admins see all
CREATE POLICY "export_history_select_policy" ON export_history
    FOR SELECT USING (
        is_admin_or_owner() OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM scheduled_exports se
            WHERE se.id = scheduled_export_id
            AND (user_has_client_access(se.client_id) OR se.created_by = auth.uid())
        )
    );

-- System can insert export history entries
CREATE POLICY "export_history_insert_policy" ON export_history
    FOR INSERT WITH CHECK (
        is_admin_or_owner() OR
        created_by = auth.uid()
    );

-- System can update export history (status changes)
CREATE POLICY "export_history_update_policy" ON export_history
    FOR UPDATE USING (
        is_admin_or_owner() OR
        created_by = auth.uid()
    );

-- Only admins can delete export history (for cleanup)
CREATE POLICY "export_history_delete_policy" ON export_history
    FOR DELETE USING (is_admin_or_owner());

-- Create policies for existing tables that might not have RLS yet
-- Enable RLS on lead_evaluations if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_evaluations') THEN
        ALTER TABLE lead_evaluations ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "lead_evaluations_select_policy" ON lead_evaluations;
        DROP POLICY IF EXISTS "lead_evaluations_insert_policy" ON lead_evaluations;
        DROP POLICY IF EXISTS "lead_evaluations_update_policy" ON lead_evaluations;
        DROP POLICY IF EXISTS "lead_evaluations_delete_policy" ON lead_evaluations;
        
        -- Create new policies
        CREATE POLICY "lead_evaluations_select_policy" ON lead_evaluations
            FOR SELECT USING (
                is_admin_or_owner() OR 
                user_has_client_access(client_id)
            );
            
        CREATE POLICY "lead_evaluations_insert_policy" ON lead_evaluations
            FOR INSERT WITH CHECK (
                is_admin_or_owner() OR
                user_has_client_access(client_id)
            );
            
        CREATE POLICY "lead_evaluations_update_policy" ON lead_evaluations
            FOR UPDATE USING (
                is_admin_or_owner() OR 
                user_has_client_access(client_id)
            );
            
        CREATE POLICY "lead_evaluations_delete_policy" ON lead_evaluations
            FOR DELETE USING (is_admin_or_owner());
    END IF;
END $$;

-- Enable RLS on cost_events if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_events') THEN
        ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "cost_events_select_policy" ON cost_events;
        DROP POLICY IF EXISTS "cost_events_insert_policy" ON cost_events;
        DROP POLICY IF EXISTS "cost_events_update_policy" ON cost_events;
        DROP POLICY IF EXISTS "cost_events_delete_policy" ON cost_events;
        
        -- Create new policies
        CREATE POLICY "cost_events_select_policy" ON cost_events
            FOR SELECT USING (
                is_admin_or_owner() OR 
                user_has_client_access(client_id)
            );
            
        CREATE POLICY "cost_events_insert_policy" ON cost_events
            FOR INSERT WITH CHECK (
                is_admin_or_owner() OR
                user_has_client_access(client_id)
            );
            
        CREATE POLICY "cost_events_update_policy" ON cost_events
            FOR UPDATE USING (
                is_admin_or_owner() OR 
                user_has_client_access(client_id)
            );
            
        CREATE POLICY "cost_events_delete_policy" ON cost_events
            FOR DELETE USING (is_admin_or_owner());
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON FUNCTION is_admin_or_owner() IS 'Helper function to check if current user is admin or owner';
COMMENT ON FUNCTION get_user_client_id() IS 'Helper function to get current user client_id';
COMMENT ON FUNCTION user_has_client_access(UUID) IS 'Helper function to check if user has access to specific client';

-- Grant execute permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_or_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_client_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_client_access(UUID) TO authenticated;