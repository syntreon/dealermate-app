# Sidebar State Persistence - Debug Cheatsheet

## Quick Diagnostics

### 🔍 Check System Status
```javascript
// In browser console
const diagnostics = window.sidebarStateService?.getDiagnostics();
console.table(diagnostics);
```

### 🏥 Health Check
```javascript
const isHealthy = window.sidebarErrorRecovery?.isHealthy();
console.log('System healthy:', isHealthy);

if (!isHealthy) {
  const recommendations = window.sidebarErrorRecovery?.getRecoveryRecommendations();
  console.log('Recommendations:', recommendations);
}
```

### 📊 View Current State
```javascript
const state = JSON.parse(localStorage.getItem('admin-sidebar-state') || '{}');
console.log('Stored state:', state);
```

## Common Issues & Solutions

### ❌ State Not Persisting

**Quick Check:**
```javascript
// Test localStorage
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('✅ localStorage available');
} catch (e) {
  console.log('❌ localStorage unavailable:', e.message);
}
```

**Solutions:**
1. Check browser settings (incognito mode, disabled storage)
2. Clear storage quota: `localStorage.clear()`
3. Check for corrupted data: `JSON.parse(localStorage.getItem('admin-sidebar-state'))`

### ❌ Cross-Tab Sync Not Working

**Quick Check:**
```javascript
// Test storage events
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.newValue);
});

// Trigger from another tab
localStorage.setItem('test-sync', Date.now().toString());
```

**Solutions:**
1. Ensure tabs are same origin
2. Check if sync listeners are registered
3. Verify storage events are firing

### ❌ Performance Issues

**Quick Check:**
```javascript
// Monitor state changes
console.time('sidebar-operation');
// Perform sidebar operation
console.timeEnd('sidebar-operation');

// Check for memory leaks
console.log('Event listeners:', getEventListeners(window));
```

**Solutions:**
1. Reduce transition duration
2. Check for excessive re-renders
3. Verify cleanup functions are called

## Debug Commands

### 🛠️ Reset Everything
```javascript
// Nuclear option - clears all sidebar data
window.sidebarStateService?.resetAllData();
location.reload();
```

### 📤 Export Data
```javascript
// Export for analysis
const data = window.sidebarStateService?.exportData();
console.log(data);

// Download as file
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'sidebar-debug.json';
a.click();
```

### 📥 Import Data
```javascript
// Import debug data
const jsonData = '{"state":{"mode":"expanded"},"preferences":{},"analytics":{}}';
const success = window.sidebarStateService?.importData(jsonData);
console.log('Import success:', success);
```

### 🔄 Force Sync
```javascript
// Manually trigger cross-tab sync
const state = { mode: 'expanded', timestamp: Date.now() };
localStorage.setItem('admin-sidebar-state', JSON.stringify(state));
window.dispatchEvent(new StorageEvent('storage', {
  key: 'admin-sidebar-state',
  newValue: JSON.stringify(state)
}));
```

## Error Analysis

### 📋 View Error History
```javascript
const errors = window.sidebarErrorRecovery?.getErrorHistory();
console.table(errors);

// Filter recent errors
const recentErrors = errors?.filter(e => Date.now() - e.timestamp < 300000); // 5 min
console.log('Recent errors:', recentErrors);
```

### 🔍 Analyze Error Patterns
```javascript
const errors = window.sidebarErrorRecovery?.getErrorHistory() || [];
const errorTypes = errors.reduce((acc, error) => {
  acc[error.type] = (acc[error.type] || 0) + 1;
  return acc;
}, {});
console.log('Error frequency:', errorTypes);
```

### 🧹 Clear Error History
```javascript
window.sidebarErrorRecovery?.clearErrorHistory();
console.log('Error history cleared');
```

## Performance Debugging

### ⏱️ Measure Operations
```javascript
// Wrap operations with timing
const originalChangeSidebarMode = changeSidebarMode;
const timedChangeSidebarMode = (mode) => {
  console.time(`changeSidebarMode-${mode}`);
  originalChangeSidebarMode(mode);
  console.timeEnd(`changeSidebarMode-${mode}`);
};
```

