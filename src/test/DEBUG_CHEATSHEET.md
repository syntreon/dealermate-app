# Test Debugging Cheat Sheet

Quick reference for debugging test issues in the call dashboard application.

## Quick Debugging Commands

### Basic Test Execution
```bash
# Run specific test file
npm test -- LoginPage.test.tsx

# Run tests matching pattern
npm test -- --grep "authentication"

# Run single test
npm test -- --grep "should login successfully"

# Run with verbose output
npm test -- --reporter=verbose

# Run with coverage
npm test -- --coverage
```

### Debug Mode
```bash
# Debug with Node inspector
npm test -- --inspect-brk src/components/__tests__/LoginPage.test.tsx

# Debug with Chrome DevTools
node --inspect-brk node_modules/.bin/vitest run LoginPage.test.tsx
```

## Common Issues & Quick Fixes

### 1. Test Not Found / Import Errors

#### Symptoms
```
Error: Cannot find module '@/components/LoginPage'
```

#### Quick Fixes
```bash
# Check file exists
ls src/components/LoginPage.tsx

# Check import path
# ❌ Wrong: import LoginPage from '@/components/LoginPage'
# ✅ Correct: import LoginPage from '@/pages/Login'

# Check tsconfig paths
cat tsconfig.json | grep -A 5 "paths"
```

### 2. Mock Not Working

#### Symptoms
```
TypeError: mockFunction is not a function
```

