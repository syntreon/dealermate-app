# Sidebar State Persistence - Troubleshooting Flow

## Visual Problem-Solving Guide

### 🔍 Initial Diagnosis Flow

```mermaid
flowchart TD
    A[Sidebar Issue Reported] --> B{Is sidebar visible?}
    B -->|No| C[Check AdminSidebar import]
    B -->|Yes| D{Does state persist?}
    
    C --> C1[Verify component is rendered]
    C1 --> C2[Check routing configuration]
    C2 --> C3[Verify user permissions]
    
    D -->|No| E[Storage Issue Path]
    D -->|Yes| F{Cross-tab sync working?}
    
    F -->|No| G[Sync Issue Path]
    F -->|Yes| H{Performance problems?}
    
    H -->|Yes| I[Performance Issue Path]
    H -->|No| J[Advanced Debugging]
    
    E --> E1[Check localStorage availability]
    G --> G1[Check storage events]
    I --> I1[Profile render performance]
```

### 🚨 Emergency Triage

```mermaid
flowchart LR
    A[Critical Issue] --> B{User can access admin?}
    B -->|No| C[🔴 CRITICAL]
    B -->|Yes| D{Functionality broken?}
    D -->|Yes| E[🟡 HIGH]
    D -->|No| F{Performance impact?}
    F -->|Yes| G[🟢 MEDIUM]
    F -->|No| H[🔵 LOW]
    
    C --> C1[Reset all data immediately]
    E --> E1[Isolate and fix specific feature]
    G --> G1[Optimize performance]
    H --> H1[Schedule for next sprint]
```

## Issue Categories & Solutions

### 📱 Category 1: State Persistence Issues

#### Problem: Sidebar resets on page reload

```mermaid
flowchart TD
    A[State not persisting] --> B{localStorage available?}
    B -->|No| C[Browser privacy mode?]
    B -->|Yes| D{Data being saved?}
    
    C -->|Yes| C1[Disable private browsing]
    C -->|No| C2[Check browser settings]
    
    D -->|No| E{Errors in console?}
    D -->|Yes| F{Data corrupted?}
    
    E -->|Yes| E1[Check error recovery]
    E -->|No| E2[Debug save function]
    
    F -->|Yes| F1[Clear corrupted data]
    F -->|No| F2[Check data expiration]
```

**Quick Fix Commands:**
```javascript
// 1. Check storage availability
console.log('Storage test:', (() => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return 'Available';
  } catch (e) {
    return 'Blocked: ' + e.message;
  }
})());

// 2. Reset if corrupted
if (localStorage.getItem('admin-sidebar-state')?.includes('undefined')) {
  sidebarStateService.resetAllData();
  location.reload();
}

// 3. Force save test
sidebarStateService.saveState({ 
  mode: 'expanded', 
  isHovered: false, 
  width: 256, 
  isTransitioning: false 
});
```

#### Problem: Data corruption

```mermaid
flowchart TD
    A[Corrupted data detected] --> B[Clear corrupted data]
    B --> C[Reset to defaults]
    C --> D[Verify recovery]
    D --> E{Working now?}
    E -->|Yes| F[Monitor for recurrence]
    E -->|No| G[Check browser compatibility]
    F --> H[Log incident]
    G --> I[Try different browser]
```

**Recovery Script:**
```javascript
// Automated corruption recovery
const recoverFromCorruption = () => {
  console.log('🔧 Starting corruption recovery...');
  
  // 1. Backup current data
  const backup = localStorage.getItem('admin-sidebar-state');
  console.log('Backup created:', backup);
  
  // 2. Clear corrupted data
  sidebarStateService.resetAllData();
  
  // 3. Verify clean state
  const cleanState = sidebarStateService.loadState();
  console.log('Clean state:', cleanState);
  
  // 4. Test save/load cycle
  sidebarStateService.saveState({ 
    mode: 'collapsed', 
    isHovered: false, 
    width: 64, 
    isTransitioning: false 
  });
  
  const testLoad = sidebarStateService.loadState();
  console.log('✅ Recovery complete:', testLoad?.mode === 'collapsed');
  
  return testLoad?.mode === 'collapsed';
};
```

### 🔄 Category 2: Cross-Tab Synchronization Issues

