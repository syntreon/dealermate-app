# Audit Logs Access Control

> **Note:** Role display names have been updated for clarity. The new labels are:
> - `client_admin` → **Business Manager**
> - `user` → **Account Manager**
> - `client_user` → **User**
> - `admin` and `owner` remain unchanged


## Row Level Security (RLS) and Admin Access

### Issue Resolved

**Problem**: The AdminAudit page was not displaying any audit logs despite data existing in the database.

**Root Cause**: The `AuditService.getAuditLogs()` method was using the regular Supabase client instead of the admin client with service role key. Since audit logs are protected by Row Level Security (RLS) policies, the regular client didn't have permission to access them.

**Solution**: Modified the `getAuditLogs()` method in `auditService.ts` to use the `adminSupabase` client which bypasses RLS policies.

### Technical Details

1. **RLS Protection**: 
   - Audit logs in the `audit_logs` table are protected by RLS policies
   - Regular authenticated users cannot access audit logs directly
   - Only users with admin privileges should be able to view audit logs

2. **Admin Client Configuration**:
   ```typescript
   // Admin client created with service role key
   const adminSupabase = createClient<Database>(
     SUPABASE_URL,
     SUPABASE_SERVICE_ROLE_KEY,
     {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       },
       global: {
         headers: {
           'x-client-info': 'supabase-js-admin'
         }
       }
     }
   );
   ```

3. **Accessing Audit Logs**:
   - The `getAuditLogs()` method must use `adminSupabase` instead of `supabase`
   - This bypasses RLS and allows access to all audit log records
   - Environment variable `VITE_SUPABASE_SERVICE_ROLE_KEY` must be set for this to work

### Implementation Notes

1. **Error Handling**:
   - Added validation to check if admin client is available
   - Provides clear error message if service role key is missing
   - Prevents silent failures when trying to access audit logs without proper permissions

2. **Security Considerations**:
   - Service role key has full access to the database and bypasses RLS
   - Only use admin client for operations that specifically require bypassing RLS
   - Regular client should be used for all other operations to maintain security

3. **Debugging**:
   - Added console logs to track query execution and filter application
   - Helps diagnose issues with audit log retrieval
   - Provides visibility into the query building process

### Best Practices

1. **Always use admin client for audit log operations**:
   ```typescript
   // Correct way to query audit logs
   let query = adminSupabase.from('audit_logs' as any).select(...)
   
   // Incorrect way (will return no results due to RLS)
   let query = supabase.from('audit_logs' as any).select(...)
   ```

2. **Check for admin client availability**:
   ```typescript
   if (!adminSupabase) {
     console.error('Admin Supabase client not available. Check if VITE_SUPABASE_SERVICE_ROLE_KEY is set.');
     throw new Error('Admin access required to view audit logs');
   }
   ```

3. **Limit admin client usage**:
   - Only use admin client for operations that specifically require it
   - Document all places where admin client is used for security auditing
   - Consider implementing additional access control checks in the application

### Environment Configuration

For audit logs to be accessible, ensure these environment variables are set:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Security Warning**: The service role key should never be exposed to the client. This key should only be used in secure server environments or admin-only sections of the application.
