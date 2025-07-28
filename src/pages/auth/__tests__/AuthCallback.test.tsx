import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthCallback from '@/pages/auth/AuthCallback';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

// Mock Supabase
const mockSupabaseAuth = {
  setSession: vi.fn(),
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
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

const renderAuthCallback = () => {
  return render(
    <BrowserRouter>
      <AuthCallback />
    </BrowserRouter>
  );
};

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    window.location.hash = '';
  });

  it('renders loading state initially', () => {
    renderAuthCallback();
    
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Processing authentication...')).toBeInTheDocument();
  });

  it('processes token-based authentication from URL hash', async () => {
    window.location.hash = '#access_token=test_token&refresh_token=test_refresh&type=signin';
    
    mockSupabaseAuth.setSession.mockResolvedValue({
      data: { user: { id: '1', email: 'test@example.com' } },
      error: null,
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(mockSupabaseAuth.setSession).toHaveBeenCalledWith({
        access_token: 'test_token',
        refresh_token: 'test_refresh',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Authentication successful! Redirecting...')).toBeInTheDocument();
    });
  });

  it('processes invitation flow correctly', async () => {
    mockSearchParams.set('token', 'invite_token');
    mockSearchParams.set('type', 'invite');

    mockSupabaseAuth.verifyOtp.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'test@example.com' } } },
      error: null,
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(mockSupabaseAuth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'invite_token',
        type: 'invite',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Invitation accepted! Redirecting to set your password...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reset-password', { replace: true });
    }, { timeout: 2000 });
  });

  it('processes code exchange flow', async () => {
    mockSearchParams.set('code', 'auth_code');

    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'test@example.com', email_confirmed_at: '2024-01-01' } } },
      error: null,
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(mockSupabaseAuth.exchangeCodeForSession).toHaveBeenCalledWith('auth_code');
    });

    await waitFor(() => {
      expect(screen.getByText('Authentication successful! Redirecting...')).toBeInTheDocument();
    });
  });

  it('handles custom redirect with next parameter', async () => {
    mockSearchParams.set('code', 'auth_code');
    mockSearchParams.set('next', '/custom-page');

    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'test@example.com', email_confirmed_at: '2024-01-01' } } },
      error: null,
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/custom-page', { replace: true });
    }, { timeout: 2000 });
  });

  it('handles authentication errors', async () => {
    mockSearchParams.set('code', 'invalid_code');

    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid code' },
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(screen.getByText('Invalid code')).toBeInTheDocument();
    });

    expect(screen.getByText('Return to Login')).toBeInTheDocument();
  });

  it('handles missing authentication data', async () => {
    renderAuthCallback();

    await waitFor(() => {
      expect(screen.getByText('No authentication data found in URL')).toBeInTheDocument();
    });

    expect(screen.getByText('Return to Login')).toBeInTheDocument();
  });

  it('redirects to login on retry', async () => {
    mockSearchParams.set('code', 'invalid_code');

    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid code' },
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(screen.getByText('Return to Login')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Return to Login');
    retryButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('processes magic link authentication', async () => {
    mockSearchParams.set('token', 'magic_token');
    mockSearchParams.set('type', 'magiclink');

    mockSupabaseAuth.verifyOtp.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'test@example.com' } } },
      error: null,
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(mockSupabaseAuth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'magic_token',
        type: 'email',
      });
    });
  });

  it('handles session without user data', async () => {
    mockSearchParams.set('code', 'auth_code');

    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: null } },
      error: null,
    });

    renderAuthCallback();

    await waitFor(() => {
      expect(screen.getByText('No user data in session')).toBeInTheDocument();
    });
  });
});