---
inclusion: always
---

This are your main rules and instructions for this project
Alwasy build clean and minimal code.
make sure the code is not long per file.
After each spec or feature implementation always create 4 file
    1. Readme
    2. Developer Guide: (For New Developers
            * Instant onboarding: Complete system understanding in one document
* Self-service debugging: Solve 90% of issues without help
* Best practices: Learn the right way to work with the system
* Emergency procedures: Handle critical issues independently
For Experienced Developers
* Quick reference: Fast access to debug commands and solutions
* Performance optimization: Systematic approach to optimization
* Troubleshooting: Visual guides for complex problems
* Monitoring: Comprehensive system health tracking)
    3. Debug_Cheatsheet: Comprehensive debugging strategies
    4. Troubleshooting_flow: Visual problem-solving guides
## Project Rules
1. Whenver you create a new folder make sure to update the project structure.md file
2. Whenver you create a new file make sure to update the project structure.md file
3. Whenver you create a new component make sure to update the project structure.md file
4. Whenver you create a new service make sure to update the project structure.md file
5. Whenver you create a new type make sure to update the project structure.md file
6. Whenver you create a new interface make sure to update the project structure.md file

## Database Rules
1. Never reset the database
2. Never run supabase db reset, becasue this is a live database. 
3. Migartions are ther for your reference, do not run this as these tables are already created.
4. New database migration can be created based on needs but never run as i will verify and do it manyally via sql editor
5. Do not create migration files without asking first.

## UI & Design Guidelines

### Theme System
1. **Always use theme-aware styling** - Use CSS variables and semantic tokens from index.css
2. **Use semantic color tokens** - Use `hsl(var(--primary))`, `hsl(var(--background))`, etc. instead of hardcoded colors
3. **Leverage theme utilities** - Use `useOptimizedTheme` hook for theme-dependent calculations
4. **Ensure smooth transitions** - All theme changes should have smooth 300ms transitions
5. **Test in both themes** - Always verify components work in both light and dark modes

### Component Design Principles
1. **Responsive first** - Always design for mobile, tablet, and desktop
2. **Accessibility compliant** - Follow WCAG guidelines for color contrast and keyboard navigation
3. **Performance optimized** - Use memoization and avoid unnecessary re-renders
4. **Consistent spacing** - Use Tailwind spacing classes and CSS variables for consistency
5. **Clean and minimal** - Follow the established design system patterns

### Chart Components
1. **Use themed tooltips** - Import and use components from `@/components/ui/themed-chart-tooltip`
2. **Theme-aware colors** - Use `getThemeAwareChartColors()` utility for consistent chart styling
3. **Smooth transitions** - Ensure chart elements transition smoothly between themes
4. **Responsive design** - Charts should adapt to different screen sizes

### Form Components
1. **Use shadcn/ui components** - Leverage the existing component library
2. **Proper validation** - Use Zod schemas with React Hook Form
3. **Loading states** - Always show loading indicators during form submission
4. **Error handling** - Display clear, user-friendly error messages
5. **Theme consistency** - Forms should follow the theme system

## Environment
You are inside Windows, so use commands that are available in powershell.
Never run `npm run dev`. as we are using Vite with HMR and dev server is already running.

## Component Development Standards

### File Organization
1. **Component files** - Place in appropriate folder under `src/components/`
2. **Hooks** - Custom hooks go in `src/hooks/`
3. **Services** - Business logic in `src/services/`
4. **Utils** - Helper functions in `src/utils/`
5. **Types** - TypeScript types in `src/types/`

### Code Quality Standards
1. **TypeScript strict mode** - All code must be properly typed
2. **ESLint compliance** - Follow the established linting rules
3. **Performance considerations** - Use React.memo, useMemo, useCallback appropriately
4. **Error boundaries** - Implement proper error handling
5. **Testing** - Write unit tests for complex logic

### Theme Integration Requirements
1. **Import theme utilities** - Use `useOptimizedTheme` for theme-dependent logic
2. **CSS variables only** - Never use hardcoded colors or theme-specific values
3. **Transition support** - Ensure smooth theme transitions with proper CSS
4. **Performance monitoring** - Use theme performance utilities when needed
5. **Validation** - Validate theme-related props and state

### New Component Checklist
- [ ] Uses semantic color tokens from CSS variables
- [ ] Responsive across mobile, tablet, desktop
- [ ] Accessible (proper ARIA labels, keyboard navigation)
- [ ] Smooth theme transitions implemented
- [ ] Performance optimized (memoization where needed)
- [ ] Error handling implemented
- [ ] TypeScript types properly defined
- [ ] Follows established patterns from existing components

### New Page Checklist
- [ ] Uses DashboardLayout or AppLayout appropriately
- [ ] Implements proper loading states
- [ ] Has error boundaries and fallbacks
- [ ] Mobile-responsive design
- [ ] Theme-aware throughout
- [ ] Proper navigation and routing
- [ ] SEO considerations (titles, meta tags)
- [ ] Performance optimized

## Project Info
for project info, check the project.md file
for project structure, check the project structure.md file
for tech stack, check the tech tech.md file
All documents are in docs folder D:\AI\NewApp\docs

