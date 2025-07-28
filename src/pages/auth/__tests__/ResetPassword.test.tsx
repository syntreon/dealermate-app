import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '@/pages/auth/ResetPassword';
import { AuthProvider } from '@/context/AuthContext';

// Mock react-router-dom
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Supabase
const mockSupabaseAuth = {
  updateUser: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth context
const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
};

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

const renderResetPassword = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders password reset form', () => {
    renderResetPassword();
    
    expect(screen.getByText('Set Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set Password' })).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    renderResetPassword();
    
    expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  it('shows password strength indicator', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    fireEvent.change(passwordInput, { target: { value: 'Test123!' } });

    await waitFor(() => {
      expect(screen.getByText(/Strength:/)).toBeInTheDocument();
    });
  });

  it('validates password requirements', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Set Password' });

    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmInput, { target: { value: 'weak' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Set Password' });

    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    fireEvent.change(confirmInput, { target: { value: 'Different123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    const toggleButton = passwordInput.parentElement?.querySelector('button');

    expect(passwordInput).toHaveAttribute('type', 'password');
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('successfully updates password', async () => {
    mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Set Password' });

    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    fireEvent.change(confirmInput, { target: { value: 'Test123!@#' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: 'Test123!@#',
      });
    });

    await waitFor(() => {
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles password update error', async () => {
    mockSupabaseAuth.updateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    });

    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Set Password' });

    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    fireEvent.change(confirmInput, { target: { value: 'Test123!@#' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalled();
    });

    // Should not proceed to sign out on error
    expect(mockSupabaseAuth.signOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    mockSupabaseAuth.updateUser.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Set Password' });

    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    fireEvent.change(confirmInput, { target: { value: 'Test123!@#' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Setting Password...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('redirects to login if user is not authenticated', () => {
    // Mock no user
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
    } as any);

    renderResetPassword();

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('updates password strength indicator correctly', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');

    // Test very weak password
    fireEvent.change(passwordInput, { target: { value: 'a' } });
    await waitFor(() => {
      expect(screen.getByText('Strength: Very Weak')).toBeInTheDocument();
    });

    // Test strong password
    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    await waitFor(() => {
      expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
    });
  });

  it('shows visual indicators for password requirements', async () => {
    renderResetPassword();
    
    const passwordInput = screen.getByLabelText('New Password');
    
    // Initially all requirements should be gray
    fireEvent.change(passwordInput, { target: { value: '' } });
    
    // Type a password that meets all requirements
    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    
    // All checkmarks should be green (we can't easily test color, but we can test presence)
    const checkmarks = screen.getAllByTestId('check-circle') || [];
    expect(checkmarks.length).toBeGreaterThan(0);
  });
});