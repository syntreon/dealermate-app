# Admin Management Routing & Access Control Guide

This guide explains how routing, layouts, and access-level restrictions work in the Admin Management section. Use this as a reference for adding new pages, layouts, or changing access logic.

---

## 1. Routing Structure

- All admin management routes are nested under `/admin/management` in `App.tsx`.
- Each sub-page (e.g., `user-management`, `business`, `roles`) is defined as a child `<Route>`.
- Routes are wrapped in layout components (e.g., `ManagementLayout`) for consistent UI.

**Example:**
```tsx
<Route path="/admin/management" element={<ManagementLayout />}>
  <Route path="user-management" element={<UserManagement />} />
  <Route path="business" element={<BusinessManagement />} />
  <Route path="roles" element={<RolesPermissions />} />
</Route>
```

---

## 2. Access Control (Role-based Restriction)

- Access is enforced using `<ProtectedAdminRoute requireSystemAccess={...}>`.
  - `requireSystemAccess={true}`: Only `system_admin` can access
  - `requireSystemAccess={false}`: Both `system_admin` and `client_admin` can access
- The `ProtectedAdminRoute` component checks the current user's role and either renders the page or redirects (usually to user management).

**Example:**
```tsx
<Route path="business" element={
  <Suspense fallback={<LoadingSpinner text="Loading business management..." />}>
    <ProtectedAdminRoute requireSystemAccess={false}>
      <BusinessManagement />
    </ProtectedAdminRoute>
  </Suspense>
} />
```

---

## 3. Adding New Pages & Layouts

1. **Create the page component** (e.g., `NewFeature.tsx`).
2. **Add the route** under `/admin/management` in `App.tsx`:
   - Wrap with `ProtectedAdminRoute` and set `requireSystemAccess` as needed.
3. **If a new layout is needed** (e.g., for a new section), create a layout component and nest routes under it.

**Example:**
```tsx
<Route path="new-feature" element={
  <Suspense fallback={<LoadingSpinner text="Loading new feature..." />}>
    <ProtectedAdminRoute requireSystemAccess={true}>
      <NewFeature />
    </ProtectedAdminRoute>
  </Suspense>
} />
```

---

## 4. Best Practices

- **Centralize role logic**: Use `ProtectedAdminRoute` for all admin/management pages.
- **Use layout components** for consistent UI and to group related pages.
- **Keep navigation configs** (`managementNav.ts`, `managementTabs.ts`) in sync with your routes.
- **Document new routes** in this guide and in `project-structure.md`.

---

## 5. Future Simplification Recommendations

- **Abstract Access Logic**: Move all access control logic to a single utility/hook (e.g., `useAccessControl`) to avoid prop-drilling and reduce boilerplate.
- **Declarative Permissions**: Use a config-driven approach for roles/permissions, e.g.:
  ```typescript
  export const managementRoutes = [
    { path: 'user-management', component: UserManagement, roles: ['system_admin', 'client_admin'] },
    { path: 'business', component: BusinessManagement, roles: ['system_admin', 'client_admin'] },
    { path: 'roles', component: RolesPermissions, roles: ['system_admin', 'client_admin'] },
    { path: 'system-settings', component: SystemSettings, roles: ['system_admin'] },
  ];
  ```
  Then generate `<Route>`s dynamically.
- **Consistent Redirects**: Always redirect unauthorized users to a single, well-defined fallback (e.g., `/admin/management/user-management`).
- **Type Safety**: Use TypeScript enums/types for roles and route configs.
- **Testing**: Add tests to verify access control for each route.

---

## 6. Troubleshooting

- If a user is redirected to the wrong page, check the `requireSystemAccess` prop and the logic in `ProtectedAdminRoute`.
- If navigation links are broken, verify the path in both navigation config and route definition.
- For new layouts, ensure nested routes are correctly wrapped and access-controlled.

---

**Keep this doc updated as you add or change routes, layouts, or access logic.**
