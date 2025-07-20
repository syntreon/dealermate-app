export interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'trial' | 'churned' | 'pending'; //dont make any changes to this db enum
  type: string;
  subscription_plan: 'Free Trial' | 'Basic' | 'Pro' | 'Custom'; //dont make any changes to this db enum
  contact_person: string | null;
  contact_email: string | null;
  phone_number: string | null;
  billing_address: string | null;
  monthly_billing_amount_cad: number;
  average_monthly_ai_cost_usd: number; // Calculated field, not input
  average_monthly_misc_cost_usd: number; // Calculated field, not input
  partner_split_percentage: number; // Backend managed field
  finders_fee_cad: number;
  slug: string;
  config_json: any;
  joined_at: Date;
  last_active_at: Date | null;

  // Computed metrics
  metrics?: {
    totalCalls: number;
    totalLeads: number;
    avgCallDuration: number;
    callsToday: number;
    leadsToday: number;
  };
}

export interface CreateClientData {
  name: string;
  type: string;
  subscription_plan: 'free trial' | 'basic' | 'Pro' | 'Custom';
  contact_person?: string;
  contact_email?: string;
  phone_number?: string;
  billing_address?: string;
  monthly_billing_amount_cad: number;
  finders_fee_cad: number;
  slug: string;
  config_json?: any;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: 'active' | 'inactive' | 'trial' | 'churned';
}

export interface ClientFilters {
  status?: 'active' | 'inactive' | 'trial' | 'churned' | 'all';
  type?: string;
  subscription_plan?: 'Free Trial' | 'Basic' | 'Pro' | 'Custom' | 'all';
  search?: string;
  searchFields?: ('name' | 'contact_person' | 'contact_email' | 'slug')[];
  dateRange?: {
    field: 'joined_at' | 'last_active_at';
    start?: Date;
    end?: Date;
  };
  billingRange?: {
    min?: number;
    max?: number;
  };
  customFields?: {
    [key: string]: any;
  };
  sortBy?: 'name' | 'joined_at' | 'last_active_at' | 'status' | 'monthly_billing_amount_cad' | 'type';
  sortDirection?: 'asc' | 'desc';
  multiSort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: ClientFilters;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user';
  client_id: string | null;
  last_login_at: Date | null;
  created_at: Date;
  preferences?: {
    notifications: {
      email: boolean;
      leadAlerts: boolean;
      systemAlerts: boolean;
      notificationEmails: string[];
    };
    displaySettings: {
      theme: 'light' | 'dark' | 'system';
      dashboardLayout: 'compact' | 'detailed';
    };
  };
}

export interface CreateUserData {
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user';
  client_id?: string | null;
}

export interface UpdateUserData extends Partial<CreateUserData> { }

export interface UserFilters {
  role?: 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user' | 'all';
  client_id?: string | 'all';
  search?: string;
  sortBy?: 'full_name' | 'email' | 'created_at' | 'last_login_at';
  sortDirection?: 'asc' | 'desc';
}

export interface SystemComponent {
  name: string;
  type: 'database' | 'api' | 'server' | 'storage' | 'processor' | string;
  status: 'up' | 'down';
  message?: string;
  lastChecked?: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  components: Record<string, SystemComponent>;
  lastChecked: Date;
}

export interface SystemEvent {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  details: string;
  timestamp: Date;
  component?: string;
}

export interface SystemMetrics {
  totalCalls: number;
  totalLeads: number;
  activeClients: number;
  averageResponseTime: number;
  errorRate: number;
  timeframeData: Array<{ timestamp: Date, value: number }>;
  recentEvents: SystemEvent[];
}

// Agent Status Types
export interface AgentStatus {
  id: string;
  client_id: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  message: string | null;
  last_updated: Date;
  updated_by: string;
  created_at: Date;

  // Computed fields
  updatedByUser?: User;
  duration?: number; // Time in current status (minutes)
}

export interface AgentStatusUpdate {
  status: 'active' | 'inactive' | 'maintenance';
  message?: string;
}

export interface AgentStatusHistory {
  id: string;
  client_id: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  message: string | null;
  changed_at: Date;
  changed_by: string;
  duration_minutes: number;
  changedByUser?: User;
}

// System Message Types
export interface SystemMessage {
  id: string;
  client_id: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  expires_at: Date | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;

  // Computed fields
  isExpired?: boolean;
  isGlobal?: boolean;
  createdByUser?: User;
}

export interface CreateSystemMessageData {
  client_id?: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  expires_at?: Date | null;
}

export interface UpdateSystemMessageData extends Partial<CreateSystemMessageData> { }

export interface SystemMessageFilters {
  client_id?: string | 'all';
  type?: 'info' | 'warning' | 'error' | 'success' | 'all';
  includeExpired?: boolean;
  search?: string;
  sortBy?: 'timestamp' | 'type' | 'expires_at';
  sortDirection?: 'asc' | 'desc';
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id: string | null;
  client_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;

  // Computed fields
  user?: User;
  client?: Client;
  summary?: string;
}

export type AuditAction =
  | 'create' | 'update' | 'delete'
  | 'login' | 'logout' | 'password_change'
  | 'role_change' | 'permission_change'
  | 'agent_status_change' | 'system_message_create'
  | 'bulk_operation' | 'data_export' | 'data_import';

export interface AuditFilters {
  user_id?: string;
  client_id?: string;
  action?: AuditAction | 'all';
  table_name?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: 'created_at' | 'action' | 'table_name';
  sortDirection?: 'asc' | 'desc';
}

// Pagination and Response Types
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Bulk Operation Types
export interface BulkOperation {
  action: 'activate' | 'deactivate' | 'delete' | 'update';
  ids: string[];
  data?: Record<string, any>;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}