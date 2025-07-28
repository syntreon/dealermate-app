# Debug Cheatsheet: Quick Solutions
## Dealermate Application

### 🚀 Quick Reference

This cheatsheet provides immediate solutions for common debugging scenarios. Use this when you need fast answers without diving into detailed documentation.

---

## 🔐 Authentication & Session Issues

### Problem: User stuck on loading screen
```bash
# Check browser console for errors
# Look for: "Loading user profile for ID: ..."

# Quick fixes:
1. Clear localStorage: localStorage.clear()
2. Force refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
3. Check network tab for failed API calls
```

### Problem: Permission denied errors
```typescript
// Debug permission state
console.log('User permissions:', {
  user: user,
  role: user?.role,
  is_admin: user?.is_admin,
  client_id: user?.client_id,
  hasSystemAccess: hasSystemWideAccess(user),
  canViewSensitive: canViewSensitiveInfo(user)
});
```

### Problem: Theme not applying correctly
```typescript
// Check theme state
console.log('Theme debug:', {
  currentTheme: document.documentElement.getAttribute('data-theme'),
  userPreference: user?.preferences?.displaySettings?.theme,
  systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches
});

// Force theme reset
document.documentElement.setAttribute('data-theme', 'light');
```

---

## 📊 Data Fetching Issues

### Problem: Data not loading
```typescript
// Check query state
const { data, isLoading, error, isError } = useQuery('key', fetchFn);
console.log('Query debug:', { data, isLoading, error, isError });

// Force refetch
queryClient.invalidateQueries('key');
queryClient.refetchQueries('key');
```

### Problem: Stale data showing
```typescript
// Clear React Query cache
queryClient.clear();

// Or clear specific query
queryClient.removeQueries('specific-key');

// Check cache contents
console.log('Cache:', queryClient.getQueryCache().getAll());
```

### Problem: Database connection issues
```bash
# Check Supabase connection
# In browser console:
supabase.from('users').select('id').limit(1)
  .then(result => console.log('DB test:', result))
  .catch(error => console.error('DB error:', error));
```

---

## 🎨 UI/UX Issues

### Problem: Components not re-rendering
```typescript
// Check component dependencies
useEffect(() => {
  console.log('Effect triggered:', { dependency1, dependency2 });
}, [dependency1, dependency2]);

// Force re-render
const [, forceUpdate] = useReducer(x => x + 1, 0);
forceUpdate();
```

### Problem: Styles not applying
```css
/* Check CSS specificity in DevTools */
/* Force style with !important (temporary fix) */
.my-class {
  color: red !important;
}

/* Check if Tailwind classes are loading */
/* Look for tw- prefixes in compiled CSS */
```

### Problem: Mobile layout broken
```css
/* Quick responsive debug */
.debug-mobile {
  border: 2px solid red !important;
  background: rgba(255, 0, 0, 0.1) !important;
}

/* Add to problematic elements temporarily */
```

---

## ⚡ Performance Issues

### Problem: Slow component rendering
```typescript
// Add render timing
const Component = () => {
  console.time('Component render');
  
  // Component logic here
  
  useEffect(() => {
    console.timeEnd('Component render');
  });
  
  return <div>...</div>;
};
```

### Problem: Memory leaks
```typescript
// Check for cleanup in useEffect
useEffect(() => {
  const subscription = subscribe();
  const interval = setInterval(() => {}, 1000);
  
  return () => {
    subscription.unsubscribe(); // ✅ Cleanup
    clearInterval(interval);    // ✅ Cleanup
  };
}, []);
```

### Problem: Bundle size too large
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist

# Check for duplicate dependencies
npm ls --depth=0
```

---

## 🔧 Common Quick Fixes

### Clear All Caches
```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}
location.reload(true);
```

### Reset User Session
```javascript
// Run in browser console
supabase.auth.signOut().then(() => {
  localStorage.clear();
  location.href = '/login';
});
```

### Force Component Re-mount
```typescript
// Add key prop to force re-mount
const [key, setKey] = useState(0);
const forceRemount = () => setKey(prev => prev + 1);

