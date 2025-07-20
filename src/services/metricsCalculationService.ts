import { supabase } from '@/integrations/supabase/client';
import { AdminService } from './adminService';
import { Client } from '@/types/admin';

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  monthlyRecurringRevenue: number;
}

export interface CostBreakdown {
  // Call-related costs (converted to CAD)
  totalCallCosts: number; // SUM(total_call_cost_usd * 1.35) - main category
  aiCosts: number; // SUM(openai_api_cost_usd * 1.35) - subcategory of call costs
  vapiCosts: number; // SUM(vapi_call_cost_usd * 1.35) - subcategory of call costs
  vapiLlmCosts: number; // SUM(vapi_llm_cost_usd * 1.35) - subcategory of vapi costs
  twilioCosts: number; // SUM(twillio_call_cost_usd * 1.35) - subcategory of call costs
  smsCosts: number; // SUM(sms_cost_usd * 1.35) - subcategory of call costs
  toolCosts: number; // SUM(tool_cost_usd * 1.35)
  
  // Calculated from client data
  partnerSplits: number; // SUM((monthly_billing_amount_cad - finders_fee_cad) * partner_split_percentage) - percentage is 0-1
  findersFees: number; // SUM(finders_fee_cad)
  
  totalCosts: number;
}

export interface ClientProfitability {
  id: string;
  name: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  status: string;
  callVolume: number;
  leadConversion: number;
}

export interface GrowthTrends {
  revenueGrowth: number;
  costGrowth: number;
  profitGrowth: number;
  clientGrowth: number;
  callVolumeGrowth: number;
  leadVolumeGrowth: number;
}

