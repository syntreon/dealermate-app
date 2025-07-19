import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Phone, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import ClientSelector from '@/components/admin/ClientSelector';

// Mock data - replace with real data from your API
const mockClients = [
  { id: '1', name: 'Acme Corp', status: 'active' as const, type: 'Enterprise' },
  { id: '2', name: 'TechStart Inc', status: 'active' as const, type: 'Startup' },
  { id: '3', name: 'Global Solutions', status: 'pending' as const, type: 'Enterprise' },
  { id: '4', name: 'Local Business', status: 'inactive' as const, type: 'SMB' },
];

const AdminDashboard = () => {
  const [selectedClient, setSelectedClient] = useState<string | 'all'>('all');

  // Mock metrics - replace with real data
  const metrics = {
    totalClients: 4,
    activeClients: 2,
    totalUsers: 24,
    totalCalls: 1247,
    totalRevenue: 45600,
    systemStatus: 'operational'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all clients, users, and system metrics
          </p>
        </div>
        
        {/* Client Selector */}
        <ClientSelector
          clients={mockClients}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
        />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{metrics.activeClients} active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalls.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">+12% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Monthly recurring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-medium">All Systems Operational</span>
            <Badge variant="secondary">Last updated: 2 minutes ago</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            All services are running normally. No issues detected.
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Client Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockClients.slice(0, 3).map((client) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.type}</p>
                    </div>
                  </div>
                  <Badge 
                    className={
                      client.status === 'active' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' 
                        : client.status === 'pending'
                        ? 'bg-warning/20 text-warning-foreground'
                        : 'bg-destructive/10 text-destructive'
                    }
                  >
                    {client.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No active alerts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All systems are operating within normal parameters.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;