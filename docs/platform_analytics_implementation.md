# Platform Analytics Implementation Guide

This document provides a step-by-step implementation plan and practical how-tos for adding user platform/session analytics to the application. It is designed for new software developers joining the project.

---

## 1. Overview

Platform analytics help us understand which devices, operating systems, and features our users engage with. This enables data-driven decisions for UX, support, and product planning.

---

## 2. Database Changes

### a. Create the `user_platform_sessions` Table

- Use the provided SQL migration in `db/migrations/` to create the table.
- Table tracks each user session, device, platform, and feature usage.

**Key Columns:**
- `user_id` (FK to users)
- `session_start`, `session_end`
- `platform`, `device_type`, `os`, `browser`, `app_version`, etc.

**How to:**
1. Run the SQL migration using your usual DB migration tool or Supabase SQL editor.
2. Confirm the table exists and indexes are created.

---

## 3. Backend API Endpoint

### a. Create an Endpoint to Log Sessions

- Add a POST endpoint, e.g. `/api/platform-session`, to receive analytics data from the frontend.
- Validate and sanitize all incoming data.
- Insert a new row into `user_platform_sessions`.

**How to:**
1. In `src/routes/` or your backend routes folder, create a new route file (e.g. `platformSession.ts`).
2. Use the TypeScript interface from `src/types/UserPlatformSession.ts` for type safety.
3. Example Express handler:

```typescript
import { Request, Response } from 'express';
import { db } from '../db'; // your DB client

export async function logPlatformSession(req: Request, res: Response) {
  try {
    const session = req.body; // validate against UserPlatformSession type
    await db('user_platform_sessions').insert(session);
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
```

---

## 4. Frontend: Collect & Send Platform Data

### a. Collect Device/Platform Info

- Use JavaScript APIs (for web) or native APIs (for mobile) to get:
  - OS, browser, version, device type
  - User agent string
  - Entry point (first page loaded)
  - Feature used (e.g., current tab or section)
  - Dark mode preference
- Use libraries like [platform.js](https://github.com/bestiejs/platform.js) for reliable detection.

### b. Send Data to Backend

- On login or app load, POST the collected data to `/api/platform-session`.
- Optionally, update the session with `session_end` on logout or unload.

**How to:**
1. In your main app entry (e.g. `App.tsx`), add a function to collect platform info.
2. Call this function on login or when the app loads.
3. Use `fetch` or `axios` to POST the data to your backend endpoint.

---

## 5. Example: Collecting Platform Info (Web)

```typescript
import platform from 'platform';

function collectPlatformInfo() {
  return {
    platform: 'web',
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    os: platform.os?.family || '',
    os_version: platform.os?.version || '',
    browser: platform.name || '',
    browser_version: platform.version || '',
    user_agent: navigator.userAgent,
    prefers_dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    entry_point: window.location.pathname,
    created_at: new Date().toISOString(),
    // Add more fields as needed
  };
}
```

---

## 6. Reporting & Analysis

- Use SQL queries or Supabase dashboard to analyze platform usage.
- Example: Count sessions by platform

```sql
SELECT platform, COUNT(*) FROM user_platform_sessions GROUP BY platform;
```

- Example: Most common OS/browser combos

```sql
SELECT os, browser, COUNT(*) FROM user_platform_sessions GROUP BY os, browser ORDER BY COUNT(*) DESC;
```

---

## 7. Privacy & Compliance

- Do not collect more data than necessary.
- Hash or anonymize IP addresses if required by law.
- Update your privacy policy to disclose analytics collection.

---

## 8. Future Enhancements

- Add columns for error/crash reporting, accessibility, or feature flags as needed.
- Consider batching analytics for performance.
- Add retention policies for old analytics data.

---

**For help, see:**
- `src/types/UserPlatformSession.ts`
- `db/migrations/` for SQL
- This doc for step-by-step guidance
