# System Messages Feature (Admin Panel)

## Overview
The System Messages feature enables platform administrators to create, manage, and display important system-wide or client-specific messages. These messages are visible to users across the platform and provide real-time updates about maintenance, outages, or other critical events. The system is designed to be enterprise-grade, responsive, and highly performant.

---

## Agent Status and System Messages

### What is "Agent Active"?
- **Agent Active** is the normal operational state for agents and the system as a whole. It means the platform is available and fully functional for users.
- The agent/system status can be set to `active`, `inactive`, or `maintenance`.

### How is Agent Status Set?
- Admins can set the agent/system status from the `AgentStatusSettings` page.
- Status can be set **globally** (for all clients) or **per client**:
  - **Global:** Setting status to `maintenance` or `inactive` for "All Clients" overrides all client-specific statuses, displaying the global status everywhere.
  - **Per Client:** Setting status for a specific client only affects users of that client, unless a global status is set.
- When status is set to `active`, it means agents and users can operate as normal (unless a global override is in place).

### How Does Status Interact with System Messages?
- If the global status is set to `maintenance` or `inactive`, this takes precedence and is shown to all users, regardless of their client.
- If the global status is `active`, client-specific statuses/messages are displayed as appropriate.
- System messages and agent status updates are both surfaced in the dashboard top bar and banners for real-time awareness.

### How is Agent Status Displayed?
- The current agent/system status is shown in the dashboard top bar and as banners.
- Users always see the most relevant status: global if set, otherwise client-specific.
- Status changes and messages update in real-time for all affected users.

---

## How It Works

### 1. Setting and Publishing Messages
- **Admins** can publish new system messages from the `AgentStatusSettings` admin page.
- Messages can be targeted to **all clients (global/platform-wide)** or to a **specific client**.
- Each message includes:
  - Message content
  - Type (`info`, `warning`, `error`, `success`)
  - Expiry date (optional)
  - Publisher (admin user)
  - Timestamp
- When a message is published:
  - It is immediately saved in the `system_messages` table in the database.
  - The cache is invalidated, so the new message appears in the admin UI on next refresh.

### 2. Displaying Messages
- The admin panel displays messages in a **paginated, responsive table** (5 per page).
- Each row is clickable and opens a detailed popup with full message info, publisher, affected clients/businesses, and technical details.
- The table supports manual refresh and paginates results for performance.
- On the user dashboard, only active (non-expired) messages relevant to the user's client (or global) are displayed.
- Messages are styled according to their type and are accessible on all device types.

### 3. Client-Based Updates
- Messages can be targeted to a specific client by selecting the client in the admin UI.
- If "All Clients" is selected, the message is stored with `client_id = null`, making it global.
- When displaying messages, the system:
  - Shows global messages to all users
  - Shows client-specific messages only to users in that client
  - Prioritizes global maintenance/inactive messages for system-wide notifications

### 4. Updating and Deleting Messages
- Admins can delete system messages from the popup dialog in the admin panel.
- Deleting a message immediately removes it from all user dashboards and the admin table (after cache invalidation).
- Editing/updating messages can be implemented similarly if required (currently only delete is supported).

### 5. Caching and Performance
- The admin table uses **in-memory caching** with a 5-minute TTL to minimize database egress and improve performance.
- The cache is only refreshed on manual refresh or when a new message is published/deleted.
- No polling or timer-based refresh is used.

---

## Technical Details
- **Database:** `system_messages` table with fields: `id`, `client_id`, `type`, `message`, `timestamp`, `expires_at`, `created_by`, `updated_by`, `created_at`, `updated_at`
- **Backend:** Supabase with row-level security and proper audit logging
- **Frontend:**
  - React components: `SystemMessagesTable`, `SystemUpdatePopup`
  - Custom hook: `useSystemMessages` for pagination, caching, and CRUD
  - All UI is responsive, theme-aware, and accessible
- **Security:** Only authenticated admins can create/delete messages; all actions are audit-logged

---

## Usage Flow
1. **Admin navigates** to AgentStatusSettings
2. **Creates a new message** (selects client or all, fills out form, publishes)
3. **Message appears** in the table instantly (after cache refresh)
4. **Users see** relevant messages in their dashboard (global or client-specific)
5. **Admin can delete** messages as needed

---

## Best Practices
- Use global messages for platform-wide maintenance or outages
- Use client-specific messages for targeted communication
- Always provide clear, actionable content in messages
- Regularly review and delete expired or irrelevant messages

---

## Troubleshooting
- If new messages do not appear, use the manual refresh button
- If you see a 400 error, check database schema and Supabase permissions
- Ensure you are authenticated as an admin to manage messages

---

## Future Enhancements
- Inline editing of messages
- Rich formatting (Markdown support)
- Bulk operations (multi-delete, multi-update)
- Real-time push updates to user dashboards
