import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type MakeOperation = Database['public']['Tables']['make_operations']['Row'];
type MakeOperationInsert = Database['public']['Tables']['make_operations']['Insert'];

export interface MakeOperationsMetrics {
  totalOperations: number;
  totalCost: number;
  successRate: number;
  dailyAverage: number;
  topScenarios: Array<{
    scenario_name: string;
    operations_count: number;
    cost_usd: number;
    success_rate: number;
    operation_type: string;
  }>;
  trends: Array<{
    date: string;
    operations_count: number;
    cost_usd: number;
    success_count: number;
    error_count: number;
  }>;
  operationsByType: Array<{
    operation_type: string;
    operations_count: number;
    cost_usd: number;
    success_rate: number;
  }>;
}

export interface ScenarioMetrics {
  scenario_name: string;
  operation_type: string;
  total_operations: number;
  total_cost: number;
  success_rate: number;
  avg_daily_operations: number;
  status: string;
  description: string | null;
  last_sync_at: string;
}

class MakeOperationsService {
  /**
   * Get Make.com operations metrics for a specific client and date range
   * If clientId is null, gets company operations only
   */
  async getOperationsMetrics(
    clientId: string | null,
    startDate: string,
    endDate: string
  ): Promise<MakeOperationsMetrics> {
    let query = supabase
      .from('make_operations')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    // Filter by client_id (including null for company operations)
    if (clientId === null) {
      query = query.is('client_id', null);
    } else {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching make operations:', error);
      throw error;
    }

    const operations = data || [];
    
    // Calculate metrics
    const totalOperations = operations.reduce((sum, op) => sum + op.operations_count, 0);
    const totalCost = operations.reduce((sum, op) => sum + Number(op.cost_usd), 0);
    const totalSuccess = operations.reduce((sum, op) => sum + op.success_count, 0);
    const successRate = totalOperations > 0 ? (totalSuccess / totalOperations) * 100 : 0;
    
    // Calculate daily average
    const uniqueDates = new Set(operations.map(op => op.date));
    const dailyAverage = uniqueDates.size > 0 ? totalOperations / uniqueDates.size : 0;

    // Get top scenarios by operations count
    const scenarioStats = new Map<string, {
      operations_count: number;
      cost_usd: number;
      success_count: number;
      total_count: number;
      operation_type: string;
    }>();

    operations.forEach(op => {
      const key = `${op.scenario_name}|${op.operation_type}`;
      const existing = scenarioStats.get(key) || {
        operations_count: 0,
        cost_usd: 0,
        success_count: 0,
        total_count: 0,
        operation_type: op.operation_type
      };
      
      scenarioStats.set(key, {
        operations_count: existing.operations_count + op.operations_count,
        cost_usd: existing.cost_usd + Number(op.cost_usd),
        success_count: existing.success_count + op.success_count,
        total_count: existing.total_count + op.operations_count,
        operation_type: op.operation_type
      });
    });

    const topScenarios = Array.from(scenarioStats.entries())
      .map(([key, stats]) => ({
        scenario_name: key.split('|')[0],
        operation_type: stats.operation_type,
        operations_count: stats.operations_count,
        cost_usd: stats.cost_usd,
        success_rate: stats.total_count > 0 ? (stats.success_count / stats.total_count) * 100 : 0
      }))
      .sort((a, b) => b.operations_count - a.operations_count)
      .slice(0, 5);

    // Get operations by type
    const typeStats = new Map<string, {
      operations_count: number;
      cost_usd: number;
      success_count: number;
      total_count: number;
    }>();

    operations.forEach(op => {
      const existing = typeStats.get(op.operation_type) || {
        operations_count: 0,
        cost_usd: 0,
        success_count: 0,
        total_count: 0
      };
      
      typeStats.set(op.operation_type, {
        operations_count: existing.operations_count + op.operations_count,
        cost_usd: existing.cost_usd + Number(op.cost_usd),
        success_count: existing.success_count + op.success_count,
        total_count: existing.total_count + op.operations_count
      });
    });

    const operationsByType = Array.from(typeStats.entries())
      .map(([operation_type, stats]) => ({
        operation_type,
        operations_count: stats.operations_count,
        cost_usd: stats.cost_usd,
        success_rate: stats.total_count > 0 ? (stats.success_count / stats.total_count) * 100 : 0
      }))
      .sort((a, b) => b.operations_count - a.operations_count);

    // Get daily trends
    const trends = operations.map(op => ({
      date: op.date,
      operations_count: op.operations_count,
      cost_usd: Number(op.cost_usd),
      success_count: op.success_count,
      error_count: op.error_count
    }));

    return {
      totalOperations,
      totalCost,
      successRate,
      dailyAverage,
      topScenarios,
      trends,
      operationsByType
    };
  }

