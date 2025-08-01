# Test Call Mode Overview

This document provides a comprehensive overview of the Test Call feature, including how it works, file locations, services used, developer guidance, future enhancements, and links to related documentation.

---

## 1. What is Test Call Mode?
Test Call Mode is a system-wide flag that allows calls to be marked as "test" for QA, training, or demo purposes. Test calls are visually distinguished in the UI and can be filtered, tracked, and managed separately from live calls.

---

## 2. How it Works
- **Marking a Test Call:**
  - In the Call Logs Table, each call row includes a "Test" checkbox. Toggling this opens a confirmation dialog before updating the backend.
  - The `is_test_call` boolean field in the database tracks test status.
- **Visual Indicators:**
  - On the Call Details popup, a red "Test Call" badge appears next to the call type badge if the call is marked as a test call.
- **Filtering:**
  - The global call type filter defaults to "live" calls, but can be extended to support filtering by test/live calls in the future.

---

## 3. Key Files and Components
- **Checkbox UI:**
  - `src/components/calls/TestCallCheckbox.tsx` – Checkbox with confirmation dialog and backend integration.
  - `src/components/CallLogsTable.tsx` – Integrates the checkbox in the call logs table.
- **Badge UI:**
  - `src/components/calls/CallDetailsPopup/index.tsx` – Renders the test call badge in the details dialog.
  - `src/components/calls/CallDetailsPopup/utils.tsx` – Utility for rendering badges.
- **Backend Service:**
  - `src/integrations/supabase/call-logs-service.ts` – Handles updating the `is_test_call` field in the database.

---

## 4. Services Used
- **Supabase:**
  - Primary database and authentication provider.
  - `callLogsService.updateCallTestStatus(id, isTestCall)` updates the test call status.
- **UI Libraries:**
  - TailwindCSS for theme-aware styling.
  - shadcn/ui for UI primitives (Badge, Checkbox, Dialog, etc.).

---

## 5. Developer Guide & Best Practices
- **Minimal & Modular:**
  - All logic is encapsulated in dedicated components and services.
- **Type Safety:**
  - The `is_test_call` property is optional in TypeScript interfaces for compatibility with Supabase types.
- **Error Handling:**
  - All UI actions provide confirmation dialogs and toast notifications.
- **Theme Compliance:**
  - All badges and UI elements use semantic color tokens from `src/index.css`.
- **Accessibility:**
  - Checkbox and badge components have ARIA labels and proper keyboard navigation.

---

## 6. Future Enhancements
- **RBAC:**
  - Restrict marking/unmarking test calls to certain roles (e.g., admin, QA).
- **Advanced Filtering:**
  - Add global and per-table filters for test/live calls.
- **Analytics:**
  - Track test call usage for QA reporting.
- **Bulk Actions:**
  - Enable marking multiple calls as test/live in batch.
- **Audit Logging:**
  - Record who changed test call status and when.

---

## 7. Related Documentation
- [Test Call Checkbox](./test-call-checkbox.md)
- [Global Call Type Filter](./global-call-type-filter.md)

---

## 8. Troubleshooting
- If the badge or checkbox does not appear, ensure the `is_test_call` field exists in the database and is being fetched by the API.
- For Supabase type issues, use `Record<string, any>` as a workaround for missing fields.

---

## 9. File Structure Reference
```
/ src
  /components
    /calls
      TestCallCheckbox.tsx
      CallDetailsPopup/
        index.tsx
        utils.tsx
    CallLogsTable.tsx
  /integrations
    /supabase
      call-logs-service.ts
/ docs
  /features
    /test-call-mode
      test-call-overview.md
      test-call-checkbox.md
      global-call-type-filter.md
```

---

For further details, refer to the linked docs or contact the project maintainers.
