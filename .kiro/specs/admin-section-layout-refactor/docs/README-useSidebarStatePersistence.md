# Sidebar State Persistence - README

## Overview

The sidebar state persistence system provides a robust, error-resilient solution for maintaining admin sidebar state across browser sessions. This implementation ensures users' preferred sidebar configuration (expanded, collapsed, or expand-on-hover) is remembered and restored when they return to the application.

## Key Features

### 🔄 State Persistence
- **Automatic saving** to localStorage when sidebar mode changes
- **State recovery** on page reload and browser restart
- **Cross-browser session** persistence
- **Data expiration** (30 days) to prevent stale data

### 🛡️ Error Handling
- **Graceful degradation** when localStorage is unavailable
- **Corrupted data recovery** with automatic cleanup
- **Storage quota management** with intelligent data clearing
- **Comprehensive error logging** and recovery strategies

### 🔄 Cross-Tab Synchronization
- **Real-time sync** between multiple browser tabs
- **Event-driven updates** using storage events
- **Conflict resolution** for simultaneous changes
- **Session tracking** for analytics

### 📊 Analytics & Preferences
- **Usage tracking** for each sidebar mode
- **User preferences** management
- **Performance monitoring** and diagnostics
- **Data export/import** capabilities

## Quick Start

### Basic Usage

```typescript
import { useSidebarStatePersistence } from '@/hooks/useSidebarStatePersistence';

const MyComponent = () => {
  const {
    sidebarState,
    changeSidebarMode,
    setHoverState,
    displayProperties,
    storageAvailable
  } = useSidebarStatePersistence();

  return (
    <div>
      <button onClick={() => changeSidebarMode('expanded')}>
        Expand Sidebar
      </button>
      <p>Current mode: {sidebarState.mode}</p>
      <p>Storage available: {storageAvailable ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

### Custom Configuration

```typescript
const {
  sidebarState,
  changeSidebarMode
} = useSidebarStatePersistence({
  persistState: true,
  defaultMode: 'collapsed',
  transitionDuration: 300,
  hoverDelay: 150
});
```

## API Reference

### Hook: `useSidebarStatePersistence(config?)`

#### Parameters
- `config` (optional): Configuration object
  - `persistState: boolean` - Enable/disable localStorage persistence (default: true)
  - `defaultMode: SidebarMode` - Default sidebar mode (default: 'collapsed')
  - `transitionDuration: number` - Animation duration in ms (default: 300)
  - `hoverDelay: number` - Hover delay in ms (default: 150)

#### Returns
- `sidebarState: SidebarState` - Current sidebar state
- `changeSidebarMode: (mode: SidebarMode) => void` - Change sidebar mode
- `setHoverState: (isHovered: boolean) => void` - Set hover state
- `displayProperties: DisplayProperties` - Computed display properties
- `clearStoredState: () => boolean` - Clear stored state
- `config: SidebarConfig` - Final configuration
- `storageAvailable: boolean` - localStorage availability

### Service: `sidebarStateService`

#### Methods
- `saveState(state: SidebarState): boolean` - Save state to localStorage
- `loadState(): Partial<SidebarState> | null` - Load state from localStorage
- `clearState(): boolean` - Clear stored state
- `savePreferences(preferences: Partial<SidebarPreferences>): boolean` - Save user preferences
- `getPreferences(): SidebarPreferences` - Get user preferences
- `getAnalytics(): SidebarAnalytics` - Get usage analytics
- `resetAllData(): boolean` - Reset all stored data
- `exportData(): string | null` - Export all data as JSON
- `importData(jsonData: string): boolean` - Import data from JSON
- `getDiagnostics()` - Get diagnostic information

## State Management

### Sidebar Modes
1. **Expanded** (`expanded`)
   - Full width (256px) showing icons and text
   - Always visible and takes up layout space

2. **Collapsed** (`collapsed`)
   - Minimal width (64px) showing icons only
   - Takes up minimal layout space

3. **Expand on Hover** (`expand-on-hover`)
   - Base width (64px) with overlay expansion on hover
   - Expands to full width without affecting layout

### State Structure

```typescript
interface SidebarState {
  mode: SidebarMode;
  isHovered: boolean;
  width: number;
  isTransitioning: boolean;
}
```

### Display Properties

```typescript
interface DisplayProperties {
  isExpanded: boolean;      // Whether sidebar is currently expanded
  showText: boolean;        // Whether to show text labels
  currentWidth: number;     // Current sidebar width
  layoutWidth: number;      // Width that affects layout
  isOverlay: boolean;       // Whether sidebar is in overlay mode
}
```

## Error Recovery

The system includes comprehensive error recovery mechanisms:

### Error Types
- `STORAGE_UNAVAILABLE` - localStorage not accessible
- `CORRUPTED_DATA` - Invalid or corrupted stored data
- `QUOTA_EXCEEDED` - Storage quota exceeded
- `SYNC_FAILURE` - Cross-tab synchronization failure
- `UNKNOWN` - Unexpected errors

### Recovery Strategies
- `FALLBACK_TO_DEFAULT` - Use default configuration
- `CLEAR_AND_RESET` - Clear corrupted data and reset
- `RETRY_WITH_DELAY` - Retry operation with exponential backoff
- `DISABLE_PERSISTENCE` - Continue without persistence

## Cross-Tab Synchronization

The system automatically synchronizes sidebar state across browser tabs:

```typescript
// Add sync listener
const cleanup = sidebarStateService.addSyncListener((syncedState) => {
  console.log('State synced from another tab:', syncedState);
});

