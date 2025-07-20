-- Create a stored procedure to fetch call intelligence data
-- Not used yet
-- This will be accessible via the Supabase client's rpc method
CREATE OR REPLACE FUNCTION get_all_call_intelligence()
RETURNS SETOF call_intelligence
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
BEGIN
  -- Log access attempt
  RAISE NOTICE 'Accessing call_intelligence function';
  
  -- Return all records from the call_intelligence table
  RETURN QUERY SELECT * FROM call_intelligence;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_call_intelligence() TO authenticated;

-- Test the function
SELECT * FROM get_all_call_intelligence();

-- Create a function that filters by client_id if provided
CREATE OR REPLACE FUNCTION get_filtered_call_intelligence(client_uuid UUID DEFAULT NULL)
RETURNS SETOF call_intelligence
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If client_id is null (admin view), return all records
  IF client_uuid IS NULL THEN
    RETURN QUERY SELECT * FROM call_intelligence;
  ELSE
    -- Otherwise filter by the provided client_id
    RETURN QUERY SELECT * FROM call_intelligence WHERE client_id = client_uuid;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_filtered_call_intelligence(UUID) TO authenticated;

-- Test the function with no client_id (admin view)
SELECT * FROM get_filtered_call_intelligence();

-- Test the function with a specific client_id
-- Replace with an actual client_id from your database
SELECT * FROM get_filtered_call_intelligence('1cbac14c-a68a-49b3-bb77-c7f1f4f06c25');