#### Problem: Changes don't sync between tabs

```mermaid
flowchart TD
    A[Cross-tab sync broken] --> B{Same origin?}
    B -->|No| C[Check domain/port consistency]
    B -->|Yes| D{Storage events firing?}
    
    D -->|No| E[Browser compatibility issue]
    D -->|Yes| F{Event listeners active?}
    
    E --> E1[Test in different browser]
    F -->|No| F1[Re-register listeners]
    F -->|Yes| G[Check event data format]
    
    C --> C1[Ensure all tabs same URL]
    E1 --> E2[Check browser support table]
    F1 --> F2[Verify cleanup on unmount]
    G --> G1[Validate JSON structure]
```

**Sync Test Suite:**
```javascript
// Comprehensive sync testing
const testCrossTabSync = () => {
  console.log('🔄 Testing cross-tab synchronization...');
  
  // 1. Test storage event detection
  let eventReceived = false;
  const testListener = (e) => {
    if (e.key === 'sync-test') {
      eventReceived = true;
      console.log('✅ Storage event received');
    }
  };
  
  window.addEventListener('storage', testListener);
  
  // 2. Trigger event from same tab (should not fire)
  localStorage.setItem('sync-test', Date.now().toString());
  
  setTimeout(() => {
    console.log('Same-tab event (should be false):', eventReceived);
    
    // 3. Instructions for manual test
    console.log('📋 Manual test: Open another tab and run:');
    console.log('localStorage.setItem("sync-test", "' + Date.now() + '")');
    
    // 4. Cleanup
    setTimeout(() => {
      window.removeEventListener('storage', testListener);
      localStorage.removeItem('sync-test');
    }, 10000);
  }, 1000);
};

// Run test
testCrossTabSync();
```

#### Problem: Sync conflicts

```mermaid
flowchart TD
    A[Sync conflicts detected] --> B[Identify conflict source]
    B --> C{Multiple rapid changes?}
    C -->|Yes| D[Implement debouncing]
    C -->|No| E{Timestamp conflicts?}
    E -->|Yes| F[Use last-write-wins strategy]
    E -->|No| G[Check for race conditions]
    
    D --> D1[Add 300ms debounce]
    F --> F1[Compare timestamps]
    G --> G1[Add mutex/locking]
```

### ⚡ Category 3: Performance Issues

#### Problem: Excessive re-renders

```mermaid
flowchart TD
    A[Performance degradation] --> B[Profile component renders]
    B --> C{Excessive re-renders?}
    C -->|Yes| D[Check memoization]
    C -->|No| E{Memory leaks?}
    
    D --> D1[Add React.memo]
    D --> D2[Add useMemo/useCallback]
    
    E -->|Yes| F[Check event listener cleanup]
    E -->|No| G[Profile storage operations]
    
    F --> F1[Verify useEffect cleanup]
    G --> G1[Add operation debouncing]
```

**Performance Profiler:**
```javascript
// Performance monitoring setup
const performanceProfiler = {
  renderCount: 0,
  storageOps: 0,
  startTime: Date.now(),
  
  start() {
    console.log('📊 Starting performance profiling...');
    
    // Monitor renders
    const originalUseState = React.useState;
    React.useState = function(initial) {
      const result = originalUseState(initial);
      performanceProfiler.renderCount++;
      return result;
    };
    
    // Monitor storage operations
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      if (key.includes('sidebar')) {
        performanceProfiler.storageOps++;
      }
      return originalSetItem.call(this, key, value);
    };
    
    // Report every 5 seconds
    this.interval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      console.log(`📈 Performance Report (${elapsed}s):`, {
        renders: this.renderCount,
        storageOps: this.storageOps,
        rendersPerSecond: (this.renderCount / elapsed).toFixed(2),
        storageOpsPerSecond: (this.storageOps / elapsed).toFixed(2)
      });
    }, 5000);
  },
  
  stop() {
    clearInterval(this.interval);
    console.log('📊 Performance profiling stopped');
  }
};

// Usage
performanceProfiler.start();
// ... test your app ...
// performanceProfiler.stop();
```

### 🎯 Category 4: Mobile-Specific Issues

#### Problem: Touch events not working