const USD_TO_CAD_RATE = 1.35; // Exchange rate for USD to CAD conversion

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const MetricsCalculationService = {
  /**
   * Calculate comprehensive financial metrics using real database data
   */
  getFinancialMetrics: async (timeframe: 'current_month' | 'last_month' | 'ytd' = 'current_month'): Promise<FinancialMetrics> => {
    try {
      // Get date range based on timeframe
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (timeframe) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
      }

      // Get active clients for revenue calculation
      const clients = await AdminService.getClients({ status: 'active' });
      
      // Calculate total revenue from active clients
      const totalRevenue = clients.reduce((sum, client) => 
        sum + (client.monthly_billing_amount_cad || 0), 0);

      // Get cost breakdown for the timeframe
      const costBreakdown = await MetricsCalculationService.getCostBreakdown(startDate, endDate);
      
      const netProfit = totalRevenue - costBreakdown.totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalCosts: costBreakdown.totalCosts,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100, // Round to 2 decimal places
        monthlyRecurringRevenue: totalRevenue // For active clients, this is the same as total revenue
      };
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      throw error;
    }
  },

  /**
   * Calculate detailed cost breakdown from call data and client configurations
   */
  getCostBreakdown: async (startDate: Date, endDate: Date): Promise<CostBreakdown> => {
    try {
      // Get call cost data for the specified period
      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select(`
          total_call_cost_usd,
          openai_api_cost_usd,
          vapi_call_cost_usd,
          vapi_llm_cost_usd,
          twillio_call_cost_usd,
          sms_cost_usd,
          tool_cost_usd
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (callsError) throw callsError;

      // Calculate operational costs from call data (convert USD to CAD)
      const costTotals = (calls || []).reduce((acc, call) => {
        const vapiCallCost = (call.vapi_call_cost_usd || 0) * USD_TO_CAD_RATE;
        const vapiLlmCost = (call.vapi_llm_cost_usd || 0) * USD_TO_CAD_RATE;
        
        return {
          totalCallCosts: acc.totalCallCosts + ((call.total_call_cost_usd || 0) * USD_TO_CAD_RATE),
          aiCosts: acc.aiCosts + ((call.openai_api_cost_usd || 0) * USD_TO_CAD_RATE),
          vapiCosts: acc.vapiCosts + vapiCallCost, // VAPI call costs only (LLM separate)
          vapiLlmCosts: acc.vapiLlmCosts + vapiLlmCost, // Track LLM separately
          twilioCosts: acc.twilioCosts + ((call.twillio_call_cost_usd || 0) * USD_TO_CAD_RATE),
          smsCosts: acc.smsCosts + ((call.sms_cost_usd || 0) * USD_TO_CAD_RATE),
          toolCosts: acc.toolCosts + ((call.tool_cost_usd || 0) * USD_TO_CAD_RATE),
        };
      }, {
        totalCallCosts: 0,
        aiCosts: 0,
        vapiCosts: 0,
        vapiLlmCosts: 0,
        twilioCosts: 0,
        smsCosts: 0,
        toolCosts: 0,
      });

      // Get active clients for partner splits and finder's fees
      const clients = await AdminService.getClients({ status: 'active' });
      
      // Calculate finder's fees and partner splits
      const findersFees = clients.reduce((sum, client) => 
        sum + (client.finders_fee_cad || 0), 0);
      
      // Partner split calculation - percentage is stored as 0-1 (not 0-100)
      const partnerSplits = clients.reduce((sum, client) => {
        const revenue = client.monthly_billing_amount_cad || 0;
        const findersFee = client.finders_fee_cad || 0;
        const netRevenue = revenue - findersFee;
        const partnerPercentage = client.partner_split_percentage || 0; // Already 0-1 format
        return sum + (netRevenue * partnerPercentage); // No need to divide by 100
      }, 0);

      // Total costs use the total_call_cost_usd + tool costs + business costs
      const totalCosts = costTotals.totalCallCosts + 
                        costTotals.toolCosts + 
                        partnerSplits + 
                        findersFees;

      return {
        ...costTotals,
        partnerSplits,
        findersFees,
        totalCosts
      };
    } catch (error) {
      console.error('Error calculating cost breakdown:', error);
      throw error;
    }
  },

  /**
   * Calculate client profitability analysis
   */
  getClientProfitability: async (timeframe: 'current_month' | 'last_month' | 'ytd' = 'current_month'): Promise<ClientProfitability[]> => {
    try {
      // Get date range
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (timeframe) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
      }

      // Get all clients
      const clients = await AdminService.getClients();
      
      // Calculate profitability for each client
      const profitabilityPromises = clients.map(async (client) => {
        // Get client's call costs for the period
        const { data: clientCalls, error: callsError } = await supabase
          .from('calls')
          .select(`
            openai_api_cost_usd,
            vapi_call_cost_usd,
            vapi_llm_cost_usd,
            twillio_call_cost_usd,
            sms_cost_usd,
            tool_cost_usd
          `)
          .eq('client_id', client.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (callsError) {
          console.error(`Error fetching calls for client ${client.id}:`, callsError);
        }

        // Get client's call and lead volume for the period
        const [callVolumeResult, leadVolumeResult] = await Promise.all([
          supabase
            .from('calls')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString()),
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
        ]);

        const callVolume = callVolumeResult.count || 0;
        const leadVolume = leadVolumeResult.count || 0;
        const leadConversion = callVolume > 0 ? (leadVolume / callVolume) * 100 : 0;

        // Calculate operational costs for this client
        const operationalCosts = (clientCalls || []).reduce((sum, call) => 
          sum + 
          ((call.openai_api_cost_usd || 0) * USD_TO_CAD_RATE) +
          ((call.vapi_call_cost_usd || 0) * USD_TO_CAD_RATE) +
          ((call.vapi_llm_cost_usd || 0) * USD_TO_CAD_RATE) +
          ((call.twillio_call_cost_usd || 0) * USD_TO_CAD_RATE) +
          ((call.sms_cost_usd || 0) * USD_TO_CAD_RATE) +
          ((call.tool_cost_usd || 0) * USD_TO_CAD_RATE), 0);

        // Calculate partner split and finder's fee for this client
        const revenue = client.monthly_billing_amount_cad || 0;
        const findersFee = client.finders_fee_cad || 0;
        const netRevenue = revenue - findersFee;
        const partnerSplit = netRevenue * (client.partner_split_percentage || 0); // Already 0-1 format

        const totalCosts = operationalCosts + partnerSplit + findersFee;
        const profit = revenue - totalCosts;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          id: client.id,
          name: client.name,
          revenue,
          costs: totalCosts,
          profit,
          margin: Math.round(margin * 100) / 100,
          status: client.status,
          callVolume,
          leadConversion: Math.round(leadConversion * 100) / 100
        };
      });

      const profitabilityResults = await Promise.all(profitabilityPromises);
      
      // Sort by profit descending
      return profitabilityResults.sort((a, b) => b.profit - a.profit);
    } catch (error) {
      console.error('Error calculating client profitability:', error);
      throw error;
    }
  },

  /**
   * Calculate growth trends comparing current period to previous period
   */
  getGrowthTrends: async (currentPeriod: 'current_month' | 'last_month' = 'current_month'): Promise<GrowthTrends> => {
    try {
      // Calculate current and previous period metrics
      const currentMetrics = await MetricsCalculationService.getFinancialMetrics(currentPeriod);
      
      // Get previous period
      const previousPeriod = currentPeriod === 'current_month' ? 'last_month' : 'current_month';
      const previousMetrics = await MetricsCalculationService.getFinancialMetrics(previousPeriod as any);

      // Get client counts for growth comparison
      const currentClients = await AdminService.getClients({ status: 'active' });
      
      // For previous client count, we'll use a simple approximation
      // In a real implementation, you'd want to track historical client counts
      const previousClientCount = Math.max(0, currentClients.length - 2); // Simple approximation

      // Get call and lead volume trends
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [currentCallsResult, previousCallsResult, currentLeadsResult, previousLeadsResult] = await Promise.all([
        supabase.from('calls').select('id', { count: 'exact', head: true }).gte('created_at', currentMonthStart.toISOString()),
        supabase.from('calls').select('id', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', currentMonthStart.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString())
      ]);

      const currentCallVolume = currentCallsResult.count || 0;
      const previousCallVolume = previousCallsResult.count || 0;
      const currentLeadVolume = currentLeadsResult.count || 0;
      const previousLeadVolume = previousLeadsResult.count || 0;

      return {
        revenueGrowth: calculatePercentageChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
        costGrowth: calculatePercentageChange(currentMetrics.totalCosts, previousMetrics.totalCosts),
        profitGrowth: calculatePercentageChange(currentMetrics.netProfit, previousMetrics.netProfit),
        clientGrowth: calculatePercentageChange(currentClients.length, previousClientCount),
        callVolumeGrowth: calculatePercentageChange(currentCallVolume, previousCallVolume),
        leadVolumeGrowth: calculatePercentageChange(currentLeadVolume, previousLeadVolume)
      };
    } catch (error) {
      console.error('Error calculating growth trends:', error);
      throw error;
    }
  }
};