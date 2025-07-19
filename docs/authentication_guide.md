# Authentication System Guide

This document provides a comprehensive guide to the application's authentication system, including core principles for future development, a high-level architectural overview, and a case study of a critical performance fix.

## 1. Core Principles & Best Practices

When building or modifying authentication features, adhere to the following principles derived from our debugging and testing.

### Rely on the Auth Listener as the Single Source of Truth

The Supabase `onAuthStateChange` listener is the heart of the system. It reliably reports all authentication events (`INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`). All application logic should be driven by these events to ensure the UI is always in sync with the user's true authentication state.

### Proactively Handle Race Conditions

As we discovered, a race condition can occur between a `SIGNED_IN` event and the backend's readiness to serve the user's profile. 

**Best Practice**: When an action depends on a previous, asynchronous event (like querying a database right after sign-in), introduce a minimal, defensive delay. Our **50ms delay** in `processSession` proved to be a robust solution to this specific problem.

### Understand "Refetch on Focus"

When you return to the application tab after it has been out of focus, the Supabase client automatically refreshes the session token for security and data freshness. This triggers a `TOKEN_REFRESHED` event. Our `useAuthSession` hook correctly handles this by re-validating the user's profile. This is a feature, not a bug, and ensures the user always has the most up-to-date session and profile data without a full page reload.

### CRITICAL: Automate Profile Creation with a Database Trigger

Our current architecture correctly separates `auth.users` (for authentication) from `public.users` (for profile data). However, the manual process of creating a profile in `public.users` is a critical point of failure.

**Action Required**: A **PostgreSQL trigger** must be implemented in the database. This trigger should automatically create a new row in `public.users` whenever a new user is created in `auth.users`. This will eliminate a major class of bugs, improve reliability, and streamline the new user onboarding process.

## 2. System Architecture Overview

The authentication system is built around these key components:

-   **`AuthProvider` (`/src/context/AuthContext.tsx`)**: A React context provider that uses the `useAuthSession` hook and makes the authentication state (user, session, loading status) and functions (`login`, `logout`) available to the entire application.
-   **`useAuthSession` (`/src/hooks/useAuthSession.ts`)**: The core hook that orchestrates the entire authentication flow. It listens for Supabase auth events and manages all state transitions.

## 3. Case Study: Resolving a Critical Performance Bottleneck

This section summarizes a real-world debugging session that restored stability to the application.

-   **The Problem**: Users experienced slow logins, frequent timeouts when loading their profiles, and an infinite loop when trying to log out or refresh the page.
-   **The Root Cause**: A race condition on login and a missing `signOut` call on logout.
-   **The Solution**: We implemented the 50ms delay to fix the race condition, added the missing `supabase.auth.signOut()` call, and refactored the `useAuthSession` hook to cleanly handle all auth events from the listener.
