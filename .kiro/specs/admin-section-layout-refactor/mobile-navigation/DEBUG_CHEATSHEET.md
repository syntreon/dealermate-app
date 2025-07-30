# Mobile Navigation Debug Cheatsheet

## Quick Diagnostics

### 🔍 Instant Checks

```bash
# Check if mobile navigation is active
console.log('Is Mobile:', useIsMobile());

# Check screen dimensions
console.log('Screen:', window.innerWidth, 'x', window.innerHeight);

# Check touch support
console.log('Touch:', 'ontouchstart' in window);

# Check drawer state
console.log('Drawer Open:', isDrawerOpen);
```

### 🚨 Emergency Commands

```tsx
// Force desktop navigation
localStorage.setItem('force-desktop-nav', 'true');
window.location.reload();

// Reset navigation state
localStorage.removeItem('admin-sidebar-state');
window.location.reload();

// Disable animations
document.body.style.setProperty('--animation-duration', '0ms');
```

## Common Issues & Quick Fixes

### ❌ Navigation Not Switching Mobile/Desktop

**Symptoms**: Stuck in mobile or desktop mode
```tsx
// Debug
console.log('useIsMobile:', useIsMobile());
console.log('Window width:', window.innerWidth);
console.log('Breakpoint check:', window.innerWidth < 768);

// Quick fix
const isMobile = window.innerWidth < 768;
```

### ❌ Touch Gestures Not Working

**Symptoms**: Swipe doesn't open/close drawer
```tsx
// Debug touch events
element.addEventListener('touchstart', (e) => {
  console.log('Touch start:', e.targetTouches[0].clientX);
});

// Check for event conflicts
console.log('Touch handlers:', element.getEventListeners?.());

// Quick fix - Force button navigation
setTouchGesturesEnabled(false);
```

### ❌ Drawer Won't Close

**Symptoms**: Drawer stays open, overlay doesn't work
```tsx
// Debug overlay clicks
const handleOverlayClick = (e) => {
  console.log('Overlay click:', {
    target: e.target,
    currentTarget: e.currentTarget,
    isOverlay: e.target === e.currentTarget
  });
};

// Force close
setIsDrawerOpen(false);
document.body.style.overflow = 'unset';
```

### ❌ Layout Issues

**Symptoms**: Content overlapping, wrong positioning
```tsx
// Check z-index stack
console.log('Z-index:', getComputedStyle(element).zIndex);

// Check positioning
console.log('Position:', getComputedStyle(element).position);

// Quick fix
element.style.zIndex = '9999';
element.style.position = 'fixed';
```

## Debug Console Commands

### Navigation State

```js
// Get current navigation state
window.debugNav = {
  isMobile: document.querySelector('.md\\:hidden') !== null,
  drawerOpen: document.querySelector('[data-drawer-open]') !== null,
  sidebarMode: localStorage.getItem('admin-sidebar-state'),
  screenWidth: window.innerWidth
};
console.table(window.debugNav);
```

### Touch Event Debugging

```js
// Monitor all touch events
['touchstart', 'touchmove', 'touchend'].forEach(event => {
  document.addEventListener(event, (e) => {
    console.log(`${event}:`, {
      x: e.targetTouches?.[0]?.clientX,
      y: e.targetTouches?.[0]?.clientY,
      target: e.target.tagName
    });
  });
});
```

### Performance Monitoring

```js
// Monitor render performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('navigation')) {
      console.log('Navigation performance:', entry);
    }
  });
});
observer.observe({ entryTypes: ['measure'] });
```

## Browser DevTools Shortcuts

### Mobile Testing
1. **F12** → Toggle DevTools
2. **Ctrl+Shift+M** → Toggle device toolbar
3. **Ctrl+Shift+I** → Inspect element
4. **Ctrl+Shift+C** → Select element

### Touch Simulation
1. DevTools → Settings → Experiments
2. Enable "Touch events simulation"
3. Reload DevTools
4. Use touch events in mobile view

### Performance Analysis
1. **F12** → Performance tab
2. Click record → Interact with navigation
3. Stop recording → Analyze timeline
4. Look for layout thrashing

## Test Commands

### Unit Tests
```bash
# Run navigation tests only
npm test -- --testNamePattern="Navigation"

# Run with coverage
npm test -- --coverage --testPathPattern="Navigation"

# Run specific test file
npm test -- src/components/admin/__tests__/MobileNavigation.test.tsx

# Watch mode
npm test -- --watch --testNamePattern="Mobile"
```

### Manual Testing Checklist

```bash
# Mobile (< 768px)
□ Menu button appears
□ Swipe right opens drawer
□ Swipe left closes drawer
□ Tap overlay closes drawer
□ Escape key closes drawer
□ Navigation items work
□ Body scroll locked when open

# Tablet (768px - 1024px)
□ Desktop sidebar appears
□ No mobile menu button
□ Sidebar states work
□ Responsive layout

# Desktop (> 1024px)
□ Full sidebar functionality
□ All three states work
□ Hover behavior correct
□ State persistence works
```