### 🔍 Monitor Re-renders
```javascript
// Add to component
useEffect(() => {
  console.log('Sidebar component re-rendered');
});

// Check render count
let renderCount = 0;
const originalRender = React.createElement;
React.createElement = (...args) => {
  if (args[0]?.name?.includes('Sidebar')) {
    renderCount++;
    console.log('Sidebar renders:', renderCount);
  }
  return originalRender(...args);
};
```

### 📊 Memory Usage
```javascript
// Check memory usage
if (performance.memory) {
  console.log('Memory usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
  });
}
```

## Storage Debugging

### 📦 Inspect Storage
```javascript
// View all sidebar-related storage
Object.keys(localStorage)
  .filter(key => key.includes('sidebar'))
  .forEach(key => {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  });
```

### 🧮 Storage Size
```javascript
// Calculate storage usage
const calculateStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return Math.round(total / 1024) + ' KB';
};
console.log('localStorage usage:', calculateStorageSize());
```

### 🗑️ Clean Storage
```javascript
// Remove old/corrupted entries
Object.keys(localStorage)
  .filter(key => key.includes('sidebar'))
  .forEach(key => {
    try {
      JSON.parse(localStorage.getItem(key));
    } catch (e) {
      console.log('Removing corrupted key:', key);
      localStorage.removeItem(key);
    }
  });
```

## Component Debugging

### 🔍 Hook State
```javascript
// Add to component using the hook
const hookState = useSidebarStatePersistence();
console.log('Hook state:', hookState);

// Monitor state changes
useEffect(() => {
  console.log('Sidebar state changed:', hookState.sidebarState);
}, [hookState.sidebarState]);
```

### 🎯 Event Debugging
```javascript
// Monitor all sidebar-related events
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
  if (type.includes('sidebar') || type === 'storage') {
    console.log('Event listener added:', type);
  }
  return originalAddEventListener.call(this, type, listener, options);
};
```

### 🔄 State Transitions
```javascript
// Log all state transitions
const originalSetState = useState;
useState = (initial) => {
  const [state, setState] = originalSetState(initial);
  
  const loggedSetState = (newState) => {
    console.log('State transition:', state, '->', newState);
    setState(newState);
  };
  
  return [state, loggedSetState];
};
```

## Network & Sync Debugging

### 🌐 Cross-Tab Communication
```javascript
// Test cross-tab messaging
const testCrossTab = () => {
  const channel = new BroadcastChannel('sidebar-debug');
  
  channel.postMessage({ type: 'test', timestamp: Date.now() });
  
  channel.onmessage = (event) => {
    console.log('Cross-tab message:', event.data);
  };
  
  setTimeout(() => channel.close(), 5000);
};
testCrossTab();
```

### 📡 Storage Events
```javascript
// Monitor all storage events
window.addEventListener('storage', (e) => {
  console.log('Storage event:', {
    key: e.key,
    oldValue: e.oldValue,
    newValue: e.newValue,
    url: e.url
  });
});
```

## Quick Fixes

### 🚀 Emergency Reset
```javascript
// Complete reset and reload
const emergencyReset = () => {
  // Clear all sidebar data
  Object.keys(localStorage)
    .filter(key => key.includes('sidebar'))
    .forEach(key => localStorage.removeItem(key));
  
  // Clear session storage
  Object.keys(sessionStorage)
    .filter(key => key.includes('sidebar'))
    .forEach(key => sessionStorage.removeItem(key));
  
  // Reload page
  location.reload();
};

// Use with caution!
// emergencyReset();
```

### 🔧 Force Default State
```javascript
// Set to default state
const forceDefault = () => {
  const defaultState = {
    mode: 'collapsed',
    timestamp: Date.now(),
    version: '1.0'
  };
  
  localStorage.setItem('admin-sidebar-state', JSON.stringify(defaultState));
  location.reload();
};
```

### 🎯 Test Specific Mode
```javascript
// Force specific mode for testing
const testMode = (mode) => {
  const testState = {
    mode: mode,
    timestamp: Date.now(),
    version: '1.0'
  };
  
  localStorage.setItem('admin-sidebar-state', JSON.stringify(testState));
  location.reload();
};

// testMode('expanded');
// testMode('collapsed');
// testMode('expand-on-hover');
```

