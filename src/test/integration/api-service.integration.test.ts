import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '@/services/adminService';
import { callsService } from '@/services/callsService';
import { dashboardService } from '@/services/dashboardService';

// Mock Supabase
const mockSupabaseAuth = {
  getSession: vi.fn(),
  admin: {
    inviteUserByEmail: vi.fn(),
    deleteUser: vi.fn(),
  },
};

const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
  rpc: mockSupabaseRpc,
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

describe('API Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default session mock
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { 
            id: 'admin-1', 
            email: 'admin@example.com',
            user_metadata: { full_name: 'Admin User' }
          } 
        } 
      },
      error: null,
    });
  });

  describe('Admin Service Integration', () => {
    it('creates user with invitation flow', async () => {
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'admin-1', role: 'admin' }, 
          error: null 
        })),
        insert: vi.fn(() => Promise.resolve({ 
          data: [{ id: 'new-user-1' }], 
          error: null 
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);
      
      mockSupabaseAuth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-1', email: 'newuser@example.com' } },
        error: null,
      });

      const userData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'user' as const,
        client_id: 'client-1',
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.objectContaining({
          data: { full_name: 'New User', role: 'user' },
        })
      );
    });

    it('handles user creation failure with cleanup', async () => {
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'admin-1', role: 'admin' }, 
          error: null 
        })),
        insert: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Profile creation failed' }
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);
      
      mockSupabaseAuth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-1', email: 'newuser@example.com' } },
        error: null,
      });

      mockSupabaseAuth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const userData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'user' as const,
        client_id: 'client-1',
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(false);
      expect(mockSupabaseAuth.admin.deleteUser).toHaveBeenCalledWith('new-user-1');
    });

    it('deletes user with fallback mechanism', async () => {
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'admin-1', role: 'admin' }, 
          error: null 
        })),
        delete: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: null 
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);
      
      // Mock admin API failure (expected on client)
      mockSupabaseAuth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Forbidden' },
      });

      // Mock RPC fallback success
      mockSupabaseRpc.mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await adminService.deleteUser('user-to-delete');

      expect(result.success).toBe(true);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('delete_user_auth', {
        user_id: 'user-to-delete',
      });
    });
  });

  describe('Calls Service Integration', () => {
    it('fetches calls with proper filtering', async () => {
      const mockCalls = [
        {
          id: '1',
          client_id: 'client-1',
          caller_full_name: 'John Doe',
          call_start_time: '2024-01-15T10:00:00Z',
          call_type: 'inbound',
        },
        {
          id: '2',
          client_id: 'client-1',
          caller_full_name: 'Jane Smith',
          call_start_time: '2024-01-15T11:00:00Z',
          call_type: 'outbound',
        },
      ];

      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        gte: vi.fn(() => mockQueryChain),
        lte: vi.fn(() => mockQueryChain),
        order: vi.fn(() => mockQueryChain),
        limit: vi.fn(() => mockQueryChain),
        range: vi.fn(() => Promise.resolve({ 
          data: mockCalls, 
          error: null,
          count: 2,
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);

      const filters = {
        clientId: 'client-1',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        page: 0,
        pageSize: 10,
      };

      const result = await callsService.getCalls(filters);

      expect(result.data).toEqual(mockCalls);
      expect(result.count).toBe(2);
      expect(mockQueryChain.eq).toHaveBeenCalledWith('client_id', 'client-1');
    });

    it('handles call fetch errors gracefully', async () => {
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        order: vi.fn(() => mockQueryChain),
        limit: vi.fn(() => mockQueryChain),
        range: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Database error' },
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);

      const filters = {
        clientId: 'client-1',
        page: 0,
        pageSize: 10,
      };

      await expect(callsService.getCalls(filters)).rejects.toThrow('Database error');
    });
  });

  describe('Dashboard Service Integration', () => {
    it('fetches dashboard metrics with proper aggregation', async () => {
      const mockMetrics = {
        totalCalls: 150,
        totalLeads: 45,
        avgCallDuration: 180,
        callsToday: 12,
        leadsToday: 3,
        conversionRate: 30,
      };

      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        gte: vi.fn(() => mockQueryChain),
        lte: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: mockMetrics, 
          error: null 
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);

      const result = await dashboardService.getMetrics('client-1');

      expect(result).toEqual(mockMetrics);
      expect(mockQueryChain.eq).toHaveBeenCalledWith('client_id', 'client-1');
    });

    it('handles missing metrics gracefully', async () => {
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: null 
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);

      const result = await dashboardService.getMetrics('client-1');

      expect(result).toEqual({
        totalCalls: 0,
        totalLeads: 0,
        avgCallDuration: 0,
        callsToday: 0,
        leadsToday: 0,
        conversionRate: 0,
      });
    });
  });

  describe('Service Error Handling', () => {
    it('handles network timeouts', async () => {
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.reject(new Error('Network timeout'))),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);

      await expect(dashboardService.getMetrics('client-1')).rejects.toThrow('Network timeout');
    });

    it('handles authentication errors', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Not authenticated' },
      });

      const userData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'user' as const,
        client_id: 'client-1',
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('authentication');
    });

    it('handles permission errors', async () => {
      // Mock non-admin user
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'user-1', 
              email: 'user@example.com',
              user_metadata: { full_name: 'Regular User' }
            } 
          } 
        },
        error: null,
      });

      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'user-1', role: 'user' }, 
          error: null 
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);

      const userData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'user' as const,
        client_id: 'client-1',
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });
  });

  describe('Data Consistency', () => {
    it('maintains data consistency across related operations', async () => {
      // Test that creating a user also creates related profile data
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'admin-1', role: 'admin' }, 
          error: null 
        })),
        insert: vi.fn(() => Promise.resolve({ 
          data: [{ 
            id: 'new-user-1',
            email: 'newuser@example.com',
            full_name: 'New User',
            role: 'user',
            client_id: 'client-1',
          }], 
          error: null 
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);
      
      mockSupabaseAuth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-1', email: 'newuser@example.com' } },
        error: null,
      });

      const userData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'user' as const,
        client_id: 'client-1',
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(true);
      
      // Verify both auth user and profile were created
      expect(mockSupabaseAuth.admin.inviteUserByEmail).toHaveBeenCalled();
      expect(mockQueryChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-user-1',
          email: 'newuser@example.com',
          full_name: 'New User',
          role: 'user',
          client_id: 'client-1',
        })
      );
    });

    it('rolls back changes on partial failure', async () => {
      // Test that auth user is deleted if profile creation fails
      const mockQueryChain = {
        select: vi.fn(() => mockQueryChain),
        eq: vi.fn(() => mockQueryChain),
        single: vi.fn(() => Promise.resolve({ 
          data: { id: 'admin-1', role: 'admin' }, 
          error: null 
        })),
        insert: vi.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Profile creation failed' }
        })),
      };

      mockSupabaseFrom.mockReturnValue(mockQueryChain);
      
      mockSupabaseAuth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-1', email: 'newuser@example.com' } },
        error: null,
      });

      mockSupabaseAuth.admin.deleteUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const userData = {
        email: 'newuser@example.com',
        full_name: 'New User',
        role: 'user' as const,
        client_id: 'client-1',
      };

      const result = await adminService.createUser(userData);

      expect(result.success).toBe(false);
      expect(mockSupabaseAuth.admin.deleteUser).toHaveBeenCalledWith('new-user-1');
    });
  });
});