## Error Messages & Solutions

### `Cannot read property 'clientX' of undefined`
```tsx
// Problem: Touch event without touches
// Solution: Add null check
const clientX = e.targetTouches?.[0]?.clientX ?? 0;
```

### `ResizeObserver loop limit exceeded`
```tsx
// Problem: Infinite resize loop
// Solution: Debounce resize handler
const debouncedResize = debounce(handleResize, 100);
```

### `Maximum update depth exceeded`
```tsx
// Problem: State update loop
// Solution: Add dependency array
useEffect(() => {
  // State update logic
}, [dependency]); // Add proper dependencies
```

### `Cannot set property 'overflow' of undefined`
```tsx
// Problem: Document.body not available
// Solution: Add null check
if (document.body) {
  document.body.style.overflow = 'hidden';
}
```

## Performance Debugging

### Memory Leaks
```js
// Check for memory leaks
const checkMemory = () => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
    });
  }
};

// Run every 5 seconds
setInterval(checkMemory, 5000);
```

### Animation Performance
```js
// Monitor frame rate
let lastTime = performance.now();
let frameCount = 0;

const measureFPS = () => {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(measureFPS);
};

measureFPS();
```

### Event Listener Audit
```js
// Check for event listener leaks
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
const listeners = new Map();

EventTarget.prototype.addEventListener = function(type, listener, options) {
  const key = `${this.constructor.name}-${type}`;
  listeners.set(key, (listeners.get(key) || 0) + 1);
  console.log('Added listener:', key, 'Total:', listeners.get(key));
  return originalAddEventListener.call(this, type, listener, options);
};

EventTarget.prototype.removeEventListener = function(type, listener, options) {
  const key = `${this.constructor.name}-${type}`;
  listeners.set(key, Math.max(0, (listeners.get(key) || 0) - 1));
  console.log('Removed listener:', key, 'Total:', listeners.get(key));
  return originalRemoveEventListener.call(this, type, listener, options);
};

// Check listener counts
console.table(Object.fromEntries(listeners));
```

## Quick Fixes

### Force Mobile Navigation
```tsx
// Temporarily force mobile navigation
const AdminSidebar = () => {
  const forceMobile = localStorage.getItem('force-mobile') === 'true';
  const isMobile = useIsMobile() || forceMobile;
  
  return isMobile ? <MobileAdminNavigation /> : <DesktopAdminSidebar />;
};

// Enable: localStorage.setItem('force-mobile', 'true');
// Disable: localStorage.removeItem('force-mobile');
```

### Disable Touch Gestures
```tsx
// Disable problematic touch gestures
const MobileAdminNavigation = () => {
  const touchEnabled = localStorage.getItem('touch-disabled') !== 'true';
  
  return (
    <div>
      {touchEnabled && <SwipeArea />}
      <MenuButton /> {/* Always available */}
    </div>
  );
};

// Disable: localStorage.setItem('touch-disabled', 'true');
```

### Reset All Navigation State
```js
// Nuclear option - reset everything
const resetNavigation = () => {
  localStorage.removeItem('admin-sidebar-state');
  localStorage.removeItem('force-mobile');
  localStorage.removeItem('force-desktop');
  localStorage.removeItem('touch-disabled');
  document.body.style.overflow = 'unset';
  window.location.reload();
};

// Run in console: resetNavigation();
```

## Browser-Specific Issues

### iOS Safari
```js
// Fix viewport height issues
const fixIOSViewport = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', fixIOSViewport);
fixIOSViewport();
```

### Chrome Mobile
```js
// Fix touch delay
document.addEventListener('touchstart', () => {}, { passive: true });
```

### Samsung Internet
```js
// Check for Samsung Internet specific issues
const isSamsungInternet = navigator.userAgent.includes('SamsungBrowser');
if (isSamsungInternet) {
  console.log('Samsung Internet detected - applying fixes');
  // Apply Samsung-specific fixes
}
```

## Emergency Fallback

```tsx
// Last resort - simple navigation
const EmergencyNavigation = () => (
  <div className="fixed top-0 left-0 w-full bg-background border-b z-50 p-4">
    <div className="flex gap-4 overflow-x-auto">
      <a href="/admin/dashboard" className="whitespace-nowrap">Dashboard</a>
      <a href="/admin/management" className="whitespace-nowrap">Management</a>
      <a href="/admin/analytics" className="whitespace-nowrap">Analytics</a>
      <a href="/admin/audit" className="whitespace-nowrap">Logs</a>
      <a href="/admin/settings" className="whitespace-nowrap">Settings</a>
    </div>
  </div>
);

// Use when main navigation fails
const AdminSidebar = () => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <EmergencyNavigation />;
  }
  
  try {
    return <MainNavigation />;
  } catch (error) {
    console.error('Navigation error:', error);
    setHasError(true);
    return <EmergencyNavigation />;
  }
};
```

---

**💡 Pro Tip**: Bookmark this page and keep DevTools open when debugging navigation issues. Most problems can be solved in under 5 minutes with these commands!