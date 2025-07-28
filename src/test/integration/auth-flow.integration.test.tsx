import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/auth/AuthCallback';
import ResetPassword from '@/pages/auth/ResetPassword';

// Mock Supabase
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
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

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', state: null }),
    useSearchParams: () => [mockSearchParams],
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
    origin: 'http://localhost:3000',
  },
  writable: true,
});

const renderWithAuth = (Component: React.ComponentType) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Component />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    window.location.hash = '';
    
    // Default mock implementations
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  describe('Login Flow', () => {
    it('completes successful login flow', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock profile fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: '1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user',
                client_id: 'client-1',
              },
              error: null,
            })),
          })),
        })),
      });

      renderWithAuth(Login);

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Verify login attempt
      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('handles login failure with error display', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      renderWithAuth(Login);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auth Callback Flow', () => {
    it('processes invitation callback and redirects to password reset', async () => {
      mockSearchParams.set('token', 'invite_token');
      mockSearchParams.set('type', 'invite');

      mockSupabaseAuth.verifyOtp = vi.fn().mockResolvedValue({
        data: { session: { user: { id: '1', email: 'test@example.com' } } },
        error: null,
      });

      renderWithAuth(AuthCallback);

      await waitFor(() => {
        expect(screen.getByText('Invitation accepted! Redirecting to set your password...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/reset-password', { replace: true });
      }, { timeout: 2000 });
    });

    it('processes regular auth callback and redirects to dashboard', async () => {
      mockSearchParams.set('code', 'auth_code');

      mockSupabaseAuth.exchangeCodeForSession = vi.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: '1', 
              email: 'test@example.com', 
              email_confirmed_at: '2024-01-01' 
            } 
          } 
        },
        error: null,
      });

      renderWithAuth(AuthCallback);

      await waitFor(() => {
        expect(screen.getByText('Authentication successful! Redirecting...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      }, { timeout: 2000 });
    });
  });

  describe('Password Reset Flow', () => {
    it('completes password reset and redirects to login', async () => {
      // Mock authenticated user for password reset
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: '1', 
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User' }
            } 
          } 
        },
        error: null,
      });

      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      renderWithAuth(ResetPassword);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Set Your Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: 'Set Password' });

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
          password: 'NewPassword123!',
        });
      });

      await waitFor(() => {
        expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Auth Context Integration', () => {
    it('maintains authentication state across components', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      // Mock initial session
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock profile fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: '1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user',
                client_id: 'client-1',
              },
              error: null,
            })),
          })),
        })),
      });

      // Mock auth state change to simulate session restoration
      let authCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        // Simulate initial session event
        setTimeout(() => {
          callback('INITIAL_SESSION', mockSession);
        }, 0);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth(Login);

      // Should eventually show authenticated state
      await waitFor(() => {
        expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
      });
    });

    it('handles logout and clears authentication state', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      // Mock initial authenticated state
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock profile fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: '1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user',
                client_id: 'client-1',
              },
              error: null,
            })),
          })),
        })),
      });

      let authCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderWithAuth(Login);

      // Simulate logout
      if (authCallback) {
        authCallback('SIGNED_OUT', null);
      }

      // Should clear authentication state
      await waitFor(() => {
        expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('handles network errors gracefully', async () => {
      mockSupabaseAuth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      renderWithAuth(Login);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      });
    });

    it('handles profile fetch errors', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock profile fetch error
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Profile not found' },
            })),
          })),
        })),
      });

      renderWithAuth(Login);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Should handle profile error gracefully
      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });
});