```mermaid
flowchart TD
    A[Touch events broken] --> B{Touch support detected?}
    B -->|No| C[Fallback to mouse events]
    B -->|Yes| D{Events firing?}
    
    D -->|No| E[Check event listeners]
    D -->|Yes| F{Gesture recognition working?}
    
    E --> E1[Verify touch event binding]
    F -->|No| F1[Check swipe thresholds]
    F -->|Yes| G[Check preventDefault calls]
    
    C --> C1[Add mouse event handlers]
    E1 --> E2[Check passive event listeners]
    F1 --> F2[Adjust sensitivity settings]
    G --> G1[Review event propagation]
```

**Mobile Debug Suite:**
```javascript
// Mobile-specific debugging
const mobileDebugger = {
  testTouchSupport() {
    console.log('📱 Touch Support Test:');
    console.log('- Touch events:', 'ontouchstart' in window);
    console.log('- Pointer events:', 'onpointerdown' in window);
    console.log('- MSPointer events:', 'onmspointerdown' in window);
    console.log('- User agent:', navigator.userAgent);
  },
  
  monitorTouchEvents() {
    console.log('👆 Monitoring touch events...');
    
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(event => {
      document.addEventListener(event, (e) => {
        console.log(`[${event}]`, {
          touches: e.touches.length,
          changedTouches: e.changedTouches.length,
          target: e.target.tagName,
          clientX: e.touches[0]?.clientX,
          clientY: e.touches[0]?.clientY
        });
      }, { passive: true });
    });
  },
  
  testSwipeGesture() {
    console.log('👈 Testing swipe gesture...');
    
    let startX = 0;
    let startTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startTime = Date.now();
    });
    
    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endTime = Date.now();
      const distance = endX - startX;
      const duration = endTime - startTime;
      
      console.log('Swipe detected:', {
        distance,
        duration,
        velocity: distance / duration,
        direction: distance > 0 ? 'right' : 'left'
      });
    });
  }
};

// Run mobile tests
mobileDebugger.testTouchSupport();
mobileDebugger.monitorTouchEvents();
mobileDebugger.testSwipeGesture();
```

## Decision Trees

### 🌳 Main Troubleshooting Decision Tree

```mermaid
flowchart TD
    A[Sidebar Issue] --> B{What type of issue?}
    
    B -->|Not visible| C[Visibility Issues]
    B -->|State problems| D[State Issues]
    B -->|Performance| E[Performance Issues]
    B -->|Mobile problems| F[Mobile Issues]
    
    C --> C1{Component rendered?}
    C1 -->|No| C2[Check imports/routing]
    C1 -->|Yes| C3[Check CSS/styling]
    
    D --> D1{Persistence working?}
    D1 -->|No| D2[Storage debugging]
    D1 -->|Yes| D3[Sync debugging]
    
    E --> E1{High CPU usage?}
    E1 -->|Yes| E2[Profile renders]
    E1 -->|No| E3[Check memory usage]
    
    F --> F1{Touch events working?}
    F1 -->|No| F2[Touch debugging]
    F1 -->|Yes| F3[Gesture debugging]
```

### 🔧 Quick Fix Decision Tree

```mermaid
flowchart TD
    A[Need Quick Fix?] --> B{How urgent?}
    
    B -->|Critical| C[Emergency Reset]
    B -->|High| D[Targeted Fix]
    B -->|Medium| E[Standard Debug]
    B -->|Low| F[Schedule Investigation]
    
    C --> C1[sidebarStateService.resetAllData()]
    C1 --> C2[window.location.reload()]
    
    D --> D1[Identify specific issue]
    D1 --> D2[Apply targeted solution]
    
    E --> E1[Follow standard flow]
    E1 --> E2[Document findings]
    
    F --> F1[Add to backlog]
    F1 --> F2[Monitor for escalation]
```

## Escalation Procedures

### 🚨 When to Escalate

