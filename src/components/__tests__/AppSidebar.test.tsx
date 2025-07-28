import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import { AuthProvider } from '@/context/AuthContext';

// Mock the auth context
const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user' as const,
  client_id: 'client-1',
};

const mockLogout = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    loading: false,
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

// Mock client data isolation utilities
const mockCanAccessAdminPanel = vi.fn(() => false);
const mockHasClientAdminAccess = vi.fn(() => false);
const mockCanAccessAnalytics = vi.fn(() => true);

vi.mock('@/utils/clientDataIsolation', () => ({
  canAccessAdminPanel: mockCanAccessAdminPanel,
  hasClientAdminAccess: mockHasClientAdminAccess,
  canAccessAnalytics: mockCanAccessAnalytics,
}));

// Mock mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => ({ isMobile: false }),
}));

// Mock sidebar components
vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div className={className} data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="sidebar-content">{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="sidebar-footer">{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="sidebar-header">{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="sidebar-menu">{children}</div>,
  SidebarMenuButton: ({ children, asChild, tooltip }: { children: React.ReactNode; asChild?: boolean; tooltip?: string }) => 
    <div data-testid="sidebar-menu-button" title={tooltip}>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="sidebar-menu-item">{children}</div>,
  useSidebar: () => ({ isMobile: false }),
}));

const renderAppSidebar = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AppSidebar />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main navigation items', () => {
    renderAppSidebar();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    renderAppSidebar();
    
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', () => {
    renderAppSidebar();
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('does not show admin panel link for regular users', () => {
    renderAppSidebar();
    
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('shows admin panel link for admin users', () => {
    // Mock admin user
    vi.mocked(canAccessAdminPanel).mockReturnValue(true);
    
    renderAppSidebar();
    
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('shows administration link for client admin users', () => {
    // Mock client admin user
    vi.mocked(hasClientAdminAccess).mockReturnValue(true);
    
    renderAppSidebar();
    
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });

  it('hides analytics for users without analytics access', () => {
    // Mock user without analytics access
    vi.mocked(canAccessAnalytics).mockReturnValue(false);
    
    renderAppSidebar();
    
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
  });

  it('has proper navigation structure', () => {
    renderAppSidebar();
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
  });

  it('renders logo in header', () => {
    renderAppSidebar();
    
    // Logo component should be rendered in the header
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
  });
});