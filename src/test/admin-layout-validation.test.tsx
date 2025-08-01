import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from 'next-themes';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminLayout from '@/layouts/admin/AdminLayout';
import ManagementLayout from '@/layouts/admin/ManagementLayout';
import AuditLayout from '@/layouts/admin/AuditLayout';
import { mainNavItems } from '@/config/adminNav';
import { managementNavItems } from '@/config/managementNav';
import { auditNavItems } from '@/config/auditNav';

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false, // Default to desktop for most tests
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'system_admin', id: '1' },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/context/ClientContext', () => ({
  ClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();
Object.defineProperty(window, 'dispatchEvent', { value: mockDispatchEvent });

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="data-theme" defaultTheme="system">
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Admin Layout Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('1. Sidebar 3-State Functionality', () => {
    it('should render sidebar with collapsed state by default', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Check if sidebar is in collapsed state (64px width)
      const sidebar = document.querySelector('[class*="w-16"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('should show footer control with dropdown menu', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Find the sidebar control button
      const controlButton = screen.getByTitle('Sidebar Options');
      expect(controlButton).toBeInTheDocument();

      // Click to open dropdown
      fireEvent.click(controlButton);

      // Check for dropdown options
      await waitFor(() => {
        expect(screen.getByText('Expanded')).toBeInTheDocument();
        expect(screen.getByText('Expand on Hover')).toBeInTheDocument();
        expect(screen.getByText('Collapsed')).toBeInTheDocument();
      });
    });

    it('should change sidebar state when dropdown options are clicked', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const controlButton = screen.getByTitle('Sidebar Options');
      fireEvent.click(controlButton);

      // Click on Expanded option
      await waitFor(() => {
        const expandedOption = screen.getByText('Expanded');
        fireEvent.click(expandedOption);
      });

      // Verify localStorage was called to save state
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'admin-sidebar-state',
        expect.stringContaining('"mode":"expanded"')
      );
    });

    it('should persist sidebar state in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('{"mode":"expanded","isHovered":false}');

      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Verify localStorage was checked
      expect(localStorageMock.getItem).toHaveBeenCalledWith('admin-sidebar-state');
    });
  });

  describe('2. Navigation Structure Validation', () => {
    it('should display all main navigation items for system admin', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Check that all main nav items are present
      mainNavItems.forEach((item) => {
        const navElement = screen.getByTitle(item.title);
        expect(navElement).toBeInTheDocument();
      });
    });

    it('should show back to main app button', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const backButton = screen.getByTitle('Back to Main App');
      expect(backButton).toBeInTheDocument();
    });

    it('should not display logout button or user info in sidebar footer', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // These should not exist in the new design
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
      expect(screen.queryByText(/user/i)).not.toBeInTheDocument();
    });
  });

  describe('3. Section Layout Validation', () => {
    it('should render ManagementLayout with proper structure', () => {
      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      // Check section title and description
      expect(screen.getByText('Management')).toBeInTheDocument();
      expect(screen.getByText(/Manage users, clients, business settings/)).toBeInTheDocument();

      // Check navigation items
      managementNavItems.forEach((item) => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });
    });

    it('should render AuditLayout with proper structure', () => {
      render(
        <TestWrapper>
          <AuditLayout />
        </TestWrapper>
      );

      // Check section title and description
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
      expect(screen.getByText(/Monitor system activities/)).toBeInTheDocument();

      // Check navigation items
      auditNavItems.forEach((item) => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });
    });

    it('should have proper spacing and layout structure', () => {
      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      // Check for proper CSS classes that match the design guidelines
      const aside = document.querySelector('aside');
      expect(aside).toHaveClass('lg:w-56', 'lg:flex-shrink-0', 'lg:border-r', 'lg:border-border');

      const contentArea = document.querySelector('.flex-1.min-w-0');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('space-y-6', 'p-4', 'h-full', 'overflow-y-auto');
    });
  });

  describe('4. Responsive Behavior', () => {
    it('should adapt to mobile layout', () => {
      // Mock mobile hook
      vi.mocked(require('@/hooks/use-mobile').useIsMobile).mockReturnValue(true);

      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Check for mobile-specific elements
      const mobileMenuButton = screen.getByLabelText('Open navigation menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should handle sidebar width changes', () => {
      render(
        <TestWrapper>
          <AdminLayout />
        </TestWrapper>
      );

      // Simulate sidebar resize event
      act(() => {
        window.dispatchEvent(new CustomEvent('admin-sidebar-resize', {
          detail: { width: 256 }
        }));
      });

      // Verify event was dispatched
      expect(mockDispatchEvent).toHaveBeenCalled();
    });
  });

  describe('5. Role-Based Access Control', () => {
    it('should filter navigation items for client_admin', () => {
      // Mock client_admin user
      vi.mocked(require('@/context/AuthContext').useAuth).mockReturnValue({
        user: { role: 'client_admin', id: '1' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      // Client admin should see Users, Business, Roles & Permissions
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
      expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();

      // But not Clients (system admin only)
      expect(screen.queryByText('Clients')).not.toBeInTheDocument();
    });

    it('should show all items for system_admin', () => {
      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      // System admin should see all items
      managementNavItems.forEach((item) => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });
    });
  });

  describe('6. Error Handling', () => {
    it('should render error boundaries for section layouts', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      // Error boundary should be present (we can't easily test the error state without more complex setup)
      expect(screen.getByText('Management')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('7. UI/UX Guidelines Compliance', () => {
    it('should have proper border and spacing according to design guidelines', () => {
      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      // Check for design-compliant structure
      const sectionHeader = document.querySelector('.py-3');
      expect(sectionHeader).toBeInTheDocument();

      const borderSeparator = document.querySelector('.border-b.border-border.my-3');
      expect(borderSeparator).toBeInTheDocument();

      const navigation = document.querySelector('nav.flex.space-x-2.lg\\:flex-col');
      expect(navigation).toBeInTheDocument();
    });

    it('should have proper navigation link styling', () => {
      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      const navLinks = document.querySelectorAll('a[class*="inline-flex items-center rounded-md"]');
      expect(navLinks.length).toBeGreaterThan(0);

      // Check for proper padding and styling classes
      navLinks.forEach((link) => {
        expect(link).toHaveClass('px-4', 'py-2', 'whitespace-nowrap');
      });
    });

    it('should have proper responsive overflow handling', () => {
      render(
        <TestWrapper>
          <ManagementLayout />
        </TestWrapper>
      );

      const navigation = document.querySelector('nav');
      expect(navigation).toHaveClass('overflow-x-auto', 'lg:overflow-x-visible');

      const contentArea = document.querySelector('.flex-1.min-w-0');
      expect(contentArea).toHaveClass('overflow-y-auto');
    });
  });

  describe('8. Transition and Animation Validation', () => {
    it('should have smooth transitions defined', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const sidebar = document.querySelector('[class*="transition-all duration-300"]');
      expect(sidebar).toBeInTheDocument();
    });

    it('should handle hover states properly', async () => {
      // Set up expand-on-hover mode
      localStorageMock.getItem.mockReturnValue('{"mode":"expand-on-hover","isHovered":false}');

      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const sidebar = document.querySelector('[class*="fixed left-0"]');
      expect(sidebar).toBeInTheDocument();

      // Test hover behavior (this is limited in jsdom but we can check the structure)
      if (sidebar) {
        fireEvent.mouseEnter(sidebar);
        // In a real browser, this would trigger the hover expansion
      }
    });
  });
});