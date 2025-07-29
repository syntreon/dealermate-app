# Admin Page Implementation Plan & Boilerplate

This document provides a scalable, modular, and consistent approach for adding new admin pages and sub-pages, ensuring UI/UX consistency across the admin panel.

---

## 1. **General Principles**
- **Single Source of Truth:** Sidebar and sub-sidebar links are managed via `mainNavItems` config.
- **Minimal Layouts:** Only create a layout component if a group of pages needs shared UI or logic (e.g., Analytics).
- **Component Reuse:** Use a page boilerplate to ensure consistency; only the main content changes per page.
- **Consistent Routing:** Use nested routing for sections with multiple sub-pages.

---

## 2. **How to Add a New Admin Page**

### **A. For Single-Page Sections**
1. **Create the Page Component:**
   - Example: `src/pages/admin/FeatureX.tsx`
2. **Add to Sidebar Config:**
   - Add a new entry to `mainNavItems` in `src/config/adminNav.ts`.
3. **Add Route:**
   - Add a route in the router (e.g., `App.tsx`) under `/admin`.

### **B. For Sections With Multiple Sub-Pages**
1. **Create a Minimal Layout (if needed):**
   - Example: `src/layouts/FeatureXLayout.tsx`
   - Usually just returns `<Outlet />` unless you want shared UI.
2. **Create Sub-Page Components:**
   - Example: `src/pages/admin/feature-x/ReportA.tsx`, `ReportB.tsx`
3. **Update Sidebar Config:**
   - Add sub-links to the corresponding parent in `mainNavItems`.
4. **Add Nested Routes:**
   - In the router, nest sub-routes under the parent section using the layout.

---

## 3. **Boilerplate for Admin Pages**

> Copy and use this for all new admin page components for consistency.

```tsx
// src/pages/admin/YourPage.tsx
import React from 'react';

/**
 * YourPage - Short description of the page's purpose.
 * Add business logic, data fetching, and UI below.
 */
const YourPage: React.FC = () => {
  // Add hooks, state, and logic here

  return (
    <div className="space-y-6 p-6 pb-8">
      {/* Page header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
        Your Page Title
      </h1>
      <p className="text-muted-foreground mb-4">
        Short description or instructions for this page.
      </p>
      {/* Main content goes here */}
    </div>
  );
};

export default YourPage;
```

---

## 4. **Boilerplate for Section Layouts (Optional)**

```tsx
// src/layouts/FeatureXLayout.tsx
import { Outlet } from 'react-router-dom';

/**
 * Optional layout for FeatureX section. Use if you need shared UI or context.
 */
const FeatureXLayout: React.FC = () => {
  return <Outlet />;
};

export default FeatureXLayout;
```

---

## 5. **Checklist for Adding New Pages**
- [ ] Create new page component using the boilerplate
- [ ] Add entry to `mainNavItems` config
- [ ] Add route to router (nested if needed)
- [ ] (Optional) Create layout if the section has multiple sub-pages or shared UI
- [ ] Test sidebar and sub-sidebar navigation
- [ ] Ensure consistent styling and comments in code

---

## 6. **Best Practices**
- Use semantic class names and theme tokens for styling
- Keep business logic modular and well-commented
- Only create new layouts for groups of pages that need shared logic/UI
- Keep the admin navigation config (`mainNavItems`) as the single source of truth for links

---

**This plan and boilerplate ensure a scalable, maintainable, and consistent admin panel as your app grows.**
