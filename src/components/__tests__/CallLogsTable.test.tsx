import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CallLogsTable from '@/components/CallLogsTable';
import { AuthProvider } from '@/context/AuthContext';
import { CallType } from '@/integrations/supabase/call-logs-service';

// Mock data
const mockCallLogs = [
  {
    id: '1',
    client_id: 'client-1',
    call_type: CallType.INBOUND,
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
    call_type: CallType.OUTBOUND,
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

const mockUser = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user' as const,
  client_id: 'client-1',
};

// Mock the auth context
vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock client data isolation
vi.mock('@/utils/clientDataIsolation', () => ({
  canViewSensitiveInfo: vi.fn(() => false),
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

// Mock call details popup
vi.mock('@/components/calls/CallDetailsPopup', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="call-details-popup">Call Details Popup</div> : null,
}));

const renderCallLogsTable = (props = {}) => {
  const defaultProps = {
    callLogs: mockCallLogs,
    loading: false,
    onRefresh: vi.fn(),
    leadCallIds: new Set(['1']),
  };

  return render(
    <BrowserRouter>
      <AuthProvider>
        <CallLogsTable {...defaultProps} {...props} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CallLogsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders call logs table with data', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('+1987654321')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    renderCallLogsTable({ loading: true });
    
    expect(screen.getByText('Loading call logs...')).toBeInTheDocument();
  });

  it('shows empty state when no call logs', () => {
    renderCallLogsTable({ callLogs: [] });
    
    expect(screen.getByText('No call logs found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search term')).toBeInTheDocument();
  });

  it('filters call logs by search term', async () => {
    renderCallLogsTable();
    
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters call logs by call type', async () => {
    renderCallLogsTable();
    
    const typeFilter = screen.getByDisplayValue('All Call Types');
    fireEvent.change(typeFilter, { target: { value: CallType.INBOUND } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('sorts call logs by different fields', async () => {
    renderCallLogsTable();
    
    const callerHeader = screen.getByText('Caller');
    fireEvent.click(callerHeader);

    // Should sort alphabetically
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // First row is header, second should be Jane Smith (alphabetically first)
      expect(rows[1]).toHaveTextContent('Jane Smith');
    });
  });

  it('opens call details popup when row is clicked', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      const johnRow = screen.getByText('John Doe').closest('tr');
      fireEvent.click(johnRow!);
    });

    expect(screen.getByTestId('call-details-popup')).toBeInTheDocument();
  });

  it('opens call details popup when view button is clicked', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      const viewButtons = screen.getAllByLabelText('View Details');
      fireEvent.click(viewButtons[0]);
    });

    expect(screen.getByTestId('call-details-popup')).toBeInTheDocument();
  });

  it('displays lead badge for calls with leads', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      expect(screen.getByText('Lead')).toBeInTheDocument();
    });
  });

  it('displays call type badges correctly', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      expect(screen.getByText('Inbound')).toBeInTheDocument();
      expect(screen.getByText('Outbound')).toBeInTheDocument();
    });
  });

  it('displays inquiry type badges when available', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      expect(screen.getByText('Sales Inquiry')).toBeInTheDocument();
      expect(screen.getByText('Support Request')).toBeInTheDocument();
    });
  });

  it('shows correct call count in footer', () => {
    renderCallLogsTable();
    
    expect(screen.getByText('Showing 2 of 2 call logs')).toBeInTheDocument();
  });

  it('handles empty leadCallIds gracefully', async () => {
    renderCallLogsTable({ leadCallIds: undefined });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Should not crash and should show no lead badges
      expect(screen.queryByText('Lead')).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', async () => {
    renderCallLogsTable();
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      expect(searchInput).toHaveAttribute('type', 'text');
      
      const viewButtons = screen.getAllByLabelText('View Details');
      expect(viewButtons[0]).toBeInTheDocument();
    });
  });
});