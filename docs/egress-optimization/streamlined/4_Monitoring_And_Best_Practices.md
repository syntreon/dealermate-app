# 4. Monitoring & Best Practices

## Summary
This section outlines how to monitor ongoing egress usage, recommended settings, and troubleshooting steps for future incidents. It is designed for both new and experienced developers to quickly validate system health and cost controls.

---

## Monitoring Checklist
- **Supabase Dashboard:**
  - Check Database → Usage → Egress for real-time trends
- **Browser Network Tab:**
  - Confirm API call frequency is low (target: <10/minute)
- **Console Logs:**
  - Look for egress optimization and emergency mode messages
- **Manual Refresh:**
  - Ensure refresh buttons work and do not trigger excessive calls

---

## Best Practices
- Keep auto-refresh and realtime updates disabled unless necessary
- Use manual refresh and cache TTL for analytics/admin data
- Activate emergency mode if egress spikes unexpectedly
- Review configuration in `egressOptimization.ts` before enabling new features

---

## Troubleshooting & Escalation
- [Immediate Actions Required](../IMMEDIATE_ACTIONS_REQUIRED.md)
- [Final Action Checklist](../FINAL_ACTION_CHECKLIST.md)
- [Emergency Activation Manual](../EMERGENCY_ACTIVATION.md)
- [Database Egress Analysis](../DATABASE_EGRESS_ANALYSIS.md)
