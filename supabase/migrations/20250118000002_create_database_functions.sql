-- Migration: Create database functions and triggers
-- This migration implements database functions for audit logging, complex queries, bulk operations, and metrics

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    current_user_id UUID;
    client_context UUID;
    user_ip INET;
    user_agent_text TEXT;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Get user's client context
    SELECT client_id INTO client_context 
    FROM users 
    WHERE id = current_user_id;
    
    -- Try to get IP and user agent from request headers (may not always be available)
    BEGIN
        user_ip := (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet;
    EXCEPTION WHEN OTHERS THEN
        user_ip := NULL;
    END;
    
    BEGIN
        user_agent_text := current_setting('request.headers', true)::json->>'user-agent';
    EXCEPTION WHEN OTHERS THEN
        user_agent_text := NULL;
    END;
    
    -- Insert audit log entry
    INSERT INTO audit_logs (
        user_id,
        client_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        client_context,
        p_action,
        p_table_name,
        p_record_id,
        p_old_values,
        p_new_values,
        user_ip,
        user_agent_text
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB;
    new_values JSONB;
    action_type TEXT;
BEGIN
    -- Determine action type
    IF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_values := to_jsonb(OLD);
        new_values := NULL;
        PERFORM log_audit_event(action_type, TG_TABLE_NAME, OLD.id, old_values, new_values);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
        PERFORM log_audit_event(action_type, TG_TABLE_NAME, NEW.id, old_values, new_values);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        action_type := 'INSERT';
        old_values := NULL;
        new_values := to_jsonb(NEW);
        PERFORM log_audit_event(action_type, TG_TABLE_NAME, NEW.id, old_values, new_values);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for key tables
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_calls_trigger
    AFTER INSERT OR UPDATE OR DELETE ON calls
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_leads_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_scheduled_exports_trigger
    AFTER INSERT OR UPDATE OR DELETE ON scheduled_exports
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function for complex client metrics aggregation
CREATE OR REPLACE FUNCTION calculate_client_metrics(
    p_client_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    call_stats JSONB;
    lead_stats JSONB;
    cost_stats JSONB;
    date_filter TEXT;
BEGIN
    -- Set default date range if not provided (last 30 days)
    IF p_start_date IS NULL THEN
        p_start_date := NOW() - INTERVAL '30 days';
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := NOW();
    END IF;
    
    -- Calculate call statistics
    SELECT jsonb_build_object(
        'total_calls', COUNT(*),
        'total_duration_minutes', COALESCE(SUM(call_duration_mins), 0),
        'average_duration_minutes', COALESCE(AVG(call_duration_mins), 0),
        'calls_with_transfers', COUNT(*) FILTER (WHERE transfer_flag = true),
        'calls_today', COUNT(*) FILTER (WHERE DATE(call_start_time) = CURRENT_DATE),
        'total_cost_usd', COALESCE(SUM(total_call_cost_usd), 0),
        'average_cost_per_call', COALESCE(AVG(total_call_cost_usd), 0)
    ) INTO call_stats
    FROM calls
    WHERE client_id = p_client_id
    AND call_start_time >= p_start_date
    AND call_start_time <= p_end_date;
    
    -- Calculate lead statistics
    SELECT jsonb_build_object(
        'total_leads', COUNT(*),
        'leads_today', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
        'leads_with_appointments', COUNT(*) FILTER (WHERE appointment_confirmed_at IS NOT NULL),
        'leads_sent_to_client', COUNT(*) FILTER (WHERE sent_to_client_at IS NOT NULL),
        'conversion_rate', CASE 
            WHEN (SELECT COUNT(*) FROM calls WHERE client_id = p_client_id AND call_start_time >= p_start_date AND call_start_time <= p_end_date) > 0
            THEN ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM calls WHERE client_id = p_client_id AND call_start_time >= p_start_date AND call_start_time <= p_end_date)) * 100, 2)
            ELSE 0
        END
    ) INTO lead_stats
    FROM leads
    WHERE client_id = p_client_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date;
    
    -- Calculate cost statistics
    SELECT jsonb_build_object(
        'total_vapi_cost', COALESCE(SUM(vapi_call_cost_usd + vapi_llm_cost_usd), 0),
        'total_openai_cost', COALESCE(SUM(openai_api_cost_usd), 0),
        'total_twilio_cost', COALESCE(SUM(twillio_call_cost_usd), 0),
        'total_sms_cost', COALESCE(SUM(sms_cost_usd), 0),
        'total_tool_cost', COALESCE(SUM(tool_cost_usd), 0),
        'cost_per_lead', CASE 
            WHEN (SELECT COUNT(*) FROM leads WHERE client_id = p_client_id AND created_at >= p_start_date AND created_at <= p_end_date) > 0
            THEN COALESCE(SUM(total_call_cost_usd), 0) / (SELECT COUNT(*) FROM leads WHERE client_id = p_client_id AND created_at >= p_start_date AND created_at <= p_end_date)
            ELSE 0
        END
    ) INTO cost_stats
    FROM calls
    WHERE client_id = p_client_id
    AND call_start_time >= p_start_date
    AND call_start_time <= p_end_date;
    
    -- Combine all statistics
    result := jsonb_build_object(
        'client_id', p_client_id,
        'period_start', p_start_date,
        'period_end', p_end_date,
        'calls', call_stats,
        'leads', lead_stats,
        'costs', cost_stats,
        'calculated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cache client metrics
CREATE OR REPLACE FUNCTION cache_client_metrics(
    p_client_id UUID,
    p_metric_type TEXT,
    p_metric_period TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ,
    p_cache_duration INTERVAL DEFAULT '1 hour'
)
RETURNS UUID AS $$
DECLARE
    cache_id UUID;
    metric_data JSONB;
    expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate metrics
    metric_data := calculate_client_metrics(p_client_id, p_period_start, p_period_end);
    expires_at := NOW() + p_cache_duration;
    
    -- Insert or update cache entry
    INSERT INTO client_metrics_cache (
        client_id,
        metric_type,
        metric_period,
        period_start,
        period_end,
        metric_data,
        expires_at
    ) VALUES (
        p_client_id,
        p_metric_type,
        p_metric_period,
        p_period_start,
        p_period_end,
        metric_data,
        expires_at
    )
    ON CONFLICT (client_id, metric_type, metric_period, period_start)
    DO UPDATE SET
        metric_data = EXCLUDED.metric_data,
        calculated_at = NOW(),
        expires_at = EXCLUDED.expires_at
    RETURNING id INTO cache_id;
    
    RETURN cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for bulk user operations
CREATE OR REPLACE FUNCTION bulk_update_user_status(
    p_user_ids UUID[],
    p_new_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(user_id UUID, success BOOLEAN, error_message TEXT) AS $$
DECLARE
    user_record RECORD;
    current_user_role TEXT;
BEGIN
    -- Check if current user has permission for bulk operations
    SELECT role INTO current_user_role FROM users WHERE id = auth.uid();
    
    IF current_user_role NOT IN ('admin', 'owner') THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Insufficient permissions for bulk operations'::TEXT;
        RETURN;
    END IF;
    
    -- Process each user
    FOR user_record IN 
        SELECT id FROM users WHERE id = ANY(p_user_ids)
    LOOP
        BEGIN
            -- Update user status (assuming there's a status field)
            -- This is a placeholder - adjust based on actual user table structure
            UPDATE users 
            SET last_login_at = CASE WHEN p_new_status = 'active' THEN NOW() ELSE last_login_at END
            WHERE id = user_record.id;
            
            -- Log the bulk operation
            PERFORM log_audit_event(
                'BULK_UPDATE',
                'users',
                user_record.id,
                NULL,
                jsonb_build_object('status', p_new_status, 'reason', p_reason)
            );
            
            RETURN QUERY SELECT user_record.id, true, NULL::TEXT;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT user_record.id, false, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for data validation
CREATE OR REPLACE FUNCTION validate_client_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format if contact_email is provided
    IF NEW.contact_email IS NOT NULL AND NEW.contact_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.contact_email;
    END IF;
    
    -- Validate phone number format if provided
    IF NEW.phone_number IS NOT NULL AND NEW.phone_number !~ '^\+?[1-9]\d{1,14}$' THEN
        RAISE EXCEPTION 'Invalid phone number format: %', NEW.phone_number;
    END IF;
    
    -- Validate billing amount is not negative
    IF NEW.monthly_billing_amount_cad < 0 THEN
        RAISE EXCEPTION 'Monthly billing amount cannot be negative';
    END IF;
    
    -- Validate partner split percentage is between 0 and 100
    IF NEW.partner_split_percentage < 0 OR NEW.partner_split_percentage > 100 THEN
        RAISE EXCEPTION 'Partner split percentage must be between 0 and 100';
    END IF;
    
    -- Ensure slug is unique and properly formatted
    IF NEW.slug IS NOT NULL THEN
        IF NEW.slug !~ '^[a-z0-9-]+$' THEN
            RAISE EXCEPTION 'Slug must contain only lowercase letters, numbers, and hyphens';
        END IF;
        
        -- Check for uniqueness (excluding current record for updates)
        IF EXISTS (
            SELECT 1 FROM clients 
            WHERE slug = NEW.slug 
            AND (TG_OP = 'INSERT' OR id != NEW.id)
        ) THEN
            RAISE EXCEPTION 'Slug must be unique: %', NEW.slug;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger for clients
CREATE TRIGGER validate_client_data_trigger
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION validate_client_data();

-- Create function for lead validation
CREATE OR REPLACE FUNCTION validate_lead_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', NEW.email;
    END IF;
    
    -- Validate phone number format if provided
    IF NEW.phone_number IS NOT NULL AND NEW.phone_number !~ '^\+?[1-9]\d{1,14}$' THEN
        RAISE EXCEPTION 'Invalid phone number format: %', NEW.phone_number;
    END IF;
    
    -- Ensure at least one contact method is provided
    IF NEW.email IS NULL AND NEW.phone_number IS NULL THEN
        RAISE EXCEPTION 'Lead must have at least one contact method (email or phone)';
    END IF;
    
    -- Validate lead status
    IF NEW.lead_status NOT IN ('new', 'contacted', 'qualified', 'appointment_set', 'closed_won', 'closed_lost') THEN
        RAISE EXCEPTION 'Invalid lead status: %', NEW.lead_status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger for leads
CREATE TRIGGER validate_lead_data_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION validate_lead_data();

-- Create function to automatically update next_run_at for scheduled exports
CREATE OR REPLACE FUNCTION update_scheduled_export_next_run()
RETURNS TRIGGER AS $$
DECLARE
    next_run TIMESTAMPTZ;
BEGIN
    -- Calculate next run time based on cron expression
    -- This is a simplified version - in production, you'd want a more robust cron parser
    IF NEW.schedule_cron IS NOT NULL AND NEW.is_active = true THEN
        -- For now, just add 24 hours as a placeholder
        -- In production, implement proper cron parsing
        NEW.next_run_at := NOW() + INTERVAL '24 hours';
    ELSIF NEW.is_active = false THEN
        NEW.next_run_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scheduled exports
CREATE TRIGGER update_scheduled_export_next_run_trigger
    BEFORE INSERT OR UPDATE ON scheduled_exports
    FOR EACH ROW EXECUTE FUNCTION update_scheduled_export_next_run();

-- Create function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired invitations
    UPDATE user_invitations 
    SET status = 'expired' 
    WHERE status = 'pending' AND expires_at < NOW();
    
    -- Clean up expired cache entries
    DELETE FROM client_metrics_cache 
    WHERE expires_at < NOW();
    
    -- Clean up old audit logs (keep last 90 days)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up old export history (keep last 180 days)
    DELETE FROM export_history 
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Log cleanup operation
    PERFORM log_audit_event(
        'CLEANUP',
        'system',
        NULL,
        NULL,
        jsonb_build_object('operation', 'expired_data_cleanup', 'timestamp', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get dashboard summary for a client
CREATE OR REPLACE FUNCTION get_client_dashboard_summary(p_client_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    today_date DATE := CURRENT_DATE;
    week_start DATE := today_date - INTERVAL '7 days';
    month_start DATE := today_date - INTERVAL '30 days';
BEGIN
    WITH call_stats AS (
        SELECT 
            COUNT(*) as total_calls,
            COUNT(*) FILTER (WHERE DATE(call_start_time) = today_date) as calls_today,
            COUNT(*) FILTER (WHERE call_start_time >= week_start) as calls_this_week,
            COUNT(*) FILTER (WHERE call_start_time >= month_start) as calls_this_month,
            COALESCE(AVG(call_duration_mins), 0) as avg_duration,
            COALESCE(SUM(total_call_cost_usd), 0) as total_cost
        FROM calls 
        WHERE client_id = p_client_id
    ),
    lead_stats AS (
        SELECT 
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE DATE(created_at) = today_date) as leads_today,
            COUNT(*) FILTER (WHERE created_at >= week_start) as leads_this_week,
            COUNT(*) FILTER (WHERE created_at >= month_start) as leads_this_month,
            COUNT(*) FILTER (WHERE appointment_confirmed_at IS NOT NULL) as appointments_confirmed
        FROM leads 
        WHERE client_id = p_client_id
    )
    SELECT jsonb_build_object(
        'client_id', p_client_id,
        'calls', jsonb_build_object(
            'total', c.total_calls,
            'today', c.calls_today,
            'this_week', c.calls_this_week,
            'this_month', c.calls_this_month,
            'avg_duration_minutes', ROUND(c.avg_duration, 2),
            'total_cost_usd', ROUND(c.total_cost, 2)
        ),
        'leads', jsonb_build_object(
            'total', l.total_leads,
            'today', l.leads_today,
            'this_week', l.leads_this_week,
            'this_month', l.leads_this_month,
            'appointments_confirmed', l.appointments_confirmed,
            'conversion_rate', CASE 
                WHEN c.total_calls > 0 THEN ROUND((l.total_leads::DECIMAL / c.total_calls) * 100, 2)
                ELSE 0
            END
        ),
        'generated_at', NOW()
    ) INTO result
    FROM call_stats c, lead_stats l;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_client_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION cache_client_metrics(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTERVAL) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_user_status(UUID[], TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_dashboard_summary(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION log_audit_event(TEXT, TEXT, UUID, JSONB, JSONB) IS 'Logs audit events for administrative actions';
COMMENT ON FUNCTION calculate_client_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculates comprehensive metrics for a client within a date range';
COMMENT ON FUNCTION cache_client_metrics(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTERVAL) IS 'Caches client metrics for performance optimization';
COMMENT ON FUNCTION bulk_update_user_status(UUID[], TEXT, TEXT) IS 'Performs bulk operations on user records with proper error handling';
COMMENT ON FUNCTION cleanup_expired_data() IS 'Cleans up expired invitations, cache entries, and old audit logs';
COMMENT ON FUNCTION get_client_dashboard_summary(UUID) IS 'Returns dashboard summary statistics for a specific client';