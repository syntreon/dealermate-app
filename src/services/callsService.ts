import { supabase } from '@/integrations/supabase/client';
import { Call } from '@/context/CallsContext';

export interface CallFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  outcome?: string;
  hasLead?: boolean;
  clientId?: string;
}

export interface CallStats {
  totalCalls: number;
  sent: number;
  answered: number;
  failed: number;
}

/**
 * Service for handling calls data operations
 */
export const CallsService = {
  /**
   * Get calls with optional filtering
   */
  getCalls: async (filters?: CallFilters): Promise<Call[]> => {
    try {
      let query = supabase.from('calls').select(`
        *,
        leads!inner(id)
      `);

      // Apply client filter if specified
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply status filter
      if (filters?.status) {
        // Map status to database fields
        switch (filters.status) {
          case 'sent':
            query = query.not('call_start_time', 'is', null);
            break;
          case 'answered':
            query = query.not('call_end_time', 'is', null);
            break;
          case 'failed':
            query = query.like('hangup_reason', '%failed%');
            break;
        }
      }

      // Apply has lead filter
      if (filters?.hasLead !== undefined) {
        if (filters.hasLead) {
          query = query.not('leads', 'is', null);
        } else {
          query = query.is('leads', null);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform database records to Call interface
      return (data || []).map(record => ({
        id: record.id,
        name: record.caller_full_name || 'Unknown Caller',
        phoneNumber: record.caller_phone_number || 'Unknown',
        timestamp: record.created_at,
        appointmentDate: record.call_start_time ? new Date(record.call_start_time).toLocaleDateString() : 'N/A',
        appointmentTime: record.call_start_time ? new Date(record.call_start_time).toLocaleTimeString() : 'N/A',
        message: record.call_summary || record.transcript?.substring(0, 100) + '...' || '',
        status: determineCallStatus(record),
        duration: record.call_duration_seconds || 0,
        outcome: determineCallOutcome(record),
        hasLead: record.leads && record.leads.length > 0,
        recording_url: record.recording_url,
        transcript: record.transcript,
        call_summary: record.call_summary,
        transfer_flag: record.transfer_flag,
        hangup_reason: record.hangup_reason,
        client_id: record.client_id
      }));
    } catch (error) {
      console.error('Error fetching calls:', error);
      throw error;
    }
  },

  /**
   * Get call statistics
   */
  getCallStats: async (clientId?: string): Promise<CallStats> => {
    try {
      let query = supabase.from('calls').select('*');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const calls = data || [];
      const totalCalls = calls.length;

      // Calculate stats based on call data
      const sent = calls.filter(call => call.call_start_time).length;
      const answered = calls.filter(call => call.call_end_time && call.call_duration_seconds > 0).length;
      const failed = calls.filter(call => 
        call.hangup_reason && call.hangup_reason.includes('failed')
      ).length;

      return {
        totalCalls,
        sent,
        answered,
        failed
      };
    } catch (error) {
      console.error('Error fetching call stats:', error);
      return {
        totalCalls: 0,
        sent: 0,
        answered: 0,
        failed: 0
      };
    }
  },

  /**
   * Get recent calls for dashboard activity feed
   */
  getRecentCalls: async (limit: number = 5, clientId?: string): Promise<Call[]> => {
    try {
      let query = supabase
        .from('calls')
        .select(`
          *,
          leads(id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(record => ({
        id: record.id,
        name: record.caller_full_name || 'Unknown Caller',
        phoneNumber: record.caller_phone_number || 'Unknown',
        timestamp: record.created_at,
        appointmentDate: record.call_start_time ? new Date(record.call_start_time).toLocaleDateString() : 'N/A',
        appointmentTime: record.call_start_time ? new Date(record.call_start_time).toLocaleTimeString() : 'N/A',
        message: record.call_summary || record.transcript?.substring(0, 100) + '...' || '',
        status: determineCallStatus(record),
        duration: record.call_duration_seconds || 0,
        outcome: determineCallOutcome(record),
        hasLead: record.leads && record.leads.length > 0,
        recording_url: record.recording_url,
        transcript: record.transcript,
        call_summary: record.call_summary,
        transfer_flag: record.transfer_flag,
        hangup_reason: record.hangup_reason,
        client_id: record.client_id
      }));
    } catch (error) {
      console.error('Error fetching recent calls:', error);
      return [];
    }
  }
};

/**
 * Determine call status based on database record
 */
function determineCallStatus(record: any): 'sent' | 'answered' | 'failed' | 'in-progress' {
  if (record.hangup_reason && record.hangup_reason.includes('failed')) {
    return 'failed';
  }
  if (record.call_end_time) {
    return 'answered';
  }
  if (record.call_start_time) {
    return 'sent';
  }
  return 'in-progress';
}

/**
 * Determine call outcome based on database record
 */
function determineCallOutcome(record: any): 'successful' | 'unsuccessful' | 'lead-generated' | 'transferred' | null {
  if (record.transfer_flag) {
    return 'transferred';
  }
  
  // Check if lead was generated (this would need to be joined with leads table)
  if (record.leads && record.leads.length > 0) {
    return 'lead-generated';
  }
  
  if (record.call_end_time && record.call_duration_seconds > 30) {
    return 'successful';
  }
  
  if (record.hangup_reason && record.hangup_reason.includes('failed')) {
    return 'unsuccessful';
  }
  
  return null;
}