# Requirements: Config-Driven Admin Routing & Access

## Objective
- Centralize all **admin panel** route definitions, layouts, and access levels in a single config file.
- Eliminate duplication of access logic and reduce risk of inconsistent restrictions.
- Make it easy to add, update, or audit any admin page, section, or subpage (e.g., dashboard, analytics, management, settings, etc.) and their allowed roles.
- Support nested routes, layouts, and navigation metadata for future extensibility.
- Enable incremental migration: start with one section (e.g. management or analytics), then migrate other admin sections as needed.
- Ensure no breaking changes or regressions in current access levels or navigation.

## Functional Requirements
- All `/admin/*` routes (dashboard, analytics, management, settings, etc.) must be defined in a config array.
- Each route must specify:
  - Path (string, supports nesting)
  - Component (React component)
  - Allowed roles (`system_admin`, `client_admin`, etc.)
  - Loading text (for Suspense fallback)
  - (Optional) Layout wrapper, navigation label, icon, children for subroutes
- The router must generate `<Route>` elements from this config, supporting nested routes/layouts.
- Role-based access must be enforced by a single guard component (`ProtectedAdminRoute`), updated to accept an `allowedRoles` array.
- Navigation and tab configs should reference the same config for consistency.
- Must be minimal, modular, and enterprise-grade.
- All changes must be incremental and non-breaking.

## Non-Functional Requirements
- No breaking changes to existing routes or components.
- No regressions in access control or navigation.
- Modular, minimal, and easily extensible for future pages.
- Fully TypeScript-typed for safety.
