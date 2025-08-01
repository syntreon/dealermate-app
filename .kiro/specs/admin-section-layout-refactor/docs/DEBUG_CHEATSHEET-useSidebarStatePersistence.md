# Sidebar State Persistence - Debug Cheatsheet

## Quick Debug Commands

### 🔍 Instant Diagnostics

```javascript
// Get complete system status
const diagnostics = sidebarStateService.getDiagnostics();
console.table(diagnostics);

// Check error history
const errors = sidebarErrorRecovery.getErrorHistory();
console.log('Recent errors:', errors);

// Verify localStorage data
console.log('Stored state:', localStorage.getItem('admin-sidebar-state'));
console.log('All sidebar keys:', Object.keys(localStorage).filter(k => k.includes('sidebar')));
```

### 🚨 Emergency Reset

```javascript
// Nuclear option - reset everything
sidebarStateService.resetAllData();
window.location.reload();

// Soft reset - clear state only
sidebarStateService.clearState();

// Clear error history
sidebarErrorRecovery.clearErrorHistory();
```

### 📊 Performance Check

```javascript
// Monitor render frequency
let renderCount = 0;
const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('sidebar')) {
    renderCount++;
    originalLog(`[${renderCount}]`, ...args);
  } else {
    originalLog(...args);
  }
};
```

## Common Issues & Solutions

### ❌ Issue: State Not Persisting

**Quick Check:**
```javascript
// 1. Storage availability
console.log('Storage available:', typeof Storage !== 'undefined');

// 2. Check for errors
sidebarErrorRecovery.getErrorHistory().forEach(error => 
  console.error(`${error.type}: ${error.message}`)
);

// 3. Test manual save
sidebarStateService.saveState({ mode: 'expanded', isHovered: false, width: 256, isTransitioning: false });
```

**Solutions:**
- **Browser Privacy Mode**: Disable private browsing
- **Storage Quota**: Clear browser data or use `sidebarStateService.resetAllData()`
- **Ad Blockers**: Whitelist domain or disable temporarily
- **CORS Issues**: Ensure same-origin policy compliance

### ❌ Issue: Cross-Tab Sync Broken

**Quick Check:**
```javascript
// 1. Test storage events
window.addEventListener('storage', e => console.log('Storage event:', e));

// 2. Manual trigger test
localStorage.setItem('test-sync', Date.now().toString());

// 3. Check sync listeners
console.log('Active sync listeners:', sidebarStateService.getDiagnostics().syncListeners);
```

**Solutions:**
- **Same Origin**: Ensure all tabs are on same domain/port
- **Browser Support**: Test in different browser
- **Event Conflicts**: Check for other storage event listeners
- **Timing Issues**: Add delays between operations

### ❌ Issue: Performance Problems

**Quick Check:**
```javascript
// 1. Monitor state changes
let stateChangeCount = 0;
const originalSetState = React.useState;
React.useState = (initial) => {
  const [state, setState] = originalSetState(initial);
  return [state, (newState) => {
    stateChangeCount++;
    console.log(`State change #${stateChangeCount}:`, newState);
    setState(newState);
  }];
};

// 2. Check localStorage operations
let storageOps = 0;
const originalSetItem = localStorage.setItem;
localStorage.setItem = (key, value) => {
  if (key.includes('sidebar')) {
    storageOps++;
    console.log(`Storage op #${storageOps}:`, key);
  }
  return originalSetItem.call(localStorage, key, value);
};
```

**Solutions:**
- **Excessive Re-renders**: Add `React.memo()` and `useMemo()`
- **Storage Spam**: Implement debouncing
- **Memory Leaks**: Check event listener cleanup
- **Large Data**: Clear old analytics data

### ❌ Issue: Hover State Stuck

**Quick Check:**
```javascript
// 1. Check current state
const { sidebarState } = useSidebarStatePersistence();
console.log('Current state:', sidebarState);

// 2. Force reset hover
const { setHoverState } = useSidebarStatePersistence();
setHoverState(false);

