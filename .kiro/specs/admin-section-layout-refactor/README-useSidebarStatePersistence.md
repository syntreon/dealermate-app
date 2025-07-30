# Sidebar State Persistence System

## Overview

The sidebar state persistence system provides comprehensive state management for the admin sidebar with automatic persistence across browser sessions, error recovery, and cross-tab synchronization.

## Features

- **Automatic State Persistence**: Saves sidebar state to localStorage automatically
- **Error Recovery**: Handles localStorage failures gracefully with fallback strategies
- **Cross-Tab Synchronization**: Keeps sidebar state consistent across browser tabs
- **State Recovery**: Restores sidebar state on page reload
- **Configurable Behavior**: Customizable default modes, delays, and persistence settings
- **Analytics Tracking**: Tracks usage patterns for optimization
- **Data Export/Import**: Backup and restore functionality

## Components

### 1. `useSidebarStatePersistence` Hook

The main hook for managing sidebar state with persistence.

```typescript
import { useSidebarStatePersistence } from '@/hooks/useSidebarStatePersistence';

const {
  sidebarState,
  changeSidebarMode,
  setHoverState,
  displayProperties,
  config,
  storageAvailable,
  clearStoredState,
} = useSidebarStatePersistence({
  persistState: true,
  defaultMode: 'collapsed',
  transitionDuration: 300,
  hoverDelay: 150,
});
```

#### Configuration Options

```typescript
interface SidebarConfig {
  persistState: boolean;        // Enable/disable persistence
  defaultMode: SidebarMode;     // Default sidebar mode
  transitionDuration: number;   // Animation duration (ms)
  hoverDelay: number;          // Hover delay for expand-on-hover (ms)
}
```

#### Return Values

- `sidebarState`: Current sidebar state
- `changeSidebarMode(mode)`: Change sidebar mode with persistence
- `setHoverState(isHovered)`: Set hover state for expand-on-hover mode
- `displayProperties`: Calculated display properties
- `config`: Current configuration
- `storageAvailable`: Whether localStorage is available
- `clearStoredState()`: Clear all stored state

### 2. `sidebarStateService`

Centralized service for advanced state management.

```typescript
import { sidebarStateService } from '@/services/sidebarStateService';

// Save/load state
sidebarStateService.saveState(state);
const state = sidebarStateService.loadState();

// Manage preferences
sidebarStateService.savePreferences({ defaultMode: 'expanded' });
const preferences = sidebarStateService.getPreferences();

// Analytics
const analytics = sidebarStateService.getAnalytics();

// Cross-tab sync
const cleanup = sidebarStateService.addSyncListener((state) => {
  console.log('State synced from another tab:', state);
});

// Diagnostics
const diagnostics = sidebarStateService.getDiagnostics();

// Data management
const exportData = sidebarStateService.exportData();
sidebarStateService.importData(jsonData);
sidebarStateService.resetAllData();
```

### 3. Error Recovery System

Automatic error recovery with multiple strategies.

```typescript
import { withErrorRecovery, sidebarErrorRecovery } from '@/utils/sidebarErrorRecovery';

// Wrap operations with error recovery
const result = await withErrorRecovery(
  () => riskyOperation(),
  'operationName',
  fallbackValue
);

// Check system health
const isHealthy = sidebarErrorRecovery.isHealthy();

// Get error history
const errors = sidebarErrorRecovery.getErrorHistory();

// Get recommendations
const recommendations = sidebarErrorRecovery.getRecoveryRecommendations();
```

## Usage Examples

### Basic Usage

```typescript
import React from 'react';
import { useSidebarStatePersistence } from '@/hooks/useSidebarStatePersistence';

const MySidebar = () => {
  const {
    sidebarState,
    changeSidebarMode,
    setHoverState,
    displayProperties,
  } = useSidebarStatePersistence();

  const { isExpanded, showText, isOverlay } = displayProperties;

  return (
    <div 
      className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
    >
      {/* Sidebar content */}
      <button onClick={() => changeSidebarMode('expanded')}>
        Expand
      </button>
    </div>
  );
};
```

### With Custom Configuration

```typescript
const {
  sidebarState,
  changeSidebarMode,
} = useSidebarStatePersistence({
  persistState: true,
  defaultMode: 'expand-on-hover',
  transitionDuration: 500,
  hoverDelay: 200,
});
```

### Error Handling

```typescript
import { withErrorRecovery } from '@/utils/sidebarErrorRecovery';

const saveUserPreference = async (mode: SidebarMode) => {
  const result = await withErrorRecovery(
    () => sidebarStateService.savePreferences({ defaultMode: mode }),
    'saveUserPreference',
    false
  );
  
  if (!result) {
    console.warn('Failed to save preference, using fallback');
  }
};
```

### Cross-Tab Synchronization

