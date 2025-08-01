# 4. Monitoring & Best Practices

## Summary
This document is the **unified, single source of truth** for monitoring, validation, and troubleshooting of analytics, dashboard, and emergency systems. All operational checks, expected behaviors, and troubleshooting steps are documented here. No other doc is needed for operational validation.

---

## Monitoring & Validation Checklist

### Analytics & Dashboard
- **Supabase Dashboard:**
  - Check Database → Usage → Egress for real-time trends. Major drops in egress indicate optimizations are working.
- **Network Tab:**
  - API call frequency should be low (target: <10/minute per user, typically far less).
  - Tab switches should not trigger new API calls if cache is valid.
- **Console Logs:**
  - Look for logs indicating cache hits, deduplication, rate limiting, and emergency mode activation/deactivation.
- **Manual Refresh:**
  - Refresh buttons should always fetch fresh data and update the cache.
- **Expected Behavior:**
  - First tab visit fetches data, subsequent switches use cache (until 5 min TTL expires).
  - No loading errors or excessive API calls.

### Emergency System
- **Activation:**
  - In browser console, run:
    ```js
    window.egressEmergency.activate();
    ```
  - All auto-refresh and intervals stop. Users see alert. Emergency mode persists for 24 hours.
- **Deactivation:**
  - In browser console, run:
    ```js
    window.egressEmergency.deactivate();
    ```
  - Normal production behavior resumes. Auto-refresh remains disabled unless explicitly enabled in config.
- **Status:**
  - Run:
    ```js
    window.egressEmergency.status();
    ```
  - Shows whether emergency mode is active, when it was activated, and duration.
- **Expected Behavior:**
  - Only one emergency system is present. No duplicate logic. No interval clearing conflicts.
  - Emergency mode disables all auto-refresh and API polling, but manual refresh still works.

### Troubleshooting
- **If cache is not working:**
  - Check cache key logic and TTL in analytics/dashboard components.
  - Ensure manual refresh clears cache and fetches new data.
- **If emergency system is undefined:**
  - Restart the server. Ensure `src/utils/emergencyEgressStop.ts` is imported in `src/main.tsx`.
- **If emergency mode doesn't work:**
  - Check localStorage for `egress_emergency_mode` and `egress_emergency_timestamp`.
  - Clear them and reload if stuck:
    ```js
    localStorage.removeItem('egress_emergency_mode');
    localStorage.removeItem('egress_emergency_timestamp');
    location.reload();
    ```
- **If API calls are excessive:**
  - Check for duplicate fetches in logs. Ensure deduplication and rate limiting are active.
- **If users report stale data:**
  - Confirm cache TTL and manual refresh logic.

---

## Best Practices
- Keep auto-refresh and realtime updates disabled unless absolutely necessary.
- Use manual refresh and 5-min cache for analytics/admin data.
- Activate emergency mode only if egress spikes unexpectedly or during a crisis.
- Review and test config in `egressOptimization.ts` before enabling new features.
- Monitor logs and Supabase dashboard regularly.

---

## Escalation & Final Checklist
- If all else fails, escalate to engineering and follow these steps:
  1. Activate emergency mode and verify all auto-refresh is stopped.
  2. Review logs and network tab for unexpected behavior.
  3. Check and clear localStorage flags if needed.
  4. Revert to minimal, working configuration as described in this doc.
