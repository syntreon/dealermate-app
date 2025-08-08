import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Filter } from 'lucide-react';
import { useCallLogs } from '@/hooks/useCallLogs';
import { useCallType } from '@/context/CallTypeContext'; // Global call type filter
import { leadService } from '@/integrations/supabase/lead-service';
import CallLogsTable, { ExtendedCallLog } from '@/components/CallLogsTable';
import { useAuth } from '@/context/AuthContext';
import { useClient } from '@/context/ClientContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { CachedAdminService } from '@/services/cachedAdminService';

/**
 * Logs page component for displaying call logs from Supabase
 * Shows a table of call logs with caller information, appointment details, and status
 */
const Logs: React.FC = () => {
  // Global call type filter from context
  const { selectedCallType } = useCallType();
  // State for call IDs that have an associated lead
  const [leadCallIds, setLeadCallIds] = useState<Set<string>>(new Set());
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedClientId, clients } = useClient();
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  // Pass selectedCallType as initial filter
  const { callLogs, loading, error, forceRefresh, refetch } = useCallLogs(true, { callType: selectedCallType });
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});

  // Client selection is now handled by the global ClientContext
  
  // Refetch logs when selectedClientId changes
  // Refetch logs when selectedClientId or selectedCallType changes
  useEffect(() => {
    refetch({ clientId: selectedClientId, callType: selectedCallType });
    // Only depend on selectedClientId and selectedCallType, since refetch is stable
  }, [selectedClientId, selectedCallType]);
  
  // Get selected client name when client ID changes
  useEffect(() => {
    // If no client is selected, clear the client name
    if (!selectedClientId) {
      setSelectedClientName(null);
      return;
    }
    
    // Find selected client name from clients array
    const selectedClient = clients?.find(client => client.id === selectedClientId);
    if (selectedClient) {
      setSelectedClientName(selectedClient.name);
    }
  }, [selectedClientId, clients]);
  
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
  }, [user?.id, user?.role, user?.client_id]); // Only depend on specific user properties
  
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
      // Non-admin: fetch all leads user is allowed to see (same as admin, but for their scope)
      fetchLeadsPromise = leadService.getLeads();
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
  }, [user?.id, user?.role, user?.client_id, selectedClientId]); // Only depend on specific user properties

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
    // Clamp page width to viewport to avoid page-level horizontal scroll on mobile.
    // Inner wide components (tables) will manage their own overflow.
    <div className="space-y-4 pb-8 w-full max-w-full overflow-x-hidden">
      {/* Mobile-first compact header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold">Call Logs</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and manage your call and appointment data</p>
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

      {/* Client selection is now handled by the global client selector in TopBar */}

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
