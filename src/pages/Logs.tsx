import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Filter } from 'lucide-react';
import { useCallLogs } from '@/hooks/useCallLogs';
import { leadService } from '@/integrations/supabase/lead-service';
import CallLogsTable, { ExtendedCallLog } from '@/components/CallLogsTable';
import ClientSelector from '@/components/ClientSelector';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { CachedAdminService } from '@/services/cachedAdminService';

/**
 * Logs page component for displaying call logs from Supabase
 * Shows a table of call logs with caller information, appointment details, and status
 */
const Logs: React.FC = () => {
  // State for call IDs that have an associated lead
  const [leadCallIds, setLeadCallIds] = useState<Set<string>>(new Set());
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const { callLogs, loading, error, forceRefresh, refetch } = useCallLogs();
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});

  // Handle client selection change
  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
    // Refetch call logs with the selected client ID
    refetch({ clientId });
  };
  
  // Get selected client name when client ID changes
  useEffect(() => {
    // If no client is selected, clear the client name
    if (!selectedClientId) {
      setSelectedClientName(null);
      return;
    }
    
    // Find the selected client name from the ClientSelector
    const clientSelectorElement = document.querySelector('[role="combobox"] span.truncate');
    if (clientSelectorElement) {
      const clientName = clientSelectorElement.textContent?.trim();
      setSelectedClientName(clientName !== 'Premier Chevrolet' && clientName !== 'All Clients' ? clientName : null);
    }
  }, [selectedClientId]);
  
  // Fetch all clients data for admin users to map client_id to client_name
  useEffect(() => {
    const fetchClientsData = async () => {
      // Only fetch clients data for admin users
      if (!user || !canViewSensitiveInfo(user)) return;
      
      try {
        const clients = await CachedAdminService.getClients();
        const clientsMapping: Record<string, string> = {};
        
        // Create a mapping of client_id to client name
        clients.forEach(client => {
          if (client.id && client.name) {
            clientsMapping[client.id] = client.name;
          }
        });
        
        setClientsMap(clientsMapping);
      } catch (error) {
        console.error('Error fetching clients data:', error);
      }
    };
    
    fetchClientsData();
  }, [user]);
  
  useEffect(() => {
    // Only fetch if admin or a client is selected
    if (!user) return;
  
    const isAdmin = canViewSensitiveInfo(user);
    const allClientsSelected = !selectedClientId || selectedClientId === 'all';
  
    setLeadsLoading(true);
    setLeadsError(null);
  
    let fetchLeadsPromise;
    if (isAdmin && allClientsSelected) {
      // Admin: fetch all leads
      fetchLeadsPromise = leadService.getLeads();
    } else if (selectedClientId) {
      // Non-admin or admin with a client selected: fetch leads for that client
      fetchLeadsPromise = leadService.getLeadsByClientId(selectedClientId);
    } else {
      setLeadCallIds(new Set());
      setLeadsLoading(false);
      return;
    }
  
    fetchLeadsPromise
      .then(leads => {
        const callIdSet = new Set<string>();
        leads.forEach(lead => {
          if (lead.call_id) callIdSet.add(lead.call_id);
        });
        setLeadCallIds(callIdSet);
      })
      .catch(err => {
        setLeadsError(typeof err === 'string' ? err : err?.message || 'Unknown error fetching leads');
        setLeadCallIds(new Set());
      })
      .finally(() => setLeadsLoading(false));
  }, [user, selectedClientId]);

  // Enhance call logs with client name
  const enhancedCallLogs: ExtendedCallLog[] = callLogs.map(log => {
    // If filtering by a specific client, use the selected client name
    if (selectedClientId && selectedClientName) {
      return {
        ...log,
        client_name: selectedClientName
      };
    }
    
    // Otherwise, look up the client name from the clients map
    return {
      ...log,
      client_name: log.client_id && clientsMap[log.client_id] ? clientsMap[log.client_id] : 'Unknown'
    };
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Mobile-first compact header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage your call and appointment data</p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:ml-2 sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Client selector for admin users - separate row on mobile */}
      {canViewSensitiveInfo(user) && (
        <div className="flex justify-end">
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientChange={handleClientChange}
            className="w-full sm:w-auto max-w-xs"
          />
        </div>
      )}

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-0">
          {error ? (
            <div className="bg-destructive/10 text-destructive p-4 m-4 rounded-md">
              <p className="text-sm">Error loading call logs: {typeof error === 'string' ? error : error.message || 'Unknown error'}</p>
            </div>
          ) : (
            <CallLogsTable 
              callLogs={enhancedCallLogs} 
              loading={loading || leadsLoading} 
              onRefresh={forceRefresh} 
              leadCallIds={leadCallIds}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-500/20 text-green-500';
    case 'rescheduled':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'cancelled':
      return 'bg-red-500/20 text-red-500';
    case 'completed':
      return 'bg-blue-500/20 text-blue-500';
    default:
      return 'bg-zinc-500/20 text-zinc-400';
  }
};

export default Logs;
