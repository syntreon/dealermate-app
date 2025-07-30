# Sidebar State Persistence - Developer Guide

## Quick Start

### For New Developers

This guide will get you up to speed with the sidebar state persistence system in 10 minutes.

#### What is it?

The sidebar state persistence system automatically saves and restores the admin sidebar's state (expanded, collapsed, or expand-on-hover) across browser sessions, tabs, and page reloads.

#### Key Components

1. **Hook**: `useSidebarStatePersistence` - Main interface for components
2. **Service**: `sidebarStateService` - Advanced state management
3. **Error Recovery**: Automatic handling of storage failures
4. **Diagnostics**: Debug tools and monitoring

### Basic Implementation

```typescript
// In your sidebar component
import { useSidebarStatePersistence } from '@/hooks/useSidebarStatePersistence';

const MySidebar = () => {
  const {
    sidebarState,           // Current state
    changeSidebarMode,      // Change mode function
    displayProperties,      // Calculated display props
  } = useSidebarStatePersistence();

  return (
    <div className={`sidebar ${displayProperties.isExpanded ? 'expanded' : 'collapsed'}`}>
      <button onClick={() => changeSidebarMode('expanded')}>
        Expand
      </button>
    </div>
  );
};
```

### That's it! 

The system automatically:
- Saves state to localStorage
- Restores state on page reload
- Syncs across browser tabs
- Handles errors gracefully
- Provides smooth transitions

## For Experienced Developers

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                          │
├─────────────────────────────────────────────────────────────┤
│  useSidebarStatePersistence Hook                           │
│  ├── State Management                                       │
│  ├── Display Properties Calculation                        │
│  └── Event Handling                                        │
├─────────────────────────────────────────────────────────────┤
│  sidebarStateService                                       │
│  ├── Persistence Layer                                     │
│  ├── Cross-Tab Sync                                        │
│  ├── Analytics Tracking                                    │
│  └── Data Import/Export                                    │
├─────────────────────────────────────────────────────────────┤
│  Error Recovery System                                     │
│  ├── Automatic Error Detection                             │
│  ├── Recovery Strategies                                   │
│  ├── Health Monitoring                                     │
│  └── Diagnostic Tools                                      │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer (localStorage)                              │
│  ├── admin-sidebar-state                                   │
│  ├── admin-sidebar-preferences                             │
│  └── admin-sidebar-analytics                               │
└─────────────────────────────────────────────────────────────┘
```

### Advanced Configuration

```typescript
const {
  sidebarState,
  changeSidebarMode,
  setHoverState,
  displayProperties,
  config,
  storageAvailable,
  clearStoredState,
} = useSidebarStatePersistence({
  persistState: true,              // Enable persistence
  defaultMode: 'collapsed',        // Default mode
  transitionDuration: 300,         // Animation duration
  hoverDelay: 150,                // Hover delay for expand-on-hover
});
```

### State Management Patterns

#### 1. Mode Changes with Validation

```typescript
const handleModeChange = useCallback((newMode: SidebarMode) => {
  // Validate mode based on user permissions
  if (newMode === 'expanded' && !hasExpandPermission) {
    showError('Insufficient permissions for expanded mode');
    return;
  }

  changeSidebarMode(newMode);
  
  // Track analytics
  trackEvent('sidebar_mode_changed', { mode: newMode });
}, [changeSidebarMode, hasExpandPermission]);
```

#### 2. Conditional Hover Behavior

```typescript
const handleMouseEnter = useCallback(() => {
  if (sidebarState.mode === 'expand-on-hover' && !isModalOpen) {
    setHoverState(true);
  }
}, [sidebarState.mode, setHoverState, isModalOpen]);

const handleMouseLeave = useCallback(() => {
  if (sidebarState.mode === 'expand-on-hover') {
    // Delay collapse to prevent flickering
    setTimeout(() => setHoverState(false), config.hoverDelay);
  }
}, [sidebarState.mode, setHoverState, config.hoverDelay]);
```

#### 3. Layout Integration

```typescript
const { layoutWidth } = displayProperties;

