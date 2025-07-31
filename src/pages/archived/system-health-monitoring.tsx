import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import ClientSelector from '@/components/admin/ClientSelector';
import { AdminService } from '@/services/adminService';
import { SystemHealth, SystemMetrics, Client } from '@/types/admin';

const SystemHealthMonitoring = () => {
  const { toast } = useToast();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | 'all'>('all');
  const [clientsLoading, setClientsLoading] = useState(true);

  // Load clients first
  useEffect(() => {
    const loadClients = async () => {
      setClientsLoading(true);
      try {
        const clientsData = await AdminService.getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load clients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setClientsLoading(false);
      }
    };

    loadClients();
  }, [toast]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // If 'all' is selected, get platform-wide health data
      // Otherwise, get client-specific health data
      const clientId = selectedClient === 'all' ? null : selectedClient;
      
      const [healthData, metricsData] = await Promise.all([
        AdminService.getSystemHealth(clientId),
        AdminService.getSystemMetrics(timeframe, clientId)
      ]);
      
      setHealth(healthData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load system health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system health data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Set up polling interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeframe, selectedClient, toast]);

  const handleRefresh = () => {
    loadData();
  };

  const handleRunHealthCheck = async () => {
    try {
      const clientId = selectedClient === 'all' ? null : selectedClient;
      const clientName = clientId ? clients.find(c => c.id === clientId)?.name : 'all clients';
      
      toast({
        title: 'Running health check...',
        description: `Checking system health for ${clientName}. This may take a few moments.`,
      });
      
      await AdminService.runSystemHealthCheck(clientId);
      await loadData();
      
      toast({
        title: 'Health check complete',
        description: `System health data for ${clientName} has been updated.`,
      });
    } catch (error) {
      console.error('Failed to run health check:', error);
      toast({
        title: 'Error',
        description: 'Failed to run health check. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Health Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor system health, performance metrics, and component status
        </p>
      </div>

      {/* Client Selector */}
      <div className="mb-6">
        <ClientSelector
          clients={clients}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
          isLoading={clientsLoading}
        />
        <p className="text-sm text-muted-foreground mt-2">
          {selectedClient === 'all' 
            ? 'Viewing platform-wide health metrics (aggregated across all clients)' 
            : `Viewing health metrics for ${clients.find(c => c.id === selectedClient)?.name || 'selected client'}`}
        </p>
      </div>

      {health && metrics ? (
        <SystemHealthDashboard
          health={health}
          metrics={metrics}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onRunHealthCheck={handleRunHealthCheck}
        />
      ) : isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load system health data</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitoring;