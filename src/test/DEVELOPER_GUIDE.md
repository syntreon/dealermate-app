# Test Suite Developer Guide

This guide provides comprehensive instructions for developers working with the call dashboard test suite. Whether you're new to the project or an experienced developer, this guide will help you understand, maintain, and extend the testing infrastructure.

## Quick Start

### For New Developers

#### 1. Environment Setup
```bash
# Install dependencies
npm install

# Run all tests to verify setup
npm test

# Run tests with UI for interactive debugging
npm run test:ui
```

#### 2. Understanding the Test Structure
```
src/
├── components/__tests__/     # Unit tests for UI components
├── hooks/__tests__/          # Unit tests for custom hooks
├── pages/__tests__/          # Unit tests for page components
├── test/
│   ├── integration/          # Integration tests
│   ├── e2e/                  # End-to-end tests
│   └── setup.ts             # Global test configuration
```

#### 3. Running Your First Test
```bash
# Run a specific test file
npm test -- src/components/__tests__/LoginPage.test.tsx

# Run tests in watch mode (recommended for development)
npm test

# Run tests with coverage
npm test -- --coverage
```

### For Experienced Developers

#### Quick Reference Commands
```bash
# Run all tests once
npm run test:run

# Run specific test pattern
npm test -- --grep "authentication"

# Run tests with verbose output
npm test -- --reporter=verbose

# Debug specific test
npm test -- --inspect-brk src/test/integration/auth-flow.integration.test.tsx
```

## Test Development Workflow

### 1. Test-Driven Development (TDD)

#### Red-Green-Refactor Cycle
```typescript
// 1. RED: Write failing test
it('should display user name when logged in', () => {
  render(<UserProfile />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

// 2. GREEN: Make test pass with minimal code
const UserProfile = () => <div>John Doe</div>;

// 3. REFACTOR: Improve implementation
const UserProfile = () => {
  const { user } = useAuth();
  return <div>{user?.full_name}</div>;
};
```

#### Best Practices for TDD
- Write the simplest test that fails
- Write minimal code to make it pass
- Refactor while keeping tests green
- Add edge cases and error scenarios

### 2. Component Testing Strategy

#### Testing Component Behavior, Not Implementation
```typescript
// ❌ Bad: Testing implementation details
it('should call useState with initial value', () => {
  const useStateSpy = vi.spyOn(React, 'useState');
  render(<Counter />);
  expect(useStateSpy).toHaveBeenCalledWith(0);
});

// ✅ Good: Testing user-visible behavior
it('should display initial count of 0', () => {
  render(<Counter />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
});
```

#### Component Testing Checklist
- [ ] Renders without crashing
- [ ] Displays expected content
- [ ] Handles user interactions correctly
- [ ] Shows proper loading states
- [ ] Displays error states appropriately
- [ ] Maintains accessibility standards

### 3. Mock Strategy Guidelines

#### When to Mock
- External APIs and services
- Complex dependencies
- Time-dependent functions
- File system operations
- Network requests

#### When NOT to Mock
- Simple utility functions
- React hooks (unless complex)
- Components being tested
- Standard library functions

#### Mock Implementation Patterns
```typescript
// Service mocking
vi.mock('@/services/apiService', () => ({
  apiService: {
    getData: vi.fn(() => Promise.resolve(mockData)),
    postData: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

// Hook mocking with different return values
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// In test:
mockUseAuth.mockReturnValue({
  user: mockUser,
  isAuthenticated: true,
});
```

## Advanced Testing Patterns

### 1. Custom Render Functions

#### Creating Reusable Test Utilities
```typescript
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

interface CustomRenderOptions extends RenderOptions {
  initialRoute?: string;
  user?: User | null;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialRoute = '/', user = null, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AuthProvider initialUser={user}>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
```

#### Usage in Tests
```typescript
import { renderWithProviders } from '../test-utils';

it('should show admin menu for admin users', () => {
  renderWithProviders(<Navigation />, {
    user: { ...mockUser, role: 'admin' }
  });
  
  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
});
```

### 2. Async Testing Patterns

#### Testing Async Operations
```typescript
it('should load and display user data', async () => {
  const mockUser = { id: '1', name: 'John Doe' };
  mockApiService.getUser.mockResolvedValue(mockUser);

  render(<UserProfile userId="1" />);

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  // Verify API was called correctly
  expect(mockApiService.getUser).toHaveBeenCalledWith('1');
});
```

