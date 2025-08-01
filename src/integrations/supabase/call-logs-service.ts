/**
 * Call Logs Service
 * Handles all interactions with call logs in Supabase
 * Provides caching and error handling
 */
import { supabase } from './client';
import type { Database } from './types';

// Type for call logs from database
export type CallLog = Database['public']['Tables']['calls']['Row'];

// Define call types
export enum CallType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  MISSED = 'missed',
  VOICEMAIL = 'voicemail'
}

// We now use CallType enum instead of CallLogStatus

// Interface for call log filters
export interface CallLogFilters {
  callType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  clientId?: string;
}

/**
 * Service for managing call logs in Supabase
 */
class CallLogsService {
  private static instance: CallLogsService;
  private cache: {
    data: CallLog[] | null;
    timestamp: number;
    expiresIn: number; // milliseconds
  };
  
  private constructor() {
    // Initialize cache
    this.cache = {
      data: null,
      timestamp: 0,
      expiresIn: 5 * 60 * 1000 // 5 minutes cache expiration
    };
  }
  
  /**
   * Get singleton instance of the service
   */
  public static getInstance(): CallLogsService {
    if (!CallLogsService.instance) {
      CallLogsService.instance = new CallLogsService();
    }
    return CallLogsService.instance;
  }
  
  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache.data) return false;
    const now = Date.now();
    return now - this.cache.timestamp < this.cache.expiresIn;
  }
  
  /**
   * Update the cache with new data
   */
  private updateCache(data: CallLog[]): void {
    this.cache = {
      data,
      timestamp: Date.now(),
      expiresIn: this.cache.expiresIn
    };
  }
  
  /**
   * Get all call logs with optional filtering
   */
  public async getCallLogs(filters?: CallLogFilters, forceRefresh = false): Promise<CallLog[]> {
    // Check cache first if not forcing refresh and no filters
    if (!forceRefresh && !filters && this.isCacheValid()) {
      console.log('Using cached call logs data');
      return this.cache.data!;
    }
    
    try {
      // Start building the query
      let query = supabase
        .from('calls')
        .select('*');
      
      // Apply filters if provided
      if (filters) {
        // Support global call type filter: 'all' = no filter, 'live' = is_test_call: false, 'test' = is_test_call: true
        if (filters.callType === 'live') {
          query = query.eq('is_test_call', false);
        } else if (filters.callType === 'test') {
          query = query.eq('is_test_call', true);
        } else if (filters.callType && filters.callType !== 'all') {
          // For legacy/other call_type string filters (e.g., 'inbound', 'outbound')
          query = query.eq('call_type', filters.callType);
        }
        
        if (filters.clientId) {
          query = query.eq('client_id', filters.clientId);
        }
        
        if (filters.startDate) {
          query = query.gte('call_start_time', filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte('call_start_time', filters.endDate);
        }
        
        if (filters.search) {
          query = query.or(`caller_full_name.ilike.%${filters.search}%,caller_phone_number.ilike.%${filters.search}%,call_summary.ilike.%${filters.search}%`);
        }
      }
      
      // Order by most recent first
      query = query.order('call_start_time', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching call logs:', error);
        throw new Error(`Failed to fetch call logs: ${error.message}`);
      }
      
      // Update cache if no filters were applied
      if (!filters) {
        this.updateCache(data);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCallLogs:', error);
      throw error;
    }
  }
  
  /**
   * Get a single call log by ID
   */
  public async getCallLogById(id: string): Promise<CallLog | null> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching call log by ID:', error);
        throw new Error(`Failed to fetch call log: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCallLogById:', error);
      throw error;
    }
  }
  
  /**
   * Create a new call log
   */
  public async createCallLog(callLog: Omit<Database['public']['Tables']['calls']['Insert'], 'id' | 'created_at'>): Promise<CallLog> {
    try {
      // Set default values for required fields if not provided
      const callLogWithDefaults = {
        ...callLog,
        call_type: callLog.call_type || 'inbound',
        transcript: callLog.transcript || '',
        call_duration_seconds: callLog.call_duration_seconds || 0,
        // Add current timestamp if not provided
        call_start_time: callLog.call_start_time || new Date().toISOString(),
        call_end_time: callLog.call_end_time || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('calls')
        .insert(callLogWithDefaults)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating call log:', error);
        throw new Error(`Failed to create call log: ${error.message}`);
      }
      
      // Invalidate cache
      this.cache.data = null;
      
      return data;
    } catch (error) {
      console.error('Error in createCallLog:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing call log
   */
  public async updateCallLog(id: string, callLog: Partial<Database['public']['Tables']['calls']['Update']>): Promise<CallLog> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .update(callLog)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating call log:', error);
        throw new Error(`Failed to update call log: ${error.message}`);
      }
      
      // Invalidate cache
      this.cache.data = null;
      
      return data;
    } catch (error) {
      console.error('Error in updateCallLog:', error);
      throw error;
    }
  }
  
  /**
   * Delete a call log
   */
  public async deleteCallLog(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting call log:', error);
        throw new Error(`Failed to delete call log: ${error.message}`);
      }
      
      // Invalidate cache
      this.cache.data = null;
    } catch (error) {
      console.error('Error in deleteCallLog:', error);
      throw error;
    }
  }
  
  /**
   * Get recent call logs (limited number)
   */
  public async getRecentCallLogs(limit: number = 10): Promise<CallLog[]> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('call_start_time', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching recent call logs:', error);
        throw new Error(`Failed to fetch recent call logs: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getRecentCallLogs:', error);
      throw error;
    }
  }
  
  /**
   * Get call logs by call type
   */
  public async getCallLogsByType(callType: string): Promise<CallLog[]> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('call_type', callType)
        .order('call_start_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching call logs by type:', error);
        throw new Error(`Failed to fetch call logs by type: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCallLogsByType:', error);
      throw error;
    }
  }
  
  /**
   * Get call logs by client ID
   * @param clientId The client ID to filter by
   */
  public async getCallLogsByClientId(clientId: string): Promise<CallLog[]> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('client_id', clientId)
        .order('call_start_time', { ascending: false });
      
      if (error) {
        console.error('Error fetching call logs by client ID:', error);
        throw new Error(`Failed to fetch call logs by client ID: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCallLogsByClientId:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const callLogsService = CallLogsService.getInstance();
