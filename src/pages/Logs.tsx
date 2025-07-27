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
