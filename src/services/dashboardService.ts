import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics, SystemMessage, AgentStatus } from '@/types/dashboard';

export interface CallMetrics {
  totalCalls: number;
  totalLeads: number;
  avgCallDuration: number;
  callsTransferred: number;
  callsToday: number;
  leadsToday: number;
  conversionRate: number;
  // Growth percentages compared to previous period
  callsGrowth: number;
  leadsGrowth: number;
  timeGrowth: number;
  transferGrowth: number;
}

export interface CallDistribution {
  byHourOfDay: Array<{ hour: number, count: number }>;
  byDayOfWeek: Array<{ day: number, count: number }>;
  byDate: Array<{ date: Date, count: number }>;
}

export interface AnalyticsData {
  callVolume: Array<{ date: Date, count: number }>;
  callDuration: Array<{ date: Date, avgDuration: number }>;
  callOutcomes: Array<{ outcome: string, count: number }>;
  leadConversion: Array<{ date: Date, leads: number, calls: number, rate: number }>;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

const calculateGrowthPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const DashboardService = {
  /**
   * Get admin-specific platform metrics (extends basic dashboard metrics)
   */
  getAdminPlatformMetrics: async (): Promise<{
    totalClients: number;
    activeClients: number;
    totalUsers: number;
    totalRevenue: number;
    platformCallVolume: number;
    platformLeadVolume: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
  }> => {
    try {
      // Get all clients for admin metrics
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, status, monthly_billing_amount_cad');

      if (clientsError) throw clientsError;

      // Get all users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get platform-wide call and lead counts
      const [callsResult, leadsResult] = await Promise.all([
        supabase.from('calls').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true })
      ]);

      if (callsResult.error) throw callsResult.error;
      if (leadsResult.error) throw leadsResult.error;

      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      const totalUsers = usersCount || 0;
      const totalRevenue = clients?.reduce((sum, client) => 
        sum + (client.monthly_billing_amount_cad || 0), 0) || 0;
      const platformCallVolume = callsResult.count || 0;
      const platformLeadVolume = leadsResult.count || 0;

      // Simple system health check based on data availability
      const systemHealth: 'healthy' | 'degraded' | 'down' = 
        (totalClients > 0 && totalUsers > 0) ? 'healthy' : 'degraded';

      return {
        totalClients,
        activeClients,
        totalUsers,
        totalRevenue,
        platformCallVolume,
        platformLeadVolume,
        systemHealth
      };
    } catch (error) {
      console.error('Error fetching admin platform metrics:', error);
      throw error;
    }
  },

  /**
   * Get client distribution metrics for admin dashboard
   */
  getClientDistributionMetrics: async (): Promise<{
    byStatus: Array<{ status: string; count: number }>;
    bySubscriptionPlan: Array<{ plan: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
  }> => {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('status, subscription_plan, type');

      if (error) throw error;

      // Group by status
      const statusMap: Record<string, number> = {};
      const planMap: Record<string, number> = {};
      const typeMap: Record<string, number> = {};

      clients?.forEach(client => {
        statusMap[client.status] = (statusMap[client.status] || 0) + 1;
        planMap[client.subscription_plan] = (planMap[client.subscription_plan] || 0) + 1;
        typeMap[client.type] = (typeMap[client.type] || 0) + 1;
      });

      return {
        byStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
        bySubscriptionPlan: Object.entries(planMap).map(([plan, count]) => ({ plan, count })),
        byType: Object.entries(typeMap).map(([type, count]) => ({ type, count }))
      };
    } catch (error) {
      console.error('Error fetching client distribution metrics:', error);
      throw error;
    }
  },

  /**
   * Get user analytics for admin dashboard
   */
  getUserAnalytics: async (): Promise<{
    byRole: Array<{ role: string; count: number }>;
    activeToday: number;
    activeThisWeek: number;
    newThisMonth: number;
    recentActivity: Array<{ id: string; email: string; lastLogin: Date | null; role: string }>;
  }> => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, last_login_at, created_at')
        .order('last_login_at', { ascending: false, nullsLast: true });

      if (error) throw error;

      // Group by role
      const roleMap: Record<string, number> = {};
      let activeToday = 0;
      let activeThisWeek = 0;
      let newThisMonth = 0;

      users?.forEach(user => {
        roleMap[user.role] = (roleMap[user.role] || 0) + 1;

        // Count active users
        if (user.last_login_at) {
          const lastLogin = new Date(user.last_login_at);
          if (lastLogin >= today) activeToday++;
          if (lastLogin >= weekAgo) activeThisWeek++;
        }

        // Count new users this month
        if (new Date(user.created_at) >= monthAgo) {
          newThisMonth++;
        }
      });

      // Get recent activity (top 10 most recent logins)
      const recentActivity = (users || [])
        .filter(user => user.last_login_at)
        .slice(0, 10)
        .map(user => ({
          id: user.id,
          email: user.email,
          lastLogin: user.last_login_at ? new Date(user.last_login_at) : null,
          role: user.role
        }));

      return {
        byRole: Object.entries(roleMap).map(([role, count]) => ({ role, count })),
        activeToday,
        activeThisWeek,
        newThisMonth,
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive dashboard metrics for a client or all clients (admin)
   */
  getDashboardMetrics: async (clientId?: string | null, callType: 'all' | 'live' | 'test' = 'live'): Promise<DashboardMetrics> => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Build base queries
      let callsQuery = supabase.from('calls').select('*');
      let leadsQuery = supabase.from('leads').select('*');

      // Apply client filter if specified
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

      // Fetch all data
      const [callsResult, leadsResult] = await Promise.all([
        callsQuery,
        leadsQuery
      ]);

      if (callsResult.error) throw callsResult.error;
      if (leadsResult.error) throw leadsResult.error;

      const calls = callsResult.data || [];
      const leads = leadsResult.data || [];

      // Calculate current period metrics
      const totalCalls = calls.length;
      const totalLeads = leads.length;
      
      // Calculate average call duration
      const totalDuration = calls.reduce((sum, call) => sum + (call.call_duration_seconds || 0), 0);
      const avgCallDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
      const averageHandleTime = formatDuration(avgCallDurationSeconds);

      // Calculate calls transferred
      const callsTransferred = calls.filter(call => call.transfer_flag === true).length;

      // Calculate today's metrics (EST timezone)
      // Get today's date in EST timezone
      const estToday = new Date().toLocaleString("en-US", {timeZone: "America/New_York"});
      const todayStartEST = new Date(new Date(estToday).toDateString()); // Start of today in EST
      const todayEndEST = new Date(todayStartEST.getTime() + 24 * 60 * 60 * 1000); // End of today in EST
      
      const callsToday = calls.filter(call => {
        const callDate = new Date(call.created_at);
        // Convert call date to EST for comparison
        const callDateEST = new Date(callDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
        return callDateEST >= todayStartEST && callDateEST < todayEndEST;
      }).length;

      const leadsToday = leads.filter(lead => 
        new Date(lead.created_at) >= today
      ).length;

      // Calculate previous period metrics for growth comparison
      const callsLastWeek = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return callDate >= twoWeeksAgo && callDate < lastWeek;
      }).length;

      const leadsLastWeek = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= twoWeeksAgo && leadDate < lastWeek;
      }).length;

      const callsThisWeek = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return callDate >= lastWeek;
      }).length;

      const leadsThisWeek = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= lastWeek;
      }).length;

      // Calculate transfers for growth comparison
      const transfersLastWeek = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return call.transfer_flag === true && callDate >= twoWeeksAgo && callDate < lastWeek;
      }).length;

      const transfersThisWeek = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return call.transfer_flag === true && callDate >= lastWeek;
      }).length;

      // Calculate average duration for growth comparison
      const callsLastWeekData = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return callDate >= twoWeeksAgo && callDate < lastWeek;
      });

      const avgDurationLastWeek = callsLastWeekData.length > 0 
        ? callsLastWeekData.reduce((sum, call) => sum + (call.call_duration_seconds || 0), 0) / callsLastWeekData.length
        : 0;

      const callsThisWeekData = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return callDate >= lastWeek;
      });

      const avgDurationThisWeek = callsThisWeekData.length > 0 
        ? callsThisWeekData.reduce((sum, call) => sum + (call.call_duration_seconds || 0), 0) / callsThisWeekData.length
        : 0;

      // Calculate growth percentages
      const callsGrowth = calculateGrowthPercentage(callsThisWeek, callsLastWeek);
      const leadsGrowth = calculateGrowthPercentage(leadsThisWeek, leadsLastWeek);
      const transferGrowth = calculateGrowthPercentage(transfersThisWeek, transfersLastWeek);
      const timeGrowth = calculateGrowthPercentage(avgDurationThisWeek, avgDurationLastWeek);

      // Get agent status and system messages
      const [agentStatus, systemMessages] = await Promise.all([
        DashboardService.getAgentStatus(clientId),
        DashboardService.getSystemMessages(clientId)
      ]);

      return {
        totalCalls,
        averageHandleTime,
        callsTransferred,
        totalLeads,
        callsGrowth,
        timeGrowth,
        transferGrowth,
        leadsGrowth,
        todaysCalls: callsToday,
        linesAvailable: 10, // Static value as requested
        agentsAvailable: 1, // Static value as requested
        callsInQueue: 0, // Static value - could be dynamic in the future
        agentStatus,
        systemMessages
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  /**
   * Get agent status for a specific client or platform-wide
   */
  getAgentStatus: async (clientId?: string | null): Promise<AgentStatus> => {
    try {
      // Create a query but don't execute it yet
      let query = supabase.from('agent_status').select('*');
      
      // Add appropriate filters based on clientId
      if (clientId) {
        // For specific client status
        query = query.eq('client_id', clientId);
      } else {
        // For platform-wide status, get the most recent global status (null client_id)
        query = query.is('client_id', null);
      }

      // Add ordering to get the most recent status first
      query = query.order('last_updated', { ascending: false });
      
      // Execute the query with proper headers
      const { data, error } = await query.limit(1).maybeSingle();

      // Handle specific errors
      if (error) {
        console.warn('Agent status query error:', error);
        // Only throw if it's not a "not found" error
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }

      // If no data found, return default status
      if (!data) {
        console.log('No agent status found, using default');
        return {
          status: 'active',
          lastUpdated: new Date(),
          message: 'System operational'
        };
      }

      // Transform the data to match our interface
      return {
        status: data.status as 'active' | 'inactive' | 'maintenance',
        lastUpdated: new Date(data.last_updated),
        message: data.message || 'System operational'
      };
    } catch (error) {
      console.error('Error fetching agent status:', error);
      // Return default status on error
      return {
        status: 'active',
        lastUpdated: new Date(),
        message: 'System operational'
      };
    }
  },

  /**
   * Get system messages for a specific client or platform-wide
   */
  getSystemMessages: async (clientId?: string | null): Promise<SystemMessage[]> => {
    try {
      let query = supabase
        .from('system_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (clientId) {
        // Get messages for specific client and global messages
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      } else {
        // For admin users, get all messages or just global ones
        query = query.is('client_id', null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(msg => ({
        id: msg.id,
        type: msg.type as 'info' | 'warning' | 'error' | 'success',
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        expiresAt: msg.expires_at ? new Date(msg.expires_at) : null
      }));
    } catch (error) {
      console.error('Error fetching system messages:', error);
      return [];
    }
  },

  /**
   * Get call distribution data for analytics
   */
  getCallDistribution: async (clientId?: string | null, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<CallDistribution> => {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      let query = supabase
        .from('calls')
        .select('call_start_time, created_at')
        .gte('created_at', startDate.toISOString());

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const calls = data || [];

      // Initialize arrays
      const byHourOfDay = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
      const byDayOfWeek = Array.from({ length: 7 }, (_, day) => ({ day, count: 0 }));
      const byDate: { [key: string]: number } = {};

      // Process calls
      calls.forEach(call => {
        const callTime = new Date(call.call_start_time || call.created_at);
        
        // Hour of day distribution
        const hour = callTime.getHours();
        byHourOfDay[hour].count++;

        // Day of week distribution (0 = Sunday)
        const dayOfWeek = callTime.getDay();
        byDayOfWeek[dayOfWeek].count++;

        // Date distribution
        const dateKey = callTime.toISOString().split('T')[0];
        byDate[dateKey] = (byDate[dateKey] || 0) + 1;
      });

      // Convert date object to array
      const byDateArray = Object.entries(byDate).map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count
      })).sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        byHourOfDay,
        byDayOfWeek,
        byDate: byDateArray
      };
    } catch (error) {
      console.error('Error fetching call distribution:', error);
      throw error;
    }
  },

  /**
   * Get analytics data for charts and reports
   */
  getAnalyticsData: async (clientId?: string | null, timeframe: 'day' | 'week' | 'month' = 'month'): Promise<AnalyticsData> => {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 7); // Last 7 days for daily view
          break;
        case 'week':
          startDate.setDate(now.getDate() - 30); // Last 30 days for weekly view
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 6); // Last 6 months for monthly view
          break;
      }

      let callsQuery = supabase
        .from('calls')
        .select('*')
        .gte('created_at', startDate.toISOString());

      let leadsQuery = supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (clientId) {
        callsQuery = callsQuery.eq('client_id', clientId);
        leadsQuery = leadsQuery.eq('client_id', clientId);
      }

      const [callsResult, leadsResult] = await Promise.all([
        callsQuery,
        leadsQuery
      ]);

      if (callsResult.error) throw callsResult.error;
      if (leadsResult.error) throw leadsResult.error;

      const calls = callsResult.data || [];
      const leads = leadsResult.data || [];

      // Group data by time periods
      const callVolumeMap: { [key: string]: number } = {};
      const callDurationMap: { [key: string]: { total: number, count: number } } = {};
      const leadConversionMap: { [key: string]: { leads: number, calls: number } } = {};

      // Process calls
      calls.forEach(call => {
        const callDate = new Date(call.created_at);
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

        // Initialize leads tracking
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

      // Convert to arrays
      const callVolume = Object.entries(callVolumeMap)
        .map(([dateStr, count]) => ({
          date: new Date(dateStr),
          count
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const callDuration = Object.entries(callDurationMap)
        .map(([dateStr, data]) => ({
          date: new Date(dateStr),
          avgDuration: data.count > 0 ? Math.round(data.total / data.count) : 0
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate call outcomes
      const outcomeMap: { [key: string]: number } = {};
      calls.forEach(call => {
        let outcome = 'completed';
        if (call.transfer_flag) {
          outcome = 'transferred';
        } else if (call.hangup_reason && call.hangup_reason.includes('failed')) {
          outcome = 'failed';
        }
        
        outcomeMap[outcome] = (outcomeMap[outcome] || 0) + 1;
      });

      const callOutcomes = Object.entries(outcomeMap).map(([outcome, count]) => ({
        outcome,
        count
      }));

      const leadConversion = Object.entries(leadConversionMap)
        .map(([dateStr, data]) => ({
          date: new Date(dateStr),
          leads: data.leads,
          calls: data.calls,
          rate: data.calls > 0 ? Math.round((data.leads / data.calls) * 100) : 0
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        callVolume,
        callDuration,
        callOutcomes,
        leadConversion
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }
};