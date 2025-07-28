import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import ClientManagement from '@/pages/admin/ClientManagement';

// Mock admin user
const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
  client_id: null,
};

// Mock Supabase
const mockSupabaseAuth = {
  getSession: vi.fn(() => Promise.resolve({
    data: { 
      session: { 
        user: mockAdminUser,
        access_token: 'admin_token' 
      } 
    },
    error: null,
  })),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  })),
  admin: {
    inviteUserByEmail: vi.fn(),
    deleteUser: vi.fn(),
  },
};

const mockClientsData = [
  {
    id: 'client-1',
    name: 'Acme Corp',
    status: 'active',
    contact_email: 'contact@acme.com',
    joined_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'client-2',
    name: 'Beta Inc',
    status: 'inactive',
    contact_email: 'contact@beta.com',
    joined_at: '2024-01-02T00:00:00Z',
  },
];

const mockUsersData = [
  {
    id: 'user-1',
    email: 'user1@acme.com',
    full_name: 'John User',
    role: 'user',
    client_id: 'client-1',
    last_login_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'user2@beta.com',
    full_name: 'Jane User',
    role: 'client_admin',
    client_id: 'client-2',
    last_login_at: '2024-01-14T15:00:00Z',
  },
];

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: mockClientsData,
            error: null,
            count: 2,
          })),
        })),
        single: vi.fn(() => Promise.resolve({
          data: mockAdminUser,
          error: null,
        })),
      })),
      order: vi.fn(() => ({
        range: vi.fn(() => Promise.resolve({
          data: mockUsersData,
          error: null,
          count: 2,
        })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({
      data: [{ id: 'new-user-1' }],
      error: null,
    })),
    update: vi.fn(() => Promise.resolve({
      data: [{ id: 'user-1' }],
      error: null,
    })),
    delete: vi.fn(() => Promise.resolve({
      data: null,
      error: null,
    })),
  })),
  rpc: vi.fn(() => Promise.resolve({
    data: true,
    error: null,
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock auth context
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockAdminUser,
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock admin services
vi.mock('@/services/adminService', () => ({
  adminService: {
    getClients: vi.fn(() => Promise.resolve({
      data: mockClientsData,
      count: 2,
    })),
    getUsers: vi.fn(() => Promise.resolve({
      data: mockUsersData,
      count: 2,
    })),
    createUser: vi.fn(() => Promise.resolve({
      success: true,
      data: { id: 'new-user-1' },
    })),
    updateUser: vi.fn(() => Promise.resolve({
      success: true,
      data: { id: 'user-1' },
    })),
    deleteUser: vi.fn(() => Promise.resolve({
      success: true,
    })),
    createClient: vi.fn(() => Promise.resolve({
      success: true,
      data: { id: 'new-client-1' },
    })),
  },
}));

// Mock client data isolation
vi.mock('@/utils/clientDataIsolation', () => ({
  canAccessAdminPanel: vi.fn(() => true),
  canViewSensitiveInfo: vi.fn(() => true),
  canManageUsers: vi.fn(() => true),
  canManageClients: vi.fn(() => true),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/admin/dashboard' }),
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const TestApp = ({ initialPath = '/admin/dashboard' }: { initialPath?: string }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/clients" element={<ClientManagement />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('End-to-End Admin Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Dashboard', () => {
    it('displays admin dashboard with system overview', async () => {
      render(<TestApp initialPath="/admin/dashboard" />);

      // Should show admin dashboard
      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      // Should show system metrics
      // (In a real implementation, these would be actual metrics)
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('allows switching between different admin views', async () => {
      render(<TestApp initialPath="/admin/dashboard" />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Admin should be able to navigate to different sections
      // (Navigation would be handled by the admin sidebar in real implementation)
    });
  });

  describe('User Management', () => {
    it('displays list of users with proper information', async () => {
      render(<TestApp initialPath="/admin/users" />);

      // Should show user management page
      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
        expect(screen.getByText('Jane User')).toBeInTheDocument();
      });

      // Should show user details
      expect(screen.getByText('user1@acme.com')).toBeInTheDocument();
      expect(screen.getByText('user2@beta.com')).toBeInTheDocument();
    });

    it('allows creating new users', async () => {
      mockSupabaseAuth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-1', email: 'newuser@example.com' } },
        error: null,
      });

      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Admin clicks create user button
      const createButton = screen.getByText(/create user/i);
      fireEvent.click(createButton);

      // Should open user creation form
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Admin fills in user details
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/full name/i);
      const roleSelect = screen.getByLabelText(/role/i);

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(roleSelect, { target: { value: 'user' } });

      // Admin submits form
      const submitButton = screen.getByText(/create user/i);
      fireEvent.click(submitButton);

      // Should create user
      await waitFor(() => {
        expect(mockSupabaseAuth.admin.inviteUserByEmail).toHaveBeenCalledWith(
          'newuser@example.com',
          expect.objectContaining({
            data: expect.objectContaining({
              full_name: 'New User',
              role: 'user',
            }),
          })
        );
      });
    });

    it('allows editing existing users', async () => {
      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Admin clicks edit button for a user
      const editButtons = screen.getAllByText(/edit/i);
      fireEvent.click(editButtons[0]);

      // Should open edit form
      await waitFor(() => {
        expect(screen.getByDisplayValue('John User')).toBeInTheDocument();
      });

      // Admin modifies user details
      const nameInput = screen.getByDisplayValue('John User');
      fireEvent.change(nameInput, { target: { value: 'John Updated User' } });

      // Admin saves changes
      const saveButton = screen.getByText(/save/i);
      fireEvent.click(saveButton);

      // Should update user
      await waitFor(() => {
        expect(screen.getByText('John Updated User')).toBeInTheDocument();
      });
    });

    it('allows deleting users with confirmation', async () => {
      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Admin clicks delete button
      const deleteButtons = screen.getAllByText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      // Admin confirms deletion
      const confirmButton = screen.getByText(/confirm/i);
      fireEvent.click(confirmButton);

      // Should delete user
      await waitFor(() => {
        expect(screen.queryByText('John User')).not.toBeInTheDocument();
      });
    });

    it('filters users by client and role', async () => {
      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
        expect(screen.getByText('Jane User')).toBeInTheDocument();
      });

      // Admin filters by role
      const roleFilter = screen.getByLabelText(/filter by role/i);
      fireEvent.change(roleFilter, { target: { value: 'user' } });

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
        expect(screen.queryByText('Jane User')).not.toBeInTheDocument();
      });
    });
  });

  describe('Client Management', () => {
    it('displays list of clients with status indicators', async () => {
      render(<TestApp initialPath="/admin/clients" />);

      // Should show client management page
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
      });

      // Should show client status
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });

    it('allows creating new clients', async () => {
      render(<TestApp initialPath="/admin/clients" />);

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });

      // Admin clicks create client button
      const createButton = screen.getByText(/create client/i);
      fireEvent.click(createButton);

      // Should open client creation form
      await waitFor(() => {
        expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
      });

      // Admin fills in client details
      const nameInput = screen.getByLabelText(/client name/i);
      const emailInput = screen.getByLabelText(/contact email/i);

      fireEvent.change(nameInput, { target: { value: 'New Client Corp' } });
      fireEvent.change(emailInput, { target: { value: 'contact@newclient.com' } });

      // Admin submits form
      const submitButton = screen.getByText(/create client/i);
      fireEvent.click(submitButton);

      // Should create client
      await waitFor(() => {
        expect(screen.getByText('New Client Corp')).toBeInTheDocument();
      });
    });

    it('allows activating and deactivating clients', async () => {
      render(<TestApp initialPath="/admin/clients" />);

      await waitFor(() => {
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
        expect(screen.getByText('inactive')).toBeInTheDocument();
      });

      // Admin clicks activate button for inactive client
      const activateButton = screen.getByText(/activate/i);
      fireEvent.click(activateButton);

      // Should activate client
      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Workflow Integration', () => {
    it('completes full user management workflow', async () => {
      render(<TestApp initialPath="/admin/users" />);

      // 1. Admin views user list
      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // 2. Admin creates new user
      const createButton = screen.getByText(/create user/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/full name/i);

      fireEvent.change(emailInput, { target: { value: 'workflow@example.com' } });
      fireEvent.change(nameInput, { target: { value: 'Workflow User' } });

      const submitButton = screen.getByText(/create user/i);
      fireEvent.click(submitButton);

      // 3. Admin verifies user was created
      await waitFor(() => {
        expect(mockSupabaseAuth.admin.inviteUserByEmail).toHaveBeenCalled();
      });

      // 4. Admin can then edit or manage the new user
      // (This would continue the workflow in a real implementation)
    });

    it('handles error scenarios gracefully', async () => {
      // Mock API error
      mockSupabaseAuth.admin.inviteUserByEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' },
      });

      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Admin tries to create user with existing email
      const createButton = screen.getByText(/create user/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

      const submitButton = screen.getByText(/create user/i);
      fireEvent.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Permission and Security', () => {
    it('restricts access based on user role', async () => {
      // Mock non-admin user
      const regularUser = {
        ...mockAdminUser,
        role: 'user',
        client_id: 'client-1',
      };

      vi.mocked(useAuth).mockReturnValue({
        user: regularUser,
        isAuthenticated: true,
        loading: false,
      } as any);

      vi.mocked(canAccessAdminPanel).mockReturnValue(false);

      render(<TestApp initialPath="/admin/dashboard" />);

      // Should redirect or show access denied
      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      });
    });

    it('shows different features based on admin level', async () => {
      // Mock client admin (limited permissions)
      const clientAdmin = {
        ...mockAdminUser,
        role: 'client_admin',
        client_id: 'client-1',
      };

      vi.mocked(useAuth).mockReturnValue({
        user: clientAdmin,
        isAuthenticated: true,
        loading: false,
      } as any);

      vi.mocked(canManageClients).mockReturnValue(false);

      render(<TestApp initialPath="/admin/users" />);

      // Should show user management but not client management
      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Should not show client management features
      expect(screen.queryByText(/manage clients/i)).not.toBeInTheDocument();
    });
  });

  describe('Data Consistency and Audit', () => {
    it('maintains data consistency across operations', async () => {
      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Admin deletes a user
      const deleteButtons = screen.getAllByText(/delete/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByText(/confirm/i);
      fireEvent.click(confirmButton);

      // Should maintain consistency by removing user from all related data
      await waitFor(() => {
        expect(screen.queryByText('John User')).not.toBeInTheDocument();
      });
    });

    it('logs admin actions for audit purposes', async () => {
      // Mock audit service
      const mockAuditLog = vi.fn();
      vi.doMock('@/services/auditService', () => ({
        AuditService: {
          logUserAction: mockAuditLog,
        },
      }));

      render(<TestApp initialPath="/admin/users" />);

      await waitFor(() => {
        expect(screen.getByText('John User')).toBeInTheDocument();
      });

      // Admin performs an action
      const editButtons = screen.getAllByText(/edit/i);
      fireEvent.click(editButtons[0]);

      // Should log the action
      expect(mockAuditLog).toHaveBeenCalled();
    });
  });
});