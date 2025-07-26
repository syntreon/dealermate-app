# Design Document

## Overview

The current theme system in Dealermate has several critical issues that need to be addressed systematically. The application uses next-themes for theme management with custom CSS variables, but there are inconsistencies in implementation, synchronization issues between theme selectors, and chart components that don't properly respect theme changes.

## Current State Analysis

### Existing Implementation
- **Theme Provider**: Uses `next-themes` with `data-theme` attribute
- **CSS Variables**: Comprehensive theme variables defined in `src/index.css`
- **Theme Selectors**: Two locations - TopBar toggle and Settings preferences
- **Default Theme**: Currently set to "dark" in AdminLayout
- **Chart Components**: Using Recharts with hardcoded colors in tooltips

### Identified Issues
1. **Default Theme Mismatch**: AdminLayout defaults to "dark" instead of "system"
2. **Chart Tooltip Styling**: Hardcoded white backgrounds in chart tooltips
3. **Theme Synchronization**: Potential race conditions between TopBar and Settings
4. **System Theme Detection**: Not properly detecting initial system preference
5. **Component Consistency**: Some components may not be using theme-aware classes

## Architecture

### Theme Management Flow
```
System Theme Detection → User Preference Check → Theme Application → Component Updates
```

### Core Components
1. **ThemeProvider Wrapper**: Centralized theme configuration
2. **Theme Detection Hook**: Enhanced system theme detection
3. **Theme Synchronization Service**: Ensures consistency across selectors
4. **Chart Theme Adapter**: Makes Recharts components theme-aware

## Components and Interfaces

### 1. Enhanced Theme Provider Configuration

**Location**: `src/layouts/AdminLayout.tsx` and `src/components/AppLayout.tsx`

**Changes**:
- Change default theme from "dark" to "system"
- Add proper theme initialization
- Ensure consistent provider configuration

### 2. Theme Detection and Initialization Hook

**Location**: `src/hooks/use-theme-init.tsx`

**Enhancements**:
- Improve system theme detection reliability
- Add proper error handling
- Ensure theme persistence works correctly
- Handle edge cases for system theme changes

### 3. Chart Theme Integration

**New Component**: `src/components/ui/themed-chart-tooltip.tsx`

**Purpose**: 
- Provide theme-aware tooltip components for Recharts
- Ensure consistent styling across all chart components
- Handle hover states and backgrounds properly

### 4. Theme Synchronization Service

**New Service**: `src/services/themeService.ts`

**Responsibilities**:
- Coordinate theme changes between TopBar and Settings
- Provide centralized theme state management
- Handle theme persistence to database
- Emit theme change events for component updates

## Data Models

### Theme Configuration Interface
```typescript
interface ThemeConfig {
  theme: 'light' | 'dark' | 'system';
  systemTheme?: 'light' | 'dark';
  isSystemDetected: boolean;
  lastUpdated: Date;
}

interface ThemeContextValue {
  currentTheme: ThemeConfig;
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  isLoading: boolean;
  error?: string;
}
```

### Chart Theme Variables
```typescript
interface ChartThemeColors {
  background: string;
  foreground: string;
  border: string;
  tooltipBackground: string;
  tooltipForeground: string;
  tooltipBorder: string;
}
```

## Error Handling

### Theme Loading Errors
- **Fallback Strategy**: Default to system theme if user preference fails to load
- **Error Recovery**: Retry theme application with exponential backoff
- **User Feedback**: Show toast notifications for theme-related errors

### System Theme Detection Failures
- **Graceful Degradation**: Fall back to light theme if system detection fails
- **Retry Mechanism**: Attempt system theme detection multiple times
- **Manual Override**: Allow users to manually set theme if auto-detection fails

### Database Synchronization Issues
- **Optimistic Updates**: Update UI immediately, sync to database asynchronously
- **Conflict Resolution**: Handle cases where local and remote theme preferences differ
- **Offline Support**: Cache theme preferences locally for offline usage

## Testing Strategy

### Unit Tests
1. **Theme Hook Tests**: Test `useThemeInit` with various scenarios
2. **Theme Service Tests**: Test synchronization and persistence logic
3. **Chart Component Tests**: Verify theme-aware styling
4. **Component Integration Tests**: Test theme changes across components

### Integration Tests
1. **Theme Synchronization**: Test TopBar and Settings synchronization
2. **System Theme Changes**: Test response to OS theme changes
3. **Database Persistence**: Test theme preference saving and loading
4. **Chart Theme Updates**: Test chart components update with theme changes

### Visual Regression Tests
1. **Theme Consistency**: Verify all components follow theme correctly
2. **Chart Styling**: Ensure chart tooltips and hover states are themed
3. **Transition Smoothness**: Test theme change animations
4. **Cross-browser Compatibility**: Test theme system across browsers

## Implementation Plan

### Phase 1: Core Theme System Fix
- Fix default theme configuration
- Enhance theme detection hook
- Improve error handling and fallbacks

### Phase 2: Chart Theme Integration
- Create themed chart tooltip components
- Update all chart components to use theme-aware styling
- Test chart theme changes across all analytics pages

### Phase 3: Synchronization and Polish
- Implement theme synchronization service
- Add comprehensive error handling
- Optimize performance and add caching

### Phase 4: Testing and Validation
- Implement comprehensive test suite
- Perform visual regression testing
- Validate across different devices and browsers

## Technical Considerations

### Performance
- **CSS Variable Updates**: Minimize DOM updates during theme changes
- **Component Re-renders**: Optimize theme context to prevent unnecessary re-renders
- **Chart Performance**: Ensure theme changes don't impact chart rendering performance

### Accessibility
- **Color Contrast**: Ensure all theme combinations meet WCAG guidelines
- **Focus Indicators**: Maintain proper focus visibility in both themes
- **Screen Reader Support**: Ensure theme changes are announced properly

### Browser Compatibility
- **CSS Custom Properties**: Ensure fallbacks for older browsers
- **Media Query Support**: Test system theme detection across browsers
- **Local Storage**: Handle storage limitations and errors gracefully