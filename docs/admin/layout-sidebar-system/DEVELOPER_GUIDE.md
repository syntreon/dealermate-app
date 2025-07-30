# Developer Guide: Admin Layout and Sidebar System

## Quick Start

### For New Developers

This guide provides complete understanding of the admin layout and sidebar system, enabling you to work confidently with the responsive, multi-state sidebar and section layouts.

### Instant Onboarding

1. **System Overview**
   - **AdminSidebar**: 3-state sidebar (expanded, collapsed, expand-on-hover) with mobile support
   - **AdminLayout**: Main layout container that responds to sidebar state changes
   - **Section Layouts**: Individual layouts for each admin section (Management, Analytics, Audit, Settings)
   - **Navigation Configuration**: Centralized navigation configuration with role-based access

2. **Key Architecture Components**
   ```
   src/
   ├── components/admin/
   │   └── AdminSidebar.tsx              # Main sidebar component
   ├── layouts/admin/
   │   ├── AdminLayout.tsx               # Main admin layout
   │   ├── ManagementLayout.tsx          # Management section layout
   │   ├── AnalyticsLayout.tsx           # Analytics section layout
   │   ├── AuditLayout.tsx               # Audit section layout
   │   └── SettingsLayout.tsx            # Settings section layout
   ├── config/
   │   ├── adminNav.ts                   # Main navigation config
   │   ├── managementNav.ts              # Management sub-navigation
   │   ├── analyticsNav.ts               # Analytics sub-navigation
   │   ├── auditNav.ts                   # Audit sub-navigation
   │   └── settingsNav.ts                # Settings sub-navigation
   └── utils/
       └── clientDataIsolation.ts        # Role-based access control
   ```

3. **Basic Understanding**
   ```tsx
   // Layout hierarchy
   <AdminLayout>           // Main container, handles sidebar width
     <AdminSidebar />      // 3-state sidebar with navigation
     <main>
       <ManagementLayout>  // Section-specific layout
         <Outlet />        // Individual pages
       </ManagementLayout>
     </main>
   </AdminLayout>
   ```

## System Architecture

### 1. Sidebar State Management

The AdminSidebar supports three distinct modes:

#### **Expanded Mode (256px width)**
```tsx
// Full sidebar with text labels
mode: 'expanded'
width: 256px
showText: true
isOverlay: false
```

#### **Collapsed Mode (64px width)**
```tsx
// Icon-only sidebar
mode: 'collapsed'
width: 64px
showText: false
isOverlay: false
```

#### **Expand-on-Hover Mode (64px base + 256px overlay)**
```tsx
// Collapsed by default, expands on hover as overlay
mode: 'expand-on-hover'
baseWidth: 64px
overlayWidth: 256px
isOverlay: true (when hovered)
```

### 2. Layout Responsiveness

The AdminLayout automatically adjusts content margins based on sidebar state:

```tsx
// Layout width calculation
const totalLeftMargin = isMobile ? 0 : mainSidebarWidth;

// Content area styling
style={{ 
  marginLeft: isMobile ? 0 : `${totalLeftMargin}px`,
  width: isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`
}}
```

### 3. State Persistence

Sidebar state is persisted in localStorage:

```tsx
// State structure
interface SidebarState {
  mode: 'expanded' | 'collapsed' | 'expand-on-hover';
  isHovered: boolean;
  width: number;
}

// Persistence
localStorage.setItem('admin-sidebar-state', JSON.stringify({
  mode: sidebarState.mode
}));
```

### 4. Communication System

Sidebar communicates width changes to layout via custom events:

```tsx
// Sidebar dispatches width changes
window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
  detail: { width: layoutWidth } 
}));

