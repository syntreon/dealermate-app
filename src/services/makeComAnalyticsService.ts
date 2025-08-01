import { adminSupabase } from '@/integrations/supabase/adminClient';
type Database = any;

const MAKE_COM_COST_PER_10000_OPS = 10.99; // $10.99 per 10,000 operations
const COST_PER_OPERATION = MAKE_COM_COST_PER_10000_OPS / 10000;

export type CallWithOperationCost = Database['public']['Tables']['calls']['Row'] & {
    make_com_cost_usd: number;
};

export interface MakeComAnalyticsData {
  totalOperations: number;
  totalCost: number;
  averageOperationsPerCall: number;
  operationsByDay: { date: string; operations: number; cost: number }[];
  topCallsByOperations: CallWithOperationCost[];
  topClientsByOperations: Array<{
    client_id: string;
    client_name: string;
    total_operations: number;
    total_cost: number;
    call_count: number;
    avg_operations_per_call: number;
  }>;
}

export async function getMakeComAnalyticsData(
  startDate: string,
  endDate: string,
  callType: 'all' | 'live' | 'test' = 'live'
): Promise<MakeComAnalyticsData> {
  const supabase = adminSupabase;

  let query = supabase
    .from('calls')
    .select('*')
    .gte('call_start_time', startDate)
    .lte('call_start_time', endDate)
    .not('make_com_operations', 'is', null)
    .gt('make_com_operations', 0);

  if (callType === 'live') {
    query = query.eq('is_test_call', false);
  } else if (callType === 'test') {
    query = query.eq('is_test_call', true);
  }

  const { data: calls, error } = await query;

  if (error) {
    console.error('Error fetching call data for Make.com analytics:', error);
    throw new Error('Failed to fetch Make.com analytics data.');
  }

  if (!calls || calls.length === 0) {
    return {
      totalOperations: 0,
      totalCost: 0,
      averageOperationsPerCall: 0,
      operationsByDay: [],
      topCallsByOperations: [],
      topClientsByOperations: [],
    };
  }

  let totalOperations = 0;
  const operationsByDayMap = new Map<string, { operations: number; cost: number }>();

  calls.forEach(call => {
    const operations = call.make_com_operations || 0;
    totalOperations += operations;

    const date = new Date(call.call_start_time).toISOString().split('T')[0];
    const dayData = operationsByDayMap.get(date) || { operations: 0, cost: 0 };

    dayData.operations += operations;
    dayData.cost += operations * COST_PER_OPERATION;
    operationsByDayMap.set(date, dayData);
  });

  const totalCost = totalOperations * COST_PER_OPERATION;
  const averageOperationsPerCall = totalOperations / calls.length;

  const operationsByDay: { date: string; operations: number; cost: number }[] = Array.from(operationsByDayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const topCallsByOperations: CallWithOperationCost[] = calls
    .map(call => ({
      ...call,
      make_com_cost_usd: (call.make_com_operations || 0) * COST_PER_OPERATION,
    }))
    .sort((a, b) => (b.make_com_operations || 0) - (a.make_com_operations || 0))
    .slice(0, 10);

  // Calculate top clients by operations
  const clientStats = new Map<string, {
    client_id: string;
    total_operations: number;
    total_cost: number;
    call_count: number;
  }>();

  calls.forEach(call => {
    const operations = call.make_com_operations || 0;
    const existing = clientStats.get(call.client_id) || {
      client_id: call.client_id,
      total_operations: 0,
      total_cost: 0,
      call_count: 0
    };

    existing.total_operations += operations;
    existing.total_cost += operations * COST_PER_OPERATION;
    existing.call_count += 1;
    clientStats.set(call.client_id, existing);
  });

  // Get client names and create top clients array
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name')
    .in('id', Array.from(clientStats.keys()));

  if (clientsError) {
    console.error('Error fetching client names:', clientsError);
  }

  const clientsMap = new Map(clients?.map(c => [c.id, c.name]) || []);

  const topClientsByOperations = Array.from(clientStats.values())
    .map(stats => ({
      client_id: stats.client_id,
      client_name: clientsMap.get(stats.client_id) || 'Unknown Client',
      total_operations: stats.total_operations,
      total_cost: stats.total_cost,
      call_count: stats.call_count,
      avg_operations_per_call: stats.call_count > 0 ? stats.total_operations / stats.call_count : 0
    }))
    .sort((a, b) => b.total_operations - a.total_operations)
    .slice(0, 10);

  return {
    totalOperations,
    totalCost,
    averageOperationsPerCall,
    operationsByDay,
    topCallsByOperations,
    topClientsByOperations,
  };
}