```typescript
useEffect(() => {
  const cleanup = sidebarStateService.addSyncListener((syncedState) => {
    if (syncedState.mode !== sidebarState.mode) {
      changeSidebarMode(syncedState.mode);
      showNotification('Sidebar synchronized with other tab');
    }
  });

  return cleanup;
}, [sidebarState.mode, changeSidebarMode]);
```

## State Structure

### SidebarState

```typescript
interface SidebarState {
  mode: 'expanded' | 'collapsed' | 'expand-on-hover';
  isHovered: boolean;
  width: number;
  isTransitioning: boolean;
}
```

### Display Properties

```typescript
interface DisplayProperties {
  isExpanded: boolean;    // Whether sidebar is currently expanded
  showText: boolean;      // Whether to show text labels
  currentWidth: number;   // Current sidebar width
  layoutWidth: number;    // Width that affects layout
  isOverlay: boolean;     // Whether sidebar is in overlay mode
}
```

## Storage Keys

The system uses these localStorage keys:

- `admin-sidebar-state`: Current sidebar state
- `admin-sidebar-preferences`: User preferences
- `admin-sidebar-analytics`: Usage analytics

## Error Recovery Strategies

1. **Fallback to Default**: Use default state when errors occur
2. **Clear and Reset**: Clear corrupted data and reset to defaults
3. **Retry with Delay**: Retry failed operations with exponential backoff
4. **Disable Persistence**: Continue without persistence if storage fails

## Performance Considerations

- State changes are debounced to prevent excessive localStorage writes
- Cross-tab synchronization uses efficient event listeners
- Error recovery includes cleanup mechanisms to prevent memory leaks
- Analytics data is automatically cleaned up after 30 days

## Testing

The system includes comprehensive tests covering:

- Basic state management
- Persistence functionality
- Error recovery scenarios
- Cross-tab synchronization
- Edge cases (corrupted data, storage unavailable)

Run tests with:

```bash
npm test -- useSidebarStatePersistence
```

## Debugging

### Development Tools

1. **Sidebar Diagnostics Component**: Visual debugging interface
2. **Console Logging**: Detailed error and recovery logs in development
3. **Export/Import**: Backup and restore functionality for debugging

### Common Issues

1. **Storage Quota Exceeded**: System automatically clears old data
2. **Corrupted Data**: Automatic cleanup and reset to defaults
3. **Cross-Tab Conflicts**: Event-based synchronization resolves conflicts
4. **Performance Issues**: Built-in debouncing and cleanup mechanisms

### Debug Commands

```typescript
// Get diagnostics
const diagnostics = sidebarStateService.getDiagnostics();

// Check system health
const isHealthy = sidebarErrorRecovery.isHealthy();

// Export error data
const errorData = sidebarErrorRecovery.exportErrorData();

// Reset everything
sidebarStateService.resetAllData();
```

## Migration Guide

### From Basic localStorage

If migrating from basic localStorage usage:

1. Replace direct localStorage calls with the hook
2. Update state management to use provided functions
3. Add error handling for critical operations
4. Test cross-tab synchronization

### Version Compatibility

The system includes version checking for forward compatibility:

- Version 1.0: Basic state persistence
- Version 1.1: Added error recovery and analytics
- Future versions will include migration logic

## Best Practices

1. **Always use the hook**: Don't access localStorage directly
2. **Handle errors gracefully**: Use withErrorRecovery for critical operations
3. **Test edge cases**: Verify behavior with storage disabled/full
4. **Monitor health**: Check system health in production
5. **Clean up listeners**: Always clean up event listeners and subscriptions

## API Reference

### Hook API

```typescript
useSidebarStatePersistence(config?: Partial<SidebarConfig>): {
  sidebarState: SidebarState;
  updateSidebarState: (updates: Partial<SidebarState>) => void;
  changeSidebarMode: (mode: SidebarMode) => void;
  setHoverState: (isHovered: boolean) => void;
  clearStoredState: () => boolean;
  displayProperties: DisplayProperties;
  config: SidebarConfig;
  storageAvailable: boolean;
}
```

### Service API

```typescript
class SidebarStateService {
  saveState(state: SidebarState): boolean;
  loadState(): Partial<SidebarState> | null;
  clearState(): boolean;
  savePreferences(preferences: Partial<SidebarPreferences>): boolean;
  getPreferences(): SidebarPreferences;
  getAnalytics(): SidebarAnalytics;
  addSyncListener(listener: (state: SidebarState) => void): () => void;
  resetAllData(): boolean;
  getDiagnostics(): DiagnosticsData;
  exportData(): string | null;
  importData(jsonData: string): boolean;
}
```

### Error Recovery API

```typescript
withErrorRecovery<T>(
  operation: () => T | Promise<T>,
  operationName: string,
  fallbackValue: T
): Promise<T>;

class SidebarErrorRecovery {
  recoverFromError(error: Error, operation: string): Promise<RecoveryResult>;
  getErrorHistory(): SidebarError[];
  clearErrorHistory(): void;
  isHealthy(): boolean;
  getRecoveryRecommendations(): string[];
  exportErrorData(): string;
}
```