// Layout listens for changes
useEffect(() => {
  const handleSidebarResize = (event: CustomEvent) => {
    setMainSidebarWidth(event.detail.width);
  };
  
  window.addEventListener('admin-sidebar-resize', handleSidebarResize);
  return () => window.removeEventListener('admin-sidebar-resize', handleSidebarResize);
}, []);
```

## Self-Service Debugging

### Common Issues and Solutions

#### 1. Sidebar Not Expanding on Hover

**Problem:** Expand-on-hover mode not working properly.

**Diagnosis:**
```tsx
// Check current sidebar state
console.log('Sidebar state:', {
  mode: sidebarState.mode,
  isHovered: sidebarState.isHovered,
  isOverlay: isOverlay
});

// Check mouse event handlers
const handleMouseEnter = () => {
  console.log('Mouse entered, mode:', sidebarState.mode);
  if (sidebarState.mode === 'expand-on-hover') {
    console.log('Setting hover state to true');
  }
};
```

**Solution:**
```tsx
// Ensure proper event handling
onMouseEnter={handleMouseEnter}
onMouseLeave={handleMouseLeave}

// Check for conflicting CSS
.sidebar {
  pointer-events: auto; /* Ensure mouse events work */
}
```

#### 2. Layout Not Adjusting to Sidebar Changes

**Problem:** Content doesn't adjust when sidebar mode changes.

**Diagnosis:**
```tsx
// Check event dispatch
useEffect(() => {
  console.log('Dispatching width change:', layoutWidth);
  window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
    detail: { width: layoutWidth } 
  }));
}, [sidebarState.mode]);

// Check event listener
useEffect(() => {
  const handleSidebarResize = (event) => {
    console.log('Received width change:', event.detail.width);
    setMainSidebarWidth(event.detail.width);
  };
  // ... rest of listener setup
}, []);
```

**Solution:**
```tsx
// Ensure initial width dispatch
useEffect(() => {
  const layoutWidth = sidebarState.mode === 'expanded' ? 256 : 64;
  window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
    detail: { width: layoutWidth } 
  }));
}, []); // Run once on mount
```

#### 3. Dropdown Menu Closing Immediately

**Problem:** Sidebar options dropdown closes before user can interact.

**Diagnosis:**
```tsx
// Check dropdown state
console.log('Dropdown open:', isDropdownOpen);
console.log('Mouse leave triggered:', sidebarState.mode === 'expand-on-hover');

// Check timeout clearing
const handleDropdownOpenChange = (open) => {
  console.log('Dropdown state changed:', open);
  if (open && hoverTimeoutRef.current) {
    console.log('Clearing timeout for dropdown');
    clearTimeout(hoverTimeoutRef.current);
  }
};
```

**Solution:**
```tsx
// Ensure proper dropdown state management
const handleMouseLeave = () => {
  if (sidebarState.mode === 'expand-on-hover' && !isDropdownOpen) {
    // Only collapse if dropdown is not open
    hoverTimeoutRef.current = setTimeout(() => {
      setSidebarState(prev => ({ ...prev, isHovered: false }));
    }, 150);
  }
};
```

#### 4. Sub-sidebar Links Cut Off

**Problem:** Text in section sub-sidebars is partially hidden.

**Diagnosis:**
```tsx
// Check CSS classes
<aside className="lg:w-56 lg:flex-shrink-0"> {/* Fixed width */}
  <nav className="overflow-x-auto lg:overflow-x-visible">
    <NavLink className="whitespace-nowrap">
      <span className="truncate">{item.title}</span>
    </NavLink>
  </nav>
</aside>
```

**Solution:**
```tsx
// Proper responsive layout
<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
  <aside className="lg:w-56 lg:flex-shrink-0">
    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-x-visible">
      {items.map((item) => (
        <NavLink className="px-4 py-2 whitespace-nowrap">
          <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
  <div className="flex-1 min-w-0">
    <Outlet />
  </div>
</div>
```

### Debug Commands

#### Browser Console Commands

```javascript
// Check sidebar state
window.debugSidebar = {
  getState: () => {
    const saved = localStorage.getItem('admin-sidebar-state');
    return saved ? JSON.parse(saved) : null;
  },
  setState: (mode) => {
    localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode }));
    window.location.reload();
  },
  testModes: () => {
    ['expanded', 'collapsed', 'expand-on-hover'].forEach((mode, i) => {
      setTimeout(() => {
        console.log(`Testing mode: ${mode}`);
        window.debugSidebar.setState(mode);
      }, i * 2000);
    });
  }
};

