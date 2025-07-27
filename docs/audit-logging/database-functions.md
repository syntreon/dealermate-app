# Database Functions and Triggers

This document explains the PostgreSQL functions and triggers that power the audit logging system in the DealerMate application.

## Core Functions

### 1. log_audit_event

This is the primary function responsible for creating audit log entries. It's defined in `20250118000002_create_database_functions.sql`.

```sql
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
    
    -- Try to get IP and user agent from request headers
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
```

**Key Features:**

1. **Parameters**:
   - `p_action`: The type of action (INSERT, UPDATE, DELETE)
   - `p_table_name`: The name of the table being modified
   - `p_record_id`: The primary key of the record being modified
   - `p_old_values`: JSONB object containing the previous state (for UPDATE/DELETE)
   - `p_new_values`: JSONB object containing the new state (for INSERT/UPDATE)

2. **User Context**:
   - Gets the current user ID using `auth.uid()`
   - Retrieves the user's client context from the users table
   - Attempts to capture IP address and user agent from request headers

3. **Security**:
   - Uses `SECURITY DEFINER` to run with the privileges of the function creator
   - This ensures audit logs can be created even if the user doesn't have direct INSERT privileges on the audit_logs table

### 2. audit_trigger_function

This function is called by database triggers to automatically log changes. It's conditionally created in `20250727000001_add_missing_audit_triggers.sql` if it doesn't already exist.

```sql
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
```

**Key Features:**

1. **Trigger Operation Detection**:
   - Detects whether the operation is INSERT, UPDATE, or DELETE using `TG_OP`
   - Handles each operation type differently

2. **Data Capture**:
   - For INSERT: Captures only the new values
   - For UPDATE: Captures both old and new values
   - For DELETE: Captures only the old values

3. **Function Call**:
   - Calls `log_audit_event` with the appropriate parameters
   - Passes the entire record as JSONB using `to_jsonb()`

4. **Conditional Creation**:
   - The function is only created if it doesn't already exist
   - This prevents overwriting any customizations during migrations

## Database Triggers

Triggers are attached to tables to automatically call the `audit_trigger_function` whenever data changes occur. The triggers are defined in two migration files:

### Original Triggers (20250118000002_create_database_functions.sql)

```sql
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
```

### Additional Triggers (20250727000001_add_missing_audit_triggers.sql)

```sql
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
```

**Key Features:**

1. **Trigger Timing**:
   - All triggers use `AFTER INSERT OR UPDATE OR DELETE`
   - This ensures the audit log is created after the operation completes successfully

2. **Row-Level Triggers**:
   - All triggers use `FOR EACH ROW`
   - This ensures every affected row generates its own audit log entry

3. **Safe Creation**:
   - Additional triggers use `DROP TRIGGER IF EXISTS` before creation
   - This ensures clean installation even if the trigger already exists

4. **Comprehensive Coverage**:
   - Covers all critical tables in the application
   - Ensures all data changes are properly audited

## Important Notes

1. **Trigger Function Dependency**:
   - All triggers depend on the `audit_trigger_function`
   - The function must exist before triggers can be created

2. **Audit Table Recursion Prevention**:
   - No trigger is created on the `audit_logs` table itself
   - This prevents infinite recursion when audit logs are created

3. **UUID Requirement**:
   - The trigger function assumes each table has an `id` column of type UUID
   - Tables without this structure would need a custom trigger function

4. **Performance Considerations**:
   - Each data modification generates additional database operations
   - For bulk operations, this can significantly impact performance
   - Consider using direct `log_audit_event` calls for bulk operations instead of triggers
