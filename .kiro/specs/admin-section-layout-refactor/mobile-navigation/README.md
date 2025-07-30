# Mobile Navigation System

## Overview

The mobile navigation system provides a responsive, touch-optimized navigation experience for the admin panel. It automatically switches between desktop sidebar and mobile drawer based on screen size, ensuring optimal usability across all devices.

## Features

### 🎯 Core Functionality
- **Responsive Design**: Automatically switches between desktop and mobile layouts at 768px breakpoint
- **Touch Gestures**: Supports swipe gestures for opening/closing navigation drawer
- **Simplified Navigation**: Clean, single-level navigation structure without dual-sidebar complexity
- **Role-based Access**: Shows appropriate navigation items based on user permissions
- **Accessibility**: Full keyboard navigation and screen reader support

### 📱 Mobile-Specific Features
- **Edge Swipe Detection**: Open drawer by swiping right from the left edge (first 50px)
- **Gesture Prevention**: Prevents accidental opening from center screen swipes
- **Touch Target Optimization**: 48px minimum touch targets for better usability
- **Body Scroll Lock**: Prevents background scrolling when drawer is open
- **Escape Key Support**: Close drawer with Escape key
- **Focus Management**: Proper focus handling for accessibility

### 🎨 Visual Enhancements
- **Backdrop Blur**: Modern backdrop blur effect on overlay
- **Smooth Animations**: 300ms transition animations for all state changes
- **Theme Integration**: Fully integrated with the application theme system
- **Visual Feedback**: Clear active states and hover effects

## Implementation Details

### Component Structure

```
AdminSidebar
├── DesktopAdminSidebar (> 768px)
│   ├── 3-state sidebar (expanded/collapsed/expand-on-hover)
│   └── Footer controls
└── MobileAdminNavigation (< 768px)
    ├── Menu trigger button
    ├── Swipe area for gestures
    └── Drawer overlay
        ├── Header with close button
        ├── Back to main app button
        ├── Navigation items
        └── Footer with app info
```

### Responsive Breakpoints

| Screen Size | Behavior | Navigation Type |
|-------------|----------|-----------------|
| < 768px | Mobile | Drawer overlay |
| 768px - 1024px | Tablet | Desktop sidebar |
| > 1024px | Desktop | Desktop sidebar |

### Touch Gesture System

#### Opening Gestures
- **Right Swipe**: From left edge (0-50px) with minimum 50px distance
- **Menu Button**: Tap the hamburger menu button

#### Closing Gestures
- **Left Swipe**: Anywhere on drawer with minimum 50px distance
- **Overlay Tap**: Tap outside the drawer content
- **Close Button**: Tap the X button in drawer header
- **Navigation Item**: Tap any navigation link
- **Escape Key**: Press Escape key

#### Gesture Prevention
- Swipes starting from center screen (>50px from left edge) are ignored
- Prevents accidental drawer opening during normal scrolling

## Usage Examples

### Basic Implementation

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        {/* Your admin content */}
      </main>
    </div>
  );
}
```

### With Layout Integration

```tsx
import { useIsMobile } from '@/hooks/use-mobile';
import AdminSidebar from '@/components/admin/AdminSidebar';

function ResponsiveAdminLayout() {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <main 
        className={cn(
          "transition-all duration-300",
          isMobile ? "pt-20 px-4" : "ml-16 p-6"
        )}
      >
        {/* Content automatically adjusts to sidebar state */}
      </main>
    </div>
  );
}
```

## Accessibility Features

### Keyboard Navigation
- **Tab Navigation**: All interactive elements are keyboard accessible
- **Escape Key**: Closes drawer when open
- **Enter/Space**: Activates buttons and links
- **Arrow Keys**: Navigate between menu items

### Screen Reader Support
- **ARIA Labels**: All buttons have descriptive labels
- **ARIA States**: Proper expanded/collapsed states
- **Semantic HTML**: Uses proper navigation landmarks
- **Focus Management**: Logical focus order and trapping

### Touch Accessibility
- **Minimum Touch Targets**: 48px minimum for all interactive elements
- **Touch Feedback**: Visual feedback for all touch interactions
- **Gesture Alternatives**: All gestures have button alternatives

## Performance Optimizations

### Rendering Optimizations
- **Conditional Rendering**: Only renders mobile or desktop version, not both
- **Memoized Components**: Prevents unnecessary re-renders
- **Efficient State Management**: Minimal state updates

### Animation Performance
- **Hardware Acceleration**: Uses transform3d for smooth animations
- **Debounced Gestures**: Prevents excessive event handling
- **Optimized Transitions**: Uses CSS transitions instead of JavaScript animations

### Memory Management
- **Event Cleanup**: Proper cleanup of event listeners
- **State Reset**: Resets state when switching between mobile/desktop
- **Timeout Management**: Clears timeouts on component unmount

## Testing

### Test Coverage
- **Unit Tests**: Component rendering and behavior
- **Integration Tests**: Navigation flow and state management
- **Responsive Tests**: Behavior across different screen sizes
- **Accessibility Tests**: Keyboard navigation and screen reader support
- **Touch Tests**: Gesture recognition and touch interactions

### Test Files
- `MobileNavigation.test.tsx` - Core mobile navigation functionality
- `ResponsiveNavigation.test.tsx` - Responsive behavior across breakpoints

### Running Tests

```bash
# Run all navigation tests
npm test -- --testPathPattern="admin.*Navigation"