// Test layout responsiveness
window.debugLayout = {
  testWidths: () => {
    [64, 256].forEach((width, i) => {
      setTimeout(() => {
        console.log(`Testing width: ${width}px`);
        window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
          detail: { width } 
        }));
      }, i * 1000);
    });
  }
};

// Check navigation configuration
window.debugNav = {
  getMainNav: () => mainNavItems,
  checkAccess: (user, item) => hasRequiredAccess(user, item.requiredAccess),
  getFilteredNav: (user) => mainNavItems.filter(item => 
    hasRequiredAccess(user, item.requiredAccess)
  )
};
```

#### Development Helpers

```tsx
// Add to AdminSidebar for debugging
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
    }
  };
}
```

## Best Practices

### 1. Sidebar State Management

```tsx
// ✅ Proper state initialization
const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
  const saved = localStorage.getItem('admin-sidebar-state');
  const defaultState = { mode: 'collapsed', isHovered: false, width: 64 };
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        mode: parsed.mode || 'collapsed',
        isHovered: false, // Always start with false
        width: parsed.mode === 'collapsed' || parsed.mode === 'expand-on-hover' ? 64 : 256
      };
    } catch {
      return defaultState;
    }
  }
  return defaultState;
});

// ❌ Avoid direct state mutation
setSidebarState({ mode: 'expanded' }); // Missing other properties

// ✅ Proper state updates
setSidebarState(prev => ({
  ...prev,
  mode: 'expanded',
  width: 256
}));
```

### 2. Layout Responsiveness

```tsx
// ✅ Proper layout calculation
const totalLeftMargin = isMobile ? 0 : mainSidebarWidth;

// ✅ Responsive styling
<div 
  className="min-h-screen transition-all duration-300 ease-in-out"
  style={{ 
    marginLeft: isMobile ? 0 : `${totalLeftMargin}px`,
    width: isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`
  }}
>

// ❌ Fixed margins
<div style={{ marginLeft: '256px' }}>
```

### 3. Section Layout Structure

```tsx
// ✅ Consistent section layout pattern
const SectionLayout = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Section Title</h2>
      <p className="text-muted-foreground">Section description</p>
    </div>
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
      <aside className="lg:w-56 lg:flex-shrink-0">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-x-visible">
          {/* Navigation items */}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  </div>
);

// ❌ Inconsistent structure
const BadLayout = () => (
  <div>
    <h1>Title</h1>
    <div className="flex">
      <div className="w-1/4"> {/* Percentage-based width */}
        {/* Navigation */}
      </div>
      <div className="w-3/4">
        <Outlet />
      </div>
    </div>
  </div>
);
```

### 4. Navigation Configuration

```tsx
// ✅ Proper navigation item structure
export const navigationItem = {
  id: 'unique-id',
  title: 'Display Title',
  href: '/admin/section',
  icon: IconComponent,
  requiredAccess: ['system_admin'] // Role-based access
};

// ✅ Access control check
const hasAccess = hasRequiredAccess(user, item.requiredAccess);

// ❌ Missing access control
const items = allNavItems; // No filtering
```

## Emergency Procedures

### Critical Layout Issues

#### 1. Sidebar Completely Broken

**Immediate Action:**
```tsx
// Reset sidebar state
localStorage.removeItem('admin-sidebar-state');
window.location.reload();

// Or force expanded mode
localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode: 'expanded' }));
window.location.reload();
```

**Temporary Bypass:**
```tsx
// Add to AdminLayout for emergency bypass
const EMERGENCY_BYPASS = process.env.NODE_ENV === 'development' && window.bypassSidebar;

return (
  <div className="min-h-screen bg-background text-foreground relative">
    {!EMERGENCY_BYPASS && <AdminSidebar />}
    <div 
      className="min-h-screen transition-all duration-300 ease-in-out"
      style={{ 
        marginLeft: EMERGENCY_BYPASS ? 0 : (isMobile ? 0 : `${totalLeftMargin}px`),
        width: EMERGENCY_BYPASS ? '100%' : (isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`)
      }}
    >
      {/* Content */}
    </div>
  </div>
);