```mermaid
flowchart TD
    A[Issue Encountered] --> B{Severity Level?}
    
    B -->|Critical| C[Immediate Escalation]
    B -->|High| D[Same Day Escalation]
    B -->|Medium| E[Next Business Day]
    B -->|Low| F[Weekly Review]
    
    C --> C1[Notify team lead immediately]
    C1 --> C2[Implement emergency workaround]
    C2 --> C3[Document incident]
    
    D --> D1[Create detailed bug report]
    D1 --> D2[Assign to senior developer]
    
    E --> E1[Add to sprint backlog]
    E1 --> E2[Schedule investigation]
    
    F --> F1[Add to technical debt list]
```

### 📋 Escalation Checklist

**Before Escalating:**
- [ ] Attempted basic troubleshooting steps
- [ ] Checked error logs and console
- [ ] Verified issue reproducibility
- [ ] Gathered debug information
- [ ] Documented steps to reproduce

**Information to Include:**
- [ ] Browser and version
- [ ] Operating system
- [ ] User role and permissions
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Console errors/warnings
- [ ] Debug report output

**Escalation Template:**
```
Subject: [SEVERITY] Sidebar State Persistence Issue

Environment:
- Browser: [Chrome 91.0.4472.124]
- OS: [Windows 10]
- User Role: [system_admin]

Issue Description:
[Clear description of the problem]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Debug Information:
[Paste debug report output]

Troubleshooting Attempted:
- [ ] Cleared localStorage
- [ ] Tested in incognito mode
- [ ] Checked console for errors
- [ ] Verified component imports

Impact:
[How this affects users/business]

Workaround:
[Any temporary solutions found]
```

## Recovery Procedures

### 🔄 Automated Recovery

```javascript
// Automated recovery system
const autoRecovery = {
  async runDiagnostics() {
    console.log('🔍 Running automated diagnostics...');
    
    const results = {
      storageAvailable: this.testStorage(),
      dataIntegrity: this.testDataIntegrity(),
      syncFunctional: await this.testSync(),
      performanceOk: this.testPerformance()
    };
    
    console.log('📊 Diagnostic Results:', results);
    return results;
  },
  
  testStorage() {
    try {
      const testKey = '__recovery_test__';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved === 'test';
    } catch (e) {
      return false;
    }
  },
  
  testDataIntegrity() {
    try {
      const data = localStorage.getItem('admin-sidebar-state');
      if (!data) return true; // No data is fine
      
      const parsed = JSON.parse(data);
      return parsed && typeof parsed.mode === 'string';
    } catch (e) {
      return false;
    }
  },
  
  async testSync() {
    return new Promise((resolve) => {
      let eventReceived = false;
      
      const listener = (e) => {
        if (e.key === '__sync_test__') {
          eventReceived = true;
          window.removeEventListener('storage', listener);
          resolve(true);
        }
      };
      
      window.addEventListener('storage', listener);
      
      // Simulate cross-tab change
      setTimeout(() => {
        if (!eventReceived) {
          window.removeEventListener('storage', listener);
          resolve(false);
        }
      }, 2000);
      
      // This won't trigger in same tab, but tests the listener setup
      localStorage.setItem('__sync_test__', Date.now().toString());
      localStorage.removeItem('__sync_test__');
    });
  },
  
  testPerformance() {
    const start = performance.now();
    
    // Simulate typical operations
    for (let i = 0; i < 100; i++) {
      sidebarStateService.loadState();
    }
    
    const duration = performance.now() - start;
    return duration < 100; // Should complete in under 100ms
  },
  
  async attemptRecovery(diagnostics) {
    console.log('🔧 Attempting automated recovery...');
    
    if (!diagnostics.storageAvailable) {
      console.log('❌ Storage unavailable - cannot recover');
      return false;
    }
    
    if (!diagnostics.dataIntegrity) {
      console.log('🧹 Clearing corrupted data...');
      sidebarStateService.resetAllData();
    }
    
    if (!diagnostics.syncFunctional) {
      console.log('🔄 Re-initializing sync listeners...');
      // Re-initialize would happen on next component mount
    }
    
    if (!diagnostics.performanceOk) {
      console.log('⚡ Clearing performance-impacting data...');
      // Clear analytics data that might be slowing things down
      localStorage.removeItem('admin-sidebar-analytics');
    }
    
    console.log('✅ Recovery attempt complete');
    return true;
  },
  
  async fullRecovery() {
    const diagnostics = await this.runDiagnostics();
    const recovered = await this.attemptRecovery(diagnostics);
    
    if (recovered) {
      console.log('🎉 Automated recovery successful');
      return true;
    } else {
      console.log('❌ Automated recovery failed - manual intervention required');
      return false;
    }
  }
};

// Usage: autoRecovery.fullRecovery()
```

