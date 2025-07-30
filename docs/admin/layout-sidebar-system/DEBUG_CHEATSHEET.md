# Debug Cheatsheet: Admin Layout & Sidebar System

## Quick Debugging Commands

### Browser Console Commands

```javascript
// === SIDEBAR STATE DEBUGGING ===

// Check current sidebar state
JSON.parse(localStorage.getItem('admin-sidebar-state'))

// Reset sidebar to default
localStorage.removeItem('admin-sidebar-state'); window.location.reload();

// Force specific sidebar mode
localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode: 'expanded' })); window.location.reload();

// Test all sidebar modes (2 second intervals)
['expanded', 'collapsed', 'expand-on-hover'].forEach((mode, i) => {
  setTimeout(() => {
    localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode }));
    window.location.reload();
  }, i * 2000);
});

// === LAYOUT DEBUGGING ===

// Test layout width changes
[64, 256].forEach((width, i) => {
  setTimeout(() => {
    console.log(`Testing width: ${width}px`);
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { detail: { width } }));
  }, i * 1000);
});

// Check current layout margins
const main = document.querySelector('main');
console.log('Main element styles:', window.getComputedStyle(main));

// Force layout width (emergency)
window.forceLayoutWidth = 64; // or 256, then reload

// === NAVIGATION DEBUGGING ===

// Check navigation access
import { mainNavItems, hasRequiredAccess } from '@/config/adminNav';
const user = /* current user object */;
mainNavItems.forEach(item => {
  console.log(`${item.title}: ${hasRequiredAccess(user, item.requiredAccess)}`);
});

// Bypass access control (development only)
window.bypassAccessControl = true; // then reload

// === MOBILE DEBUGGING ===

// Simulate mobile viewport
Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
window.dispatchEvent(new Event('resize'));

// Test touch events
const drawer = document.querySelector('[data-drawer]');
drawer.dispatchEvent(new TouchEvent('touchstart', { touches: [{ clientX: 10 }] }));
```

## Common Issues & Quick Fixes

### 🔧 Sidebar Issues

#### Issue: Sidebar not expanding on hover
```javascript
// Check mode
const state = JSON.parse(localStorage.getItem('admin-sidebar-state'));
console.log('Current mode:', state?.mode);

// Force expand-on-hover mode
localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode: 'expand-on-hover' }));
window.location.reload();

// Check mouse events
document.querySelector('[data-sidebar]').addEventListener('mouseenter', () => console.log('Mouse entered'));
```

#### Issue: Dropdown closes immediately
```javascript
// Check dropdown state in React DevTools
// Look for isDropdownOpen state

// Temporary fix: increase timeout
// In AdminSidebar.tsx, change timeout from 150ms to 500ms
```

#### Issue: Sidebar stuck in one mode
```javascript
// Nuclear option - clear all sidebar state
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### 🔧 Layout Issues

#### Issue: Content not adjusting to sidebar width
```javascript
// Check event listener
window.addEventListener('admin-sidebar-resize', (e) => console.log('Width change:', e.detail.width));

// Manual width dispatch
window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { detail: { width: 256 } }));

// Check layout component state
// Use React DevTools to inspect mainSidebarWidth state
```

#### Issue: Layout jumping or flickering
```javascript
// Check CSS transitions
const main = document.querySelector('main');
main.style.transition = 'none'; // Disable transitions temporarily

// Check for conflicting styles
console.log('Computed styles:', window.getComputedStyle(main));
```

### 🔧 Mobile Issues

#### Issue: Mobile drawer not opening
```javascript
// Check mobile detection
console.log('Is mobile:', window.innerWidth < 768);

// Force mobile mode
Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });
window.dispatchEvent(new Event('resize'));

// Test drawer trigger
document.querySelector('[data-mobile-trigger]').click();
```

#### Issue: Touch gestures not working
```javascript
// Test touch events manually
const overlay = document.querySelector('[data-drawer-overlay]');
const touchStart = new TouchEvent('touchstart', {
  touches: [{ clientX: 10, clientY: 100 }]
});
const touchEnd = new TouchEvent('touchend', {
  changedTouches: [{ clientX: 100, clientY: 100 }]
});

