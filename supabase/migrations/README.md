# Supabase Migrations

This directory contains SQL migrations that need to be applied to your Supabase instance.

## User Management Fix: Auth User Deletion

### Problem
The client-side application doesn't have permission to use the Supabase Admin API directly to delete auth users, resulting in orphaned auth records when users are deleted from the public.users table.

### Solution
We've created a PostgreSQL function that can be called via RPC to securely delete users from the auth.users table. This function:
- Runs with elevated privileges (SECURITY DEFINER)
- Checks if the calling user has admin privileges
- Safely deletes the user from auth.users
- Returns a boolean indicating success or failure

## Deployment Instructions

### Option 1: Using Supabase CLI (Recommended)
1. Install the Supabase CLI if you haven't already:
   ```
   npm install -g supabase
   ```

2. Link your project:
   ```
   supabase link --project-ref your-project-ref
   ```

3. Push the migrations:
   ```
   supabase db push
   ```

### Option 2: Manual SQL Execution
1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `20250727_create_delete_user_auth_function.sql`
4. Paste into the SQL Editor and run the query

## Testing
After deployment, test the function by:
1. Creating a test user
2. Attempting to delete the user through the application
3. Verify that both the public.users and auth.users records are deleted

## Security Note
This function is designed to only be executable by users with 'admin' or 'owner' roles. The function validates the caller's permissions before performing any deletion.
