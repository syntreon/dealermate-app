# 1. Incident & Root Cause Analysis

## Summary
In August 2025, the DealerMate application experienced a severe spike in database egress costs, threatening operational continuity. This section summarizes the incident's triggers, the underlying technical and architectural causes, and the immediate business impact.

---

## Root Cause Overview
- **Multiple auto-refresh intervals** across dashboard and analytics components
- **Infinite render loops** and component remounting
- **Tab/window focus events** triggering redundant API calls
- **Realtime subscriptions** with high update rates
- **Lack of caching and request deduplication**

### Impact
- Egress costs increased by 5–10x
- Application performance degraded for all users
- Risk of exceeding monthly cloud budget

---

## Deep Dives & Supporting Details

### Database Egress Analysis (Summary)
- **Root Cause**: Excessive API calls from analytics and dashboard tabs, especially during tab switches and auto-refresh intervals.
- **Findings**: No caching or deduplication on analytics queries; every tab switch or focus event triggered a new fetch. Real-time widgets and periodic refreshes compounded the issue.
- **Impact**: Egress costs spiked, especially during high usage periods or when multiple users had dashboard tabs open.

### Debug Tab Focus Issue
- **Issue**: Analytics and dashboard tabs would refetch data on every window/tab focus event, even if data was fresh.
- **Fix**: Disabled tab focus-triggered refreshes. Added 5-minute cache TTL and manual refresh button. Now, tab switches use cached data unless expired.

### Component Remounting Fix Summary
- **Problem**: Duplicate emergency system logic caused all intervals to be cleared on every activation, leading to unintended side effects (e.g., auth profile reloads, Supabase client warnings).
- **Solution**: Removed duplicate emergency system (`immediateEmergencyFix.ts`). Now only `emergencyEgressStop.ts` is used, and it is globally accessible as `window.egressEmergency`.
- **Additional Fixes**:
  - Optimized auth session reloads: Only reload user profile for SIGNED_IN or INITIAL_SESSION events, not token refreshes.
  - Added debug logging and error boundaries to catch and isolate future issues.

---

All critical root cause, debug, and fix details are now inlined. No external doc reference is required.
