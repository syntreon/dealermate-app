import { supabase } from '@/integrations/supabase/client';

export interface CallInquiryData {
  type: string;
  count: number;
  percentage: number;
}

export interface CallInquiryFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

/**
 * Service for fetching and processing call intelligence data
 */
export const CallIntelligenceService = {
  /**
   * Get call inquiry data from the call_intelligence table
   * 
   * @param clientId - Optional client ID to filter data (undefined for admin view to see all data)
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Array of call intelligence records
   */
  async getCallInquiries(clientId?: string, startDate?: string, endDate?: string) {
    try {
      console.log('Fetching call inquiries with params:', { clientId, startDate, endDate });
      
      // Calculate default date range (last 30 days) if not provided
      const now = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(now.getDate() - 30);

      const effectiveStartDate = startDate || defaultStartDate.toISOString();
      const effectiveEndDate = endDate || now.toISOString();
      
      // Build query for the call_intelligence table
      let queryBuilder = supabase
        .from('call_intelligence')
        .select('*');
      
      // Apply date filtering
      queryBuilder = queryBuilder.gte('created_at', effectiveStartDate);
      queryBuilder = queryBuilder.lte('created_at', effectiveEndDate);
      
      // Apply client filtering if provided
      if (clientId) {
        console.log('Filtering by client_id:', clientId);
        queryBuilder = queryBuilder.eq('client_id', clientId);
      } else {
        console.log('Admin view - no client_id filter applied');
      }
      
      // Execute the query
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.log('Error fetching call intelligence data:', error.message);
        return [];
      }
      
      if (data && data.length > 0) {
        console.log('Found call intelligence data:', data.length, 'records');
        return data;
      }
      
      console.log('No call intelligence data found');
      return [];
    } catch (e) {
      console.error('Exception in getCallInquiries:', e);
      return [];
    }
  },
  
  /**
   * Get inquiry type for a specific call
   * 
   * @param callId - The call ID to get inquiry type for
   * @returns The inquiry type or null if not found
   */
  async getCallInquiryType(callId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('call_intelligence')
        .select('inquiry_type')
        .eq('call_id', callId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No intelligence data found for this call
          return null;
        }
        console.error('Error fetching call inquiry type:', error);
        return null;
      }
      
      return data?.inquiry_type || null;
    } catch (error) {
      console.error('Exception in getCallInquiryType:', error);
      return null;
    }
  },

  /**
   * Get inquiry types for multiple calls in batch
   * 
   * @param callIds - Array of call IDs to get inquiry types for
   * @returns Map of call ID to inquiry type
   */
  async getCallInquiryTypes(callIds: string[]): Promise<Map<string, string>> {
    try {
      if (callIds.length === 0) return new Map();
      
      const { data, error } = await supabase
        .from('call_intelligence')
        .select('call_id, inquiry_type')
        .in('call_id', callIds);
      
      if (error) {
        console.error('Error fetching call inquiry types:', error);
        return new Map();
      }
      
      const inquiryMap = new Map<string, string>();
      data?.forEach(item => {
        if (item.call_id && item.inquiry_type) {
          inquiryMap.set(item.call_id, item.inquiry_type);
        }
      });
      
      return inquiryMap;
    } catch (error) {
      console.error('Exception in getCallInquiryTypes:', error);
      return new Map();
    }
  },

  /**
   * Process raw call inquiry data into a format suitable for charts
   * 
   * @param inquiryData - Raw inquiry data from the database
   * @returns Processed data with counts and percentages
   */
  processCallInquiryData(inquiryData: Array<any>): CallInquiryData[] {
    try {
      if (!inquiryData || inquiryData.length === 0) {
        console.log('No inquiry data to process');
        return [];
      }
      
      // Count occurrences of each inquiry type
      const inquiryCounts: Record<string, number> = {};
      let totalInquiries = 0;
      
      inquiryData.forEach(item => {
        // Try different possible field names for inquiry type
        const inquiryType = item.inquiry_type || 
                            item.inquiryType || 
                            item.type || 
                            'unknown';
        
        // Normalize inquiry type to lowercase for consistency
        const normalizedType = inquiryType.toLowerCase();
        
        // Increment count for this type
        inquiryCounts[normalizedType] = (inquiryCounts[normalizedType] || 0) + 1;
        totalInquiries++;
      });
      
      // Convert counts to array with percentages
      const result: CallInquiryData[] = Object.entries(inquiryCounts).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalInquiries) * 100)
      }));
      
      console.log('Processed inquiry data:', result);
      return result;
    } catch (e) {
      console.error('Error processing inquiry data:', e);
      return [];
    }
  }
};
