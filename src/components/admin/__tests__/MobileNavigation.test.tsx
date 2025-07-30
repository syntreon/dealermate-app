import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AdminSidebar from '../AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock the hooks
vi.mock('@/context/AuthContext');
vi.mock('@/hooks/use-mobile');
vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseIsMobile = vi.mocked(useIsMobile);

// Mock user with admin access
const mockUser = {
  role: 'system_admin',
  id: '1',
  email: 'admin@test.com'
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Mobile Navigation', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn()
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should render mobile menu trigger button', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should open drawer when menu button is clicked', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });
    });

    it('should close drawer when close button is clicked', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });

      // Close drawer
      const closeButton = screen.getByLabelText('Close navigation');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
      });
    });

    it('should close drawer when overlay is clicked', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });

      // Click overlay (backdrop)
      const overlay = screen.getByText('Admin Sections').closest('.fixed');
      if (overlay?.parentElement) {
        fireEvent.click(overlay.parentElement);
      }

      await waitFor(() => {
        expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
      });
    });

    it('should prevent body scroll when drawer is open', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Initially body should not have overflow hidden
      expect(document.body.style.overflow).not.toBe('hidden');

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });

      // Close drawer
      const closeButton = screen.getByLabelText('Close navigation');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('unset');
      });
    });

    it('should handle touch gestures for opening drawer', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const swipeArea = screen.getByLabelText('Swipe right to open navigation');

      // Simulate right swipe from left edge
      fireEvent.touchStart(swipeArea, {
        targetTouches: [{ clientX: 10 }]
      });

      fireEvent.touchMove(swipeArea, {
        targetTouches: [{ clientX: 80 }]
      });

      fireEvent.touchEnd(swipeArea);

      // Drawer should open
      expect(screen.getByText('Admin Sections')).toBeInTheDocument();
    });

    it('should handle touch gestures for closing drawer', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer first
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });

      // Get the overlay element
      const overlay = screen.getByText('Admin Sections').closest('.fixed')?.parentElement;
      expect(overlay).toBeInTheDocument();

      // Simulate left swipe to close
      fireEvent.touchStart(overlay!, {
        targetTouches: [{ clientX: 200 }]
      });

      fireEvent.touchMove(overlay!, {
        targetTouches: [{ clientX: 100 }]
      });

      fireEvent.touchEnd(overlay!);

      await waitFor(() => {
        expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
      });
    });

    it('should close drawer when navigation item is clicked', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click on a navigation item
      const dashboardLink = screen.getByText('Dashboard');
      fireEvent.click(dashboardLink);

      await waitFor(() => {
        expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
      });
    });

    it('should handle escape key to close drawer', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });

      // Press escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
      });
    });
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should not render mobile menu trigger button', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
    });

    it('should render desktop sidebar', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Should show desktop sidebar elements (icons should be visible even in collapsed mode)
      const dashboardLink = screen.getByTitle('Dashboard');
      const managementLink = screen.getByTitle('Management');
      
      expect(dashboardLink).toBeInTheDocument();
      expect(managementLink).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should show appropriate navigation items for system admin', async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'system_admin' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn()
      });

      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Management')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Logs')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should show limited navigation items for client admin', async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'client_admin' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshSession: vi.fn()
      });

      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Management')).toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
        expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
        expect(screen.queryByText('Logs')).not.toBeInTheDocument();
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });
  });
});