# Run specific test file
npm test -- src/components/admin/__tests__/MobileNavigation.test.tsx

# Run with coverage
npm test -- --coverage --testPathPattern="admin.*Navigation"
```

## Browser Support

### Modern Browsers
- **Chrome**: 88+ (full support)
- **Firefox**: 85+ (full support)
- **Safari**: 14+ (full support)
- **Edge**: 88+ (full support)

### Touch Support
- **iOS Safari**: 12+ (full touch gesture support)
- **Chrome Mobile**: 88+ (full touch gesture support)
- **Samsung Internet**: 15+ (full touch gesture support)

### Fallbacks
- **No Touch Support**: Falls back to button-only navigation
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Supports high contrast mode

## Troubleshooting

### Common Issues

#### Drawer Not Opening on Mobile
1. Check if `useIsMobile` hook is working correctly
2. Verify screen width detection
3. Ensure touch events are not being prevented

#### Gestures Not Working
1. Check if touch events are supported
2. Verify swipe area positioning
3. Ensure no other touch handlers are interfering

#### Layout Issues
1. Verify CSS transitions are enabled
2. Check z-index stacking
3. Ensure proper viewport meta tag

### Debug Commands

```bash
# Check mobile detection
console.log('Is Mobile:', useIsMobile());

# Check touch support
console.log('Touch Support:', 'ontouchstart' in window);

# Check viewport width
console.log('Viewport Width:', window.innerWidth);
```

## Migration Guide

### From Dual-Sidebar System

If migrating from the old dual-sidebar system:

1. **Remove Dual-Sidebar Logic**
   ```tsx
   // Old - Remove this
   const [subSidebarVisible, setSubSidebarVisible] = useState(false);
   
   // New - Use section-specific layouts instead
   // Each section now has its own layout component
   ```

2. **Update Navigation Structure**
   ```tsx
   // Old - Complex nested navigation
   const navItems = {
     main: [...],
     sub: [...]
   };
   
   // New - Simplified single-level navigation
   const navItems = [...];
   ```

3. **Update Layout Components**
   ```tsx
   // Old - Manual sidebar width calculations
   const sidebarWidth = mainWidth + subWidth;
   
   // New - Automatic responsive handling
   // Layout automatically adjusts to sidebar state
   ```

### Breaking Changes

- **Navigation Structure**: Simplified from dual-sidebar to single-level
- **State Management**: Removed sub-sidebar state management
- **CSS Classes**: Updated class names for new structure
- **Event Handling**: Simplified event system

## Future Enhancements

### Planned Features
- **Gesture Customization**: Allow users to customize gesture sensitivity
- **Animation Preferences**: Respect user motion preferences
- **Offline Support**: Cache navigation state for offline use
- **PWA Integration**: Enhanced mobile app experience

### Performance Improvements
- **Virtual Scrolling**: For large navigation lists
- **Lazy Loading**: Load navigation items on demand
- **Service Worker**: Cache navigation assets

## Contributing

### Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow project linting rules
- **Prettier**: Auto-format on save
- **Testing**: Write tests for new features

### Pull Request Guidelines

1. **Test Coverage**: Maintain 90%+ test coverage
2. **Documentation**: Update README for new features
3. **Accessibility**: Ensure WCAG 2.1 AA compliance
4. **Performance**: No performance regressions
5. **Browser Testing**: Test on major browsers

## License

This component is part of the Dealermate application and follows the project's licensing terms.