// Cleanup when component unmounts
useEffect(() => cleanup, []);
```

## Performance Considerations

### Optimizations
- **Debounced saves** to prevent excessive localStorage writes
- **Memoized calculations** for display properties
- **Event listener cleanup** to prevent memory leaks
- **Lazy loading** of analytics data

### Memory Management
- **Automatic cleanup** of old data (30+ days)
- **Limited error history** (max 10 entries)
- **Session-based tracking** with automatic cleanup

## Testing

The implementation includes comprehensive tests covering:
- Basic functionality and state changes
- localStorage persistence and recovery
- Error handling and graceful degradation
- Cross-browser compatibility
- Performance characteristics

Run tests:
```bash
npm run test:run -- src/hooks/__tests__/useSidebarStatePersistence.test.ts
```

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### Fallback Behavior
- **No localStorage**: Continues with in-memory state only
- **Quota exceeded**: Automatically clears old data
- **Corrupted data**: Resets to default configuration

## Troubleshooting

### Common Issues

1. **State not persisting**
   - Check if localStorage is available
   - Verify browser privacy settings
   - Check storage quota

2. **Cross-tab sync not working**
   - Ensure both tabs are on the same domain
   - Check browser storage event support
   - Verify no ad blockers interfering

3. **Performance issues**
   - Check for excessive state changes
   - Verify proper cleanup of event listeners
   - Monitor localStorage usage

### Debug Information

```typescript
// Get diagnostic information
const diagnostics = sidebarStateService.getDiagnostics();
console.log('Sidebar diagnostics:', diagnostics);

// Export error data
const errorData = sidebarErrorRecovery.exportErrorData();
console.log('Error history:', errorData);
```

## Migration Guide

### From Previous Versions

If upgrading from a previous sidebar implementation:

1. **Remove old state management** code
2. **Update imports** to use new hook
3. **Update component props** to use display properties
4. **Test persistence** functionality

### Data Migration

The system automatically handles data migration:
- **Version checking** for stored data
- **Automatic cleanup** of incompatible formats
- **Graceful fallback** for missing data

## Security Considerations

### Data Privacy
- **No sensitive data** stored in localStorage
- **User preferences only** - no personal information
- **Automatic expiration** of stored data

### XSS Protection
- **Input validation** for all stored data
- **JSON parsing safety** with error handling
- **No eval()** or dynamic code execution

## Contributing

When contributing to the sidebar state persistence system:

1. **Add tests** for new functionality
2. **Update documentation** for API changes
3. **Consider backward compatibility**
4. **Test error scenarios**
5. **Verify cross-browser support**

## Related Files

- `src/hooks/useSidebarStatePersistence.ts` - Main hook implementation
- `src/services/sidebarStateService.ts` - State management service
- `src/utils/sidebarErrorRecovery.ts` - Error recovery utilities
- `src/components/admin/AdminSidebar.tsx` - Sidebar component using the hook
- `src/hooks/__tests__/useSidebarStatePersistence.test.ts` - Test suite