#### Quick Fixes
```typescript
// ❌ Mock after import
import { apiService } from '@/services/apiService';
vi.mock('@/services/apiService');

// ✅ Mock before import
vi.mock('@/services/apiService', () => ({
  apiService: {
    getData: vi.fn(() => Promise.resolve([])),
  },
}));
import { apiService } from '@/services/apiService';

// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Async Test Failures

#### Symptoms
```
TestingLibraryElementError: Unable to find element
```

#### Quick Fixes
```typescript
// ❌ Not waiting for async operations
it('should show data', () => {
  render(<AsyncComponent />);
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// ✅ Wait for async operations
it('should show data', async () => {
  render(<AsyncComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// ✅ Alternative: findBy queries (built-in waiting)
it('should show data', async () => {
  render(<AsyncComponent />);
  expect(await screen.findByText('Data loaded')).toBeInTheDocument();
});
```

### 4. Component Not Rendering

#### Symptoms
```
TestingLibraryElementError: Unable to find an accessible element
```

#### Debug Steps
```typescript
it('debug rendering', () => {
  const { container } = render(<MyComponent />);
  
  // See what's actually rendered
  screen.debug();
  
  // Check if component rendered at all
  console.log('Container HTML:', container.innerHTML);
  
  // Check for specific elements
  console.log('All buttons:', screen.getAllByRole('button'));
});
```

### 5. Provider/Context Issues

#### Symptoms
```
Error: useAuth must be used within an AuthProvider
```

#### Quick Fixes
```typescript
// ❌ Missing provider wrapper
render(<ComponentUsingAuth />);

// ✅ Wrap with required providers
render(
  <BrowserRouter>
    <AuthProvider>
      <ComponentUsingAuth />
    </AuthProvider>
  </BrowserRouter>
);

// ✅ Use custom render utility
const renderWithProviders = (ui) => {
  return render(ui, { wrapper: AllTheProviders });
};
```

## Debugging Techniques

### 1. Visual Debugging

#### See Rendered Output
```typescript
// Debug entire component
screen.debug();

// Debug specific element
const button = screen.getByRole('button');
screen.debug(button);

// Debug with size limit
screen.debug(undefined, 20000); // Increase output limit
```

#### Check Element Queries
```typescript
// List all available roles
console.log('Available roles:', screen.getAllByRole(''));

// List all text content
console.log('All text:', screen.getAllByText(/./));

// Check element attributes
const input = screen.getByLabelText('Email');
console.log('Input attributes:', input.attributes);
```

### 2. Mock Debugging

#### Inspect Mock Calls
```typescript
const mockFn = vi.fn();

// After test interactions
console.log('Mock called:', mockFn.mock.calls.length, 'times');
console.log('Call arguments:', mockFn.mock.calls);
console.log('Last call:', mockFn.mock.lastCall);
console.log('Return values:', mockFn.mock.results);

// Check if mock was called with specific args
expect(mockFn).toHaveBeenCalledWith('expected', 'arguments');
```

#### Mock Implementation Debugging
```typescript
const mockApiCall = vi.fn().mockImplementation((...args) => {
  console.log('Mock called with:', args);
  return Promise.resolve({ data: 'test' });
});
```

### 3. Async Debugging

#### Debug Timing Issues
```typescript
it('debug async operations', async () => {
  console.log('Before render');
  render(<AsyncComponent />);
  
  console.log('Before wait');
  await waitFor(() => {
    console.log('Inside waitFor');
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
  
  console.log('After wait');
});
```

#### Check Promise States
```typescript
const mockPromise = Promise.resolve('data');
console.log('Promise state:', mockPromise);

// Wait for promise resolution
await mockPromise.then(data => {
  console.log('Promise resolved with:', data);
});
```

## Error Message Decoder

### Common Error Patterns

#### "toBeInTheDocument is not a function"
```bash
# Missing jest-dom setup
# Fix: Add to src/test/setup.ts
import '@testing-library/jest-dom';
```

#### "Cannot read property 'mockReturnValue' of undefined"
```typescript
// Mock not properly defined
// Fix: Ensure mock is created before use
const mockFn = vi.fn();
mockFn.mockReturnValue('value');
```

#### "Element is not visible"
```typescript
// Element might be hidden by CSS
// Debug: Check element styles
const element = screen.getByTestId('hidden-element');
console.log('Element styles:', getComputedStyle(element));

// Alternative: Use queryBy instead of getBy
expect(screen.queryByText('Hidden text')).not.toBeInTheDocument();
```

#### "Multiple elements found"
```typescript
// Query returned multiple elements
// Fix: Use more specific selector
// ❌ screen.getByText('Submit')
// ✅ screen.getByRole('button', { name: 'Submit' })
```

## Performance Debugging

### 1. Slow Tests

#### Identify Bottlenecks
```bash
# Run with timing
npm test -- --reporter=verbose

# Profile specific test
npm test -- --inspect-brk LoginPage.test.tsx
```

#### Common Causes & Fixes
```typescript
// ❌ Slow: Large mock data
const hugeMockArray = Array.from({ length: 10000 }, ...);

// ✅ Fast: Minimal test data
const mockData = [{ id: 1, name: 'Test' }];

// ❌ Slow: Real timers
setTimeout(() => {}, 1000);

// ✅ Fast: Fake timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
```

### 2. Memory Leaks

#### Detect Memory Issues
```typescript
// Check for cleanup
afterEach(() => {
  // Verify no lingering timers
  vi.clearAllTimers();
  
  // Verify no open connections
  // (Add specific cleanup checks)
});
```

## Environment Issues

### 1. CI/CD Failures

#### Local vs CI Differences
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check environment variables
env | grep -i test

# Run in CI-like environment
CI=true npm test
```

#### Common CI Fixes
```typescript
// Increase timeouts for CI
vi.setTimeout(10000); // 10 seconds

// Mock time-sensitive operations
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01'));
```

### 2. Browser Environment Issues

#### jsdom Limitations
```typescript
// ❌ Not available in jsdom
window.scrollTo(0, 100);

// ✅ Mock browser APIs
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});
```

## Quick Reference Commands

### Test Execution
| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests in watch mode |
| `npm run test:run` | Run all tests once |
| `npm test -- --coverage` | Run with coverage report |
| `npm test -- --ui` | Open Vitest UI |
| `npm test -- --grep "pattern"` | Run tests matching pattern |

### Debugging
| Command | Purpose |
|---------|---------|
| `screen.debug()` | Print rendered HTML |
| `console.log(mockFn.mock.calls)` | Check mock calls |
| `vi.clearAllMocks()` | Reset all mocks |
| `waitFor(() => {})` | Wait for async operations |
| `screen.logTestingPlaygroundURL()` | Get testing playground URL |

### Common Queries
| Query | Use Case |
|-------|---------|
| `getByRole('button')` | Find button elements |
| `getByLabelText('Email')` | Find form inputs |
| `getByText('Submit')` | Find text content |
| `getByTestId('custom-id')` | Find by test ID |
| `queryBy*` | Non-throwing queries |
| `findBy*` | Async queries |

## Emergency Procedures

### 1. All Tests Failing
```bash
# Check basic setup
npm install
npm run build

# Clear cache
rm -rf node_modules/.cache
npm test -- --no-cache

# Check for global issues
npm test -- --reporter=verbose | head -20
```

### 2. Flaky Tests
```bash
# Run test multiple times
for i in {1..10}; do npm test -- LoginPage.test.tsx; done

# Add debugging
console.log('Test run:', Date.now());

# Increase timeouts
vi.setTimeout(30000);
```

### 3. Mock Issues
```typescript
// Reset everything
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

// Check mock setup
console.log('Mock implementation:', mockFn.getMockImplementation());
```

## Pro Tips

### 1. Efficient Debugging
- Use `screen.logTestingPlaygroundURL()` for query suggestions
- Add `data-testid` attributes for reliable element selection
- Use `userEvent` instead of `fireEvent` for more realistic interactions
- Keep test data minimal but realistic

### 2. Better Error Messages
```typescript
// ❌ Generic assertion
expect(result).toBe(true);

// ✅ Descriptive assertion
expect(result).toBe(true, 'User should be authenticated after login');

// ✅ Custom matcher
expect(screen.getByRole('button')).toBeEnabled();
```

### 3. Debugging Workflow
1. **Reproduce** - Run the failing test in isolation
2. **Isolate** - Add `screen.debug()` to see what's rendered
3. **Inspect** - Check mock calls and async operations
4. **Fix** - Make minimal changes to fix the issue
5. **Verify** - Run test multiple times to ensure stability

This cheat sheet should help you quickly identify and resolve common testing issues. Keep it handy during development!