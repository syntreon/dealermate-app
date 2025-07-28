# Testing Strategy: Comprehensive Testing Approach
## Dealermate Application

### 🎯 Overview

This document outlines a comprehensive testing strategy for the Dealermate application, focusing on preventing bugs through systematic testing approaches. It covers unit testing, integration testing, end-to-end testing, and performance testing.

---

## 🧪 Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /____\    - Critical user journeys
 /      \   - Cross-browser testing
/________\  Integration Tests (Some)
           - API integration
           - Component integration
           - Database operations
___________________
Unit Tests (Many)
- Pure functions
- Component logic
- Utility functions
- Business logic
```

---

## 🔬 Unit Testing Strategy

### Priority 1: Critical Business Logic

#### Authentication & Authorization
```typescript
// src/utils/__tests__/clientDataIsolation.test.ts
describe('clientDataIsolation', () => {
  describe('hasSystemWideAccess', () => {
    test('returns true for admin users', () => {
      const adminUser = { role: 'admin', is_admin: true, client_id: null };
      expect(hasSystemWideAccess(adminUser)).toBe(true);
    });

    test('returns false for client users', () => {
      const clientUser = { role: 'client_user', is_admin: false, client_id: 'client-1' };
      expect(hasSystemWideAccess(clientUser)).toBe(false);
    });

    test('handles null user gracefully', () => {
      expect(hasSystemWideAccess(null)).toBe(false);
    });
  });

  describe('canAccessClientData', () => {
    test('allows system admin to access any client data', () => {
      const adminUser = { role: 'admin', is_admin: true, client_id: null };
      expect(canAccessClientData(adminUser, 'any-client-id')).toBe(true);
    });

    test('allows client user to access own client data only', () => {
      const clientUser = { role: 'client_user', client_id: 'client-1' };
      expect(canAccessClientData(clientUser, 'client-1')).toBe(true);
      expect(canAccessClientData(clientUser, 'client-2')).toBe(false);
    });

    test('denies access when client_id is null', () => {
      const clientUser = { role: 'client_user', client_id: 'client-1' };
      expect(canAccessClientData(clientUser, null)).toBe(false);
    });
  });
});
```

#### Data Transformation Functions
```typescript
// src/services/__tests__/adminService.test.ts
describe('AdminService', () => {
  describe('transformClient', () => {
    test('handles complete client data', () => {
      const rawClient = {
        id: '1',
        name: 'Test Client',
        status: 'active',
        joined_at: '2023-01-01T00:00:00Z',
        monthly_billing_amount_cad: 1000
      };

      const transformed = transformClient(rawClient);
      
      expect(transformed).toEqual({
        id: '1',
        name: 'Test Client',
        status: 'active',
        joined_at: new Date('2023-01-01T00:00:00Z'),
        monthly_billing_amount_cad: 1000
      });
    });

    test('handles missing optional fields', () => {
      const rawClient = {
        id: '1',
        name: 'Test Client',
        status: 'active',
        created_at: '2023-01-01T00:00:00Z'
        // Missing joined_at, monthly_billing_amount_cad
      };

      const transformed = transformClient(rawClient);
      
      expect(transformed.joined_at).toEqual(new Date('2023-01-01T00:00:00Z'));
      expect(transformed.monthly_billing_amount_cad).toBe(0);
    });
  });
});
```

#### Theme Utilities
```typescript
// src/utils/__tests__/themeValidation.test.ts
describe('ThemeValidator', () => {
  test('validates correct theme values', () => {
    expect(ThemeValidator.validateTheme('light')).toEqual({
      isValid: true,
      sanitizedTheme: 'light',
      errors: []
    });
  });

  test('rejects invalid theme values', () => {
    expect(ThemeValidator.validateTheme('invalid')).toEqual({
      isValid: false,
      sanitizedTheme: 'system',
      errors: ['Invalid theme value: invalid']
    });
  });

  test('handles null/undefined gracefully', () => {
    expect(ThemeValidator.validateTheme(null)).toEqual({
      isValid: false,
      sanitizedTheme: 'system',
      errors: ['Theme value is null or undefined']
    });
  });
});
```

### Priority 2: Component Logic

#### Custom Hooks
```typescript
// src/hooks/__tests__/useAuthSession.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthSession } from '../useAuthSession';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('useAuthSession', () => {
  test('initializes with loading state', () => {
    const { result } = renderHook(() => useAuthSession());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('handles successful login', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com' }
    };
    
    require('@/integrations/supabase/client').supabase.auth.signInWithPassword
      .mockResolvedValue({ data: { session: mockSession }, error: null });

    const { result } = renderHook(() => useAuthSession());
    
    const success = await result.current.login('test@example.com', 'password');
    
    expect(success).toBe(true);
  });
});
```

#### Component Testing
```typescript
// src/components/__tests__/CallLogsTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CallLogsTable from '../CallLogsTable';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('CallLogsTable', () => {
  const mockCallLogs = [
    {
      id: '1',
      caller_full_name: 'John Doe',
      caller_phone_number: '+1234567890',
      call_start_time: '2023-01-01T10:00:00Z',
      call_type: 'inbound'
    }
  ];

  test('renders call logs correctly', () => {
    render(
      <CallLogsTable 
        callLogs={mockCallLogs} 
        loading={false} 
        onRefresh={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(
      <CallLogsTable 
        callLogs={[]} 
        loading={true} 
        onRefresh={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Loading call logs...')).toBeInTheDocument();
  });

  test('handles search functionality', () => {
    render(
      <CallLogsTable 
        callLogs={mockCallLogs} 
        loading={false} 
        onRefresh={jest.fn()} 
      />,
      { wrapper: createWrapper() }
    );

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

---

## 🔗 Integration Testing Strategy

### API Integration Tests

#### Supabase Integration
```typescript
// src/services/__tests__/adminService.integration.test.ts
describe('AdminService Integration', () => {
  beforeEach(async () => {
    // Setup test database state
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestDatabase();
  });

  test('creates client with proper audit logging', async () => {
    const clientData = {
      name: 'Test Client',
      type: 'dealership',
      subscription_plan: 'basic'
    };

    const client = await AdminService.createClient(clientData, 'admin-user-id');

    expect(client.name).toBe('Test Client');
    
    // Verify audit log was created
    const auditLogs = await AuditService.getClientAuditLogs(client.id);
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe('create');
  });

  test('enforces RLS policies for client data', async () => {
    // Test as client user
    const clientUser = await createTestUser('client_user', 'client-1');
    
    // Should only see own client's data
    const clients = await AdminService.getClients({}, { page: 1, limit: 10 });
    
    expect(clients.every(client => client.id === 'client-1')).toBe(true);
  });
});
```

#### Authentication Flow Integration
```typescript
// src/__tests__/auth-flow.integration.test.ts
describe('Authentication Flow Integration', () => {
  test('complete login flow', async () => {
    // Mock successful auth response
    mockSupabaseAuth({
      session: { user: { id: '1', email: 'test@example.com' } },
      user: { id: '1', role: 'admin', client_id: null }
    });

    render(<App />);

    // Navigate to login
    fireEvent.click(screen.getByText('Login'));

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password' }
    });
    fireEvent.click(screen.getByText('Sign In'));

    // Should redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Should show admin navigation
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});
```

### Component Integration Tests

#### Dashboard Integration
```typescript
// src/pages/__tests__/Dashboard.integration.test.ts
describe('Dashboard Integration', () => {
  test('loads and displays data correctly', async () => {
    // Mock API responses
    mockApiResponses({
      calls: mockCallsData,
      metrics: mockMetricsData,
      leads: mockLeadsData
    });

    render(<Dashboard />, { wrapper: createAppWrapper() });

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Should load and display data
    await waitFor(() => {
      expect(screen.getByText('156')).toBeInTheDocument(); // Total calls
      expect(screen.getByText('42')).toBeInTheDocument();  // Total leads
    });

    // Should show recent activity
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  test('handles client selection for admin users', async () => {
    const adminUser = { role: 'admin', is_admin: true };
    mockAuthUser(adminUser);

    render(<Dashboard />, { wrapper: createAppWrapper() });

    // Should show client selector
    expect(screen.getByText('Select Client')).toBeInTheDocument();

    // Select specific client
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'client-1' }
    });

    // Should refetch data for selected client
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'client-1' })
      );
    });
  });
});
```

---

## 🌐 End-to-End Testing Strategy

### Critical User Journeys

#### Admin User Journey
```typescript
// e2e/admin-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin User Journey', () => {
  test('admin can manage clients and users', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Navigate to admin panel
    await page.click('[data-testid="admin-nav"]');
    await expect(page).toHaveURL('/admin');

    // Create new client
    await page.click('[data-testid="create-client"]');
    await page.fill('[data-testid="client-name"]', 'Test Client');
    await page.selectOption('[data-testid="client-type"]', 'dealership');
    await page.click('[data-testid="save-client"]');

    // Verify client was created
    await expect(page.locator('[data-testid="client-list"]')).toContainText('Test Client');

    // Create user for client
    await page.click('[data-testid="users-tab"]');
    await page.click('[data-testid="create-user"]');
    await page.fill('[data-testid="user-email"]', 'user@testclient.com');
    await page.fill('[data-testid="user-name"]', 'Test User');
    await page.selectOption('[data-testid="user-role"]', 'client_admin');
    await page.click('[data-testid="save-user"]');

    // Verify user was created
    await expect(page.locator('[data-testid="user-list"]')).toContainText('user@testclient.com');
  });
});
```

#### Client User Journey
```typescript
// e2e/client-user-journey.spec.ts
test.describe('Client User Journey', () => {
  test('client user can view own data only', async ({ page }) => {
    // Login as client user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'client@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Should see dashboard with own client data
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="client-selector"]')).not.toBeVisible();

    // Navigate to call logs
    await page.click('[data-testid="logs-nav"]');
    
    // Should only see own client's calls
    const callRows = page.locator('[data-testid="call-row"]');
    const count = await callRows.count();
    
    for (let i = 0; i < count; i++) {
      const row = callRows.nth(i);
      await expect(row).toContainText('Client: Test Client'); // Own client only
    }

    // Should not have access to admin panel
    await expect(page.locator('[data-testid="admin-nav"]')).not.toBeVisible();
  });
});
```

### Cross-Browser Testing
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

---

## ⚡ Performance Testing Strategy

### Load Testing
```typescript
// performance/load-test.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
};

export default function() {
  // Test dashboard load
  let response = http.get('https://app.dealermate.com/dashboard', {
    headers: { 'Authorization': 'Bearer ' + __ENV.AUTH_TOKEN }
  });
  
  check(response, {
    'dashboard loads in < 2s': (r) => r.timings.duration < 2000,
    'status is 200': (r) => r.status === 200,
  });

  // Test call logs API
  response = http.get('https://app.dealermate.com/api/call-logs', {
    headers: { 'Authorization': 'Bearer ' + __ENV.AUTH_TOKEN }
  });
  
  check(response, {
    'call logs API responds in < 1s': (r) => r.timings.duration < 1000,
    'returns valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
}
```

### Component Performance Testing
```typescript
// src/components/__tests__/CallLogsTable.performance.test.tsx
describe('CallLogsTable Performance', () => {
  test('handles large datasets efficiently', async () => {
    const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
      id: `call-${i}`,
      caller_full_name: `Caller ${i}`,
      caller_phone_number: `+123456789${i}`,
      call_start_time: new Date().toISOString(),
      call_type: 'inbound'
    }));

    const startTime = performance.now();
    
    render(
      <CallLogsTable 
        callLogs={largeMockData} 
        loading={false} 
        onRefresh={jest.fn()} 
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render large dataset in under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('search performance with large datasets', async () => {
    const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
      id: `call-${i}`,
      caller_full_name: `Caller ${i}`,
      caller_phone_number: `+123456789${i}`,
      call_start_time: new Date().toISOString(),
      call_type: 'inbound'
    }));

    render(
      <CallLogsTable 
        callLogs={largeMockData} 
        loading={false} 
        onRefresh={jest.fn()} 
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    
    const startTime = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Caller 500' } });
    const endTime = performance.now();

    const searchTime = endTime - startTime;

    // Search should complete in under 50ms
    expect(searchTime).toBeLessThan(50);
    expect(screen.getByText('Caller 500')).toBeInTheDocument();
  });
});
```

---

## 🔒 Security Testing Strategy

### Authentication Security Tests
```typescript
// src/security/__tests__/auth-security.test.ts
describe('Authentication Security', () => {
  test('prevents unauthorized access to admin routes', async () => {
    // Mock non-admin user
    mockAuthUser({ role: 'client_user', is_admin: false });

    render(<App />);

    // Try to navigate to admin route
    window.history.pushState({}, '', '/admin/dashboard');

    // Should redirect or show access denied
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  test('validates JWT tokens properly', async () => {
    // Mock expired token
    mockSupabaseAuth({ 
      session: null, 
      error: { message: 'JWT expired' } 
    });

    render(<App />);

    // Should redirect to login
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });
});
```

### Data Access Security Tests
```typescript
// src/security/__tests__/data-access-security.test.ts
describe('Data Access Security', () => {
  test('client users cannot access other clients data', async () => {
    const clientUser = { role: 'client_user', client_id: 'client-1' };
    
    // Mock API to return data from multiple clients
    mockApiResponse('/api/calls', [
      { id: '1', client_id: 'client-1', caller_name: 'John' },
      { id: '2', client_id: 'client-2', caller_name: 'Jane' }, // Should be filtered
    ]);

    render(<CallLogsTable />, { 
      wrapper: createAuthWrapper(clientUser) 
    });

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.queryByText('Jane')).not.toBeInTheDocument();
    });
  });
});
```

---

## 📊 Test Coverage Goals

### Coverage Targets
- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: 70% of critical user flows
- **E2E Tests**: 100% of primary user journeys
- **Performance Tests**: All major components and APIs

### Coverage Monitoring
```json
// jest.config.js
{
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
    "!src/test/**/*"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/utils/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

---

## 🚀 Test Automation & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:performance
```

---

## 📈 Test Metrics & Reporting

### Key Metrics to Track
- **Test Coverage**: Code coverage percentage
- **Test Execution Time**: Time to run full test suite
- **Flaky Test Rate**: Percentage of tests that fail intermittently
- **Bug Detection Rate**: Bugs caught by tests vs. production bugs
- **Performance Regression**: Performance test results over time

### Reporting Dashboard
- Integrate with tools like Codecov for coverage reporting
- Use GitHub Actions for automated test reporting
- Set up alerts for test failures and coverage drops
- Track performance metrics over time

---

*This testing strategy should be implemented incrementally, starting with the highest priority unit tests and gradually expanding to full integration and E2E coverage.*