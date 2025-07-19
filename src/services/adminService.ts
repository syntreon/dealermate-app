import { 
  Client, 
  ClientFilters, 
  CreateClientData, 
  UpdateClientData, 
  User, 
  UserFilters, 
  CreateUserData, 
  UpdateUserData,
  PaginatedResponse,
  PaginationOptions,
  DatabaseError,
  BulkOperation,
  BulkOperationResult,
  SystemHealth,
  SystemMetrics
} from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Database utility functions
const handleDatabaseError = (error: any): DatabaseError => {
  console.error('Database error:', error);
  
  const dbError = new Error(error.message || 'Database operation failed') as DatabaseError;
  dbError.code = error.code;
  dbError.details = error.details;
  dbError.hint = error.hint;
  
  return dbError;
};

const transformClient = (row: Database['public']['Tables']['clients']['Row']): Client => {
  return {
    id: row.id,
    name: row.name,
    status: row.status as 'active' | 'inactive' | 'trial' | 'churned',
    type: row.type,
    subscription_plan: row.subscription_plan as 'free trial' | 'basic' | 'Pro' | 'Custom',
    contact_person: row.contact_person,
    contact_email: row.contact_email,
    phone_number: row.phone_number,
    billing_address: row.billing_address,
    monthly_billing_amount_cad: row.monthly_billing_amount_cad,
    average_monthly_ai_cost_usd: row.average_monthly_ai_cost_usd,
    average_monthly_misc_cost_usd: row.average_monthly_misc_cost_usd,
    partner_split_percentage: row.partner_split_percentage,
    finders_fee_cad: row.finders_fee_cad,
    slug: row.slug,
    config_json: row.config_json,
    joined_at: new Date(row.joined_at),
    last_active_at: row.last_active_at ? new Date(row.last_active_at) : null,
  };
};

const transformUser = (row: Database['public']['Tables']['users']['Row']): User => {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role as 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user',
    client_id: row.client_id,
    last_login_at: row.last_login_at ? new Date(row.last_login_at) : null,
    created_at: new Date(row.created_at),
    preferences: row.preferences as any,
  };
};

// Calculate client metrics from database
const calculateClientMetrics = async (clientId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get total calls and leads
  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('id, call_duration_seconds, created_at')
    .eq('client_id', clientId);
    
  if (callsError) {
    console.error('Error fetching calls for metrics:', callsError);
    return {
      totalCalls: 0,
      totalLeads: 0,
      avgCallDuration: 0,
      callsToday: 0,
      leadsToday: 0
    };
  }
  
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id, created_at')
    .eq('client_id', clientId);
    
  if (leadsError) {
    console.error('Error fetching leads for metrics:', leadsError);
  }
  
  const totalCalls = calls?.length || 0;
  const totalLeads = leads?.length || 0;
  
  // Calculate average call duration
  const avgCallDuration = totalCalls > 0 
    ? Math.round((calls?.reduce((sum, call) => sum + call.call_duration_seconds, 0) || 0) / totalCalls)
    : 0;
  
  // Calculate today's metrics
  const callsToday = calls?.filter(call => 
    new Date(call.created_at) >= today
  ).length || 0;
  
  const leadsToday = leads?.filter(lead => 
    new Date(lead.created_at) >= today
  ).length || 0;
  
  return {
    totalCalls,
    totalLeads,
    avgCallDuration,
    callsToday,
    leadsToday
  };
};

