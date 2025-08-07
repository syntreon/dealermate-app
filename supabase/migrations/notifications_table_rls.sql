-- 1. Add helper functions (safe, idempotent)
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.role = 'admin' OR users.role = 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_client_access(target_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
            users.role IN ('admin', 'owner') OR 
            users.client_id = target_client_id OR
            users.client_id IS NULL
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS and add policies ONLY for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        is_admin_or_owner() OR 
        user_has_client_access(client_id)
    );

CREATE POLICY "notifications_insert_policy" ON notifications
    FOR INSERT WITH CHECK (is_admin_or_owner());

CREATE POLICY "notifications_update_policy" ON notifications
    FOR UPDATE USING (is_admin_or_owner());

CREATE POLICY "notifications_delete_policy" ON notifications
    FOR DELETE USING (is_admin_or_owner());