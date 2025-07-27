-- Migration: Optimize audit logs table with indexes
-- This migration adds indexes to the audit_logs table to improve query performance

-- First, ensure the pg_trgm extension is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add index for client_id filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_id ON audit_logs (client_id);

-- Add index for user_id filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

-- Add index for action filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

-- Add index for table_name filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs (table_name);

-- Add index for record_id filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs (record_id);

-- Add index for timestamp filtering (for date range queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- Add composite index for client_id + table_name (common filter combination)
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_table ON audit_logs (client_id, table_name);

-- Add composite index for client_id + user_id (common filter combination)
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_user ON audit_logs (client_id, user_id);

-- Add composite index for client_id + created_at (common filter combination)
CREATE INDEX IF NOT EXISTS idx_audit_logs_client_date ON audit_logs (client_id, created_at);

-- Add partial index for system events (no client_id)
CREATE INDEX IF NOT EXISTS idx_audit_logs_system_events ON audit_logs (created_at) 
WHERE client_id IS NULL;

-- Note: details column doesn't exist in audit_logs table, so we skip this index
-- If you need full-text search on specific fields, consider using the old_values and new_values indexes below

-- Add GIN index for JSONB fields old_values and new_values
-- Note: For JSONB fields, we use the built-in GIN operator class, not gin_trgm_ops
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_values_gin ON audit_logs USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_values_gin ON audit_logs USING GIN (new_values);

-- Note: These indexes will increase database size but significantly improve query performance
-- for the audit log filtering operations commonly used in the admin panel
