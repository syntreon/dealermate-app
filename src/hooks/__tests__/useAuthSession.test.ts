import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthSession } from '@/hooks/useAuthSession';

// Mock Supabase
const mockSupabaseAuth = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
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

// Mock audit service
vi.mock('@/services/auditService', () => ({
  AuditService: {
    logUserAction: vi.fn(),
  },
}));

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      // Return unsubscribe function
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuthSession());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles successful login', async () => {
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

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      const success = await result.current.login('test@example.com', 'password');
      expect(success).toBe(true);
    });

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles login failure', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      const success = await result.current.login('test@example.com', 'wrongpassword');
      expect(success).toBe(false);
    });
  });

  it('handles logout', async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
  });

  it('sets up auth state change listener', () => {
    renderHook(() => useAuthSession());
    
    expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled();
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

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
  });

  it('handles profile fetch error', async () => {
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

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.hasProfileError).toBe(true);
    });
  });

  it('refreshes session', async () => {
    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
  });

  it('cleans up auth listener on unmount', () => {
    const mockUnsubscribe = vi.fn();
    mockSupabaseAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { unmount } = renderHook(() => useAuthSession());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handles auth state change events', async () => {
    let authCallback: any;
    
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuthSession());

    // Simulate SIGNED_IN event
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };

    const mockSession = {
      user: mockUser,
      access_token: 'token',
    };

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

    await act(async () => {
      authCallback('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('handles SIGNED_OUT event', async () => {
    let authCallback: any;
    
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      authCallback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('handles TOKEN_REFRESHED event', async () => {
    let authCallback: any;
    
    mockSupabaseAuth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuthSession());

    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      },
      access_token: 'new_token',
    };

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

    await act(async () => {
      authCallback('TOKEN_REFRESHED', mockSession);
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});