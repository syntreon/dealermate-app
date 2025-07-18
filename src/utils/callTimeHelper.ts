/**
 * Utility functions for handling call time data
 */
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Get call time from call ID
 * @param callId The call ID to look up
 * @returns Formatted call time string or null if not found
 */
export async function getCallTimeFromCallId(callId: string): Promise<string | null> {
  if (!callId) return null;
  
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('call_start_time')
      .eq('id', callId)
      .single();
    
    if (error || !data || !data.call_start_time) {
      console.error('Error fetching call time:', error);
      return null;
    }
    
    // Format the call time
    const callTime = new Date(data.call_start_time);
    if (isNaN(callTime.getTime())) {
      return null;
    }
    
    return format(callTime, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error in getCallTimeFromCallId:', error);
    return null;
  }
}

/**
 * Enhance leads with call time data
 * @param leads Array of leads to enhance
 * @returns Promise resolving to leads with call time data
 */
export async function enhanceLeadsWithCallTime(leads: any[]): Promise<any[]> {
  if (!leads || leads.length === 0) return leads;
  
  // Get unique call IDs
  const callIds = [...new Set(leads.map(lead => lead.call_id).filter(Boolean))];
  
  if (callIds.length === 0) return leads;
  
  try {
    // Fetch call times for all call IDs in one query
    const { data, error } = await supabase
      .from('calls')
      .select('id, call_start_time')
      .in('id', callIds);
    
    if (error || !data) {
      console.error('Error fetching call times:', error);
      return leads;
    }
    
    // Create a map of call ID to call time
    const callTimeMap = new Map();
    data.forEach(call => {
      if (call.call_start_time) {
        const callTime = new Date(call.call_start_time);
        if (!isNaN(callTime.getTime())) {
          callTimeMap.set(call.id, format(callTime, 'MMM d, yyyy h:mm a'));
        }
      }
    });
    
    // Enhance leads with call time
    return leads.map(lead => ({
      ...lead,
      call_time: lead.call_id ? callTimeMap.get(lead.call_id) || null : null
    }));
  } catch (error) {
    console.error('Error in enhanceLeadsWithCallTime:', error);
    return leads;
  }
}