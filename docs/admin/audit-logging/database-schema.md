# Audit Logging Database Schema

## audit_logs Table

The `audit_logs` table is the central component of the audit logging system, storing a record of all changes made to critical data in the application.

### Table Structure

The table is defined in the migration file `20250118000000_create_admin_panel_tables.sql`:

```sql
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
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, automatically generated |
| `user_id` | UUID | Foreign key to users table, identifies who made the change |
| `client_id` | UUID | Foreign key to clients table, identifies which client the change affects |
| `action` | TEXT | Type of action performed (INSERT, UPDATE, DELETE) |
| `table_name` | TEXT | Name of the table that was modified |
| `record_id` | UUID | Primary key of the record that was modified |
| `old_values` | JSONB | JSON object containing the previous values (for UPDATE/DELETE) |
| `new_values` | JSONB | JSON object containing the new values (for INSERT/UPDATE) |
| `ip_address` | INET | IP address of the user who made the change |
| `user_agent` | TEXT | Browser/client information of the user who made the change |
| `created_at` | TIMESTAMPTZ | Timestamp when the audit log was created |

### Important Notes

1. **Foreign Key References**:
   - `user_id` references `users(id)` with `ON DELETE SET NULL` - if a user is deleted, their audit logs remain but the user reference is nullified
   - `client_id` references `clients(id)` with `ON DELETE SET NULL` - if a client is deleted, their audit logs remain but the client reference is nullified

2. **JSONB Fields**:
   - `old_values` and `new_values` use PostgreSQL's JSONB type, which allows for efficient storage and querying of JSON data
   - These fields store the complete state of the record before and after the change
   - For INSERT operations, only `new_values` is populated
   - For DELETE operations, only `old_values` is populated
   - For UPDATE operations, both fields are populated

3. **No Details Column**:
   - Note that there is no `details` column in the schema
   - Any additional contextual information should be stored in the `new_values` field

## Performance Optimization

The `audit_logs` table has several indexes to optimize query performance, defined in the migration file `20250727000002_optimize_audit_logs.sql`:

### Single-Column Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
```

### Composite Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_table ON audit_logs (client_id, table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_user ON audit_logs (client_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_date ON audit_logs (client_id, created_at);
```

### Partial Index

```sql
CREATE INDEX IF NOT EXISTS idx_audit_logs_system_events ON audit_logs (created_at) 
WHERE client_id IS NULL;
```

### JSONB Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_values_gin ON audit_logs USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_values_gin ON audit_logs USING GIN (new_values);
```

## Row-Level Security (RLS)

The `audit_logs` table is protected by RLS policies that restrict access based on user role:

```sql
-- Only allow admin users to view audit logs
CREATE POLICY "Admin users can view audit logs" 
ON audit_logs FOR SELECT 
USING (auth.uid() IN (
  SELECT id FROM users WHERE role IN ('admin', 'owner')
));

-- Only allow admin users to insert audit logs
CREATE POLICY "Admin users can insert audit logs" 
ON audit_logs FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT id FROM users WHERE role IN ('admin', 'owner')
));

-- No one can update audit logs (immutable)
-- No explicit policy for UPDATE means no one can update

-- Only allow admin users to delete audit logs
CREATE POLICY "Admin users can delete audit logs" 
ON audit_logs FOR DELETE 
USING (auth.uid() IN (
  SELECT id FROM users WHERE role IN ('admin', 'owner')
));
```

These policies ensure that:
1. Only admin users can view audit logs
2. Only admin users can create audit logs
3. No one can update audit logs (they are immutable)
4. Only admin users can delete audit logs (for data cleanup purposes)