#### Handling Race Conditions
```typescript
it('should handle rapid state changes', async () => {
  const { rerender } = render(<SearchResults query="initial" />);

  // Simulate rapid query changes
  rerender(<SearchResults query="updated" />);
  rerender(<SearchResults query="final" />);

  // Wait for final result
  await waitFor(() => {
    expect(screen.getByText('Results for: final')).toBeInTheDocument();
  });
});
```

### 3. Error Boundary Testing

#### Testing Error Scenarios
```typescript
it('should display error boundary when component throws', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Integration Testing Best Practices

### 1. Testing Component Interactions

#### Multi-Component Workflows
```typescript
it('should complete user registration flow', async () => {
  render(<RegistrationWizard />);

  // Step 1: Personal Info
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  fireEvent.click(screen.getByText('Next'));

  // Step 2: Password Setup
  await waitFor(() => {
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'SecurePass123!' }
  });
  fireEvent.click(screen.getByText('Complete Registration'));

  // Verify completion
  await waitFor(() => {
    expect(screen.getByText('Registration Successful')).toBeInTheDocument();
  });
});
```

### 2. API Integration Testing

#### Testing Service Layer Integration
```typescript
it('should handle API errors gracefully', async () => {
  // Mock API failure
  mockSupabase.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => Promise.reject(new Error('Network error')))
    }))
  });

  render(<DataTable />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });

  // Verify retry functionality
  const retryButton = screen.getByText('Retry');
  fireEvent.click(retryButton);

  expect(mockSupabase.from).toHaveBeenCalledTimes(2);
});
```

## End-to-End Testing Guidelines

### 1. User Journey Testing

#### Complete Workflow Testing
```typescript
it('should complete full authentication journey', async () => {
  // Start at login page
  render(<App />);

  // User logs in
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'user@example.com' }
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' }
  });
  fireEvent.click(screen.getByText('Sign In'));

  // Verify dashboard loads
  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  // User navigates to profile
  fireEvent.click(screen.getByText('Profile'));

  // Verify profile page
  await waitFor(() => {
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  // User logs out
  fireEvent.click(screen.getByText('Logout'));

  // Verify return to login
  await waitFor(() => {
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
```

### 2. Cross-Component State Management

#### Testing Global State Changes
```typescript
it('should update UI across components when user changes', async () => {
  render(<App />);

  // Initial state
  expect(screen.getByText('Guest User')).toBeInTheDocument();

  // Simulate login
  const loginButton = screen.getByText('Login');
  fireEvent.click(loginButton);

  // Mock successful authentication
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  // Verify state change reflected in navigation
  expect(screen.getByText('Logout')).toBeInTheDocument();
  expect(screen.queryByText('Login')).not.toBeInTheDocument();
});
```

## Performance Testing

### 1. Component Performance

#### Testing Render Performance
```typescript
it('should render large lists efficiently', async () => {
  const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  const startTime = performance.now();
  
  render(<VirtualizedList items={largeDataset} />);
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;

  // Should render within reasonable time
  expect(renderTime).toBeLessThan(100); // 100ms threshold

  // Should only render visible items
  const visibleItems = screen.getAllByTestId('list-item');
  expect(visibleItems.length).toBeLessThan(50); // Virtualization working
});
```

### 2. Memory Leak Testing

#### Testing Component Cleanup
```typescript
it('should clean up resources on unmount', () => {
  const mockCleanup = vi.fn();
  
  const TestComponent = () => {
    useEffect(() => {
      const interval = setInterval(() => {}, 1000);
      return () => {
        clearInterval(interval);
        mockCleanup();
      };
    }, []);
    
    return <div>Test</div>;
  };

  const { unmount } = render(<TestComponent />);
  unmount();

  expect(mockCleanup).toHaveBeenCalled();
});
```

## Accessibility Testing

### 1. Automated Accessibility Testing

#### Using jest-axe for A11y Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 2. Keyboard Navigation Testing

#### Testing Keyboard Interactions
```typescript
it('should support keyboard navigation', () => {
  render(<NavigationMenu />);

  const firstItem = screen.getByRole('menuitem', { name: 'Home' });
  firstItem.focus();

  // Test Tab navigation
  fireEvent.keyDown(firstItem, { key: 'Tab' });
  
  const secondItem = screen.getByRole('menuitem', { name: 'About' });
  expect(secondItem).toHaveFocus();

  // Test Enter activation
  fireEvent.keyDown(secondItem, { key: 'Enter' });
  expect(mockNavigate).toHaveBeenCalledWith('/about');
});
```

## Debugging Test Issues

### 1. Common Debugging Techniques

#### Using screen.debug()
```typescript
it('should debug component output', () => {
  render(<ComplexComponent />);
  
  // Debug entire component
  screen.debug();
  
  // Debug specific element
  const button = screen.getByRole('button');
  screen.debug(button);
});
```

#### Inspecting Mock Calls
```typescript
it('should verify mock interactions', () => {
  const mockFn = vi.fn();
  
  render(<ComponentWithCallback onCallback={mockFn} />);
  
  fireEvent.click(screen.getByText('Trigger'));
  
  // Debug mock calls
  console.log('Mock calls:', mockFn.mock.calls);
  console.log('Call count:', mockFn.mock.calls.length);
  console.log('Last call args:', mockFn.mock.lastCall);
});
```

### 2. Troubleshooting Common Issues

#### Test Timing Issues
```typescript
// ❌ Problematic: Not waiting for async operations
it('should show success message', () => {
  render(<AsyncComponent />);
  fireEvent.click(screen.getByText('Submit'));
  expect(screen.getByText('Success')).toBeInTheDocument(); // May fail
});

// ✅ Fixed: Properly waiting for async operations
it('should show success message', async () => {
  render(<AsyncComponent />);
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

#### Mock Not Working
```typescript
// ❌ Problematic: Mock defined after import
import { apiService } from '@/services/apiService';
vi.mock('@/services/apiService');

// ✅ Fixed: Mock defined before import
vi.mock('@/services/apiService', () => ({
  apiService: {
    getData: vi.fn(),
  },
}));
import { apiService } from '@/services/apiService';
```

## Test Maintenance

### 1. Keeping Tests Up to Date

#### Regular Maintenance Tasks
- Update test data when schemas change
- Refactor tests when components change
- Remove obsolete tests
- Update mocks when APIs change
- Review and optimize slow tests

#### Test Health Monitoring
```typescript
// Add test metadata for monitoring
it('should load user dashboard', async () => {
  const startTime = Date.now();
  
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
  
  const duration = Date.now() - startTime;
  
  // Log performance metrics
  console.log(`Test duration: ${duration}ms`);
  
  // Fail if test is too slow
  expect(duration).toBeLessThan(5000);
});
```

### 2. Test Code Quality

#### Test Code Review Checklist
- [ ] Tests are readable and well-named
- [ ] Tests are focused and test one thing
- [ ] Proper use of mocks and test doubles
- [ ] Good error messages for failures
- [ ] No test interdependencies
- [ ] Proper cleanup in afterEach/afterAll

#### Refactoring Test Code
```typescript
// ❌ Before: Repetitive test setup
describe('UserProfile', () => {
  it('should show user name', () => {
    const mockUser = { id: '1', name: 'John' };
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should show user email', () => {
    const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});

// ✅ After: Extracted common setup
describe('UserProfile', () => {
  const defaultUser = { id: '1', name: 'John', email: 'john@example.com' };
  
  const renderUserProfile = (user = defaultUser) => {
    return render(<UserProfile user={user} />);
  };

  it('should show user name', () => {
    renderUserProfile();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should show user email', () => {
    renderUserProfile();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## Emergency Procedures

### 1. Critical Test Failures

#### When Tests Fail in CI/CD
1. **Immediate Actions**:
   - Check if it's a flaky test (re-run)
   - Look for recent code changes
   - Check environment differences

2. **Investigation Steps**:
   - Run tests locally
   - Check mock configurations
   - Verify test data and setup
   - Look for timing issues

3. **Resolution**:
   - Fix the underlying issue
   - Update test if behavior changed
   - Skip test temporarily if blocking (with ticket)

### 2. Performance Issues

#### When Tests Become Slow
1. **Identify Bottlenecks**:
   ```bash
   npm test -- --reporter=verbose --timeout=10000
   ```

2. **Common Solutions**:
   - Optimize mock implementations
   - Reduce test data size
   - Parallelize test execution
   - Use more specific selectors

3. **Monitoring**:
   - Set up test performance alerts
   - Track test execution times
   - Regular performance reviews

## Best Practices Summary

### Do's ✅
- Write tests that test behavior, not implementation
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies
- Test error scenarios
- Include accessibility checks
- Use proper async patterns
- Clean up after tests

### Don'ts ❌
- Don't test implementation details
- Don't write interdependent tests
- Don't ignore flaky tests
- Don't mock everything
- Don't write overly complex tests
- Don't skip error cases
- Don't forget edge cases
- Don't leave debugging code in tests

This developer guide provides the foundation for effective testing in the call dashboard application. Regular updates and team collaboration ensure the test suite remains valuable and maintainable.