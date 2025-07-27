# Supabase Migrations

This directory contains SQL migrations that need to be applied to your Supabase instance.

## Required Supabase Configuration

### Email Templates
For the user invitation flow to work properly, you need to configure the following email templates in your Supabase dashboard:

1. **Invitation Email**: Used when inviting new users
2. **Password Reset Email**: Used when users need to reset their password

### Authentication Settings
Configure these settings in your Supabase dashboard:

1. **Site URL**: Set to your production domain (e.g., `https://app.dealermate.ca`)
2. **Redirect URLs**: Add `https://app.dealermate.ca/auth/callback` to allowed redirect URLs
3. **Enable Email Signup**: Must be enabled for user invitations to work

## User Management Improvements

### 1. User Invitation Flow

#### Problem
Previously, new users were created with random temporary passwords, but they couldn't log in properly after confirming their email, resulting in 400 Bad Request errors.

#### Solution
We've implemented a proper user invitation flow using Supabase's admin API:

1. Admin creates a user via `supabase.auth.admin.inviteUserByEmail()`
2. User receives an email with a secure link
3. User clicks the link and is redirected to set their password
4. User can then log in normally

The code includes a fallback to regular signup if the admin API call fails due to permission restrictions.

### 2. Auth User Deletion

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
