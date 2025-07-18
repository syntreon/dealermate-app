export interface SystemMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  expiresAt: Date | null;
}

export interface AgentStatus {
  status: 'active' | 'inactive' | 'maintenance';
  lastUpdated: Date;
  message?: string;
}

export interface DashboardMetrics {
  totalCalls: number;
  averageHandleTime: string;
  callsTransferred: number;
  totalLeads: number;
  callsGrowth?: number;
  timeGrowth?: number;
  transferGrowth?: number;
  leadsGrowth?: number;
  agentStatus: AgentStatus;
  systemMessages: SystemMessage[];
}