overlay.dispatchEvent(touchStart);
setTimeout(() => overlay.dispatchEvent(touchEnd), 100);
```

### 🔧 Navigation Issues

#### Issue: Navigation items not showing
```javascript
// Check user permissions
const user = /* get current user */;
console.log('User access level:', user?.user_metadata?.access_level);

// Check navigation filtering
import { getFilteredNavItems } from '@/components/admin/AdminSidebar';
console.log('Filtered items:', getFilteredNavItems(user));

// Bypass filtering temporarily
window.showAllNavItems = true; // then modify component to check this flag
```

#### Issue: Wrong navigation items for user role
```javascript
// Check access control function
import { hasRequiredAccess } from '@/config/adminNav';
const testAccess = (requiredAccess) => hasRequiredAccess(user, requiredAccess);

console.log('System admin access:', testAccess(['system_admin']));
console.log('Client admin access:', testAccess(['client_admin']));
```

## Emergency Procedures

### 🚨 Complete Sidebar Failure
```javascript
// 1. Bypass sidebar completely
window.bypassSidebar = true;
// Then modify AdminLayout to check this flag

// 2. Reset all state
localStorage.clear();
sessionStorage.clear();
indexedDB.deleteDatabase('your-app-db'); // if using IndexedDB

// 3. Force reload with clean state
window.location.href = window.location.href + '?clean=true';
```

### 🚨 Layout Completely Broken
```javascript
// 1. Force fixed layout
document.body.style.cssText = `
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: auto !important;
`;

// 2. Remove all dynamic styles
document.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

// 3. Emergency CSS injection
const emergencyCSS = `
  main { margin-left: 0 !important; width: 100% !important; }
  .sidebar { display: none !important; }
`;
const style = document.createElement('style');
style.textContent = emergencyCSS;
document.head.appendChild(style);
```

### 🚨 Navigation Access Issues
```javascript
// 1. Bypass all access control
window.emergencyAccess = true;
// Then modify access control functions to check this flag

// 2. Force admin role
const fakeUser = {
  user_metadata: { access_level: 'system_admin' },
  id: 'emergency-user'
};
// Use this in place of real user object

// 3. Show all navigation
window.showAllNavigation = true;
// Then modify navigation components to show all items
```

## Performance Debugging

### 🔍 Sidebar Performance
```javascript
// Monitor sidebar re-renders
let renderCount = 0;
const originalRender = React.createElement;
React.createElement = function(...args) {
  if (args[0]?.name?.includes('Sidebar')) {
    console.log(`Sidebar render #${++renderCount}`);
  }
  return originalRender.apply(this, args);
};

// Monitor state changes
let stateChanges = 0;
const originalSetState = useState;
// This is more complex - use React DevTools Profiler instead
```

### 🔍 Layout Performance
```javascript
// Monitor layout recalculations
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'layout-shift') {
      console.log('Layout shift detected:', entry);
    }
  });
});
observer.observe({ entryTypes: ['layout-shift'] });

