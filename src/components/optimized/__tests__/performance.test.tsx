import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testUtils, performanceTester } from '@/utils/performanceTesting';
import MemoizedCallLogsTable from '../MemoizedCallLogsTable';
import VirtualizedCallLogsTable from '../VirtualizedCallLogsTable';
import MemoizedLeadsTable from '../MemoizedLeadsTable';
import MemoizedMetricsSummaryCards from '../MemoizedMetricsSummaryCards';
import { ExtendedCallLog } from '@/components/CallLogsTable';
import { Lead as SupabaseLead } from '@/integrations/supabase/lead-service';

// Mock dependencies
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', client_id: 'client-1', role: 'user' }
  })
}));

vi.mock('@/services/callIntelligenceService', () => ({
  CallIntelligenceService: {
    getCallInquiryTypes: vi.fn().mockResolvedValue(new Map())
  }
}));

vi.mock('@/components/calls/CallDetailsPopup', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="call-details-popup">Call Details</div> : null
}));

vi.mock('@/components/calls/InquiryTypeBadge', () => ({
  default: ({ inquiryType }: { inquiryType: string }) => 
    <span data-testid="inquiry-badge">{inquiryType}</span>
}));

// Test data generators
const createCallLog = (id: number): ExtendedCallLog => ({
  id: `call-${id}`,
  client_id: 'client-1',
  call_type: 'inbound',
  caller_phone_number: `+1234567${id.toString().padStart(3, '0')}`,
  to_phone_number: '+1234567890',
  caller_full_name: `Caller ${id}`,
  call_start_time: new Date(Date.now() - id * 60000).toISOString(),
  call_end_time: new Date(Date.now() - id * 60000 + 300000).toISOString(),
  call_duration_seconds: 300,
  call_duration_mins: 5,
  transcript: `This is a test transcript for call ${id}`,
  call_summary: `Summary for call ${id}`,
  recording_url: `https://example.com/recording-${id}`,
  assistant_id: 'assistant-1',
  hangup_reason: 'completed',
  transfer_flag: false,
  vapi_call_cost_usd: 0.1,
  vapi_llm_cost_usd: 0.05,
  openai_api_cost_usd: 0.02,
  openai_api_tokens_input: 100,
  openai_api_tokens_output: 50,
  twillio_call_cost_usd: 0.03,
  sms_cost_usd: 0.01,
  tool_cost_usd: 0.01,
  total_call_cost_usd: 0.22,
  total_cost_cad: 0.3,
  created_at: new Date(Date.now() - id * 60000).toISOString(),
  client_name: `Client ${id % 3 + 1}`
});

const createLead = (id: number): SupabaseLead => ({
  id: `lead-${id}`,
  client_id: 'client-1',
  call_id: `call-${id}`,
  full_name: `Lead ${id}`,
  first_name: `First${id}`,
  last_name: `Last${id}`,
  phone_number: `+1234567${id.toString().padStart(3, '0')}`,
  from_phone_number: '+1234567890',
  email: `lead${id}@example.com`,
  lead_status: 'new',
  callback_timing_captured: true,
  callback_timing_value: 'morning',
  appointment_confirmed_at: null,
  sent_to_client_at: null,
  custom_lead_data: null,
  created_at: new Date(Date.now() - id * 60000).toISOString(),
  status: 'new' as const,
  source: 'ai_agent' as const,
  notes: `Notes for lead ${id}`,
  client_name: `Client ${id % 3 + 1}`,
  call_time: new Date(Date.now() - id * 60000).toISOString()
});

const createMetrics = () => ({
  totalCalls: 1000,
  averageHandleTime: '5:30',
  callsTransferred: 50,
  totalLeads: 200,
  callsGrowth: 15,
  timeGrowth: -5,
  transferGrowth: 10,
  leadsGrowth: 25,
  todaysCalls: 45,
  linesAvailable: 10,
  agentsAvailable: 1,
  callsInQueue: 3
});

