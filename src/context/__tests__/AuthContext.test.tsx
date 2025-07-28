import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
};

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful session
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    // Mock auth state change listener
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      // Return unsubscribe function
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('provides initial auth state', async () => {
    renderWithAuth();
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };

    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null,
    });

    renderWithAuth();
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });
  });

  it('handles login error', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    renderWithAuth();
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it('handles logout', async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({
      error: null,
    });

    renderWithAuth();
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  it('shows loading state during authentication', async () => {
    // Mock loading state
    mockSupabaseAuth.signInWithPassword.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        data: { user: null, session: null },
        error: null,
      }), 100))
    );

    renderWithAuth();
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    // Should show loading state briefly
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
  });

  it('handles session restoration on mount', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      },
      access_token: 'token',
    };

    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    renderWithAuth();

    await waitFor(() => {
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
    });
  });

  it('sets up auth state change listener', () => {
    renderWithAuth();
    
    expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
  });

  it('cleans up auth state change listener on unmount', () => {
    const mockUnsubscribe = vi.fn();
    mockSupabaseAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { unmount } = renderWithAuth();
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});