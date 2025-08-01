import React, { useMemo, useEffect, useState } from 'react';
import { useClient } from '@/context/ClientContext';
import ClientSelector from '@/components/ClientSelector';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { useAuth } from '@/context/AuthContext';
import { Users } from 'lucide-react';
import { AdminService } from '@/services/adminService';

/**
 * GlobalClientSelector component for the TopBar
 * Displays a client selector for admin users to filter data across the entire app
 * For non-admin users, displays their client name as a non-interactive UI element
 * Uses the ClientContext to maintain global client selection state
 */
const GlobalClientSelector: React.FC = () => {
  const { user } = useAuth();
  const { selectedClientId, setSelectedClientId, clients, loading, error } = useClient();
  const [userClientName, setUserClientName] = useState<string>("");
  
  // Check if user can view all clients (admin/owner)
  const canViewAllClients = useMemo(() => canViewSensitiveInfo(user), [user]);
  
  // For non-admin users, fetch their client name directly
  useEffect(() => {
    if (!canViewAllClients && user?.client_id) {
      // First try to find the client name in the existing clients array
      const existingClient = clients.find(client => client.id === user.client_id);
      if (existingClient?.name) {
        setUserClientName(existingClient.name);
      } else {
        // If not found, fetch the client directly
        const fetchClientName = async () => {
          try {
            const clientsData = await AdminService.getClients();
            const userClient = clientsData.find(client => client.id === user.client_id);
            if (userClient?.name) {
              setUserClientName(userClient.name);
            }
          } catch (err) {
            console.error("Failed to fetch client name:", err);
          }
        };
        fetchClientName();
      }
    }
  }, [user, clients, canViewAllClients]);
  
  // For admin users, show the full client selector
  if (canViewAllClients) {
    return (
      <div className="hidden md:block">
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
          clients={clients}
          loading={loading}
          error={error}
        />
      </div>
    );
  }
  
  // For non-admin users, show a non-interactive client name display
  return (
    <div className="hidden md:flex items-center px-3 h-8 text-sm bg-background border border-border rounded-md">
      <Users className="h-4 w-4 shrink-0 opacity-50 mr-2" />
      <span className="text-card-foreground">{userClientName || "Loading..."}</span>
    </div>
  );
};

export default GlobalClientSelector;