useEffect(() => {
  // Notify layout system of width changes
  window.dispatchEvent(new CustomEvent('admin-sidebar-resize', {
    detail: { width: layoutWidth }
  }));
}, [layoutWidth]);

// In layout component
const [sidebarWidth, setSidebarWidth] = useState(64);

useEffect(() => {
  const handleResize = (event: CustomEvent<{ width: number }>) => {
    setSidebarWidth(event.detail.width);
  };

  window.addEventListener('admin-sidebar-resize', handleResize as EventListener);
  return () => window.removeEventListener('admin-sidebar-resize', handleResize as EventListener);
}, []);
```

### Error Handling Strategies

#### 1. Graceful Degradation

```typescript
import { withErrorRecovery } from '@/utils/sidebarErrorRecovery';

const saveUserPreference = async (preference: string, value: any) => {
  const result = await withErrorRecovery(
    () => sidebarStateService.savePreferences({ [preference]: value }),
    'saveUserPreference',
    false
  );

  if (!result) {
    // Fallback to in-memory storage
    inMemoryPreferences[preference] = value;
    showWarning('Preferences saved temporarily - enable localStorage for persistence');
  }
};
```

#### 2. Health Monitoring

```typescript
import { sidebarErrorRecovery } from '@/utils/sidebarErrorRecovery';

const HealthMonitor = () => {
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    const checkHealth = () => {
      const healthy = sidebarErrorRecovery.isHealthy();
      setIsHealthy(healthy);
      
      if (!healthy) {
        const recommendations = sidebarErrorRecovery.getRecoveryRecommendations();
        console.warn('Sidebar system unhealthy:', recommendations);
      }
    };

    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return isHealthy ? null : (
    <div className="health-warning">
      Sidebar system experiencing issues. <button onClick={handleReset}>Reset</button>
    </div>
  );
};
```

### Performance Optimization

#### 1. Memoization

```typescript
const displayProperties = useMemo(() => ({
  isExpanded: sidebarState.mode === 'expanded' || 
              (sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered),
  showText: sidebarState.mode === 'expanded' || 
            (sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered),
  currentWidth: sidebarState.mode === 'expanded' ? 256 : 64,
  layoutWidth: sidebarState.mode === 'expanded' ? 256 : 64,
  isOverlay: sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered,
}), [sidebarState.mode, sidebarState.isHovered]);
```

#### 2. Debounced Persistence

```typescript
const debouncedSave = useMemo(
  () => debounce((state: SidebarState) => {
    sidebarStateService.saveState(state);
  }, 300),
  []
);

useEffect(() => {
  debouncedSave(sidebarState);
}, [sidebarState, debouncedSave]);
```

### Testing Strategies

#### 1. Unit Tests

```typescript
describe('Sidebar State Persistence', () => {
  it('should persist state across sessions', async () => {
    const { result, unmount } = renderHook(() => useSidebarStatePersistence());
    
    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    unmount();

    const { result: newResult } = renderHook(() => useSidebarStatePersistence());
    
    await waitFor(() => {
      expect(newResult.current.sidebarState.mode).toBe('expanded');
    });
  });
});
```

#### 2. Integration Tests

```typescript
describe('Cross-Tab Synchronization', () => {
  it('should sync state between tabs', async () => {
    const tab1 = renderHook(() => useSidebarStatePersistence());
    const tab2 = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      tab1.result.current.changeSidebarMode('expanded');
    });

    // Simulate storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'admin-sidebar-state',
      newValue: JSON.stringify({ mode: 'expanded', timestamp: Date.now() }),
    }));

    await waitFor(() => {
      expect(tab2.result.current.sidebarState.mode).toBe('expanded');
    });
  });
});
```

#### 3. Error Scenario Tests

```typescript
describe('Error Recovery', () => {
  it('should handle localStorage quota exceeded', async () => {
    // Mock quota exceeded error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    // Should still work without persistence
    expect(result.current.sidebarState.mode).toBe('expanded');

    localStorage.setItem = originalSetItem;
  });
});
```

## Debugging Guide

### Common Issues

#### 1. State Not Persisting

**Symptoms**: Sidebar resets to default on page reload

**Diagnosis**:
```typescript
const diagnostics = sidebarStateService.getDiagnostics();
console.log('Storage available:', diagnostics.storageAvailable);
console.log('Current state:', diagnostics.currentState);
```

**Solutions**:
- Check if localStorage is available
- Verify browser settings allow localStorage
- Check for quota exceeded errors
- Ensure persistence is enabled in config

#### 2. Cross-Tab Sync Not Working

**Symptoms**: Changes in one tab don't reflect in others

**Diagnosis**:
```typescript
// Check sync listeners
const diagnostics = sidebarStateService.getDiagnostics();
console.log('Sync listeners:', diagnostics.syncListeners);

