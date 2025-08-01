import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsMetrics {
  callVolume: Array<{ date: string, count: number }>;
  callDuration: Array<{ date: string, avgDuration: number }>;
  callOutcomes: Array<{ outcome: string, count: number, percentage: number }>;
  leadConversion: Array<{ date: string, leads: number, calls: number, rate: number }>;
  hourlyDistribution: Array<{ hour: number, count: number }>;
  dailyDistribution: Array<{ day: string, count: number }>;
  topPerformers: Array<{ metric: string, value: number, change: number }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  timeframe?: 'day' | 'week' | 'month';
  callType?: 'all' | 'live' | 'test';
}

export const AnalyticsService = {
  /**
   * Get comprehensive analytics data
   */
  getAnalyticsData: async (filters?: AnalyticsFilters): Promise<AnalyticsMetrics> => {
    try {
      const { startDate, endDate, clientId, timeframe = 'month', callType = 'live' } = filters || {};
      
      // Calculate date range if not provided
      const now = new Date();
      const defaultStartDate = new Date();
      
      switch (timeframe) {
        case 'day':
          defaultStartDate.setDate(now.getDate() - 7);
          break;
        case 'week':
          defaultStartDate.setDate(now.getDate() - 30);
          break;
        case 'month':
          defaultStartDate.setMonth(now.getMonth() - 6);
          break;
      }

      const effectiveStartDate = startDate || defaultStartDate.toISOString();
      const effectiveEndDate = endDate || now.toISOString();

      // Build queries
      let callsQuery = supabase
        .from('calls')
        .select('*')
        .gte('created_at', effectiveStartDate)
        .lte('created_at', effectiveEndDate);

      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .gte('created_at', effectiveStartDate)
        .lte('created_at', effectiveEndDate);

      if (clientId) {
        callsQuery = callsQuery.eq('client_id', clientId);
        leadsQuery = leadsQuery.eq('client_id', clientId);
      }

      // Apply call type filter
      if (callType === 'live') {
        callsQuery = callsQuery.eq('is_test_call', false);
      } else if (callType === 'test') {
        callsQuery = callsQuery.eq('is_test_call', true);
      }

      // Fetch data
      const [callsResult, leadsResult] = await Promise.all([
        callsQuery.order('created_at', { ascending: true }),
        leadsQuery.order('created_at', { ascending: true })
      ]);

      if (callsResult.error) throw callsResult.error;
      if (leadsResult.error) throw leadsResult.error;

      const calls = callsResult.data || [];
      const leads = leadsResult.data || [];

      // Process data for analytics
      const analytics = await processAnalyticsData(calls, leads, timeframe);
      
      return analytics;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  },

  /**
   * Get call performance metrics
   */
  getCallPerformanceMetrics: async (clientId?: string): Promise<any> => {
    try {
      let query = supabase.from('calls').select('*');
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const calls = data || [];
      
      // Calculate performance metrics
      const totalCalls = calls.length;
      const completedCalls = calls.filter(call => call.call_end_time).length;
      const transferredCalls = calls.filter(call => call.transfer_flag).length;
      const avgDuration = calls.reduce((sum, call) => sum + (call.call_duration_seconds || 0), 0) / totalCalls;
      
      const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
      const transferRate = totalCalls > 0 ? (transferredCalls / totalCalls) * 100 : 0;

      return {
        totalCalls,
        completedCalls,
        transferredCalls,
        avgDuration: Math.round(avgDuration),
        completionRate: Math.round(completionRate * 100) / 100,
        transferRate: Math.round(transferRate * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching call performance metrics:', error);
      throw error;
    }
  },

  /**
   * Get lead conversion analytics
   */
  getLeadConversionAnalytics: async (clientId?: string): Promise<any> => {
    try {
      // Get calls and leads with relationship
      let callsQuery = supabase.from('calls').select(`
        *,
        leads(*)
      `);
      
      if (clientId) {
        callsQuery = callsQuery.eq('client_id', clientId);
      }

      const { data: callsWithLeads, error } = await callsQuery;
      
      if (error) throw error;

      const calls = callsWithLeads || [];
      const totalCalls = calls.length;
      const callsWithLeadsGenerated = calls.filter(call => call.leads && call.leads.length > 0).length;
      
      const conversionRate = totalCalls > 0 ? (callsWithLeadsGenerated / totalCalls) * 100 : 0;

      // Group by lead status
      const leadsByStatus: { [key: string]: number } = {};
      calls.forEach(call => {
        if (call.leads && call.leads.length > 0) {
          call.leads.forEach((lead: any) => {
            leadsByStatus[lead.lead_status] = (leadsByStatus[lead.lead_status] || 0) + 1;
          });
        }
      });

      return {
        totalCalls,
        callsWithLeads: callsWithLeadsGenerated,
        conversionRate: Math.round(conversionRate * 100) / 100,
        leadsByStatus
      };
    } catch (error) {
      console.error('Error fetching lead conversion analytics:', error);
      throw error;
    }
  }
};

/**
 * Process raw data into analytics format
 */
async function processAnalyticsData(calls: any[], leads: any[], timeframe: string): Promise<AnalyticsMetrics> {
  // Group data by time periods
  const callVolumeMap: { [key: string]: number } = {};
  const callDurationMap: { [key: string]: { total: number, count: number } } = {};
  const leadConversionMap: { [key: string]: { leads: number, calls: number } } = {};
  const hourlyMap: { [key: number]: number } = {};
  const dailyMap: { [key: string]: number } = {};

  // Initialize hourly distribution (0-23 hours)
  for (let i = 0; i < 24; i++) {
    hourlyMap[i] = 0;
  }

  // Initialize daily distribution
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  daysOfWeek.forEach(day => {
    dailyMap[day] = 0;
  });

  // Process calls
  calls.forEach(call => {
    const callDate = new Date(call.created_at);
    const callStartTime = call.call_start_time ? new Date(call.call_start_time) : callDate;
    
    let periodKey: string;
    
    if (timeframe === 'day') {
      periodKey = callDate.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (timeframe === 'week') {
      const weekStart = new Date(callDate);
      weekStart.setDate(callDate.getDate() - callDate.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else {
      periodKey = `${callDate.getFullYear()}-${String(callDate.getMonth() + 1).padStart(2, '0')}`;
    }

    // Call volume
    callVolumeMap[periodKey] = (callVolumeMap[periodKey] || 0) + 1;

    // Call duration
    if (!callDurationMap[periodKey]) {
      callDurationMap[periodKey] = { total: 0, count: 0 };
    }
    callDurationMap[periodKey].total += call.call_duration_seconds || 0;
    callDurationMap[periodKey].count += 1;

    // Hourly distribution
    const hour = callStartTime.getHours();
    hourlyMap[hour] += 1;

    // Daily distribution
    const dayOfWeek = daysOfWeek[callStartTime.getDay()];
    dailyMap[dayOfWeek] += 1;

    // Initialize lead conversion tracking
    if (!leadConversionMap[periodKey]) {
      leadConversionMap[periodKey] = { leads: 0, calls: 0 };
    }
    leadConversionMap[periodKey].calls += 1;
  });

  // Process leads
  leads.forEach(lead => {
    const leadDate = new Date(lead.created_at);
    let periodKey: string;

    if (timeframe === 'day') {
      periodKey = leadDate.toISOString().split('T')[0];
    } else if (timeframe === 'week') {
      const weekStart = new Date(leadDate);
      weekStart.setDate(leadDate.getDate() - leadDate.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else {
      periodKey = `${leadDate.getFullYear()}-${String(leadDate.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!leadConversionMap[periodKey]) {
      leadConversionMap[periodKey] = { leads: 0, calls: 0 };
    }
    leadConversionMap[periodKey].leads += 1;
  });

  // Calculate call outcomes
  const outcomeMap: { [key: string]: number } = {};
  calls.forEach(call => {
    let outcome = 'completed';
    if (call.transfer_flag) {
      outcome = 'transferred';
    } else if (call.hangup_reason && call.hangup_reason.includes('failed')) {
      outcome = 'failed';
    } else if (!call.call_end_time) {
      outcome = 'incomplete';
    }
    
    outcomeMap[outcome] = (outcomeMap[outcome] || 0) + 1;
  });

  const totalOutcomes = Object.values(outcomeMap).reduce((sum, count) => sum + count, 0);

  // Convert to arrays and calculate percentages
  const callVolume = Object.entries(callVolumeMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const callDuration = Object.entries(callDurationMap)
    .map(([date, data]) => ({
      date,
      avgDuration: data.count > 0 ? Math.round(data.total / data.count) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const callOutcomes = Object.entries(outcomeMap).map(([outcome, count]) => ({
    outcome,
    count,
    percentage: totalOutcomes > 0 ? Math.round((count / totalOutcomes) * 100) : 0
  }));

  const leadConversion = Object.entries(leadConversionMap)
    .map(([date, data]) => ({
      date,
      leads: data.leads,
      calls: data.calls,
      rate: data.calls > 0 ? Math.round((data.leads / data.calls) * 100) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const hourlyDistribution = Object.entries(hourlyMap).map(([hour, count]) => ({
    hour: parseInt(hour),
    count
  }));

  const dailyDistribution = Object.entries(dailyMap).map(([day, count]) => ({
    day,
    count
  }));

  // Calculate top performers (mock for now, would be more complex in real implementation)
  const topPerformers = [
    { metric: 'Conversion Rate', value: leadConversion.length > 0 ? Math.max(...leadConversion.map(l => l.rate)) : 0, change: 5 },
    { metric: 'Avg Call Duration', value: callDuration.length > 0 ? Math.max(...callDuration.map(c => c.avgDuration)) : 0, change: -2 },
    { metric: 'Daily Call Volume', value: callVolume.length > 0 ? Math.max(...callVolume.map(c => c.count)) : 0, change: 12 }
  ];

  return {
    callVolume,
    callDuration,
    callOutcomes,
    leadConversion,
    hourlyDistribution,
    dailyDistribution,
    topPerformers
  };
}