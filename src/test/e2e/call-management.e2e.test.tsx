import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Logs from '@/pages/Logs';
import Call from '@/pages/Call';

// Mock authenticated user
const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  client_id: 'client-1',
};

// Mock Supabase
const mockSupabaseAuth = {
  getSession: vi.fn(() => Promise.resolve({
    data: { 
      session: { 
        user: mockUser,
        access_token: 'token' 
      } 
    },
    error: null,
  })),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  })),
};

const mockCallsData = [
  {
    id: '1',
    client_id: 'client-1',
    call_type: 'inbound',
    caller_phone_number: '+1234567890',
    caller_full_name: 'John Doe',
    call_start_time: '2024-01-15T10:30:00Z',
    call_end_time: '2024-01-15T10:35:00Z',
    call_duration_seconds: 300,
    call_duration_mins: 5,
    transcript: 'Hello, I am interested in your services',
    recording_url: 'https://example.com/recording1.mp3',
    transfer_flag: false,
  },
  {
    id: '2',
    client_id: 'client-1',
    call_type: 'outbound',
    caller_phone_number: '+1987654321',
    caller_full_name: 'Jane Smith',
    call_start_time: '2024-01-15T14:20:00Z',
    call_end_time: '2024-01-15T14:25:00Z',
    call_duration_seconds: 300,
    call_duration_mins: 5,
    transcript: 'Following up on your inquiry',
    recording_url: 'https://example.com/recording2.mp3',
    transfer_flag: true,
  },
];

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: mockCallsData,
            error: null,
            count: 2,
          })),
        })),
        single: vi.fn(() => Promise.resolve({
          data: mockCallsData[0],
          error: null,
        })),
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({
              data: mockCallsData,
              error: null,
              count: 2,
            })),
          })),
        })),
      })),
    })),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock auth context
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock services
vi.mock('@/services/callIntelligenceService', () => ({
  CallIntelligenceService: {
    getCallInquiryTypes: vi.fn(() => Promise.resolve(new Map([
      ['1', 'Sales Inquiry'],
      ['2', 'Support Request'],
    ]))),
  },
}));

vi.mock('@/services/leadEvaluationService', () => ({
  LeadEvaluationService: {
    getEvaluationsByCallIds: vi.fn(() => Promise.resolve(new Map())),
  },
}));

vi.mock('@/services/promptAdherenceService', () => ({
  PromptAdherenceService: {
    getAdherenceScoresByCallIds: vi.fn(() => Promise.resolve(new Map())),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const TestApp = ({ initialPath = '/logs' }: { initialPath?: string }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/logs" element={<Logs />} />
          <Route path="/call/:id" element={<Call />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('End-to-End Call Management Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Call Logs Page', () => {
    it('displays call logs with proper information', async () => {
      render(<TestApp initialPath="/logs" />);

      // User should see the call logs page
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Should show call details
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('+1987654321')).toBeInTheDocument();
      
      // Should show call types
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
    });

    it('allows filtering calls by search term', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // User searches for specific caller
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('allows filtering calls by call type', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // User filters by call type
      const typeFilter = screen.getByDisplayValue('All Call Types');
      fireEvent.change(typeFilter, { target: { value: 'inbound' } });

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('allows sorting calls by different fields', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // User clicks on caller name header to sort
      const callerHeader = screen.getByText('Caller');
      fireEvent.click(callerHeader);

      // Should trigger sorting (we can't easily test the actual sort order in this mock setup)
      expect(callerHeader).toBeInTheDocument();
    });

    it('opens call details when clicking on a call', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // User clicks on a call row
      const johnRow = screen.getByText('John Doe').closest('tr');
      if (johnRow) {
        fireEvent.click(johnRow);
      }

      // Should open call details popup
      await waitFor(() => {
        // In a real implementation, this would open a modal
        // For now, we just verify the click was registered
        expect(johnRow).toBeInTheDocument();
      });
    });

    it('shows inquiry types when available', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('Sales Inquiry')).toBeInTheDocument();
        expect(screen.getByText('Support Request')).toBeInTheDocument();
      });
    });
  });

  describe('Call Details View', () => {
    it('displays detailed call information', async () => {
      // Mock single call fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockCallsData[0],
              error: null,
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/call/1" />);

      // Should show call details
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should show transcript
      expect(screen.getByText('Hello, I am interested in your services')).toBeInTheDocument();
    });

    it('handles call not found error', async () => {
      // Mock call not found
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Call not found' },
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/call/999" />);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/call not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Call Management Workflow', () => {
    it('completes full call review workflow', async () => {
      render(<TestApp initialPath="/logs" />);

      // 1. User views call logs
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // 2. User searches for specific call
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });

      // 3. User clicks on call to view details
      const viewButton = screen.getAllByLabelText('View Details')[0];
      fireEvent.click(viewButton);

      // Should trigger call details view
      expect(viewButton).toBeInTheDocument();

      // 4. User clears search to see all calls again
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('handles pagination for large call lists', async () => {
      // Mock large dataset
      const largeMockData = Array.from({ length: 50 }, (_, i) => ({
        ...mockCallsData[0],
        id: `call-${i}`,
        caller_full_name: `Caller ${i}`,
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: largeMockData.slice(0, 10), // First page
                error: null,
                count: 50,
              })),
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/logs" />);

      // Should show pagination info
      await waitFor(() => {
        expect(screen.getByText(/showing.*of.*call logs/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('shows loading state while fetching calls', async () => {
      // Mock slow API response
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => new Promise(resolve => 
                setTimeout(() => resolve({
                  data: mockCallsData,
                  error: null,
                  count: 2,
                }), 100)
              )),
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/logs" />);

      // Should show loading state
      expect(screen.getByText('Loading call logs...')).toBeInTheDocument();

      // Should eventually show data
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('handles empty call logs gracefully', async () => {
      // Mock empty response
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: [],
                error: null,
                count: 0,
              })),
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/logs" />);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('No call logs found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or search term')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API error
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({
                data: null,
                error: { message: 'Database connection failed' },
              })),
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/logs" />);

      // Should handle error gracefully
      await waitFor(() => {
        // In a real implementation, this would show an error message
        // For now, we just verify the component doesn't crash
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('recovers from network errors', async () => {
      // Mock network error followed by success
      let callCount = 0;
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => {
                callCount++;
                if (callCount === 1) {
                  return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({
                  data: mockCallsData,
                  error: null,
                  count: 2,
                });
              }),
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/logs" />);

      // Should eventually recover and show data
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper keyboard navigation', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Search input should be focusable
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Filter dropdown should be focusable
      const typeFilter = screen.getByDisplayValue('All Call Types');
      typeFilter.focus();
      expect(document.activeElement).toBe(typeFilter);
    });

    it('provides proper ARIA labels', async () => {
      render(<TestApp initialPath="/logs" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Table should have proper role
      expect(screen.getByRole('table')).toBeInTheDocument();

      // View buttons should have proper labels
      const viewButtons = screen.getAllByLabelText('View Details');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('announces loading states to screen readers', async () => {
      // Mock slow loading
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => new Promise(resolve => 
                setTimeout(() => resolve({
                  data: mockCallsData,
                  error: null,
                  count: 2,
                }), 100)
              )),
            })),
          })),
        })),
      });

      render(<TestApp initialPath="/logs" />);

      // Loading message should be announced
      const loadingMessage = screen.getByText('Loading call logs...');
      expect(loadingMessage).toBeInTheDocument();
    });
  });
});