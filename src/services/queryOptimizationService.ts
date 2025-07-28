import { supabase } from '@/integrations/supabase/client';

// Query optimization utilities for admin dashboard
export class QueryOptimizationService {
  
  // Optimized query for dashboard metrics with minimal data transfer
  static async getOptimizedDashboardMetrics(clientId?: string | null) {
    try {
      // Use a single query with aggregations to minimize round trips
      const query = `
        WITH call_stats AS (
          SELECT 
            COUNT(*) as total_calls,
            AVG(call_duration_seconds) as avg_duration,
            COUNT(CASE WHEN transfer_flag = true THEN 1 END) as transfers,
            COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as calls_today
          FROM calls
          ${clientId ? `WHERE client_id = '${clientId}'` : ''}
        ),
        lead_stats AS (
          SELECT 
            COUNT(*) as total_leads,
            COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as leads_today
          FROM leads
          ${clientId ? `WHERE client_id = '${clientId}'` : ''}
        )
        SELECT 
          c.total_calls,
          c.avg_duration,
          c.transfers,
          c.calls_today,
          l.total_leads,
          l.leads_today
        FROM call_stats c, lead_stats l
      `;

      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) throw error;
      
      return data[0] || {
        total_calls: 0,
        avg_duration: 0,
        transfers: 0,
        calls_today: 0,
        total_leads: 0,
        leads_today: 0
      };
    } catch (error) {
      console.error('Error in optimized dashboard metrics query:', error);
      throw error;
    }
  }

  // Optimized client profitability query with pre-calculated aggregations
  static async getOptimizedClientProfitability() {
    try {
      const query = `
        WITH client_metrics AS (
          SELECT 
            c.id,
            c.name,
            c.status,
            c.monthly_billing_amount_cad as revenue,
            COALESCE(call_costs.total_cost, 0) as costs,
            COALESCE(call_metrics.call_count, 0) as call_volume,
            COALESCE(lead_metrics.lead_count, 0) as leads
          FROM clients c
          LEFT JOIN (
            SELECT 
              client_id,
              SUM(COALESCE(total_call_cost_usd, 0) * 1.35) as total_cost
            FROM calls 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
            GROUP BY client_id
          ) call_costs ON c.id = call_costs.client_id
          LEFT JOIN (
            SELECT 
              client_id,
              COUNT(*) as call_count
            FROM calls 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
            GROUP BY client_id
          ) call_metrics ON c.id = call_metrics.client_id
          LEFT JOIN (
            SELECT 
              client_id,
              COUNT(*) as lead_count
            FROM leads 
            WHERE created_at >= date_trunc('month', CURRENT_DATE)
            GROUP BY client_id
          ) lead_metrics ON c.id = lead_metrics.client_id
        )
        SELECT 
          id,
          name,
          status,
          revenue,
          costs,
          (revenue - costs) as profit,
          CASE 
            WHEN revenue > 0 THEN ((revenue - costs) / revenue) * 100 
            ELSE 0 
          END as margin,
          call_volume,
          CASE 
            WHEN call_volume > 0 THEN (leads::float / call_volume::float) * 100 
            ELSE 0 
          END as lead_conversion
        FROM client_metrics
        WHERE revenue > 0 OR costs > 0
        ORDER BY profit DESC
        LIMIT 20
      `;

      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error in optimized client profitability query:', error);
      throw error;
    }
  }

  // Optimized cost breakdown query with single aggregation
  static async getOptimizedCostBreakdown(startDate: Date, endDate: Date) {
    try {
      const query = `
        WITH cost_aggregations AS (
          SELECT 
            SUM(COALESCE(openai_api_cost_usd, 0) * 1.35) as ai_costs,
            SUM(COALESCE(vapi_call_cost_usd, 0) * 1.35) as vapi_costs,
            SUM(COALESCE(vapi_llm_cost_usd, 0) * 1.35) as vapi_llm_costs,
            SUM(COALESCE(tts_cost_usd, 0) * 1.35) as tts_costs,
            SUM(COALESCE(transcriber_cost_usd, 0) * 1.35) as transcriber_costs,
            SUM(COALESCE(call_summary_cost_usd, 0) * 1.35) as call_summary_costs,
            SUM(COALESCE(twillio_call_cost_usd, 0) * 1.35) as twilio_costs,
            SUM(COALESCE(sms_cost_usd, 0) * 1.35) as sms_costs,
            SUM(COALESCE(tool_cost_usd, 0) * 1.35) as tool_costs,
            SUM(COALESCE(total_call_cost_usd, 0) * 1.35) as total_call_costs
          FROM calls 
          WHERE created_at >= '${startDate.toISOString()}'
            AND created_at <= '${endDate.toISOString()}'
        ),
        client_costs AS (
          SELECT 
            SUM(
              (monthly_billing_amount_cad - COALESCE(finders_fee_cad, 0)) * 
              COALESCE(partner_split_percentage, 0)
            ) as partner_splits,
            SUM(COALESCE(finders_fee_cad, 0)) as finders_fees
          FROM clients 
          WHERE status = 'active'
        )
        SELECT 
          ca.*,
          cc.partner_splits,
          cc.finders_fees,
          (ca.total_call_costs + ca.tool_costs + cc.partner_splits + cc.finders_fees) as total_costs
        FROM cost_aggregations ca, client_costs cc
      `;

      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) throw error;
      
      return data[0] || {
        ai_costs: 0,
        vapi_costs: 0,
        vapi_llm_costs: 0,
        tts_costs: 0,
        transcriber_costs: 0,
        call_summary_costs: 0,
        twilio_costs: 0,
        sms_costs: 0,
        tool_costs: 0,
        total_call_costs: 0,
        partner_splits: 0,
        finders_fees: 0,
        total_costs: 0
      };
    } catch (error) {
      console.error('Error in optimized cost breakdown query:', error);
      throw error;
    }
  }

  // Optimized user analytics with single query
  static async getOptimizedUserAnalytics() {
    try {
      const query = `
        WITH user_stats AS (
          SELECT 
            role,
            COUNT(*) as count,
            COUNT(CASE WHEN last_login_at >= CURRENT_DATE THEN 1 END) as active_today,
            COUNT(CASE WHEN last_login_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_week,
            COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as new_month
          FROM users
          GROUP BY role
        ),
        recent_activity AS (
          SELECT 
            id,
            email,
            last_login_at,
            role,
            ROW_NUMBER() OVER (ORDER BY last_login_at DESC NULLS LAST) as rn
          FROM users
          WHERE last_login_at IS NOT NULL
        )
        SELECT 
          json_agg(
            json_build_object(
              'role', role,
              'count', count
            )
          ) as by_role,
          SUM(active_today) as active_today,
          SUM(active_week) as active_this_week,
          SUM(new_month) as new_this_month,
          (
            SELECT json_agg(
              json_build_object(
                'id', id,
                'email', email,
                'lastLogin', last_login_at,
                'role', role
              )
            )
            FROM recent_activity 
            WHERE rn <= 10
          ) as recent_activity
        FROM user_stats
      `;

      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) throw error;
      
      const result = data[0] || {};
      
      return {
        byRole: result.by_role || [],
        activeToday: result.active_today || 0,
        activeThisWeek: result.active_this_week || 0,
        newThisMonth: result.new_this_month || 0,
        recentActivity: result.recent_activity || []
      };
    } catch (error) {
      console.error('Error in optimized user analytics query:', error);
      throw error;
    }
  }

  // Optimized client distribution query
  static async getOptimizedClientDistribution() {
    try {
      const query = `
        SELECT 
          json_agg(
            json_build_object(
              'status', status,
              'count', count
            )
          ) as by_status,
          json_agg(
            json_build_object(
              'plan', subscription_plan,
              'count', plan_count
            )
          ) as by_plan,
          json_agg(
            json_build_object(
              'type', type,
              'count', type_count
            )
          ) as by_type
        FROM (
          SELECT 
            status,
            COUNT(*) as count,
            subscription_plan,
            COUNT(*) OVER (PARTITION BY subscription_plan) as plan_count,
            type,
            COUNT(*) OVER (PARTITION BY type) as type_count
          FROM clients
          GROUP BY status, subscription_plan, type
        ) t
      `;

      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) throw error;
      
      const result = data[0] || {};
      
      return {
        byStatus: result.by_status || [],
        bySubscriptionPlan: result.by_plan || [],
        byType: result.by_type || []
      };
    } catch (error) {
      console.error('Error in optimized client distribution query:', error);
      throw error;
    }
  }

  // Query performance monitoring
  static async measureQueryPerformance<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<{ result: T; duration: number; timestamp: Date }> {
    const startTime = performance.now();
    const timestamp = new Date();
    
    try {
      const result = await queryFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Query "${queryName}" completed in ${duration.toFixed(2)}ms`);
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: "${queryName}" took ${duration.toFixed(2)}ms`);
      }
      
      return { result, duration, timestamp };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`Query "${queryName}" failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Connection pooling optimization
  static async optimizeConnection() {
    try {
      // Set optimal connection parameters
      await supabase.rpc('set_config', {
        setting_name: 'statement_timeout',
        new_value: '30s',
        is_local: true
      });
      
      await supabase.rpc('set_config', {
        setting_name: 'idle_in_transaction_session_timeout',
        new_value: '10s',
        is_local: true
      });
      
      console.log('Database connection optimized');
    } catch (error) {
      console.warn('Failed to optimize database connection:', error);
    }
  }

  // Batch query execution for multiple related queries
  static async executeBatch<T extends Record<string, () => Promise<any>>>(
    queries: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
    const startTime = performance.now();
    
    try {
      const results = await Promise.allSettled(
        Object.entries(queries).map(async ([key, queryFn]) => {
          const result = await queryFn();
          return { key, result };
        })
      );
      
      const successfulResults: any = {};
      const errors: any = {};
      
      results.forEach((result, index) => {
        const key = Object.keys(queries)[index];
        
        if (result.status === 'fulfilled') {
          successfulResults[key] = result.value.result;
        } else {
          errors[key] = result.reason;
          console.error(`Batch query "${key}" failed:`, result.reason);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Batch execution completed in ${duration.toFixed(2)}ms`);
      console.log(`Successful queries: ${Object.keys(successfulResults).length}`);
      console.log(`Failed queries: ${Object.keys(errors).length}`);
      
      return successfulResults;
    } catch (error) {
      console.error('Batch execution failed:', error);
      throw error;
    }
  }

  // Index usage analysis (for development)
  static async analyzeIndexUsage(tableName: string) {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const query = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE tablename = '${tableName}'
        ORDER BY idx_scan DESC
      `;
      
      const { data, error } = await supabase.rpc('execute_sql', { query });
      
      if (error) throw error;
      
      console.group(`Index usage analysis for table: ${tableName}`);
      console.table(data);
      console.groupEnd();
      
      return data;
    } catch (error) {
      console.warn('Failed to analyze index usage:', error);
    }
  }
}

// Query optimization hooks
export const useQueryOptimization = () => {
  const measureQuery = async <T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ) => {
    return QueryOptimizationService.measureQueryPerformance(queryName, queryFunction);
  };

  const executeBatch = async <T extends Record<string, () => Promise<any>>>(
    queries: T
  ) => {
    return QueryOptimizationService.executeBatch(queries);
  };

  return {
    measureQuery,
    executeBatch,
    optimizeConnection: QueryOptimizationService.optimizeConnection,
    analyzeIndexUsage: QueryOptimizationService.analyzeIndexUsage
  };
};

export default QueryOptimizationService;