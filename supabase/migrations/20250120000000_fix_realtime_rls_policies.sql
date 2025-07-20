-- Fix RLS policies for real-time functionality

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view system messages" ON system_messages;
DROP POLICY IF EXISTS "Only admins can manage system messages" ON system_messages;
DROP POLICY IF EXISTS "Anyone can view agent status" ON agent_status;
DROP POLICY IF EXISTS "Only admins can update agent status" ON agent_status;

-- Create comprehensive policies for system_messages
CREATE POLICY "Users can view system messages" ON system_messages
    FOR SELECT USING (
        -- Allow viewing global messages (client_id IS NULL) or messages for user's client
        client_id IS NULL OR 
        client_id IN (
            SELECT client_id FROM users WHERE id = auth.uid()
        ) OR
        -- Allow admins to view all messages
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

CREATE POLICY "Admins can insert system messages" ON system_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

CREATE POLICY "Admins can update system messages" ON system_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

CREATE POLICY "Admins can delete system messages" ON system_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

-- Create comprehensive policies for agent_status
CREATE POLICY "Users can view agent status" ON agent_status
    FOR SELECT USING (
        -- Allow viewing global status (client_id IS NULL) or status for user's client
        client_id IS NULL OR 
        client_id IN (
            SELECT client_id FROM users WHERE id = auth.uid()
        ) OR
        -- Allow admins to view all statuses
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

CREATE POLICY "Admins can insert agent status" ON agent_status
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

CREATE POLICY "Admins can update agent status" ON agent_status
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

CREATE POLICY "Admins can delete agent status" ON agent_status
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'owner')
        )
    );

-- Note: We use audit_logs table for agent status history tracking
-- No need for separate agent_status_history table since audit_logs already provides:
-- - Who made the change (user_id)
-- - What changed (old_values, new_values) 
-- - When it happened (created_at)
-- - Action type (agent_status_change)

-- Create function to handle upsert operations for agent_status
CREATE OR REPLACE FUNCTION upsert_agent_status(
    p_client_id UUID,
    p_status TEXT,
    p_message TEXT,
    p_updated_by UUID
)
RETURNS agent_status AS $$
DECLARE
    result agent_status;
BEGIN
    -- Try to update existing record
    UPDATE agent_status 
    SET 
        status = p_status,
        message = p_message,
        last_updated = NOW(),
        updated_by = p_updated_by
    WHERE client_id = p_client_id OR (client_id IS NULL AND p_client_id IS NULL)
    RETURNING * INTO result;
    
    -- If no record was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO agent_status (client_id, status, message, updated_by)
        VALUES (p_client_id, p_status, p_message, p_updated_by)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION upsert_agent_status TO authenticated;

-- Create function to get current user info (for debugging)
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(
    user_id UUID,
    user_role TEXT,
    client_id UUID,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.role as user_role,
        u.client_id,
        (u.role = 'admin' OR u.role = 'owner') as is_admin
    FROM users u
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_info TO authenticated;