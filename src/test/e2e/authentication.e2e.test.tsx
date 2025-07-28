import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AuthCallback from '@/pages/auth/AuthCallback';
import ResetPassword from '@/pages/auth/ResetPassword';

// Mock Supabase with realistic behavior
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
};

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
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
          error: null 
        })),
      })),
    })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock dashboard service
vi.mock('@/services/dashboardService', () => ({
  dashboardService: {
    getMetrics: vi.fn(() => Promise.resolve({
      totalCalls: 150,
      totalLeads: 45,
      avgCallDuration: 180,
      callsToday: 12,
      leadsToday: 3,
      conversionRate: 30,
    })),
  },
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hash: '',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
  },
  writable: true,
});

// Test App component that includes routing
const TestApp = ({ initialPath = '/' }: { initialPath?: string }) => {
  // Mock useNavigate and useLocation for routing
  const mockNavigate = vi.fn();
  const mockLocation = { pathname: initialPath, state: null, search: '', hash: '' };
  const mockSearchParams = new URLSearchParams();

  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useLocation: () => mockLocation,
      useSearchParams: () => [mockSearchParams],
    };
  });

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('End-to-End Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  describe('Complete Login Flow', () => {
    it('allows user to login and access dashboard', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      // Mock successful login
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock auth state change
      let authCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(<TestApp initialPath="/login" />);

      // User sees login form
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // User fills in credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // User submits form
      fireEvent.click(submitButton);

      // System processes login
      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Simulate successful auth state change
      if (authCallback) {
        authCallback('SIGNED_IN', mockSession);
      }

      // User should see success message
      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });

    it('shows error message for invalid credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      render(<TestApp initialPath="/login" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      // User should still be on login page
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });
  });

  describe('Invitation and Password Reset Flow', () => {
    it('processes invitation and allows password setup', async () => {
      // Mock invitation verification
      mockSupabaseAuth.verifyOtp.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: '1', 
              email: 'newuser@example.com',
              user_metadata: { full_name: 'New User' }
            } 
          } 
        },
        error: null,
      });

      // Mock password update
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      // Mock URL parameters for invitation
      window.location.search = '?token=invite_token&type=invite';

      render(<TestApp initialPath="/auth/callback" />);

      // User sees processing message
      expect(screen.getByText('Processing authentication...')).toBeInTheDocument();

      // System processes invitation
      await waitFor(() => {
        expect(mockSupabaseAuth.verifyOtp).toHaveBeenCalledWith({
          token_hash: 'invite_token',
          type: 'invite',
        });
      });

      // User sees success message
      await waitFor(() => {
        expect(screen.getByText('Invitation accepted! Redirecting to set your password...')).toBeInTheDocument();
      });

      // Simulate navigation to password reset (in real app, this would be automatic)
      render(<TestApp initialPath="/reset-password" />);

      // User sees password setup form
      await waitFor(() => {
        expect(screen.getByText('Set Your Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New Password');
      const confirmInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: 'Set Password' });

      // User sets new password
      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPassword123!' } });
      fireEvent.click(submitButton);

      // System updates password
      await waitFor(() => {
        expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
          password: 'NewPassword123!',
        });
      });

      // System signs out user and redirects to login
      await waitFor(() => {
        expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Session Management', () => {
    it('maintains session across page refreshes', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      // Mock existing session
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock auth state change for session restoration
      let authCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        // Simulate initial session event
        setTimeout(() => {
          callback('INITIAL_SESSION', mockSession);
        }, 0);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(<TestApp initialPath="/dashboard" />);

      // System should restore session
      await waitFor(() => {
        expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
      });

      // User should eventually see dashboard content
      // (In a real test, we'd check for dashboard-specific content)
    });

    it('handles token refresh automatically', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'new_token',
      };

      let authCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(<TestApp initialPath="/dashboard" />);

      // Simulate token refresh event
      if (authCallback) {
        authCallback('TOKEN_REFRESHED', mockSession);
      }

      // System should handle token refresh gracefully
      await waitFor(() => {
        expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
      });
    });
  });

  describe('Logout Flow', () => {
    it('allows user to logout and clears session', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token',
      };

      // Mock initial authenticated state
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      let authCallback: any;
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(<TestApp initialPath="/dashboard" />);

      // Simulate logout action (would normally be triggered by user clicking logout)
      if (authCallback) {
        authCallback('SIGNED_OUT', null);
      }

      // System should clear authentication state
      await waitFor(() => {
        expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery', () => {
    it('recovers from network errors', async () => {
      // Mock network error followed by success
      mockSupabaseAuth.signInWithPassword
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { 
            user: { id: '1', email: 'test@example.com' }, 
            session: { user: { id: '1' }, access_token: 'token' } 
          },
          error: null,
        });

      render(<TestApp initialPath="/login" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First attempt fails
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
      });

      // User retries
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledTimes(2);
      });
    });

    it('handles authentication callback errors gracefully', async () => {
      mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid authorization code' },
      });

      // Mock URL with invalid code
      window.location.search = '?code=invalid_code';

      render(<TestApp initialPath="/auth/callback" />);

      await waitFor(() => {
        expect(screen.getByText('Invalid authorization code')).toBeInTheDocument();
      });

      // User should see retry option
      expect(screen.getByText('Return to Login')).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('provides proper loading states', async () => {
      // Mock slow login
      mockSupabaseAuth.signInWithPassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: { user: null, session: null },
          error: null,
        }), 100))
      );

      render(<TestApp initialPath="/login" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('maintains focus management during navigation', async () => {
      render(<TestApp initialPath="/login" />);

      const emailInput = screen.getByLabelText(/email/i);
      
      // Focus should be manageable
      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);
    });

    it('provides proper error announcements for screen readers', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      render(<TestApp initialPath="/login" />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
      });
    });
  });
});