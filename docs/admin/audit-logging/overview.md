# Audit Logging System Overview

## Purpose

The audit logging system provides a comprehensive record of all changes made to critical data within the DealerMate application. It serves several important purposes:

1. **Security & Compliance**: Maintains a tamper-evident record of all data modifications
2. **Accountability**: Tracks which users made specific changes
3. **Troubleshooting**: Helps diagnose issues by showing the history of data changes
4. **Forensics**: Enables investigation of suspicious activities
5. **Data Recovery**: Provides historical data that can be used for recovery

## Access Control

Audit logs contain sensitive information and are protected by Row Level Security (RLS) policies:

1. **Admin-Only Access**: Only users with admin privileges can view audit logs
2. **Service Role Required**: Accessing audit logs requires the Supabase service role key
3. **RLS Bypass**: The `adminSupabase` client must be used to bypass RLS restrictions

> **Important**: For detailed information on audit log access control and implementation, see [access-control.md](./access-control.md)

## System Architecture

The audit logging system uses a hybrid approach combining database-level and application-level components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Actions   │────▶│  Application    │────▶│  Database       │
│  (UI/API)       │     │  (Frontend/API) │     │  (Supabase)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  Audit Triggers │
                                               │  & Functions    │
                                               │                 │
                                               └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │                 │
                                               │  audit_logs     │
                                               │  Table          │
                                               │                 │
                                               └─────────────────┘
```

### Key Components

1. **Database Triggers**:
   - Automatically fire on INSERT, UPDATE, and DELETE operations
   - Capture old and new values of the affected records
   - Call the audit logging function to create audit entries

2. **Database Functions**:
   - `audit_trigger_function`: Captures changes and calls the logging function
   - `log_audit_event`: Creates standardized audit log entries

3. **Application Service**:
   - `auditService.ts`: Provides programmatic access to create audit logs
   - Uses admin Supabase client to bypass RLS policies when needed

4. **Security Measures**:
   - Row-Level Security (RLS) policies restrict access to audit logs
   - Only admin users can view audit logs
   - Audit logs are immutable (no updates allowed)

## Data Flow

1. **Automatic Logging (Database Triggers)**:
   - User makes a change through the application
   - Change is sent to the database
   - Database trigger fires automatically
   - Trigger calls `audit_trigger_function`
   - Function captures old/new values and calls `log_audit_event`
   - Audit log entry is created

2. **Manual Logging (Application Code)**:
   - Application code calls `auditService.createAuditLog()`
   - Service prepares audit data
   - Service uses admin Supabase client to insert record
   - Audit log entry is created

## Audited Tables

The following tables have audit triggers that automatically log changes:

- `clients`
- `users`
- `calls`
- `leads`
- `system_messages`
- `agent_status`
- `user_invitations`
- `client_metrics_cache`
- `export_history`
- `lead_evaluations`

Additional tables can be added by creating triggers using the pattern shown in the migration files.

## Next Steps

For more detailed information about specific components of the audit logging system, refer to the following documentation:

- [Database Schema](./database-schema.md)
- [Database Functions & Triggers](./database-functions.md)
- [Backend Integration](./backend-integration.md)
- [Troubleshooting](./troubleshooting.md)