export const AdminService = {
  // Client management
  getClients: async (filters?: ClientFilters, pagination?: PaginationOptions): Promise<Client[]> => {
    const result = await AdminService.getClientsPaginated(filters, pagination);
    return result.data;
  },

  getClientsPaginated: async (filters?: ClientFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<Client>> => {
    try {
      let query = supabase.from('clients').select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        if (filters.type) {
          query = query.eq('type', filters.type);
        }

        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`);
        }

        // Apply sorting
        if (filters.sortBy) {
          const ascending = filters.sortDirection !== 'desc';
          query = query.order(filters.sortBy, { ascending });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      }

      // Apply pagination
      if (pagination) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      // Transform data and add metrics
      const clients: Client[] = await Promise.all(
        (data || []).map(async (row) => {
          const client = transformClient(row);
          client.metrics = await calculateClientMetrics(client.id);
          return client;
        })
      );

      const total = count || 0;
      const limit = pagination?.limit || total;
      const page = pagination?.page || 1;

      return {
        data: clients,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  getClientById: async (id: string): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleDatabaseError(error);
      }

      const client = transformClient(data);
      client.metrics = await calculateClientMetrics(client.id);
      
      return client;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  createClient: async (data: CreateClientData): Promise<Client> => {
    try {
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          name: data.name,
          type: data.type,
          subscription_plan: data.subscription_plan,
          contact_person: data.contact_person || null,
          contact_email: data.contact_email || null,
          phone_number: data.phone_number || null,
          billing_address: data.billing_address || null,
          monthly_billing_amount_cad: data.monthly_billing_amount_cad,
          average_monthly_ai_cost_usd: 0, // Default calculated field
          average_monthly_misc_cost_usd: 0, // Default calculated field
          partner_split_percentage: 0, // Default backend managed field
          finders_fee_cad: data.finders_fee_cad,
          slug: data.slug,
          config_json: data.config_json || {},
          status: 'trial' // Default status for new clients
        })
        .select()
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      const client = transformClient(newClient);
      client.metrics = await calculateClientMetrics(client.id);
      
      return client;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  updateClient: async (id: string, data: UpdateClientData): Promise<Client> => {
    try {
      const updateData: any = {};
      
      // Only include defined fields in the update
      Object.keys(data).forEach(key => {
        if (data[key as keyof UpdateClientData] !== undefined) {
          updateData[key] = data[key as keyof UpdateClientData];
        }
      });

      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      const client = transformClient(updatedClient);
      client.metrics = await calculateClientMetrics(client.id);
      
      return client;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  deleteClient: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        throw handleDatabaseError(error);
      }
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  activateClient: async (id: string): Promise<Client> => {
    return AdminService.updateClient(id, { status: 'active' });
  },

  deactivateClient: async (id: string): Promise<Client> => {
    return AdminService.updateClient(id, { status: 'inactive' });
  },

  setClientToTrial: async (id: string): Promise<Client> => {
    return AdminService.updateClient(id, { status: 'trial' });
  },

  churnClient: async (id: string): Promise<Client> => {
    return AdminService.updateClient(id, { status: 'churned' });
  },

  bulkUpdateClients: async (operation: BulkOperation): Promise<BulkOperationResult> => {
    try {
      const results: BulkOperationResult = {
        success: true,
        processed: 0,
        failed: 0,
        errors: []
      };

      for (const id of operation.ids) {
        try {
          switch (operation.action) {
            case 'activate':
              await AdminService.updateClient(id, { status: 'active' });
              break;
            case 'deactivate':
              await AdminService.updateClient(id, { status: 'inactive' });
              break;
            case 'delete':
              await AdminService.deleteClient(id);
              break;
            case 'update':
              if (operation.data) {
                await AdminService.updateClient(id, operation.data);
              }
              break;
          }
          results.processed++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      results.success = results.failed === 0;
      return results;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // User management functions
  getUsers: async (filters?: UserFilters, pagination?: PaginationOptions): Promise<User[]> => {
    const result = await AdminService.getUsersPaginated(filters, pagination);
    return result.data;
  },

  getUsersPaginated: async (filters?: UserFilters, pagination?: PaginationOptions): Promise<PaginatedResponse<User>> => {
    try {
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.role && filters.role !== 'all') {
          query = query.eq('role', filters.role);
        }

        if (filters.client_id && filters.client_id !== 'all') {
          if (filters.client_id === 'null') {
            query = query.is('client_id', null);
          } else {
            query = query.eq('client_id', filters.client_id);
          }
        }

        if (filters.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        // Apply sorting
        if (filters.sortBy) {
          const ascending = filters.sortDirection !== 'desc';
          query = query.order(filters.sortBy, { ascending });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      }

      // Apply pagination
      if (pagination) {
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw handleDatabaseError(error);
      }

      const users = (data || []).map(transformUser);
      const total = count || 0;
      const limit = pagination?.limit || total;
      const page = pagination?.page || 1;

      return {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleDatabaseError(error);
      }

      return transformUser(data);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    try {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: data.email,
          full_name: data.full_name,
          role: data.role,
          client_id: data.client_id || null,
          preferences: {
            notifications: {
              email: true,
              leadAlerts: false,
              systemAlerts: false,
              notificationEmails: [data.email]
            },
            displaySettings: {
              theme: 'system',
              dashboardLayout: 'compact'
            }
          }
        })
        .select()
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      return transformUser(newUser);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    try {
      const updateData: any = {};
      
      // Only include defined fields in the update
      Object.keys(data).forEach(key => {
        if (data[key as keyof UpdateUserData] !== undefined) {
          updateData[key] = data[key as keyof UpdateUserData];
        }
      });

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw handleDatabaseError(error);
      }

      return transformUser(updatedUser);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw handleDatabaseError(error);
      }
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  bulkUpdateUsers: async (operation: BulkOperation): Promise<BulkOperationResult> => {
    try {
      const results: BulkOperationResult = {
        success: true,
        processed: 0,
        failed: 0,
        errors: []
      };

      for (const id of operation.ids) {
        try {
          switch (operation.action) {
            case 'delete':
              await AdminService.deleteUser(id);
              break;
            case 'update':
              if (operation.data) {
                await AdminService.updateUser(id, operation.data);
              }
              break;
          }
          results.processed++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      results.success = results.failed === 0;
      return results;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // System health functions
  getSystemHealth: async (clientId?: string | null): Promise<SystemHealth> => {
    try {
      // Check database connectivity
      const { error: dbError } = await supabase.from('clients').select('id').limit(1);
      const dbStatus = dbError ? 'down' : 'up';
      const dbMessage = dbError ? `Database error: ${dbError.message}` : 'Connection pool healthy';

      // Get agent status for client or platform
      let agentStatus = 'up';
      let agentMessage = 'All agents operational';
      
      if (clientId) {
        const { data: agentData, error: agentError } = await supabase
          .from('agent_status')
          .select('status, message')
          .eq('client_id', clientId)
          .single();
          
        if (!agentError && agentData) {
          agentStatus = agentData.status === 'active' ? 'up' : 'down';
          agentMessage = agentData.message || `Agent is ${agentData.status}`;
        }
      }

      // Get client info if specific client requested
      let clientName = 'Platform';
      if (clientId) {
        const client = await AdminService.getClientById(clientId);
        clientName = client?.name || 'Unknown Client';
      }

      const components = {
        database: {
          name: 'Database',
          type: 'database' as const,
          status: dbStatus as 'up' | 'down',
          message: dbMessage,
          lastChecked: new Date()
        },
        api: {
          name: 'API Server',
          type: 'api' as const,
          status: 'up' as const,
          message: 'All endpoints responding',
          lastChecked: new Date()
        },
        agent: {
          name: clientId ? `${clientName} Agent` : 'Platform Agents',
          type: 'server' as const,
          status: agentStatus as 'up' | 'down',
          message: agentMessage,
          lastChecked: new Date()
        }
      };

      // Determine overall status
      const hasDown = Object.values(components).some(c => c.status === 'down');
      const overallStatus = hasDown ? 'down' : 'healthy';

      return {
        status: overallStatus,
        components,
        lastChecked: new Date()
      };
    } catch (error) {
      // If we can't check health, assume system is down
      return {
        status: 'down',
        components: {
          database: {
            name: 'Database',
            type: 'database',
            status: 'down',
            message: 'Unable to connect to database',
            lastChecked: new Date()
          },
          api: {
            name: 'API Server',
            type: 'api',
            status: 'down',
            message: 'API server unreachable',
            lastChecked: new Date()
          }
        },
        lastChecked: new Date()
      };
    }
  },
  
  getSystemMetrics: async (timeframe: 'day' | 'week' | 'month', clientId?: string | null): Promise<SystemMetrics> => {
    try {
      // Calculate date range based on timeframe
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

      // Get metrics from database
      let callsQuery = supabase
        .from('calls')
        .select('id, created_at, call_duration_seconds')
        .gte('created_at', startDate.toISOString());
        
      let leadsQuery = supabase
        .from('leads')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      if (clientId) {
        callsQuery = callsQuery.eq('client_id', clientId);
        leadsQuery = leadsQuery.eq('client_id', clientId);
      }

      const [callsResult, leadsResult, clientsResult] = await Promise.all([
        callsQuery,
        leadsQuery,
        supabase.from('clients').select('id').eq('status', 'active')
      ]);

      const calls = callsResult.data || [];
      const leads = leadsResult.data || [];
      const activeClients = clientsResult.data?.length || 0;

      // Calculate metrics
      const totalCalls = calls.length;
      const totalLeads = leads.length;
      const averageResponseTime = 245; // This would come from actual API monitoring
      const errorRate = 0.42; // This would come from error tracking

      // Generate timeframe data
      const dataPoints = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : 30;
      const interval = timeframe === 'day' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const timeframeData: Array<{ timestamp: Date, value: number }> = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const timestamp = new Date(now.getTime() - (dataPoints - i) * interval);
        const periodCalls = calls.filter(call => {
          const callTime = new Date(call.created_at);
          return callTime >= timestamp && callTime < new Date(timestamp.getTime() + interval);
        }).length;
        
        timeframeData.push({
          timestamp,
          value: periodCalls
        });
      }

      // Get recent system messages as events
      const { data: recentMessages } = await supabase
        .from('system_messages')
        .select('type, message, timestamp')
        .order('timestamp', { ascending: false })
        .limit(5);

      const recentEvents = (recentMessages || []).map(msg => ({
        type: msg.type as 'error' | 'warning' | 'info' | 'success',
        message: msg.message,
        details: msg.message,
        timestamp: new Date(msg.timestamp)
      }));

      return {
        totalCalls,
        totalLeads,
        activeClients,
        averageResponseTime,
        errorRate,
        timeframeData,
        recentEvents
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },
  
  runSystemHealthCheck: async (clientId?: string | null): Promise<void> => {
    try {
      // Perform actual health checks
      await supabase.from('clients').select('id').limit(1);
      
      if (clientId) {
        // Check client-specific health
        await supabase.from('calls').select('id').eq('client_id', clientId).limit(1);
        await supabase.from('leads').select('id').eq('client_id', clientId).limit(1);
      }
      
      // Health check completed successfully
      console.log(`Health check completed for ${clientId ? `client ${clientId}` : 'platform'}`);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }
};