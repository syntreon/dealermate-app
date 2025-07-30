# AdminSidebar Dropdown Fix

## Problem
When in expand-on-hover mode, clicking the sidebar options button would show the dropdown for a fraction of a second before the sidebar collapsed, preventing users from switching sidebar modes.

## Root Cause
The dropdown menu content is rendered outside the sidebar container (due to portal behavior in shadcn/ui). When the user moves their mouse to interact with the dropdown, it triggers the `onMouseLeave` event on the sidebar, causing it to collapse immediately.

## Solution
1. **Added dropdown state tracking**: Added `isDropdownOpen` state to track when the dropdown is open
2. **Prevented collapse during dropdown interaction**: Modified `handleMouseLeave` to not collapse the sidebar when the dropdown is open
3. **Added dropdown state handler**: Created `handleDropdownOpenChange` to manage dropdown state changes
4. **Delayed collapse on dropdown close**: When dropdown closes, added a small delay before checking if sidebar should collapse

## Key Changes

### State Management
```typescript
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
```

### Mouse Leave Handler Update
```typescript
const handleMouseLeave = () => {
  if (sidebarState.mode === 'expand-on-hover' && !isDropdownOpen) {
    // Only collapse if dropdown is not open
    hoverTimeoutRef.current = setTimeout(() => {
      setSidebarState(prev => ({ ...prev, isHovered: false }));
    }, 150);
  }
};
```

### Dropdown State Handler
```typescript
const handleDropdownOpenChange = (open: boolean) => {
  setIsDropdownOpen(open);
  
  // If dropdown closes and we're in expand-on-hover mode, check if we should collapse
  if (!open && sidebarState.mode === 'expand-on-hover') {
    // Small delay to allow user to move mouse back to sidebar if needed
    hoverTimeoutRef.current = setTimeout(() => {
      setSidebarState(prev => ({ ...prev, isHovered: false }));
    }, 200);
  }
};
```

### Dropdown Component Updates
```typescript
<DropdownMenu onOpenChange={handleDropdownOpenChange}>
```

## Expected Behavior After Fix
1. User hovers over sidebar in expand-on-hover mode → overlay appears
2. User clicks sidebar options button → dropdown opens and stays open
3. User can interact with dropdown options without sidebar collapsing
4. When dropdown closes:
   - If mouse is still over sidebar → sidebar stays expanded
   - If mouse has left sidebar → sidebar collapses after small delay
5. User can successfully switch between sidebar modes

## Testing Checklist
- [ ] Expand-on-hover mode works correctly
- [ ] Dropdown opens and stays open when clicked
- [ ] Can select different sidebar modes from dropdown
- [ ] Sidebar doesn't collapse while dropdown is open
- [ ] Sidebar collapses appropriately when dropdown closes and mouse leaves
- [ ] All three sidebar modes still work correctly
- [ ] No regression in other sidebar functionality