// In browser console
window.bypassSidebar = true;
```

#### 2. Layout Width Calculation Errors

**Diagnosis:**
```tsx
// Check width calculation
console.log('Sidebar mode:', sidebarState.mode);
console.log('Calculated width:', mainSidebarWidth);
console.log('Is mobile:', isMobile);
console.log('Total margin:', totalLeftMargin);
```

**Emergency Fix:**
```tsx
// Force specific width
const FORCE_WIDTH = window.forceLayoutWidth;
const totalLeftMargin = FORCE_WIDTH || (isMobile ? 0 : mainSidebarWidth);

// In browser console
window.forceLayoutWidth = 64; // or 256
```

#### 3. Navigation Access Issues

**Immediate Action:**
```tsx
// Bypass access control temporarily
const BYPASS_ACCESS = window.bypassAccessControl;

const filteredNavItems = BYPASS_ACCESS 
  ? mainNavItems 
  : mainNavItems.filter(item => hasRequiredAccess(user, item.requiredAccess));

// In browser console
window.bypassAccessControl = true;
```

### Performance Issues

#### 1. Sidebar State Thrashing

**Problem:** Rapid state changes causing performance issues.

**Solution:**
```tsx
// Debounce state changes
const debouncedSetSidebarState = useMemo(
  () => debounce(setSidebarState, 100),
  []
);