// 3. Check event listeners
console.log('Mouse events:', document.getEventListeners?.(document));
```

**Solutions:**
- **Event Cleanup**: Ensure `mouseenter`/`mouseleave` are balanced
- **Timeout Issues**: Clear any pending hover timeouts
- **State Conflicts**: Reset to collapsed mode first
- **CSS Issues**: Check for `pointer-events: none`

## Debug Tools & Utilities

### 🛠️ Debug Panel Component

```javascript
// Add this to your component for live debugging
const SidebarDebugPanel = () => {
  const hookData = useSidebarStatePersistence();
  const [showDebug, setShowDebug] = useState(false);
  
  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}
      >
        🐛 Debug
      </button>
    );
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 50, 
      right: 10, 
      background: 'white', 
      border: '1px solid #ccc',
      padding: 20,
      maxWidth: 400,
      maxHeight: 600,
      overflow: 'auto',
      zIndex: 9999
    }}>
      <button onClick={() => setShowDebug(false)}>❌ Close</button>
      <h3>Sidebar Debug Info</h3>
      <pre style={{ fontSize: 12 }}>
        {JSON.stringify({
          hookData: {
            mode: hookData.sidebarState.mode,
            isHovered: hookData.sidebarState.isHovered,
            width: hookData.sidebarState.width,
            storageAvailable: hookData.storageAvailable
          },
          diagnostics: sidebarStateService.getDiagnostics(),
          errors: sidebarErrorRecovery.getErrorHistory().slice(0, 3)
        }, null, 2)}
      </pre>
    </div>
  );
};
```

### 🔧 Console Utilities

```javascript
// Add these to browser console for debugging
window.sidebarDebug = {
  // Get current state
  getState: () => sidebarStateService.loadState(),
  
  // Force state change
  setState: (mode) => sidebarStateService.saveState({ 
    mode, isHovered: false, width: mode === 'expanded' ? 256 : 64, isTransitioning: false 
  }),
  
  // Clear everything
  reset: () => sidebarStateService.resetAllData(),
  
  // Export data for support
  export: () => sidebarStateService.exportData(),
  
  // Test cross-tab sync
  testSync: () => {
    const testData = { mode: 'expanded', timestamp: Date.now() };
    localStorage.setItem('admin-sidebar-state', JSON.stringify(testData));
  },
  
  // Monitor events
  monitor: () => {
    ['storage', 'admin-sidebar-resize'].forEach(event => {
      window.addEventListener(event, (e) => {
        console.log(`[${event}]`, e.detail || e.newValue);
      });
    });
  }
};

// Usage: sidebarDebug.getState()
```

### 📱 Mobile Debug

```javascript
// Mobile-specific debugging
const mobileDebug = {
  // Check touch events
  logTouches: () => {
    ['touchstart', 'touchmove', 'touchend'].forEach(event => {
      document.addEventListener(event, (e) => {
        console.log(`[${event}]`, {
          touches: e.touches.length,
          clientX: e.touches[0]?.clientX,
          target: e.target.tagName
        });
      });
    });
  },
  
  // Check viewport
  checkViewport: () => {
    console.log('Viewport:', {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768
    });
  },
  
  // Test drawer
  testDrawer: () => {
    const event = new TouchEvent('touchstart', {
      touches: [{ clientX: 10, clientY: 100 }]
    });
    document.dispatchEvent(event);
  }
};
```

## Browser-Specific Issues

### 🌐 Chrome/Chromium

**Common Issues:**
- Storage quota in incognito mode
- DevTools affecting performance
- Extension conflicts

**Debug Commands:**
```javascript
// Check storage quota
navigator.storage.estimate().then(estimate => {
  console.log('Storage quota:', estimate);
});

// Check extensions
console.log('Extensions affecting storage:', 
  chrome.runtime?.getManifest?.() ? 'Yes' : 'No'
);
```

### 🦊 Firefox

**Common Issues:**
- Strict privacy settings
- Storage events timing
- CSS transition conflicts

**Debug Commands:**
```javascript
// Check privacy settings
console.log('Storage allowed:', 
  typeof Storage !== 'undefined' && 
  localStorage.getItem('test') !== null
);

// Test storage events
setTimeout(() => {
  localStorage.setItem('test-event', 'test');
}, 100);
```

### 🧭 Safari

**Common Issues:**
- Private browsing detection
- Storage size limits
- Touch event handling

**Debug Commands:**
```javascript
// Check private browsing
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('Private browsing:', false);
} catch (e) {
  console.log('Private browsing:', true);
}

// Check touch support
console.log('Touch support:', 'ontouchstart' in window);
```

## Performance Debugging

### 📊 Render Performance

```javascript
// Monitor component renders
const RenderCounter = ({ name }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  useEffect(() => {
    console.log(`${name} rendered ${renderCount.current} times`);
  });
  
  return null;
};