  /**
   * Get scenario-specific metrics
   */
  async getScenarioMetrics(
    clientId: string | null,
    startDate: string,
    endDate: string
  ): Promise<ScenarioMetrics[]> {
    let query = supabase
      .from('make_operations')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    // Filter by client_id (including null for company operations)
    if (clientId === null) {
      query = query.is('client_id', null);
    } else {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scenario metrics:', error);
      throw error;
    }

    const operations = data || [];
    const scenarioMap = new Map<string, {
      operations: MakeOperation[];
      total_operations: number;
      total_cost: number;
      total_success: number;
      operation_type: string;
      status: string;
      description: string | null;
      last_sync_at: string;
    }>();

    // Group by scenario name and operation type
    operations.forEach(op => {
      const key = `${op.scenario_name}|${op.operation_type}`;
      const existing = scenarioMap.get(key) || {
        operations: [],
        total_operations: 0,
        total_cost: 0,
        total_success: 0,
        operation_type: op.operation_type,
        status: op.status,
        description: op.description,
        last_sync_at: op.last_sync_at
      };

      existing.operations.push(op);
      existing.total_operations += op.operations_count;
      existing.total_cost += Number(op.cost_usd);
      existing.total_success += op.success_count;
      
      // Use most recent status, description, and sync time
      if (new Date(op.last_sync_at) > new Date(existing.last_sync_at)) {
        existing.status = op.status;
        existing.description = op.description;
        existing.last_sync_at = op.last_sync_at;
      }

      scenarioMap.set(key, existing);
    });

    // Calculate metrics for each scenario
    return Array.from(scenarioMap.entries()).map(([key, data]) => {
      const scenario_name = key.split('|')[0];
      const uniqueDates = new Set(data.operations.map(op => op.date));
      const success_rate = data.total_operations > 0 
        ? (data.total_success / data.total_operations) * 100 
        : 0;
      const avg_daily_operations = uniqueDates.size > 0 
        ? data.total_operations / uniqueDates.size 
        : 0;

      return {
        scenario_name,
        operation_type: data.operation_type,
        total_operations: data.total_operations,
        total_cost: data.total_cost,
        success_rate,
        avg_daily_operations,
        status: data.status,
        description: data.description,
        last_sync_at: data.last_sync_at
      };
    }).sort((a, b) => b.total_operations - a.total_operations);
  }

  /**
   * Sync operations data from Make.com (to be called by Make.com webhook/automation)
   */
  async syncOperationsData(operationsData: MakeOperationInsert[]): Promise<void> {
    const { error } = await supabase
      .from('make_operations')
      .upsert(operationsData, {
        onConflict: 'client_id,scenario_name,date'
      });

    if (error) {
      console.error('Error syncing make operations:', error);
      throw error;
    }
  }

  /**
   * Get company operations (where client_id is null)
   */
  async getCompanyOperations(
    startDate: string,
    endDate: string
  ): Promise<MakeOperationsMetrics> {
    return this.getOperationsMetrics(null, startDate, endDate);
  }

  /**
   * Get company scenario metrics
   */
  async getCompanyScenarioMetrics(
    startDate: string,
    endDate: string
  ): Promise<ScenarioMetrics[]> {
    return this.getScenarioMetrics(null, startDate, endDate);
  }

  /**
   * Get operations data for all clients (admin view)
   */
  async getAllClientsOperations(
    startDate: string,
    endDate: string
  ): Promise<Array<MakeOperation & { client_name: string | null }>> {
    const { data, error } = await supabase
      .from('make_operations')
      .select(`
        *,
        clients(name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching all clients operations:', error);
      throw error;
    }

    return (data || []).map(item => ({
      ...item,
      client_name: item.clients?.name || (item.client_id ? 'Unknown Client' : 'Company Operations')
    }));
  }
}

export const makeOperationsService = new MakeOperationsService();