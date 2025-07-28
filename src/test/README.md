# Comprehensive Test Suite

This document provides an overview of the comprehensive test suite implemented for the call dashboard application. The test suite follows a three-tier testing strategy: unit tests, integration tests, and end-to-end tests.

## Test Architecture

### Testing Strategy

Our testing approach follows the testing pyramid:

1. **Unit Tests (70%)** - Fast, isolated tests for individual components and functions
2. **Integration Tests (20%)** - Tests for component interactions and API integrations
3. **End-to-End Tests (10%)** - Full user workflow tests

### Technology Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: Vitest mocks
- **Assertions**: Vitest/Chai assertions with jest-dom matchers
- **Environment**: jsdom

## Test Structure

### Unit Tests

Located in `src/components/__tests__/`, `src/hooks/__tests__/`, `src/pages/__tests__/`

#### Core Components Tested:
- **LoginPage** - Authentication form validation and submission
- **AppSidebar** - Navigation and role-based menu items
- **CallLogsTable** - Data display, filtering, and sorting
- **MetricsSummaryCards** - Dashboard metrics display
- **AuthContext** - Authentication state management
- **FormValidation** - Form validation with Zod schemas

#### Authentication Components:
- **AuthCallback** - Token processing and redirects
- **ResetPassword** - Password validation and update flow
- **useAuthSession** - Authentication hook logic

### Integration Tests

Located in `src/test/integration/`

#### Authentication Flow Integration:
- Complete login workflow
- Invitation and password reset flow
- Session management and token refresh
- Error handling and recovery

#### API Service Integration:
- Admin service operations (user creation, deletion)
- Calls service with filtering and pagination
- Dashboard service metrics aggregation
- Error handling and data consistency

### End-to-End Tests

Located in `src/test/e2e/`

#### Critical User Flows:
- **Authentication E2E** - Complete login, invitation, and logout flows
- **Call Management E2E** - Call logs viewing, filtering, and details
- **Admin Functionality E2E** - User and client management workflows

## Running Tests

### All Tests
```bash
npm test
```

### Run Tests Once
```bash
npm run test:run
```

### Test with UI
```bash
npm run test:ui
```

### Specific Test Categories

#### Unit Tests Only
```bash
npm test -- src/components/__tests__ src/hooks/__tests__ src/pages/__tests__
```

#### Integration Tests Only
```bash
npm test -- src/test/integration
```

#### End-to-End Tests Only
```bash
npm test -- src/test/e2e
```

## Test Coverage

### Current Coverage Goals:
- **Unit Tests**: 80% code coverage for core business logic
- **Integration Tests**: 100% coverage for critical authentication and data handling
- **End-to-End Tests**: All user stories covered by at least one E2E test

### Coverage Reports
```bash
npm run test:coverage
```

## Test Patterns and Best Practices

### Mocking Strategy

#### Supabase Mocking
```typescript
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: mockSupabaseAuth },
}));
```

#### React Router Mocking
```typescript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
```

### Component Testing Patterns

#### Rendering with Providers
```typescript
const renderWithAuth = (Component: React.ComponentType) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Component />
      </AuthProvider>
    </BrowserRouter>
  );
};
```

#### Async Testing
```typescript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Accessibility Testing

All tests include accessibility checks:
- Proper ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Focus management

## Test Data Management

### Mock Data Structure
```typescript
const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  client_id: 'client-1',
};

const mockCallLogs = [
  {
    id: '1',
    client_id: 'client-1',
    call_type: 'inbound',
    caller_full_name: 'John Doe',
    // ... other properties
  },
];
```

### Test Utilities

#### Custom Render Functions
- `renderWithAuth()` - Renders components with authentication context
- `renderWithRouter()` - Renders components with router context
- `renderTestApp()` - Renders full app with routing for E2E tests

## Error Handling Tests

### Network Errors
```typescript
it('handles network errors gracefully', async () => {
  mockSupabaseAuth.signInWithPassword.mockRejectedValue(
    new Error('Network error')
  );
  
  // Test error handling
});
```

### Authentication Errors
```typescript
it('handles authentication errors', async () => {
  mockSupabaseAuth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message: 'Invalid credentials' },
  });
  
  // Test error display
});
```

## Performance Testing

### Loading States
```typescript
it('shows loading state during authentication', async () => {
  mockSupabaseAuth.signInWithPassword.mockImplementation(() => 
    new Promise(resolve => setTimeout(resolve, 100))
  );
  
  // Test loading indicators
});
```

### Large Dataset Handling
```typescript
it('handles large call lists efficiently', async () => {
  const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
    id: `call-${i}`,
    caller_full_name: `Caller ${i}`,
  }));
  
  // Test pagination and virtualization
});
```

## Security Testing

### Role-Based Access Control
```typescript
it('restricts access based on user role', async () => {
  const regularUser = { ...mockUser, role: 'user' };
  
  // Test access restrictions
});
```

### Data Isolation
```typescript
it('filters data by client ID', async () => {
  // Test client data isolation
});
```

## Debugging Tests

### Debug Mode
```bash
npm test -- --reporter=verbose
```

### Test Debugging Tips
1. Use `screen.debug()` to see rendered HTML
2. Use `console.log()` in tests for debugging
3. Check mock call history with `expect(mockFn).toHaveBeenCalledWith()`
4. Use `waitFor()` for async operations

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Tests
  run: npm run test:run
  
- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run"
    }
  }
}
```

## Test Maintenance

### Regular Tasks
1. Update test data when schema changes
2. Review and update mocks when APIs change
3. Add tests for new features
4. Remove tests for deprecated features
5. Monitor test performance and optimize slow tests

### Test Review Checklist
- [ ] Tests cover happy path and error cases
- [ ] Proper mocking of external dependencies
- [ ] Accessibility considerations included
- [ ] Performance implications tested
- [ ] Security aspects verified
- [ ] Documentation updated

## Common Issues and Solutions

### Mock Issues
**Problem**: Mocks not working properly
**Solution**: Ensure mocks are defined before imports and use `vi.clearAllMocks()` in `beforeEach`

### Async Issues
**Problem**: Tests failing due to timing
**Solution**: Use `waitFor()` and proper async/await patterns

### Component Issues
**Problem**: Components not rendering
**Solution**: Ensure all required providers are wrapped around components

### Environment Issues
**Problem**: Tests failing in CI but passing locally
**Solution**: Check environment variables and mock configurations

## Future Improvements

### Planned Enhancements
1. Visual regression testing with Chromatic
2. Performance benchmarking tests
3. Cross-browser testing with Playwright
4. API contract testing with Pact
5. Load testing for critical endpoints

### Test Metrics to Track
- Test execution time
- Test coverage percentage
- Flaky test identification
- Test maintenance overhead
- Bug detection rate

## Contributing to Tests

### Adding New Tests
1. Follow existing patterns and naming conventions
2. Include both positive and negative test cases
3. Add accessibility checks
4. Update documentation
5. Ensure tests are deterministic and fast

### Test Naming Convention
```typescript
describe('ComponentName', () => {
  it('should perform expected behavior when condition', () => {
    // Test implementation
  });
});
```

This comprehensive test suite ensures the reliability, maintainability, and quality of the call dashboard application across all critical user flows and system components.