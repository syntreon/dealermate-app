-- Create a secure function to delete auth users that can only be called by authenticated users with admin privileges
-- This function should be deployed to your Supabase instance

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.delete_user_auth(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
SET search_path = public
AS $$
DECLARE
  calling_user_role TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Check if the calling user has admin privileges
  SELECT role INTO calling_user_role FROM public.users WHERE id = auth.uid();
  is_admin := calling_user_role IN ('admin', 'owner');
  
  -- Only allow admins to delete users
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only admins can delete users';
  END IF;

  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Return success
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (consider adding proper logging)
    RAISE WARNING 'Error deleting auth user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Set appropriate permissions
REVOKE ALL ON FUNCTION public.delete_user_auth(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_auth(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.delete_user_auth(UUID) IS 'Securely deletes a user from auth.users table. Can only be executed by admin users.';
