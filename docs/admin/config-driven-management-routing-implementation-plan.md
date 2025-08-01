# Implementation Plan: Config-Driven Admin Routing & Access

## Step 1: Prepare
- Audit all current admin panel routes and their access levels (done for management, repeat for others as needed).
- Create `src/config/adminRoutes.ts` with all current routes, components, roles, loading texts, and layout/navigation metadata.

## Step 2: Update Access Guard
- Update `ProtectedAdminRoute` to accept `allowedRoles` (array) instead of `requireSystemAccess` (boolean).
- Ensure backward compatibility by supporting both props during migration.
- Add tests to verify correct access for each role.

## Step 3: Refactor Router
- In `App.tsx`, replace hardcoded admin routes with a recursive `.map` over `adminRoutes`.
- Support nested routes and layouts as specified in the config.
- Use Suspense and LoadingSpinner as before.
- Verify all routes render and access logic works as expected.

## Step 4: Sync Navigation
- Update navigation configs (sidebar, tabs) to reference `adminRoutes` for path and label consistency.
- Optionally, generate navigation dynamically from the config.

## Step 5: Test & Validate
- Test all admin pages as `system_admin` and `client_admin`.
- Confirm no regressions in access or navigation.
- Fix any import or dependency issues found.

## Step 6: Document
- Update admin routing docs with the new config-driven approach.
- Add troubleshooting/cheatsheet for common issues.

## Step 7: Rollout
- Remove support for legacy `requireSystemAccess` prop after migration is stable.
- Migrate additional admin sections incrementally as new features are added.