describe('Performance Tests', () => {
  beforeEach(() => {
    performanceTester.clearResults();
  });

  afterEach(() => {
    performanceTester.cleanup();
  });

  describe('MemoizedCallLogsTable', () => {
    it('should render small dataset efficiently', async () => {
      const callLogs = Array.from({ length: 100 }, (_, i) => createCallLog(i));
      const leadCallIds = new Set(['call-1', 'call-2', 'call-3']);
      const onRefresh = vi.fn();

      const { result, renderTime, passed } = await testUtils.testRenderPerformance(() => {
        return render(
          <MemoizedCallLogsTable
            callLogs={callLogs}
            loading={false}
            onRefresh={onRefresh}
            leadCallIds={leadCallIds}
          />
        );
      }, 100);

      expect(passed).toBe(true);
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText('Caller 0')).toBeInTheDocument();
    });

    it('should prevent unnecessary re-renders with same props', () => {
      const callLogs = Array.from({ length: 50 }, (_, i) => createCallLog(i));
      const leadCallIds = new Set(['call-1', 'call-2']);
      const onRefresh = vi.fn();

      const { rerender } = render(
        <MemoizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={onRefresh}
          leadCallIds={leadCallIds}
        />
      );

      // Re-render with same props should not cause re-render
      const renderSpy = vi.spyOn(React, 'createElement');
      const initialCallCount = renderSpy.mock.calls.length;

      rerender(
        <MemoizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={onRefresh}
          leadCallIds={leadCallIds}
        />
      );

      // Should not have created new elements due to memoization
      expect(renderSpy.mock.calls.length).toBe(initialCallCount);
    });

    it('should handle large datasets within performance limits', async () => {
      const callLogs = Array.from({ length: 1000 }, (_, i) => createCallLog(i));
      const leadCallIds = new Set(Array.from({ length: 100 }, (_, i) => `call-${i}`));
      const onRefresh = vi.fn();

      const { renderTime, passed } = await testUtils.testRenderPerformance(() => {
        return render(
          <MemoizedCallLogsTable
            callLogs={callLogs}
            loading={false}
            onRefresh={onRefresh}
            leadCallIds={leadCallIds}
          />
        );
      }, 200); // Allow more time for large dataset

      expect(passed).toBe(true);
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('VirtualizedCallLogsTable', () => {
    it('should render large dataset efficiently with virtualization', async () => {
      const callLogs = Array.from({ length: 5000 }, (_, i) => createCallLog(i));
      const leadCallIds = new Set(Array.from({ length: 500 }, (_, i) => `call-${i}`));
      const onRefresh = vi.fn();

      const { renderTime, passed } = await testUtils.testRenderPerformance(() => {
        return render(
          <VirtualizedCallLogsTable
            callLogs={callLogs}
            loading={false}
            onRefresh={onRefresh}
            leadCallIds={leadCallIds}
            height={600}
            itemHeight={80}
          />
        );
      }, 100); // Virtualization should be very fast

      expect(passed).toBe(true);
      expect(renderTime).toBeLessThan(100);
    });

    it('should maintain low memory usage with large datasets', () => {
      const callLogs = Array.from({ length: 10000 }, (_, i) => createCallLog(i));
      const onRefresh = vi.fn();

      render(
        <VirtualizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={onRefresh}
          height={600}
          itemHeight={80}
        />
      );

      const { memoryUsage, passed } = testUtils.testMemoryUsage(100);
      expect(passed).toBe(true);
    });

    it('should handle scrolling performance', async () => {
      const callLogs = Array.from({ length: 1000 }, (_, i) => createCallLog(i));
      const onRefresh = vi.fn();

      render(
        <VirtualizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={onRefresh}
          height={600}
          itemHeight={80}
        />
      );

      // Simulate scrolling
      const scrollContainer = screen.getByRole('table').closest('div');
      if (scrollContainer) {
        const startTime = performance.now();
        
        // Simulate multiple scroll events
        for (let i = 0; i < 10; i++) {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
        }
        
        const endTime = performance.now();
        const scrollTime = endTime - startTime;
        
        expect(scrollTime).toBeLessThan(50); // Should handle scrolling quickly
      }
    });
  });

  describe('MemoizedLeadsTable', () => {
    it('should render leads efficiently', async () => {
      const leads = Array.from({ length: 200 }, (_, i) => createLead(i));
      const mockHandlers = {
        onViewLead: vi.fn(),
        onEditLead: vi.fn(),
        onDeleteLead: vi.fn(),
        onStatusChange: vi.fn(),
        onExportLeads: vi.fn()
      };

      const { renderTime, passed } = await testUtils.testRenderPerformance(() => {
        return render(
          <MemoizedLeadsTable
            leads={leads}
            loading={false}
            {...mockHandlers}
          />
        );
      }, 150);

      expect(passed).toBe(true);
      expect(renderTime).toBeLessThan(150);
      expect(screen.getByText('Lead 0')).toBeInTheDocument();
    });

    it('should optimize re-renders when lead data changes', () => {
      const leads = Array.from({ length: 100 }, (_, i) => createLead(i));
      const mockHandlers = {
        onViewLead: vi.fn(),
        onEditLead: vi.fn(),
        onDeleteLead: vi.fn(),
        onStatusChange: vi.fn(),
        onExportLeads: vi.fn()
      };

      const { rerender } = render(
        <MemoizedLeadsTable
          leads={leads}
          loading={false}
          {...mockHandlers}
        />
      );

      // Change one lead's status
      const updatedLeads = [...leads];
      updatedLeads[0] = { ...updatedLeads[0], status: 'contacted' as const };

      const renderSpy = vi.spyOn(console, 'log');
      
      rerender(
        <MemoizedLeadsTable
          leads={updatedLeads}
          loading={false}
          {...mockHandlers}
        />
      );

      // Should re-render due to data change
      expect(screen.getByText('Lead 0')).toBeInTheDocument();
    });
  });

  describe('MemoizedMetricsSummaryCards', () => {
    it('should render metrics cards efficiently', async () => {
      const metrics = createMetrics();

      const { renderTime, passed } = await testUtils.testRenderPerformance(() => {
        return render(
          <MemoizedMetricsSummaryCards
            metrics={metrics}
            isLoading={false}
          />
        );
      }, 50);

      expect(passed).toBe(true);
      expect(renderTime).toBeLessThan(50);
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total calls
    });

    it('should prevent re-renders when metrics unchanged', () => {
      const metrics = createMetrics();

      const { rerender } = render(
        <MemoizedMetricsSummaryCards
          metrics={metrics}
          isLoading={false}
        />
      );

      const renderSpy = vi.spyOn(React, 'createElement');
      const initialCallCount = renderSpy.mock.calls.length;

      // Re-render with same metrics
      rerender(
        <MemoizedMetricsSummaryCards
          metrics={metrics}
          isLoading={false}
        />
      );

      // Should not create new elements due to memoization
      expect(renderSpy.mock.calls.length).toBe(initialCallCount);
    });

    it('should re-render when metrics change', () => {
      const metrics = createMetrics();

      const { rerender } = render(
        <MemoizedMetricsSummaryCards
          metrics={metrics}
          isLoading={false}
        />
      );

      // Change metrics
      const updatedMetrics = { ...metrics, totalCalls: 1500 };

      rerender(
        <MemoizedMetricsSummaryCards
          metrics={updatedMetrics}
          isLoading={false}
        />
      );

      expect(screen.getByText('1,500')).toBeInTheDocument();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet table component benchmarks', async () => {
      const testId = performanceTester.startTest('CallLogsTable');
      
      const callLogs = Array.from({ length: 500 }, (_, i) => createCallLog(i));
      
      render(
        <MemoizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={vi.fn()}
        />
      );

      const result = performanceTester.endTest(testId, 'CallLogsTable');
      const benchmarks = performanceTester.checkBenchmarks('CallLogsTable', 'table');

      expect(benchmarks.passed).toBe(true);
      expect(result.renderTime).toBeLessThan(100);
    });

    it('should meet virtualized component benchmarks', async () => {
      const testId = performanceTester.startTest('VirtualizedCallLogsTable');
      
      const callLogs = Array.from({ length: 2000 }, (_, i) => createCallLog(i));
      
      render(
        <VirtualizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={vi.fn()}
          height={600}
          itemHeight={80}
        />
      );

      const result = performanceTester.endTest(testId, 'VirtualizedCallLogsTable');
      const benchmarks = performanceTester.checkBenchmarks('VirtualizedCallLogsTable', 'virtualized');

      expect(benchmarks.passed).toBe(true);
      expect(result.renderTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    it('should maintain reasonable memory usage with large datasets', () => {
      // Create large dataset
      const callLogs = Array.from({ length: 5000 }, (_, i) => createCallLog(i));
      
      render(
        <VirtualizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={vi.fn()}
          height={600}
          itemHeight={80}
        />
      );

      const { memoryUsage, passed } = testUtils.testMemoryUsage(50);
      
      // Memory usage should be reasonable even with large datasets
      expect(passed).toBe(true);
      expect(memoryUsage).toBeLessThan(50);
    });
  });
});

describe('Integration Performance Tests', () => {
  it('should handle real-world usage patterns efficiently', async () => {
    const callLogs = Array.from({ length: 1000 }, (_, i) => createCallLog(i));
    const onRefresh = vi.fn();

    const { renderTime } = await testUtils.testRenderPerformance(() => {
      return render(
        <MemoizedCallLogsTable
          callLogs={callLogs}
          loading={false}
          onRefresh={onRefresh}
        />
      );
    });

    // Simulate user interactions
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    const interactionStartTime = performance.now();
    
    // Type in search
    fireEvent.change(searchInput, { target: { value: 'Caller 1' } });
    
    // Wait for debounced search
    await waitFor(() => {
      expect(screen.getByText('Caller 1')).toBeInTheDocument();
    });

    const interactionEndTime = performance.now();
    const interactionTime = interactionEndTime - interactionStartTime;

    expect(renderTime).toBeLessThan(200);
    expect(interactionTime).toBeLessThan(100);
  });
});