return <Component key={key} />;
```

### Debug React Query
```javascript
// Enable React Query DevTools in production
window.__REACT_QUERY_DEVTOOLS__ = true;

// Check query state
console.log(queryClient.getQueryData(['key']));
console.log(queryClient.getQueryState(['key']));
```

---

## 🐛 Error Patterns & Solutions

### Error: "Cannot read property 'X' of undefined"
```typescript
// Quick fix: Optional chaining
user.preferences.theme          // ❌ Can crash
user?.preferences?.theme        // ✅ Safe

// Or with fallback
const theme = user?.preferences?.theme || 'system';
```

### Error: "Maximum update depth exceeded"
```typescript
// Common cause: Object/array in dependency
useEffect(() => {
  // ...
}, [{ filter: 'active' }]); // ❌ New object every render

// Fix: Memoize or use primitive values
const filter = useMemo(() => ({ filter: 'active' }), []);
useEffect(() => {
  // ...
}, [filter]); // ✅ Stable reference
```

### Error: "Cannot update component while rendering"
```typescript
// Common cause: State update during render
const Component = () => {
  if (condition) {
    setState(newValue); // ❌ State update during render
  }
  return <div>...</div>;
};

// Fix: Move to useEffect
const Component = () => {
  useEffect(() => {
    if (condition) {
      setState(newValue); // ✅ State update in effect
    }
  }, [condition]);
  
  return <div>...</div>;
};
```

---

## 🔍 Debugging Commands

### Browser Console Commands
```javascript
// Check React version
React.version

// Get component props (select element first)
$0._owner.memoizedProps

// Check if element is in viewport
$0.getBoundingClientRect()

// Monitor network requests
fetch = new Proxy(fetch, {
  apply: (target, thisArg, args) => {
    console.log('Fetch:', args[0]);
    return target.apply(thisArg, args);
  }
});
```

### React DevTools
```bash
# Component search shortcuts
Ctrl+F (Windows) / Cmd+F (Mac) - Search components
Ctrl+Shift+F - Search by prop/state value

# Profiler shortcuts
Record - Start profiling
Stop - Stop profiling
Clear - Clear profiling data
```

### Network Debugging
```javascript
// Monitor all API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API Call:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('API Response:', response.status, args[0]);
      return response;
    });
};
```

---

## 🚨 Emergency Procedures

### App Completely Broken
1. Check browser console for errors
2. Clear all storage: `localStorage.clear(); sessionStorage.clear();`
3. Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
4. Check network tab for failed requests
5. Revert to last known working commit

### Database Issues
1. Check Supabase dashboard status
2. Verify API keys in environment variables
3. Test connection: `supabase.from('users').select('id').limit(1)`
4. Check RLS policies if getting permission errors

### Authentication Broken
1. Clear auth tokens: `localStorage.removeItem('supabase.auth.token')`
2. Sign out: `supabase.auth.signOut()`
3. Check auth callback URL configuration
4. Verify user exists in database

### Performance Emergency
1. Open React DevTools Profiler
2. Record interaction causing slowness
3. Look for components with long render times
4. Check for unnecessary re-renders
5. Temporarily disable expensive features

---

## 📱 Mobile-Specific Issues

### Touch Events Not Working
```css
/* Add to problematic elements */
.touch-fix {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

### Viewport Issues
```html
<!-- Check meta viewport tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### iOS Safari Specific
```css
/* Fix iOS Safari 100vh issue */
.full-height {
  height: 100vh;
  height: -webkit-fill-available;
}
```

---

## 🔗 Quick Links

### Development Tools
- **React DevTools**: Browser extension for component debugging
- **Redux DevTools**: State management debugging
- **React Query DevTools**: Query state inspection
- **Lighthouse**: Performance and accessibility auditing

### Documentation
- [Main Bug Analysis](./comprehensive-bug-analysis.md)
- [Developer Guide](./developer-guide.md)
- [Troubleshooting Flow](./troubleshooting-flow.md)

### External Resources
- [React DevTools Guide](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Supabase Docs](https://supabase.com/docs)

---

*Keep this cheatsheet handy for quick problem resolution. For complex issues, refer to the detailed guides.*