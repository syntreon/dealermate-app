-- Migration: Add missing audit triggers for important tables
-- This migration adds audit triggers for tables that were missing them

-- First, check if the audit_trigger_function exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_function') THEN
    -- Create the audit trigger function
    CREATE OR REPLACE FUNCTION audit_trigger_function()
    RETURNS TRIGGER AS $$
    DECLARE
      audit_id UUID;
    BEGIN
      IF TG_OP = 'INSERT' THEN
        audit_id := log_audit_event(
          TG_OP, 
          TG_TABLE_NAME::text, 
          NEW.id::uuid, 
          NULL, 
          to_jsonb(NEW)
        );
        RETURN NEW;
      ELSIF TG_OP = 'UPDATE' THEN
        audit_id := log_audit_event(
          TG_OP, 
          TG_TABLE_NAME::text, 
          NEW.id::uuid, 
          to_jsonb(OLD), 
          to_jsonb(NEW)
        );
        RETURN NEW;
      ELSIF TG_OP = 'DELETE' THEN
        audit_id := log_audit_event(
          TG_OP, 
          TG_TABLE_NAME::text, 
          OLD.id::uuid, 
          to_jsonb(OLD), 
          NULL
        );
        RETURN OLD;
      END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    RAISE NOTICE 'Created audit_trigger_function';
  ELSE
    RAISE NOTICE 'audit_trigger_function already exists';
  END IF;
END $$;

-- Add audit trigger for system_messages table
DROP TRIGGER IF EXISTS audit_system_messages_trigger ON system_messages;
CREATE TRIGGER audit_system_messages_trigger
    AFTER INSERT OR UPDATE OR DELETE ON system_messages
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger for agent_status table
DROP TRIGGER IF EXISTS audit_agent_status_trigger ON agent_status;
CREATE TRIGGER audit_agent_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agent_status
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger for user_invitations table
DROP TRIGGER IF EXISTS audit_user_invitations_trigger ON user_invitations;
CREATE TRIGGER audit_user_invitations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger for client_metrics_cache table
DROP TRIGGER IF EXISTS audit_client_metrics_cache_trigger ON client_metrics_cache;
CREATE TRIGGER audit_client_metrics_cache_trigger
    AFTER INSERT OR UPDATE OR DELETE ON client_metrics_cache
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger for export_history table
DROP TRIGGER IF EXISTS audit_export_history_trigger ON export_history;
CREATE TRIGGER audit_export_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON export_history
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add audit trigger for lead_evaluations table
DROP TRIGGER IF EXISTS audit_lead_evaluations_trigger ON lead_evaluations;
CREATE TRIGGER audit_lead_evaluations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lead_evaluations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Note: We don't add a trigger to the audit_logs table itself to avoid recursive triggers
-- and because audit logs should be immutable (except for admin cleanup operations)
