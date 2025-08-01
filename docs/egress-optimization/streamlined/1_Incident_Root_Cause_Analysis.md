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

## Deep Dives & Supporting Docs
- [Database Egress Analysis](../DATABASE_EGRESS_ANALYSIS.md)
- [Debug Tab Focus Issue](../DEBUG_TAB_FOCUS_ISSUE.md)
- [Component Remounting Fix Summary](../component-remounting-fix-summary.md)
