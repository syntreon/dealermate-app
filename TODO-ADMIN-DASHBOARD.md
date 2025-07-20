# Admin Dashboard Overhaul - TODO List

## Theme System Implementation

- [ ] Replace hardcoded light theme colors with semantic tokens:
  - [ ] Change `bg-white` to `bg-card`
  - [ ] Change `border-gray-200` to `border-border`
  - [ ] Change `bg-gray-50/100` to `bg-muted/50` or `bg-muted`
  - [ ] Change `text-gray-700/800` to `text-card-foreground`
  - [ ] Change `text-gray-500` to `text-muted-foreground`
  - [ ] Change `text-red-500` to `text-destructive`
  - [ ] Change `bg-red-50` to `bg-destructive/10`
  - [ ] Change `border-red-100` to `border-destructive/20`

- [ ] Update loading skeletons in all admin components:
  - [ ] UsersTable.tsx - Replace `bg-gray-200` with `bg-muted`
  - [ ] ClientsTable.tsx - Replace hardcoded colors with theme tokens

- [ ] Update status badges to use semantic variants:
  - [ ] Use `text-warning`, `bg-warning/10` for warning states
  - [ ] Use semantic variants (emerald, amber, destructive) for status colors

## Component Issues

### User Management
- [ ] Fix minor CRUD issues in UserManagement.tsx
- [ ] Ensure UserForm validation works correctly for all fields
- [ ] Add pagination to UsersTable for better performance with large datasets
- [ ] Add bulk actions for user management (bulk delete, bulk role change)

### Client Management
- [ ] Fix minor CRUD issues in ClientManagement.tsx
- [ ] Ensure ClientForm validation works correctly
- [ ] Add client details view with more comprehensive information
- [ ] Implement client status change workflow with proper confirmation

## Authentication Improvements
- [ ] Implement database trigger for automatic profile creation when users sign up
- [ ] Increase timeout for first database query attempt to handle "sleeping" database on free tier
- [ ] Add error handling for database connection issues

## Performance Optimizations
- [ ] Add pagination to all tables to improve performance
- [ ] Implement lazy loading for large datasets
- [ ] Add caching for frequently accessed data

## UI/UX Improvements
- [ ] Make all admin components fully responsive
- [ ] Add confirmation dialogs for destructive actions
- [ ] Improve form validation feedback
- [ ] Add success/error notifications for all actions

## Testing
- [ ] Add comprehensive tests for all admin components
- [ ] Test theme switching to ensure all components render correctly in both light and dark modes
- [ ] Test with different user roles to ensure proper access control

## Documentation
- [ ] Document admin dashboard architecture
- [ ] Create user guide for admin features
- [ ] Document theme system implementation

## Future Enhancements
- [ ] Add advanced filtering options
- [ ] Implement export functionality for tables
- [ ] Add dashboard customization options
- [ ] Implement role-based dashboard views