## Browser-Specific Issues

### 🔍 Safari Private Mode
```javascript
// Check if in Safari private mode
const isPrivateMode = () => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return false;
  } catch (e) {
    return e.code === 22; // QuotaExceededError in Safari private mode
  }
};
console.log('Private mode:', isPrivateMode());
```

### 🔍 Firefox Storage Disabled
```javascript
// Check Firefox storage settings
const checkFirefoxStorage = () => {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
};
console.log('Firefox storage available:', checkFirefoxStorage());
```

### 🔍 Chrome Incognito
```javascript
// Detect Chrome incognito mode
const isChromeIncognito = () => {
  return new Promise((resolve) => {
    if ('webkitRequestFileSystem' in window) {
      webkitRequestFileSystem(0, 0, () => resolve(false), () => resolve(true));
    } else {
      resolve(false);
    }
  });
};

isChromeIncognito().then(isIncognito => {
  console.log('Chrome incognito:', isIncognito);
});
```

## Environment Setup

### 🛠️ Development Console
```javascript
// Add debug utilities to window
window.sidebarDebug = {
  // Quick access to services
  service: window.sidebarStateService,
  recovery: window.sidebarErrorRecovery,
  
  // Utility functions
  reset: () => window.sidebarStateService?.resetAllData(),
  export: () => window.sidebarStateService?.exportData(),
  health: () => window.sidebarErrorRecovery?.isHealthy(),
  errors: () => window.sidebarErrorRecovery?.getErrorHistory(),
  
  // Test functions
  testMode: (mode) => {
    const state = { mode, timestamp: Date.now(), version: '1.0' };
    localStorage.setItem('admin-sidebar-state', JSON.stringify(state));
    location.reload();
  },
  
  // Storage utilities
  clearStorage: () => {
    Object.keys(localStorage)
      .filter(key => key.includes('sidebar'))
      .forEach(key => localStorage.removeItem(key));
  },
  
  // Performance monitoring
  monitor: () => {
    console.log('Starting performance monitoring...');
    // Add performance monitoring code
  }
};

console.log('Sidebar debug utilities available at window.sidebarDebug');
```

## Automated Testing

### 🧪 Quick Test Suite
```javascript
const runQuickTests = () => {
  const tests = [
    {
      name: 'localStorage available',
      test: () => {
        localStorage.setItem('test', 'test');
        const result = localStorage.getItem('test') === 'test';
        localStorage.removeItem('test');
        return result;
      }
    },
    {
      name: 'State persistence',
      test: () => {
        const state = { mode: 'expanded', timestamp: Date.now() };
        localStorage.setItem('admin-sidebar-state', JSON.stringify(state));
        const retrieved = JSON.parse(localStorage.getItem('admin-sidebar-state'));
        return retrieved.mode === 'expanded';
      }
    },
    {
      name: 'Error recovery available',
      test: () => typeof window.sidebarErrorRecovery?.isHealthy === 'function'
    },
    {
      name: 'Service available',
      test: () => typeof window.sidebarStateService?.getDiagnostics === 'function'
    }
  ];
  
  tests.forEach(({ name, test }) => {
    try {
      const result = test();
      console.log(`${result ? '✅' : '❌'} ${name}`);
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  });
};

// Run tests
runQuickTests();
```

## Emergency Contacts

### 🆘 When All Else Fails

1. **Clear everything**: `window.sidebarDebug?.reset()`
2. **Export data first**: `window.sidebarDebug?.export()`
3. **Check browser console** for error messages
4. **Try incognito mode** to isolate storage issues
5. **Check browser settings** for storage permissions
6. **Report issue** with exported debug data

### 📞 Debug Information to Collect

```javascript
const collectDebugInfo = () => {
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: location.href,
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    diagnostics: window.sidebarStateService?.getDiagnostics(),
    errors: window.sidebarErrorRecovery?.getErrorHistory(),
    storageSize: Object.keys(localStorage).length,
    sidebarKeys: Object.keys(localStorage).filter(k => k.includes('sidebar'))
  };
};

// Copy this output when reporting issues
console.log(JSON.stringify(collectDebugInfo(), null, 2));
```