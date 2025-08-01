# Global Call Type Filter Integration

## Overview
This document describes the implementation, architecture, and extension plan for the global call type filter in the DealerMate app. It covers how the filter works, which files and services are involved, how to maintain/extend it, and the roadmap for future integration with additional pages and analytics.

---

## What We Have Done
- **Default filter is now 'Live Calls'**: The global call type filter defaults to 'live', so users see only live calls unless they change the filter.
- **Implemented a global call type filter** using React Context (`CallTypeContext`), accessible throughout the app via the `useCallType` hook.
- **Integrated the filter into the Logs page**: All call log data (via `useCallLogs`) now respects the global call type filter, filtering by live/test/all calls as selected.
- **Updated the service layer** (`callLogsService`) to apply the correct filtering logic at the database query level.
- **Dashboard page partially integrated**: The filter is passed to dashboard hooks/services, but underlying service methods still need to apply the filter.

---

## How It Works
- **Context**: The `CallTypeProvider` wraps the app in `App.tsx`. The context exposes `selectedCallType` and a setter. The default is `'live'` (Live Calls).
- **Usage**: Any component/page can call `const { selectedCallType } = useCallType()` to access the current filter.
- **Role-Based UI Logic**:
  - **Admin/Owner**: Fully interactive dropdown to select All Calls, Live Calls, or Test Calls
  - **Client Admin**: Fully interactive dropdown (same as admin/owner)
  - **Client User**: Non-interactive UI, always displays "Live Calls" (cannot change)
- **Filtering Logic**:
  - `'all'`: No filter on `is_test_call`
  - `'live'`: Only records with `is_test_call = false`
  - `'test'`: Only records with `is_test_call = true`
- **Logs Page**: Passes `selectedCallType` into `useCallLogs`, which passes it to `callLogsService.getCallLogs`, which applies the filter in the Supabase query.

---

## File & Service Structure

### Context & Hooks
- `src/context/CallTypeContext.tsx` — Context and provider
- `src/hooks/useCallType.ts` — Hook to access context (may be inlined in context file)

### Pages
- `src/pages/Logs.tsx` — Uses the filter for call logs
- `src/pages/Dashboard.tsx` — Receives the filter, but underlying services need updating

### Services
- `src/integrations/supabase/call-logs-service.ts` — Main call logs query logic
- `src/hooks/useCallLogs.ts` — Hook for fetching logs, passes filter to service
- `src/services/callsService.ts` — Used by Dashboard for call stats/recent calls (needs update for filter)
- `src/services/dashboardService.ts` — Used for dashboard metrics (needs update for filter)
- `src/services/simpleAIAnalyticsService.ts` — Used for analytics (future extension)

---

## How to Change or Extend
- **To change filter logic**: Update `callLogsService.getCallLogs` and any other service methods that use the filter.
- **To add to a new page**: Import `useCallType`, get `selectedCallType`, and pass to relevant data hooks/services.
- **To extend to Dashboard or Analytics**: Update their service methods to accept and apply a `callType` or `is_test_call` filter, following the Logs page pattern.
- **File locations**: See above structure. All context/hooks in `src/context` or `src/hooks`, services in `src/services` or `src/integrations/supabase`.

---

## Where This Works
- **Logs Page**: Fully integrated, all call log queries respect the filter.
- **Dashboard Page**: Filter passed, but not yet applied in stats/services.
- **Other Pages**: Not yet integrated.

---

## Services Used
- `callLogsService` (Supabase call logs)
- `useCallLogs` (hook)
- `callsService` (dashboard calls/stats, needs update)
- `dashboardService` (dashboard metrics, needs update)
- `simpleAIAnalyticsService` (analytics, for future)

---

## Future Plan: Extending to Dashboard & Analytics

### Dashboard
- **Update `callsService.getCallStats` and `getRecentCalls`** to accept and apply callType filter (`is_test_call` logic)
- **Update `dashboardService.getDashboardMetrics`** to accept callType and pass to all sub-queries
- **Update `useDashboardMetrics`** to pass callType to service
- **Test all dashboard metrics, charts, and widgets for correct filtering**

### Analytics
- **Update `simpleAIAnalyticsService.getSimpleAnalytics`** to accept and apply callType filter
- **Update analytics page hooks/components** to pass selectedCallType
- **Test all analytics charts and widgets for correct filtering**

---

## Summary Table
| Area       | Status           | Main Files/Services                                      |
|------------|------------------|---------------------------------------------------------|
| Logs Page  | ✅ Complete      | Logs.tsx, useCallLogs.ts, call-logs-service.ts           |
| Dashboard  | ⚠️ Partial       | Dashboard.tsx, callsService.ts, dashboardService.ts      |
| Analytics  | 🚧 Planned       | Analytics.tsx, simpleAIAnalyticsService.ts               |

---

## For Developers
- **Search for `useCallType` and `selectedCallType`** to see where the filter is used.
- **Update or extend service methods** to accept/apply the filter as needed.
- **Keep logic minimal and modular** — always use context, never duplicate state.
- **Add comments** explaining filter mapping for future maintainability.

---

For questions or to extend this feature, see the above file/service structure and follow the established pattern from the Logs page.