// Monitor paint events
const paintObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('Paint event:', entry.name, entry.startTime);
  });
});
paintObserver.observe({ entryTypes: ['paint'] });
```

## Development Helpers

### 🛠️ Add to AdminSidebar Component
```tsx
// Add this in development mode
if (process.env.NODE_ENV === 'development') {
  window.sidebarDebug = {
    currentState: sidebarState,
    forceMode: (mode) => handleModeChange(mode),
    triggerHover: () => handleMouseEnter(),
    triggerLeave: () => handleMouseLeave(),
    clearTimeouts: () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    },
    testDropdown: () => setIsDropdownOpen(!isDropdownOpen)
  };
}
```

### 🛠️ Add to AdminLayout Component
```tsx
// Add this in development mode
if (process.env.NODE_ENV === 'development') {
  window.layoutDebug = {
    currentWidth: mainSidebarWidth,
    isMobile: isMobile,
    forceWidth: (width) => setMainSidebarWidth(width),
    testResize: () => {
      [64, 256].forEach((width, i) => {
        setTimeout(() => {
          console.log(`Testing width: ${width}px`);
          setMainSidebarWidth(width);
        }, i * 1000);
      });
    }
  };
}
```

## Testing Scenarios

### 🧪 Sidebar State Transitions
```javascript
// Test all state transitions
const testTransitions = async () => {
  const modes = ['expanded', 'collapsed', 'expand-on-hover'];
  
  for (let i = 0; i < modes.length; i++) {
    for (let j = 0; j < modes.length; j++) {
      if (i !== j) {
        console.log(`Testing transition: ${modes[i]} -> ${modes[j]}`);
        
        // Set initial state
        localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode: modes[i] }));
        window.location.reload();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trigger transition
        // This would need to be done manually or with automation
      }
    }
  }
};
```

### 🧪 Responsive Breakpoints
```javascript
// Test all breakpoints
const testBreakpoints = () => {
  const breakpoints = [320, 768, 1024, 1440, 1920];
  
  breakpoints.forEach((width, i) => {
    setTimeout(() => {
      console.log(`Testing breakpoint: ${width}px`);
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
      window.dispatchEvent(new Event('resize'));
    }, i * 2000);
  });
};
```

### 🧪 User Role Testing
```javascript
// Test different user roles
const testUserRoles = () => {
  const roles = [
    { access_level: 'system_admin' },
    { access_level: 'client_admin' },
    { access_level: 'user' },
    null // No user
  ];
  
  roles.forEach((userMetadata, i) => {
    setTimeout(() => {
      console.log(`Testing role:`, userMetadata);
      // You would need to update the auth context with this user
      // This is more complex and would require proper auth system integration
    }, i * 3000);
  });
};
```

## CSS Debugging

### 🎨 Sidebar Styles
```css
/* Add to browser dev tools for debugging */

/* Highlight sidebar boundaries */
[data-sidebar] {
  outline: 2px solid red !important;
}

/* Show overlay boundaries */
[data-sidebar-overlay] {
  outline: 2px solid blue !important;
  background: rgba(255, 0, 0, 0.1) !important;
}

/* Debug transitions */
* {
  transition: all 0.3s ease !important;
}

/* Show all hover states */
*:hover {
  outline: 1px solid yellow !important;
}
```

### 🎨 Layout Styles
```css
/* Debug layout boundaries */
main {
  outline: 2px solid green !important;
}

/* Show content area */
.content-area {
  background: rgba(0, 255, 0, 0.1) !important;
}

/* Debug responsive breakpoints */
@media (max-width: 768px) {
  body::before {
    content: "MOBILE" !important;
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    background: red !important;
    color: white !important;
    padding: 4px !important;
    z-index: 9999 !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  body::before {
    content: "TABLET" !important;
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    background: orange !important;
    color: white !important;
    padding: 4px !important;
    z-index: 9999 !important;
  }
}

@media (min-width: 1025px) {
  body::before {
    content: "DESKTOP" !important;
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    background: green !important;
    color: white !important;
    padding: 4px !important;
    z-index: 9999 !important;
  }
}
```

## React DevTools Tips

### 🔍 Component Inspection
1. **Find AdminSidebar component** in React DevTools
2. **Check state values**: `sidebarState`, `isDropdownOpen`, `isHovered`
3. **Monitor state changes** in real-time
4. **Check props** passed to child components

### 🔍 Performance Profiling
1. **Open React DevTools Profiler**
2. **Start recording** before interacting with sidebar
3. **Perform actions** (hover, click, mode change)
4. **Stop recording** and analyze render times
5. **Look for unnecessary re-renders**

### 🔍 Hook Debugging
1. **Use React DevTools hooks** to inspect custom hooks
2. **Check useEffect dependencies** for infinite loops
3. **Monitor useCallback/useMemo** for optimization issues

This cheatsheet provides quick solutions for the most common issues you'll encounter with the admin layout and sidebar system. Keep it handy for rapid debugging!