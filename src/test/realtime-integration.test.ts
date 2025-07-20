/**
 * Integration tests for real-time functionality
 * These tests verify that the real-time services and hooks work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtimeAgentStatus } from '@/hooks/useRealtimeAgentStatus';
import { useRealtimeSystemMessages } from '@/hooks/useRealtimeSystemMessages';
import { realtimeService } from '@/services/realtimeService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    realtime: {
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      }),
      unsubscribe: vi.fn(),
    })),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock AgentStatusService
vi.mock('@/services/agentStatusService', () => ({
  AgentStatusService: {
    getAgentStatus: vi.fn().mockResolvedValue({
      id: 'test-id',
      client_id: 'test-client',
      status: 'active',
      message: 'Test message',
      last_updated: new Date(),
      updated_by: 'test-user',
      created_at: new Date(),
    }),
    updateAgentStatus: vi.fn().mockResolvedValue({
      id: 'test-id',
      client_id: 'test-client',
      status: 'maintenance',
      message: 'Updated message',
      last_updated: new Date(),
      updated_by: 'test-user',
      created_at: new Date(),
    }),
  },
}));

// Mock SystemMessageService
vi.mock('@/services/systemMessageService', () => ({
  SystemMessageService: {
    getMessagesForClient: vi.fn().mockResolvedValue([
      {
        id: 'msg-1',
        client_id: 'test-client',
        type: 'info',
        message: 'Test message',
        timestamp: new Date(),
        expires_at: null,
        created_by: 'test-user',
        updated_by: 'test-user',
        created_at: new Date(),
        updated_at: new Date(),
        isExpired: false,
        isGlobal: false,
      },
    ]),
    getSystemMessages: vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    }),
    createSystemMessage: vi.fn().mockResolvedValue({
      id: 'new-msg',
      client_id: 'test-client',
      type: 'warning',
      message: 'New test message',
      timestamp: new Date(),
      expires_at: null,
      created_by: 'test-user',
      updated_by: 'test-user',
      created_at: new Date(),
      updated_at: new Date(),
      isExpired: false,
      isGlobal: false,
    }),
  },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Real-time Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any active subscriptions
    realtimeService.disconnect();
  });

  describe('useRealtimeAgentStatus', () => {
    it('should load initial agent status', async () => {
      const { result } = renderHook(() =>
        useRealtimeAgentStatus({ clientId: 'test-client' })
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.agentStatus).toBe(null);

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have loaded status
      expect(result.current.isLoading).toBe(false);
      expect(result.current.agentStatus).toBeTruthy();
      expect(result.current.agentStatus?.status).toBe('active');
    });

    it('should update agent status', async () => {
      const { result } = renderHook(() =>
        useRealtimeAgentStatus({ clientId: 'test-client' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Update status
      await act(async () => {
        await result.current.updateStatus({
          status: 'maintenance',
          message: 'Updated message',
        });
      });

      expect(result.current.agentStatus?.status).toBe('maintenance');
      expect(result.current.agentStatus?.message).toBe('Updated message');
    });

    it('should handle connection status changes', () => {
      const { result } = renderHook(() =>
        useRealtimeAgentStatus({ clientId: 'test-client' })
      );

      // Should start with disconnected status
      expect(result.current.connectionStatus.status).toBe('disconnected');
    });
  });

  describe('useRealtimeSystemMessages', () => {
    it('should load initial system messages', async () => {
      const { result } = renderHook(() =>
        useRealtimeSystemMessages({ clientId: 'test-client' })
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.messages).toEqual([]);

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have loaded messages
      expect(result.current.isLoading).toBe(false);
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].message).toBe('Test message');
    });

    it('should create new system message', async () => {
      const { result } = renderHook(() =>
        useRealtimeSystemMessages({ clientId: 'test-client' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Create new message
      let createdMessage;
      await act(async () => {
        createdMessage = await result.current.createMessage({
          client_id: 'test-client',
          type: 'warning',
          message: 'New test message',
        });
      });

      expect(createdMessage).toBeTruthy();
      expect(createdMessage.type).toBe('warning');
      expect(createdMessage.message).toBe('New test message');
    });

    it('should filter active and expired messages', async () => {
      const { result } = renderHook(() =>
        useRealtimeSystemMessages({ clientId: 'test-client' })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // All messages should be active (no expiration)
      expect(result.current.activeMessages).toHaveLength(1);
      expect(result.current.expiredMessages).toHaveLength(0);
    });
  });

  describe('RealtimeService', () => {
    it('should manage connection status', () => {
      const initialStatus = realtimeService.getConnectionStatus();
      expect(initialStatus.status).toBe('disconnected');
    });

    it('should track active subscriptions', () => {
      const initialCount = realtimeService.getActiveSubscriptionsCount();
      expect(initialCount).toBe(0);

      // Create a subscription
      const subscription = realtimeService.subscribeToAgentStatus(
        'test-client',
        () => {}
      );

      expect(realtimeService.getActiveSubscriptionsCount()).toBe(1);

      // Clean up
      subscription.unsubscribe();
      expect(realtimeService.getActiveSubscriptionsCount()).toBe(0);
    });

    it('should handle multiple subscriptions', () => {
      const agentSub = realtimeService.subscribeToAgentStatus(
        'test-client',
        () => {}
      );
      const messagesSub = realtimeService.subscribeToSystemMessages(
        'test-client',
        () => {}
      );
      const clientSub = realtimeService.subscribeToClientUpdates(() => {});

      expect(realtimeService.getActiveSubscriptionsCount()).toBe(3);

      // Clean up all
      agentSub.unsubscribe();
      messagesSub.unsubscribe();
      clientSub.unsubscribe();

      expect(realtimeService.getActiveSubscriptionsCount()).toBe(0);
    });
  });
});