### 🆘 Manual Recovery Steps

**Step 1: Assessment**
```javascript
// Quick health check
const healthCheck = () => {
  console.log('🏥 Health Check Results:');
  console.log('- Storage:', typeof Storage !== 'undefined' ? '✅' : '❌');
  console.log('- Data:', localStorage.getItem('admin-sidebar-state') ? '✅' : '⚠️');
  console.log('- Errors:', sidebarErrorRecovery.getErrorHistory().length);
  console.log('- Performance:', performance.memory ? '✅' : '⚠️');
};
```

**Step 2: Data Backup**
```javascript
// Create backup before recovery
const createBackup = () => {
  const backup = {
    timestamp: new Date().toISOString(),
    sidebarState: localStorage.getItem('admin-sidebar-state'),
    preferences: localStorage.getItem('admin-sidebar-preferences'),
    analytics: localStorage.getItem('admin-sidebar-analytics')
  };
  
  console.log('💾 Backup created:', backup);
  return JSON.stringify(backup);
};
```

**Step 3: Progressive Recovery**
```javascript
// Progressive recovery approach
const progressiveRecovery = {
  step1_clearCorrupted() {
    console.log('🧹 Step 1: Clearing corrupted data...');
    try {
      const data = localStorage.getItem('admin-sidebar-state');
      JSON.parse(data || '{}');
      console.log('✅ Data is valid');
    } catch (e) {
      localStorage.removeItem('admin-sidebar-state');
      console.log('🗑️ Removed corrupted data');
    }
  },
  
  step2_resetToDefaults() {
    console.log('🔄 Step 2: Resetting to defaults...');
    sidebarStateService.saveState({
      mode: 'collapsed',
      isHovered: false,
      width: 64,
      isTransitioning: false
    });
    console.log('✅ Default state restored');
  },
  
  step3_testFunctionality() {
    console.log('🧪 Step 3: Testing functionality...');
    const loaded = sidebarStateService.loadState();
    console.log('Load test:', loaded ? '✅' : '❌');
    
    sidebarStateService.saveState({
      mode: 'expanded',
      isHovered: false,
      width: 256,
      isTransitioning: false
    });
    
    const reloaded = sidebarStateService.loadState();
    console.log('Save/load test:', reloaded?.mode === 'expanded' ? '✅' : '❌');
  },
  
  runAll() {
    this.step1_clearCorrupted();
    this.step2_resetToDefaults();
    this.step3_testFunctionality();
    console.log('🎉 Progressive recovery complete');
  }
};
```

## Monitoring & Prevention

### 📊 Health Monitoring

```javascript
// Continuous health monitoring
const healthMonitor = {
  start() {
    console.log('🔍 Starting health monitoring...');
    
    this.interval = setInterval(() => {
      const health = {
        timestamp: new Date().toISOString(),
        storage: this.checkStorage(),
        errors: this.checkErrors(),
        performance: this.checkPerformance(),
        memory: this.checkMemory()
      };
      
      // Only log if there are issues
      if (!health.storage || health.errors > 0 || !health.performance) {
        console.warn('⚠️ Health issue detected:', health);
      }
    }, 30000); // Check every 30 seconds
  },
  
  stop() {
    clearInterval(this.interval);
    console.log('🔍 Health monitoring stopped');
  },
  
  checkStorage() {
    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  checkErrors() {
    return sidebarErrorRecovery.getErrorHistory().filter(
      error => Date.now() - error.timestamp < 300000 // Last 5 minutes
    ).length;
  },
  
  checkPerformance() {
    const start = performance.now();
    sidebarStateService.loadState();
    const duration = performance.now() - start;
    return duration < 10; // Should be under 10ms
  },
  
  checkMemory() {
    if (!performance.memory) return null;
    
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
  }
};

// Start monitoring
healthMonitor.start();
```

This comprehensive troubleshooting flow provides visual guides and systematic approaches to diagnose and resolve sidebar state persistence issues efficiently.