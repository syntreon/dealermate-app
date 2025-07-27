# Audit Logging System Documentation

This documentation provides a comprehensive overview of the audit logging system implemented in the DealerMate application. It is designed to help developers understand, maintain, and troubleshoot the audit logging functionality.

## Table of Contents

1. [Overview](./overview.md) - High-level overview of the audit logging system
2. [Database Schema](./database-schema.md) - Details of the audit_logs table structure
3. [Database Functions & Triggers](./database-functions.md) - Explanation of PostgreSQL functions and triggers
4. [Backend Integration](./backend-integration.md) - How the audit service integrates with the application
5. [Troubleshooting](./troubleshooting.md) - Common issues and their solutions

## Quick Start

The audit logging system automatically captures changes to critical database tables through PostgreSQL triggers. Each insert, update, or delete operation generates an audit log entry containing:

- Who made the change (user_id)
- Which client it affects (client_id)
- What action was performed (insert, update, delete)
- Which table was modified (table_name)
- Which record was affected (record_id)
- Previous values (old_values as JSONB)
- New values (new_values as JSONB)
- Additional metadata (IP address, user agent, timestamp)

The system uses a combination of database triggers, functions, and application code to ensure comprehensive and reliable audit logging.

## Key Components

1. **Database Layer**:
   - `audit_logs` table for storing audit records
   - `audit_trigger_function` for capturing changes
   - `log_audit_event` function for standardized logging
   - Triggers on all relevant tables

2. **Application Layer**:
   - `auditService.ts` for programmatic audit log creation
   - Admin Supabase client for bypassing RLS policies
   - TypeScript interfaces for type safety

3. **Security**:
   - Row-Level Security (RLS) policies for audit log access control
   - Service role authentication for administrative operations

## Migration Files

The audit logging system is set up through several migration files:

- `20250118000000_create_admin_panel_tables.sql` - Creates the audit_logs table
- `20250118000002_create_database_functions.sql` - Creates the log_audit_event function
- `20250727000001_add_missing_audit_triggers.sql` - Adds audit_trigger_function and triggers to tables
- `20250727000002_optimize_audit_logs.sql` - Adds performance optimization indexes

See the detailed documentation files for more information on each component of the system.