// Test storage events
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.newValue);
});
```

**Solutions**:
- Verify storage event listeners are attached
- Check if tabs are from same origin
- Ensure localStorage is not disabled

#### 3. Performance Issues

**Symptoms**: Slow sidebar transitions, high CPU usage

**Diagnosis**:
```typescript
// Monitor state changes
const originalChangeSidebarMode = changeSidebarMode;
const monitoredChangeSidebarMode = (mode) => {
  console.time('sidebar-mode-change');
  originalChangeSidebarMode(mode);
  console.timeEnd('sidebar-mode-change');
};
```

**Solutions**:
- Check for excessive re-renders
- Verify memoization is working
- Reduce transition duration
- Optimize CSS animations

### Debug Tools

#### 1. Sidebar Diagnostics Component

```typescript
import SidebarDiagnostics from '@/components/admin/SidebarDiagnostics';

// Add to development routes
<Route path="/admin/debug/sidebar" element={<SidebarDiagnostics />} />
```

#### 2. Console Commands

```typescript
// In browser console
window.sidebarDebug = {
  getDiagnostics: () => sidebarStateService.getDiagnostics(),
  getErrors: () => sidebarErrorRecovery.getErrorHistory(),
  reset: () => sidebarStateService.resetAllData(),
  export: () => sidebarStateService.exportData(),
};
```

#### 3. Performance Monitoring

```typescript
const usePerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('sidebar')) {
          console.log('Sidebar performance:', entry);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);
};
```

## Best Practices

### 1. Component Integration

```typescript
// ✅ Good: Use the hook properly
const MySidebar = () => {
  const { sidebarState, changeSidebarMode, displayProperties } = useSidebarStatePersistence();
  
  return (
    <div className={`sidebar ${displayProperties.isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Content */}
    </div>
  );
};

// ❌ Bad: Direct localStorage access
const MySidebar = () => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('sidebar-mode') || 'collapsed';
  });
  
  // This bypasses error recovery and sync
};
```

### 2. Error Handling

```typescript
// ✅ Good: Wrap critical operations
const saveCriticalSetting = async (setting) => {
  const result = await withErrorRecovery(
    () => sidebarStateService.savePreferences(setting),
    'saveCriticalSetting',
    false
  );
  
  if (!result) {
    // Handle failure appropriately
    showFallbackUI();
  }
};

// ❌ Bad: No error handling
const saveCriticalSetting = (setting) => {
  sidebarStateService.savePreferences(setting);
  // What if this fails?
};
```

### 3. Performance

```typescript
// ✅ Good: Memoize expensive calculations
const sidebarStyles = useMemo(() => ({
  width: displayProperties.currentWidth,
  transform: displayProperties.isOverlay ? 'translateX(0)' : 'none',
  zIndex: displayProperties.isOverlay ? 50 : 40,
}), [displayProperties]);

// ❌ Bad: Recalculate on every render
const sidebarStyles = {
  width: sidebarState.mode === 'expanded' ? 256 : 64,
  // Expensive calculations on every render
};
```

### 4. Testing

```typescript
// ✅ Good: Test with realistic scenarios
test('should handle storage quota exceeded', async () => {
  mockLocalStorageQuotaExceeded();
  
  const { result } = renderHook(() => useSidebarStatePersistence());
  
  await act(async () => {
    result.current.changeSidebarMode('expanded');
  });
  
  expect(result.current.sidebarState.mode).toBe('expanded');
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('quota'));
});

// ❌ Bad: Only test happy path
test('should change mode', () => {
  const { result } = renderHook(() => useSidebarStatePersistence());
  
  act(() => {
    result.current.changeSidebarMode('expanded');
  });
  
  expect(result.current.sidebarState.mode).toBe('expanded');
});
```

## Migration Checklist

### From Basic State Management

- [ ] Replace useState with useSidebarStatePersistence hook
- [ ] Remove direct localStorage calls
- [ ] Update state change handlers to use provided functions
- [ ] Add error handling for critical operations
- [ ] Test cross-tab synchronization
- [ ] Verify persistence works across sessions
- [ ] Update tests to cover error scenarios

### From Other Persistence Libraries

- [ ] Identify current persistence mechanism
- [ ] Map existing state structure to SidebarState
- [ ] Replace library calls with hook functions
- [ ] Migrate stored data using import/export functionality
- [ ] Update error handling to use recovery system
- [ ] Test migration with existing user data

## Troubleshooting Flowchart

```
State not persisting?
├── Is localStorage available?
│   ├── No → Check browser settings, use fallback
│   └── Yes → Continue
├── Is persistence enabled in config?
│   ├── No → Enable persistState: true
│   └── Yes → Continue
├── Are there storage errors?
│   ├── Yes → Check error recovery logs
│   └── No → Check data format
└── Is data being saved?
    ├── No → Check save operation
    └── Yes → Check load operation

Cross-tab sync not working?
├── Are tabs from same origin?
│   ├── No → Sync only works within same origin
│   └── Yes → Continue
├── Are storage events firing?
│   ├── No → Check event listeners
│   └── Yes → Continue
└── Are sync listeners registered?
    ├── No → Check addSyncListener calls
    └── Yes → Check listener implementation

Performance issues?
├── Are there excessive re-renders?
│   ├── Yes → Add memoization
│   └── No → Continue
├── Are transitions smooth?
│   ├── No → Check CSS animations
│   └── Yes → Continue
└── Is storage I/O blocking?
    ├── Yes → Check debouncing
    └── No → Profile other operations
```

## Quick Reference

### Hook API
```typescript
const {
  sidebarState,          // Current state
  changeSidebarMode,     // (mode: SidebarMode) => void
  setHoverState,         // (isHovered: boolean) => void
  displayProperties,     // Calculated display props
  clearStoredState,      // () => boolean
  storageAvailable,      // boolean
} = useSidebarStatePersistence(config?);
```

### Service API
```typescript
sidebarStateService.saveState(state)           // Save state
sidebarStateService.loadState()               // Load state
sidebarStateService.getPreferences()          // Get preferences
sidebarStateService.getAnalytics()            // Get analytics
sidebarStateService.addSyncListener(fn)       // Add sync listener
sidebarStateService.getDiagnostics()          // Get diagnostics
sidebarStateService.resetAllData()            // Reset all data
```

### Error Recovery
```typescript
withErrorRecovery(operation, name, fallback)  // Wrap operations
sidebarErrorRecovery.isHealthy()              // Check health
sidebarErrorRecovery.getErrorHistory()        // Get errors
sidebarErrorRecovery.getRecoveryRecommendations() // Get recommendations
```