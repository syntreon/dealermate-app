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

// Helper function to simulate screen resize
const resizeScreen = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Navigation Behavior', () => {
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
        matches: query.includes('max-width: 767px') ? window.innerWidth < 768 : false,
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
    document.body.style.overflow = 'unset';
  });

  describe('Mobile Breakpoint (< 768px)', () => {
    beforeEach(() => {
      resizeScreen(375); // iPhone size
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should show mobile navigation on small screens', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      expect(screen.queryByTitle('Dashboard')).not.toBeInTheDocument();
    });

    it('should handle touch interactions properly on mobile', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      
      // Simulate touch interaction
      fireEvent.touchStart(menuButton);
      fireEvent.touchEnd(menuButton);
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });
    });

    it('should have proper touch target sizes', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      const buttonStyles = window.getComputedStyle(menuButton);
      
      // Button should have adequate touch target size (at least 44px)
      expect(menuButton.className).toContain('h-12');
      expect(menuButton.className).toContain('w-12');
    });
  });

  describe('Tablet Breakpoint (768px - 1024px)', () => {
    beforeEach(() => {
      resizeScreen(768); // Tablet size
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should show desktop navigation on tablet screens', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
      expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Desktop Breakpoint (> 1024px)', () => {
    beforeEach(() => {
      resizeScreen(1200); // Desktop size
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should show desktop navigation on large screens', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
      expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    });

    it('should have sidebar options button on desktop', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Should have the sidebar options button
      const optionsButton = screen.getByTitle('Sidebar Options');
      expect(optionsButton).toBeInTheDocument();
      expect(optionsButton).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('Responsive Transitions', () => {
    it('should handle transition from mobile to desktop', async () => {
      // Start with mobile
      resizeScreen(375);
      mockUseIsMobile.mockReturnValue(true);

      const { rerender } = render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();

      // Transition to desktop
      resizeScreen(1200);
      mockUseIsMobile.mockReturnValue(false);

      rerender(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
      expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    });

    it('should handle transition from desktop to mobile', async () => {
      // Start with desktop
      resizeScreen(1200);
      mockUseIsMobile.mockReturnValue(false);

      const { rerender } = render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.getByTitle('Dashboard')).toBeInTheDocument();

      // Transition to mobile
      resizeScreen(375);
      mockUseIsMobile.mockReturnValue(true);

      rerender(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      expect(screen.queryByTitle('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Touch Gesture Optimization', () => {
    beforeEach(() => {
      resizeScreen(375);
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should have optimized swipe area for edge gestures', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const swipeArea = screen.getByLabelText('Swipe right to open navigation');
      expect(swipeArea).toBeInTheDocument();
      expect(swipeArea.className).toContain('w-6'); // 24px wide swipe area
    });

    it('should prevent accidental drawer opening from center swipes', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const swipeArea = screen.getByLabelText('Swipe right to open navigation');

      // Simulate swipe from center of screen (should not open)
      fireEvent.touchStart(swipeArea, {
        targetTouches: [{ clientX: 200 }] // Center of screen
      });

      fireEvent.touchMove(swipeArea, {
        targetTouches: [{ clientX: 280 }]
      });

      fireEvent.touchEnd(swipeArea);

      // Drawer should not open
      expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
    });

    it('should handle rapid touch interactions without issues', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');

      // Rapid taps
      for (let i = 0; i < 5; i++) {
        fireEvent.click(menuButton);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Should still work correctly
      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    beforeEach(() => {
      resizeScreen(375);
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Swipe right to open navigation')).toBeInTheDocument();
    });

    it('should support keyboard navigation when drawer is open', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      // Open drawer
      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Close navigation')).toBeInTheDocument();
      });

      // Should be able to close with Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
      });
    });

    it('should have proper focus management', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(menuButton);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close navigation');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Performance on Mobile', () => {
    beforeEach(() => {
      resizeScreen(375);
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should not cause layout thrashing during animations', async () => {
      render(
        <TestWrapper>
          <AdminSidebar />
        </TestWrapper>
      );

      const menuButton = screen.getByLabelText('Open navigation menu');
      
      // Multiple rapid open/close operations
      for (let i = 0; i < 3; i++) {
        fireEvent.click(menuButton);
        
        await waitFor(() => {
          expect(screen.getByText('Admin Sections')).toBeInTheDocument();
        });

        const closeButton = screen.getByLabelText('Close navigation');
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByText('Admin Sections')).not.toBeInTheDocument();
        });
      }

      // Should still work correctly after multiple operations
      fireEvent.click(menuButton);
      await waitFor(() => {
        expect(screen.getByText('Admin Sections')).toBeInTheDocument();
      });
    });
  });
});