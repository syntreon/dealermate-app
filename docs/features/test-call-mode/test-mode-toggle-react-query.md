# Test Mode Toggle: React Query Synchronization

## Overview
This document explains the architecture and flow of the Test Mode toggle button, focusing on how it synchronizes state between the `BusinessSettings` and `ClientForm` components using React Query.

---

## Components Involved
- **BusinessSettings**: Contains the primary Test Mode toggle button for business admins.
- **ClientForm**: Also displays the Test Mode state for client management.

Both components need to stay in sync with the backend and each other.

---

## Data Flow & React Query Usage

### 1. Query Key Convention
- Both components use the query key pattern: `["client", clientId]` to fetch and cache client data.
- This ensures each client's data is isolated and can be invalidated independently or in bulk.

### 2. Optimistic Update
- When toggling Test Mode in `BusinessSettings`, the UI is updated immediately (optimistically) before the server responds.
- This is achieved by calling `queryClient.setQueryData(["client", clientId], ...)` with the new value.
- If the server call fails, the optimistic change is reverted.

### 3. Server Update & Audit Logging
- The toggle triggers `AdminService.updateClientWithAudit`, which updates the database and logs the change for auditing.
- No duplicate audit logs occur, as logging is handled only in the service layer.

### 4. Cache Invalidation for Sync
- After a successful update, all queries starting with `["client"]` are invalidated via `queryClient.invalidateQueries({ queryKey: ["client"], exact: false })`.
- This ensures both `BusinessSettings` and `ClientForm` see the latest value, regardless of which one triggered the change.

---

## Synchronization Example
1. User toggles Test Mode in `BusinessSettings`.
2. UI updates instantly (optimistic update).
3. API call updates the backend and logs the change.
4. All `["client"]` queries are invalidated.
5. Both `BusinessSettings` and `ClientForm` refetch and display the synced value.

---

## Error Handling
- If the API call fails, the optimistic update is reverted and an error message is shown.
- The cache remains consistent with the backend.

---

## Minimal, Modular, Enterprise-Ready
- **Minimal**: Only essential fields and logic are updated.
- **Modular**: All logic is encapsulated in service methods and React Query hooks.
- **Enterprise-Ready**: Audit logging, error handling, and UI feedback are robust.

---

## Visual Flow
```
[User toggles Test Mode]
        |
[Optimistic UI update]
        |
[API call: update + audit log]
        |
[Invalidate all ["client"] queries]
        |
[All components refetch & sync]
```

---

## Best Practices
- Always use broad cache invalidation for shared data (`exact: false`).
- Keep audit logging in the service layer only.
- Use optimistic updates for instant UI feedback, but always handle rollback on error.

---

## References
- See `BusinessSettings.tsx` (handleTestModeToggle)
- See `adminService.ts` (updateClientWithAudit, transformClient)
- See `ClientForm.tsx` (React Query usage)
