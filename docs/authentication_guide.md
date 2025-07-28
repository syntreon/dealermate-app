 # Authentication System Guide

This document provides a comprehensive guide to the application's authentication system, including user management flows, core principles for future development, and a high-level architectural overview.

## 1. User Management Flows

### User Creation and Invitation Process

#### Admin-Initiated User Creation

The application uses Supabase's admin invitation flow for creating new users:

1. **Admin creates user**: An admin uses the UserForm component to enter the new user's email, name, role, and client association.

2. **Invitation email**: The system sends an invitation email to the user via `supabase.auth.admin.inviteUserByEmail()` with a secure link.

3. **Fallback mechanism**: If the admin API fails (due to permission restrictions), the system falls back to regular signup with a temporary password.

4. **Auth callback handling**: When the user clicks the invitation link, they are directed to `/auth/callback`, which processes their authentication token or code.

5. **Password setup**: The user is then redirected to the password reset page to set their permanent password.

```typescript
// Core invitation flow in adminService.ts
await supabase.auth.admin.inviteUserByEmail(
  email,
  {
    data: { full_name, role },
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
  }
);
```

#### Authentication Callback Flow

The `AuthCallback.tsx` component handles multiple authentication scenarios:

1. **Token-based authentication**: Processes authentication tokens from URL hash fragments.

2. **Code-based authentication**: Handles OAuth2 PKCE code exchange from query parameters.

3. **Session establishment**: Sets up the user's session using `supabase.auth.setSession()` or `supabase.auth.exchangeCodeForSession()`.

4. **User redirection**: Directs users to the appropriate page based on their authentication context (password reset for new users, dashboard for returning users).

### User Deletion Process

User deletion is implemented with a robust, security-first, multi-step approach:

1. **Client-side attempt (expected to fail on client)**: The UI first tries to delete the user from both `public.users` and `auth.users` tables using `supabase.auth.admin.deleteUser()`. This call requires the Supabase service role key, which is **never exposed to client-side code** for security reasons. If run from the client, this will throw a 403 Forbidden error (caught and logged as a warning).

2. **Secure server-side fallback (best practice)**: When the admin API fails, the system falls back to a secure PostgreSQL function `delete_user_auth()`. This function is defined with `SECURITY DEFINER` and can perform privileged actions, but only after verifying the caller's role is 'admin' or 'owner'.

   - **Why not use the service role key client-side?**
     - The service role key grants unrestricted access to your entire database, bypassing all security policies. Exposing it to the client would create a massive security vulnerability.
     - Instead, we use a secure RPC function with strict permission checks. This allows safe, auditable admin actions from the UI without ever exposing sensitive credentials.

3. **Audit logging**: All deletion attempts are logged asynchronously for accountability.

4. **Error handling**: Failed deletions are logged to a `system_alerts` table for admin attention.

```sql
-- Core server-side deletion function
CREATE OR REPLACE FUNCTION public.delete_user_auth(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
    RAISE WARNING 'Error deleting auth user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$;
```

## 2. Core Principles & Best Practices

When building or modifying authentication features, adhere to the following principles derived from our debugging and testing.

### Rely on the Auth Listener as the Single Source of Truth

The Supabase `onAuthStateChange` listener is the heart of the system. It reliably reports all authentication events (`INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`). All application logic should be driven by these events to ensure the UI is always in sync with the user's true authentication state.

### Proactively Handle Race Conditions

As we discovered, a race condition can occur between a `SIGNED_IN` event and the backend's readiness to serve the user's profile. 

**Best Practice**: When an action depends on a previous, asynchronous event (like querying a database right after sign-in), introduce a minimal, defensive delay. Our **50ms delay** in `processSession` proved to be a robust solution to this specific problem.

### Understand "Refetch on Focus"

When you return to the application tab after it has been out of focus, the Supabase client automatically refreshes the session token for security and data freshness. This triggers a `TOKEN_REFRESHED` event. Our `useAuthSession` hook correctly handles this by re-validating the user's profile. This is a feature, not a bug, and ensures the user always has the most up-to-date session and profile data without a full page reload.

### Profile Management

Our architecture separates `auth.users` (for authentication) from `public.users` (for profile data). The user creation flow now correctly handles both tables:

1. **Auth User Creation**: First creates the user in `auth.users` via invitation or signup
2. **Profile Creation**: Then creates a corresponding profile in `public.users` with the same UUID
3. **Cleanup on Failure**: If profile creation fails, the auth user is automatically deleted to maintain consistency

**Future Enhancement**: Consider implementing a PostgreSQL trigger to automatically create a new row in `public.users` whenever a new user is created in `auth.users`. This would provide an additional layer of reliability.

## 3. System Architecture Overview

The authentication system is built around these key components:

### Core Authentication Components

-   **`AuthProvider` (`/src/context/AuthContext.tsx`)**: A React context provider that uses the `useAuthSession` hook and makes the authentication state (user, session, loading status) and functions (`login`, `logout`) available to the entire application.
-   **`useAuthSession` (`/src/hooks/useAuthSession.ts`)**: The core hook that orchestrates the entire authentication flow. It listens for Supabase auth events and manages all state transitions.

### User Management Components

-   **`AdminService.createUser` (`/src/services/adminService.ts`)**: Handles user creation with invitation emails using Supabase Admin API.
-   **`AdminService.deleteUser` (`/src/services/adminService.ts`)**: Implements robust user deletion with fallback mechanisms.
-   **`AuthCallback` (`/src/pages/auth/AuthCallback.tsx`)**: Processes authentication tokens and codes from email links.
-   **`ResetPassword` (`/src/pages/auth/ResetPassword.tsx`)**: Allows users to set or reset their password.

### Database Components

-   **`delete_user_auth` (PostgreSQL function)**: Secure server-side function for deleting auth users when client-side deletion fails.
-   **`public.users` table**: Stores user profile information.
-   **`system_alerts` table**: Records failed operations that require admin attention.

## 4. Case Study: Resolving a Critical Performance Bottleneck

This section summarizes a real-world debugging session that restored stability to the application.

-   **The Problem**: Users experienced slow logins, frequent timeouts when loading their profiles, and an infinite loop when trying to log out or refresh the page.
-   **The Root Cause**: A race condition on login and a missing `signOut` call on logout.
-   **The Solution**: We implemented the 50ms delay to fix the race condition, added the missing `supabase.auth.signOut()` call, and refactored the `useAuthSession` hook to cleanly handle all auth events from the listener.
