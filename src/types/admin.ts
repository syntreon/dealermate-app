export interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  type: string;
  subscription_plan: string;
  contact_person: string | null;
  contact_email: string | null;
  phone_number: string | null;
  billing_address: string | null;
  monthly_billing_amount_cad: number;
  average_monthly_ai_cost_usd: number;
  average_monthly_misc_cost_usd: number;
  partner_split_percentage: number;
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
  subscription_plan: string;
  contact_person?: string;
  contact_email?: string;
  phone_number?: string;
  billing_address?: string;
  monthly_billing_amount_cad: number;
  average_monthly_ai_cost_usd: number;
  average_monthly_misc_cost_usd: number;
  partner_split_percentage: number;
  finders_fee_cad: number;
  slug: string;
  config_json?: any;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: 'active' | 'inactive' | 'pending';
}

export interface ClientFilters {
  status?: 'active' | 'inactive' | 'pending' | 'all';
  type?: string;
  search?: string;
  sortBy?: 'name' | 'joined_at' | 'last_active_at' | 'status';
  sortDirection?: 'asc' | 'desc';
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

export interface UpdateUserData extends Partial<CreateUserData> {}

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