// Usage: <RenderCounter name="AdminSidebar" />
```

### 💾 Memory Usage

```javascript
// Monitor memory usage
const memoryMonitor = {
  start: () => {
    setInterval(() => {
      if (performance.memory) {
        console.log('Memory usage:', {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }
    }, 5000);
  }
};

memoryMonitor.start();
```

### ⚡ Storage Performance

```javascript
// Benchmark storage operations
const storagePerf = {
  test: () => {
    const iterations = 1000;
    const testData = JSON.stringify({ mode: 'expanded', timestamp: Date.now() });
    
    console.time('localStorage-write');
    for (let i = 0; i < iterations; i++) {
      localStorage.setItem(`test-${i}`, testData);
    }
    console.timeEnd('localStorage-write');
    
    console.time('localStorage-read');
    for (let i = 0; i < iterations; i++) {
      localStorage.getItem(`test-${i}`);
    }
    console.timeEnd('localStorage-read');
    
    // Cleanup
    for (let i = 0; i < iterations; i++) {
      localStorage.removeItem(`test-${i}`);
    }
  }
};

storagePerf.test();
```

## Testing Scenarios

### 🧪 Manual Test Cases

```javascript
// Test suite for manual verification
const manualTests = {
  // Test 1: Basic persistence
  testPersistence: () => {
    console.log('🧪 Testing persistence...');
    sidebarStateService.saveState({ mode: 'expanded', isHovered: false, width: 256, isTransitioning: false });
    const loaded = sidebarStateService.loadState();
    console.log('✅ Persistence:', loaded?.mode === 'expanded' ? 'PASS' : 'FAIL');
  },
  
  // Test 2: Error recovery
  testErrorRecovery: () => {
    console.log('🧪 Testing error recovery...');
    localStorage.setItem('admin-sidebar-state', 'invalid-json');
    const loaded = sidebarStateService.loadState();
    console.log('✅ Error recovery:', loaded === null ? 'PASS' : 'FAIL');
  },
  
  // Test 3: Cross-tab sync
  testCrossTab: () => {
    console.log('🧪 Testing cross-tab sync...');
    console.log('Open another tab and run: localStorage.setItem("admin-sidebar-state", JSON.stringify({mode:"expanded"}))');
    window.addEventListener('storage', (e) => {
      if (e.key === 'admin-sidebar-state') {
        console.log('✅ Cross-tab sync: PASS');
      }
    });
  },
  
  // Run all tests
  runAll: () => {
    Object.keys(manualTests).forEach(test => {
      if (test !== 'runAll') {
        manualTests[test]();
      }
    });
  }
};

// Usage: manualTests.runAll()
```

### 🔄 Automated Test Helpers

```javascript
// Helpers for automated testing
const testHelpers = {
  // Mock localStorage
  mockStorage: (shouldFail = false) => {
    const storage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key) => shouldFail ? null : storage[key] || null,
        setItem: (key, value) => {
          if (shouldFail) throw new Error('Storage failed');
          storage[key] = value;
        },
        removeItem: (key) => delete storage[key],
        clear: () => Object.keys(storage).forEach(key => delete storage[key])
      }
    });
  },
  
  // Wait for async operations
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },
  
  // Simulate user interactions
  simulateHover: (element) => {
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    return () => element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }
};
```

## Emergency Procedures

### 🚨 Critical Issues

**User Can't Access Admin Panel:**
```javascript
// 1. Check authentication
console.log('User:', useAuth().user);

// 2. Reset sidebar state
sidebarStateService.resetAllData();

// 3. Clear all storage
Object.keys(localStorage).forEach(key => {
  if (key.includes('sidebar') || key.includes('admin')) {
    localStorage.removeItem(key);
  }
});

// 4. Force reload
window.location.reload();
```

**Infinite Re-render Loop:**
```javascript
// 1. Stop React DevTools
// 2. Open console and run:
React.unstable_batchedUpdates = () => {};

// 3. Or disable the hook temporarily:
window.DISABLE_SIDEBAR_PERSISTENCE = true;
```

**Storage Quota Exceeded:**
```javascript
// 1. Clear all sidebar data
sidebarStateService.resetAllData();

// 2. Clear other app data
Object.keys(localStorage).forEach(key => {
  if (!key.includes('auth')) { // Keep auth data
    localStorage.removeItem(key);
  }
});

// 3. Check quota
navigator.storage.estimate().then(console.log);
```

### 📞 Support Information

When reporting issues, include this debug info:

```javascript
// Generate support report
const supportReport = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
  viewport: { width: window.innerWidth, height: window.innerHeight },
  storage: {
    available: typeof Storage !== 'undefined',
    quota: navigator.storage?.estimate?.(),
    data: sidebarStateService.exportData()
  },
  errors: sidebarErrorRecovery.exportErrorData(),
  diagnostics: sidebarStateService.getDiagnostics(),
  performance: performance.memory ? {
    used: performance.memory.usedJSHeapSize,
    total: performance.memory.totalJSHeapSize,
    limit: performance.memory.jsHeapSizeLimit
  } : null
};

console.log('Support Report:', JSON.stringify(supportReport, null, 2));
```

## Quick Reference

### 🔑 Key Functions

| Function | Purpose | Usage |
|----------|---------|-------|
| `sidebarStateService.getDiagnostics()` | System status | Debug info |
| `sidebarErrorRecovery.getErrorHistory()` | Error log | Troubleshooting |
| `sidebarStateService.resetAllData()` | Nuclear reset | Emergency |
| `localStorage.getItem('admin-sidebar-state')` | Raw data | Inspection |
| `window.sidebarDebug.monitor()` | Event monitoring | Real-time debug |

### 🎯 Common Patterns

```javascript
// Check if working
const isWorking = () => {
  const state = sidebarStateService.loadState();
  return state !== null && typeof state.mode === 'string';
};

// Force specific mode
const forceMode = (mode) => {
  sidebarStateService.saveState({ 
    mode, isHovered: false, width: mode === 'expanded' ? 256 : 64, isTransitioning: false 
  });
  window.location.reload();
};

// Monitor changes
const monitorChanges = () => {
  let lastState = sidebarStateService.loadState();
  setInterval(() => {
    const currentState = sidebarStateService.loadState();
    if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
      console.log('State changed:', currentState);
      lastState = currentState;
    }
  }, 1000);
};
```