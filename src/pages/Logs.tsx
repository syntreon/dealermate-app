import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Filter } from 'lucide-react';
import { useCallLogs } from '@/hooks/useCallLogs';
import CallLogsTable from '@/components/CallLogsTable';
import ClientSelector from '@/components/ClientSelector';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';

/**
 * Logs page component for displaying call logs from Supabase
 * Shows a table of call logs with caller information, appointment details, and status
 */
const Logs: React.FC = () => {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { callLogs, loading, error, forceRefresh, refetch } = useCallLogs();

  // Handle client selection change
  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
    // Refetch call logs with the selected client ID
    refetch({ clientId });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Responsive header layout */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Call Logs</h1>
          </div>
          <p className="text-muted-foreground">View and manage your call and appointment data</p>
        </div>
        
        <div className="flex gap-2 self-start">
          {/* Client selector for admin users */}
          {canViewSensitiveInfo(user) && (
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={handleClientChange}
            />
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Call Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="bg-destructive/10 text-destructive p-6 m-4 rounded-md">
              <p>Error loading call logs: {typeof error === 'string' ? error : error.message || 'Unknown error'}</p>
            </div>
          ) : (
            <CallLogsTable 
              callLogs={callLogs} 
              loading={loading} 
              onRefresh={forceRefresh} 
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
