# Audit Logging Troubleshooting Guide

This document provides guidance for troubleshooting common issues with the audit logging system in the DealerMate application.

## Common Issues and Solutions

### 1. Missing Audit Logs

**Symptoms:**
- Actions are performed but no audit logs are created
- Gaps in audit history for certain operations

**Possible Causes and Solutions:**

#### a) Service Role Key Missing

**Problem:** The `VITE_SUPABASE_SERVICE_ROLE_KEY` environment variable is not set.

**Solution:**
- Check if the environment variable is set in your `.env` file
- Verify the key is correctly loaded in the application
- Look for console warnings: `Audit logging skipped: No service role key available`

```typescript
// Check if service role key is available
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Audit logging skipped: No service role key available');
  return minimalAuditLog;
}
```

#### b) Missing Audit Triggers

**Problem:** Some tables may be missing audit triggers.

**Solution:**
- Check if the table has an audit trigger by querying PostgreSQL:

```sql
SELECT * FROM pg_trigger 
WHERE tgrelid = 'your_table_name'::regclass 
AND tgname LIKE 'audit_%';
```

- If missing, add the trigger manually:

```sql
CREATE TRIGGER audit_your_table_trigger
    AFTER INSERT OR UPDATE OR DELETE ON your_table_name
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

#### c) RLS Policy Issues

**Problem:** Row Level Security (RLS) policies are preventing audit log creation.

**Solution:**
- Ensure the admin client is being used for audit log creation
- Check if the service role key has the necessary permissions
- Verify RLS policies are correctly configured for the audit_logs table

### 2. TypeScript Errors

**Symptoms:**
- TypeScript errors related to the `audit_logs` table
- Errors like: `Property 'audit_logs' does not exist on type...`

**Possible Causes and Solutions:**

#### a) Missing Generated Types

**Problem:** The `audit_logs` table is not included in the generated Supabase types.

**Solution:**
- Regenerate the Supabase types to include the `audit_logs` table:

```bash
npx supabase gen types typescript --project-id your-project-id --schema public > src/integrations/supabase/types.ts
```

- Until types are regenerated, use type assertions as a workaround:

```typescript
// Use type assertion for audit_logs table
const { data, error } = await supabase
  .from('audit_logs' as any)
  .select('*');
```

### 3. Database Migration Errors

**Symptoms:**
- Migration failures when running `supabase db push`
- Errors related to audit functions or triggers

**Possible Causes and Solutions:**

#### a) Invalid GIN Index Operator Class

**Problem:** Using `gin_trgm_ops` operator class with JSONB fields.

**Solution:**
- Use the default GIN operator class for JSONB fields:

```sql
-- Incorrect
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING GIN (new_values gin_trgm_ops);

-- Correct
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING GIN (new_values);
```

#### b) Missing pg_trgm Extension

**Problem:** The `pg_trgm` extension is required but not installed.

**Solution:**
- Add the extension creation to your migration:

```sql
-- Add at the beginning of your migration
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

#### c) Duplicate Trigger Creation

**Problem:** Attempting to create a trigger that already exists.

**Solution:**
- Use conditional trigger creation:

```sql
DROP TRIGGER IF EXISTS audit_your_table_trigger ON your_table;
CREATE TRIGGER audit_your_table_trigger
    AFTER INSERT OR UPDATE OR DELETE ON your_table
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### 4. Performance Issues

**Symptoms:**
- Slow database operations when audit logging is active
- High database load during bulk operations

**Possible Causes and Solutions:**

#### a) Inefficient Indexing

**Problem:** Missing or inefficient indexes on the audit_logs table.

**Solution:**
- Ensure proper indexes are created for common query patterns:

```sql
-- Create indexes for commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

#### b) Large JSONB Objects

**Problem:** Storing very large objects in old_values or new_values JSONB fields.

**Solution:**
- Consider limiting the size of stored objects
- For large objects, store only the changed fields rather than the entire object

```typescript
// Instead of storing the entire object
const newValues = { ...hugeObject };

// Store only the changed fields
const newValues = {
  field1: hugeObject.field1,
  field2: hugeObject.field2
};
```

#### c) Bulk Operations Impact

**Problem:** Audit logging significantly slows down bulk operations.

**Solution:**
- For bulk operations, consider using a single audit log entry instead of one per record
- Use the 'bulk_operation' action type with summary information

```typescript
// Instead of logging each record individually
await AuditService.logAuditEvent(
  userId,
  'bulk_operation',
  'users',
  null,
  null,
  { 
    operation: 'status_update',
    count: records.length,
    affected_ids: records.map(r => r.id)
  }
);
```

### 5. Security Issues

**Symptoms:**
- Unauthorized access to audit logs
- Missing audit logs for certain user actions

**Possible Causes and Solutions:**

#### a) Incorrect RLS Policies

**Problem:** RLS policies not properly restricting access to audit logs.

**Solution:**
- Review and update the RLS policies for the audit_logs table:

```sql
-- Example: Ensure only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'owner')
    )
  );
```

#### b) Service Role Key Exposure

**Problem:** The service role key is exposed or accessible to client-side code.

**Solution:**
- Ensure the service role key is only used in server-side code
- Use environment variables that are not exposed to the client
- Consider using API endpoints for audit log operations instead of direct client access

## Debugging Techniques

### 1. Enable Detailed Logging

Add more detailed logging to troubleshoot audit logging issues:

```typescript
// Add to auditService.ts
const DEBUG_AUDIT = true;

// Then use throughout the code
if (DEBUG_AUDIT) {
  console.log('Audit data:', JSON.stringify(auditData, null, 2));
  console.log('Admin client available:', !!adminSupabase);
}
```

### 2. Check Database Directly

Query the audit_logs table directly to verify if logs are being created:

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### 3. Verify Trigger Function

Check if the audit trigger function is working by testing it directly:

```sql
-- Test the audit trigger function
DO $$ 
DECLARE
  result UUID;
BEGIN
  SELECT audit_trigger_function() INTO result;
  RAISE NOTICE 'Result: %', result;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;
```

### 4. Monitor Database Performance

Use PostgreSQL's query analysis tools to identify performance bottlenecks:

```sql
-- Check for slow queries related to audit logs
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query ILIKE '%audit_logs%'
ORDER BY total_time DESC
LIMIT 10;
```

## Best Practices for Prevention

1. **Test Migrations Locally**: Always test migrations in a local environment before applying to production
2. **Version Control**: Keep all database migrations in version control
3. **Monitoring**: Set up alerts for audit logging failures
4. **Regular Maintenance**: Periodically check and optimize audit log indexes
5. **Documentation**: Keep documentation updated with any changes to the audit logging system

## When to Contact Support

If you've tried the solutions above and still experience issues, collect the following information before contacting support:

1. Error messages and stack traces
2. Database migration logs
3. Application logs showing audit logging attempts
4. PostgreSQL server logs
5. Details of the environment (development, staging, production)
6. Recent changes to the codebase or database schema