// Use in mouse handlers
const handleMouseEnter = () => {
  if (sidebarState.mode === 'expand-on-hover') {
    debouncedSetSidebarState(prev => ({ ...prev, isHovered: true }));
  }
};
```

#### 2. Layout Recalculation Issues

**Problem:** Excessive layout recalculations.

**Solution:**
```tsx
// Memoize layout calculations
const layoutStyle = useMemo(() => ({
  marginLeft: isMobile ? 0 : `${totalLeftMargin}px`,
  width: isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`
}), [isMobile, totalLeftMargin]);

// Use transform instead of margin for better performance
const layoutTransform = useMemo(() => ({
  transform: isMobile ? 'translateX(0)' : `translateX(${totalLeftMargin}px)`,
  width: isMobile ? '100%' : `calc(100vw - ${totalLeftMargin}px)`
}), [isMobile, totalLeftMargin]);
```

## Performance Optimization

### 1. Sidebar Optimization

```tsx
// Memoize sidebar component
const MemoizedAdminSidebar = memo(AdminSidebar);

// Optimize mouse event handlers
const handleMouseEnter = useCallback(() => {
  if (sidebarState.mode === 'expand-on-hover') {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setSidebarState(prev => ({ ...prev, isHovered: true }));
  }
}, [sidebarState.mode]);

// Optimize navigation rendering
const navigationItems = useMemo(() => 
  getFilteredNavItems(user),
  [user]
);
```

### 2. Layout Optimization

```tsx
// Avoid unnecessary re-renders
const AdminLayout = memo(() => {
  // Component implementation
});

// Optimize width calculations
const layoutWidth = useMemo(() => {
  return isMobile ? 0 : mainSidebarWidth;
}, [isMobile, mainSidebarWidth]);

// Use CSS custom properties for better performance
useEffect(() => {
  document.documentElement.style.setProperty(
    '--sidebar-width', 
    `${mainSidebarWidth}px`
  );
}, [mainSidebarWidth]);
```

### 3. Section Layout Optimization

```tsx
// Lazy load section layouts
const ManagementLayout = lazy(() => import('./ManagementLayout'));
const AnalyticsLayout = lazy(() => import('./AnalyticsLayout'));

// Preload critical layouts
useEffect(() => {
  const timer = setTimeout(() => {
    import('./ManagementLayout');
    import('./AnalyticsLayout');
  }, 2000);
  
  return () => clearTimeout(timer);
}, []);

// Optimize navigation rendering
const SectionNavigation = memo(({ items }) => (
  <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
    {items.map((item) => (
      <NavLink key={item.href} to={item.href}>
        <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.title}</span>
      </NavLink>
    ))}
  </nav>
));
```

## Testing Strategies

### 1. Sidebar State Testing

```tsx
describe('AdminSidebar', () => {
  it('initializes with correct default state', () => {
    render(<AdminSidebar />);
    
    // Check localStorage
    const saved = localStorage.getItem('admin-sidebar-state');
    expect(saved).toBeTruthy();
    
    const state = JSON.parse(saved);
    expect(state.mode).toBe('collapsed');
  });
  
  it('handles mode changes correctly', async () => {
    render(<AdminSidebar />);
    
    // Test mode change
    const dropdownTrigger = screen.getByTitle('Sidebar Options');
    fireEvent.click(dropdownTrigger);
    
    const expandedOption = screen.getByText('Expanded');
    fireEvent.click(expandedOption);
    
    await waitFor(() => {
      const saved = localStorage.getItem('admin-sidebar-state');
      const state = JSON.parse(saved);
      expect(state.mode).toBe('expanded');
    });
  });
  
  it('dispatches width changes', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    render(<AdminSidebar />);
    
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'admin-sidebar-resize',
        detail: { width: expect.any(Number) }
      })
    );
  });
});
```

### 2. Layout Responsiveness Testing

```tsx
describe('AdminLayout', () => {
  it('adjusts to sidebar width changes', () => {
    render(<AdminLayout />);
    
    // Simulate sidebar width change
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', {
      detail: { width: 256 }
    }));
    
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle('margin-left: 256px');
  });
  
  it('handles mobile layout correctly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    render(<AdminLayout />);
    
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle('margin-left: 0px');
  });
});
```

### 3. Integration Testing

```tsx
describe('Layout Integration', () => {
  it('handles complete sidebar state flow', async () => {
    render(
      <BrowserRouter>
        <AdminLayout>
          <ManagementLayout />
        </AdminLayout>
      </BrowserRouter>
    );
    
    // Test expand-on-hover
    const sidebar = screen.getByRole('navigation');
    fireEvent.mouseEnter(sidebar);
    
    await waitFor(() => {
      expect(screen.getByText('Management')).toBeVisible();
    });
    
    // Test dropdown interaction
    const dropdownTrigger = screen.getByTitle('Sidebar Options');
    fireEvent.click(dropdownTrigger);
    
    const collapsedOption = screen.getByText('Collapsed');
    fireEvent.click(collapsedOption);
    
    await waitFor(() => {
      const saved = localStorage.getItem('admin-sidebar-state');
      const state = JSON.parse(saved);
      expect(state.mode).toBe('collapsed');
    });
  });
});
```

## Migration Guide

### From Legacy Layout System

1. **Update Layout Structure:**
   ```tsx
   // Before
   <div className="admin-container">
     <Sidebar />
     <div className="content">
       <Component />
     </div>
   </div>
   
   // After
   <AdminLayout>
     <SectionLayout>
       <Component />
     </SectionLayout>
   </AdminLayout>
   ```

2. **Update Navigation Configuration:**
   ```tsx
   // Before
   const navItems = [
     { name: 'Users', path: '/admin/users' }
   ];
   
   // After
   const navItems = [
     {
       id: 'users',
       title: 'Users',
       href: '/admin/users',
       icon: Users,
       requiredAccess: ['system_admin']
     }
   ];
   ```

3. **Update Access Control:**
   ```tsx
   // Before
   if (user.role === 'admin') {
     // Show component
   }
   
   // After
   if (hasRequiredAccess(user, ['system_admin'])) {
     // Show component
   }
   ```

This comprehensive developer guide provides everything needed to work effectively with the admin layout and sidebar system. Use it as your primary reference for development, debugging, and optimization.