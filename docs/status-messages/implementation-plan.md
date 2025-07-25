# Implementation Plan: Real-time Agent Status & System Messaging

## 1. Overview

This document outlines the plan to implement a real-time agent status and system messaging feature. This will allow administrators to set a global or client-specific status for agents (`Active`, `Maintenance`, `Inactive`) and broadcast custom messages that will appear in the application's top bar for designated users. These changes will propagate in real-time and affect various parts of the application, including the main dashboard and the agents page.

## 2. User Requirements

- **Admin Requirement:** An admin must be able to set an agent status and a custom message for either "All Clients" or a specific client from the admin dashboard.
- **User Requirement:** A non-admin user must see the relevant status/message in the top bar of the application.
- **Functional Requirement:** The "Available Agents" count on the dashboard and the agent list on the Agents page must reflect the current agent status in real-time.

## 3. Architecture & Data Flow

The system will leverage Supabase Realtime for live updates and Supabase Edge Functions for secure backend logic.

1.  **Admin Action:** Admin sets a status/message in the Admin Dashboard UI.
2.  **API Call:** The UI calls a secure Supabase Edge Function (`set-system-status`).
3.  **Database Update:** The Edge Function validates the request and updates the `agent_status` or `system_messages` table in the database.
4.  **Real-time Broadcast:** Supabase Realtime detects the database change and broadcasts the new data to all subscribed clients.
5.  **Client-Side Update:** A custom React hook (`useSystemStatus`) on the client-side receives the new data and updates the application's state.
6.  **UI Reaction:** Components like `TopBar`, `MetricsSummaryCards`, and `Agents.tsx` consume the updated state and re-render to reflect the changes.

## 4. Database Schema

**File:** `supabase/migrations/20240101000000_create_system_status_tables.sql`

The database schema for this feature is already implemented in the existing migration file. The key tables are:

**`system_messages` table:**

```sql
CREATE TABLE IF NOT EXISTS system_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for platform-wide messages
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**`agent_status` table:**

```sql
CREATE TABLE IF NOT EXISTS agent_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for platform-wide status
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
    message TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(client_id)
);
```

## 5. Backend Development

**File:** `supabase/functions/set-system-status/index.ts`

-   Create a new Edge Function `set-system-status`.
-   **Function Logic:**
    -   Authenticates the user and verifies they are an admin.
    -   Accepts `(client_id | null)`, `(status | null)`, and `(message | null)` as payload.
    -   If `status` is provided, it will `UPSERT` into the `agent_status` table for the given `client_id`.
    -   If `message` is provided, it will `INSERT` into the `system_messages` table.

## 6. Frontend Development

### 6.1. Admin Panel UI

**File:** `src/components/admin/dashboard/tabs/SystemTab.tsx` (or a new tab)

-   Create a new card/section titled "Agent Status & Messaging".
-   Add a `ClientSelector` component to choose between "All Clients" and a specific client.
-   Add a `Select` component for agent status (`Active`, `Maintenance`, 'Inactive').
-   Add a `Textarea` for the custom message.
-   Add a "Publish" button that triggers the call to the `set-system-status` Edge Function.

### 6.2. Real-time State Management

**File:** `src/hooks/useSystemStatus.ts` (New File)

-   Create a custom hook to encapsulate Supabase Realtime subscriptions.
-   The hook will subscribe to changes in both `agent_status` and `system_messages`.
-   It will intelligently determine the most relevant message/status to display (a specific client's status takes precedence over a global one).
-   It will return an object like `{ status: 'active', message: 'Welcome!' }`.

### 6.3. UI Component Integration

**File:** `src/components/TopBar.tsx`

-   Use the `useSystemStatus` hook.
-   Conditionally render a banner at the top of the page if there is an active message or a non-active agent status.
-   The banner should be styled appropriately (e.g., yellow for maintenance, red for inactive).

**File:** `src/pages/Agents.tsx`

-   Use the `useSystemStatus` hook.
-   Before fetching the list of agents, check the `status`.
-   If `status` is `inactive` or `maintenance`, display a full-page message indicating the status and hide the agent list.
-   Otherwise, render the agent list as normal.

**File:** `src/components/dashboard/MetricsSummaryCards.tsx`

-   Use the `useSystemStatus` hook.
-   Modify the "Available Agents" metric.
-   If `status` is `inactive` or `maintenance`, the value should be `0`.
-   The component should listen to changes from the hook and re-render when the status changes.

## 7. Next Steps

1.  Review and approve this implementation plan.
2.  Develop the `set-system-status` Supabase Edge Function.
3.  Implement the UI changes in the Admin Panel.
4.  Create the `useSystemStatus` hook.
5.  Integrate the hook into `TopBar.tsx`, `Agents.tsx`, and `MetricsSummaryCards.tsx`.
6.  Thoroughly test the end-to-end flow.
