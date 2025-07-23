/**
 * Utility functions for syncing Make.com operations data
 * This can be called from Make.com scenarios to update operations data
 */

import { makeOperationsService } from '@/services/makeOperationsService';

export interface MakeOperationsSyncData {
  client_id: string | null; // null for company operations
  call_id?: string | null; // null for non-call operations
  scenario_name: string;
  scenario_id?: string;
  operation_type: 'call' | 'admin' | 'marketing' | 'notification' | 'evaluation' | 'general';
  date: string; // YYYY-MM-DD format
  operations_count: number;
  operations_limit?: number;
  cost_usd: number;
  success_count: number;
  error_count: number;
  status: 'active' | 'paused' | 'error' | 'disabled';
  description?: string;
}

/**
 * Sync operations data from Make.com
 * This function should be called daily by Make.com scenarios
 */
export async function syncMakeOperationsData(
  operationsData: MakeOperationsSyncData[]
): Promise<{ success: boolean; message: string; synced_count: number }> {
  try {
    // Validate data
    const validatedData = operationsData.map(data => {
      // Ensure required fields are present (client_id can be null for company operations)
      if (data.scenario_name === undefined || !data.date || !data.operation_type) {
        throw new Error(`Missing required fields in operations data: ${JSON.stringify(data)}`);
      }

      // Ensure date is in correct format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        throw new Error(`Invalid date format: ${data.date}. Expected YYYY-MM-DD`);
      }

      // Ensure numeric fields are valid
      if (data.operations_count < 0 || data.cost_usd < 0 || data.success_count < 0 || data.error_count < 0) {
        throw new Error(`Negative values not allowed in operations data: ${JSON.stringify(data)}`);
      }

      // Ensure success + error counts don't exceed total operations
      if (data.success_count + data.error_count > data.operations_count) {
        console.warn(`Success + error counts exceed total operations for ${data.scenario_name} on ${data.date}`);
      }

      return {
        client_id: data.client_id,
        call_id: data.call_id || null,
        scenario_name: data.scenario_name,
        scenario_id: data.scenario_id || null,
        operation_type: data.operation_type,
        date: data.date,
        operations_count: data.operations_count,
        operations_limit: data.operations_limit || null,
        cost_usd: data.cost_usd,
        success_count: data.success_count,
        error_count: data.error_count,
        status: data.status,
        description: data.description || null,
        last_sync_at: new Date().toISOString()
      };
    });

    // Sync to database
    await makeOperationsService.syncOperationsData(validatedData);

    return {
      success: true,
      message: `Successfully synced ${validatedData.length} operations records`,
      synced_count: validatedData.length
    };
  } catch (error) {
    console.error('Error syncing Make.com operations data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      synced_count: 0
    };
  }
}

/**
 * Get client ID by slug (for Make.com scenarios that only have client slug)
 */
export async function getClientIdBySlug(slug: string): Promise<string | null> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching client by slug:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getClientIdBySlug:', error);
    return null;
  }
}

/**
 * Example usage for Make.com scenario:
 * 
 * const operationsData = [
 *   {
 *     client_id: "uuid-here", // or null for company operations
 *     call_id: "call-uuid", // or null for non-call operations
 *     scenario_name: "Lead Processing",
 *     scenario_id: "12345",
 *     operation_type: "call",
 *     date: "2025-01-22",
 *     operations_count: 150,
 *     operations_limit: 1000,
 *     cost_usd: 7.50,
 *     success_count: 145,
 *     error_count: 5,
 *     status: "active",
 *     description: "Processes incoming leads from calls"
 *   },
 *   {
 *     client_id: null, // Company operation
 *     call_id: null,
 *     scenario_name: "Marketing Automation",
 *     scenario_id: "67890",
 *     operation_type: "marketing",
 *     date: "2025-01-22",
 *     operations_count: 50,
 *     cost_usd: 2.50,
 *     success_count: 48,
 *     error_count: 2,
 *     status: "active",
 *     description: "Automated email campaigns and lead nurturing"
 *   }
 * ];
 * 
 * const result = await syncMakeOperationsData(operationsData);
 * console.log(result);
 */

/**
 * Helper function to calculate operations from Make.com webhook data
 * This can be used to process raw Make.com execution data
 */
export function calculateOperationsFromWebhook(webhookData: {
  scenario_id: string;
  scenario_name: string;
  operation_type: 'call' | 'admin' | 'marketing' | 'notification' | 'evaluation' | 'general';
  description?: string;
  executions: Array<{
    status: 'success' | 'error' | 'incomplete';
    operations_consumed: number;
    cost_usd: number;
    timestamp: string;
  }>;
}): Omit<MakeOperationsSyncData, 'client_id' | 'call_id'> {
  const today = new Date().toISOString().split('T')[0];
  
  // Filter executions for today
  const todayExecutions = webhookData.executions.filter(exec => 
    exec.timestamp.startsWith(today)
  );

  const totalOperations = todayExecutions.reduce((sum, exec) => sum + exec.operations_consumed, 0);
  const totalCost = todayExecutions.reduce((sum, exec) => sum + exec.cost_usd, 0);
  const successCount = todayExecutions.filter(exec => exec.status === 'success').length;
  const errorCount = todayExecutions.filter(exec => exec.status === 'error').length;

  // Determine status based on recent executions
  const recentErrors = todayExecutions.slice(-5).filter(exec => exec.status === 'error').length;
  const status = recentErrors >= 3 ? 'error' : 'active';

  return {
    scenario_name: webhookData.scenario_name,
    scenario_id: webhookData.scenario_id,
    operation_type: webhookData.operation_type,
    date: today,
    operations_count: totalOperations,
    cost_usd: totalCost,
    success_count: successCount,
    error_count: errorCount,
    status: status as 'active' | 'error',
    description: webhookData.description
  };
}