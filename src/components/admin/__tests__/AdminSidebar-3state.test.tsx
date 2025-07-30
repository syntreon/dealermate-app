import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminSidebar from '../AdminSidebar';

// Mock the hooks and components
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'system_admin', full_name: 'Test User', email: 'test@example.com' }
  })
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}));

vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>
}));

vi.mock('@/config/adminNav', () => ({
  mainNavItems: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: () => <div>Dashboard Icon</div>,
      href: '/admin/dashboard',
      requiredAccess: 'system_admin'
    },
    {
      id: 'management',
      title: 'Management',
      icon: () => <div>Management Icon</div>,
      href: '/admin/management',
      requiredAccess: 'system_admin'
    }
  ],
  hasRequiredAccess: () => true,
  backToMainAppItem: {
    title: 'Back to Main App',
    icon: () => <div>Back Icon</div>,
    href: '/dashboard'
  }
}));

// Mock the dropdown menu components to make them testable
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => (
    <div data-testid="dropdown-trigger" {...props}>{children}</div>
  ),
  DropdownMenuContent: ({ children, ...props }: any) => (
    <div data-testid="dropdown-content" {...props}>{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <div 
      data-testid="dropdown-item" 
      onClick={onClick}
      className={className}
      role="menuitem"
    >
      {children}
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AdminSidebar 3-State Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders in expanded state by default', () => {
    renderWithRouter(<AdminSidebar />);
    
    // Should show logo and admin text
    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Back to Main App')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  it('shows sidebar options dropdown when clicking the menu button', async () => {
    renderWithRouter(<AdminSidebar />);
    
    // Should show the dropdown menu structure
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    
    // Should show the three state options
    const dropdownItems = screen.getAllByTestId('dropdown-item');
    expect(dropdownItems).toHaveLength(3);
    expect(screen.getByText('Expanded')).toBeInTheDocument();
    expect(screen.getByText('Expand on Hover')).toBeInTheDocument();
    expect(screen.getByText('Collapsed')).toBeInTheDocument();
  });

  it('changes to collapsed state when selected from dropdown', async () => {
    renderWithRouter(<AdminSidebar />);
    
    // Find and click the collapsed option
    const collapsedOption = screen.getByText('Collapsed');
    fireEvent.click(collapsedOption);
    
    // Should dispatch resize event
    await waitFor(() => {
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'admin-sidebar-resize',
          detail: { width: 64 }
        })
      );
    });
  });

  it('changes to expand-on-hover state when selected from dropdown', async () => {
    renderWithRouter(<AdminSidebar />);
    
    // Find and click the expand-on-hover option
    const expandOnHoverOption = screen.getByText('Expand on Hover');
    fireEvent.click(expandOnHoverOption);
    
    // Should dispatch resize event
    await waitFor(() => {
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'admin-sidebar-resize',
          detail: { width: 256 }
        })
      );
    });
  });

  it('persists sidebar state to localStorage', async () => {
    renderWithRouter(<AdminSidebar />);
    
    // Change to collapsed state
    const collapsedOption = screen.getByText('Collapsed');
    fireEvent.click(collapsedOption);
    
    // Check localStorage
    await waitFor(() => {
      const savedState = localStorage.getItem('admin-sidebar-state');
      expect(savedState).toBeTruthy();
      const parsedState = JSON.parse(savedState!);
      expect(parsedState.mode).toBe('collapsed');
    });
  });

  it('loads saved state from localStorage on mount', () => {
    // Set initial state in localStorage
    localStorage.setItem('admin-sidebar-state', JSON.stringify({ mode: 'collapsed' }));
    
    renderWithRouter(<AdminSidebar />);
    
    // Should dispatch event with collapsed width
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'admin-sidebar-resize',
        detail: { width: 64 }
      })
    );
  });

  it('does not show logout button or user info in footer', () => {
    renderWithRouter(<AdminSidebar />);
    
    // Should not show logout button or user info
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('system_admin Access')).not.toBeInTheDocument();
  });

  it('shows only the dropdown menu control in footer', () => {
    renderWithRouter(<AdminSidebar />);
    
    // Should show the dropdown menu structure
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    
    // Should not show other footer elements like logout or user info
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });
});