import React, { useMemo } from 'react';
import { useClient } from '@/context/ClientContext';
import ClientSelector from '@/components/ClientSelector';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { useAuth } from '@/context/AuthContext';

/**
 * GlobalClientSelector component for the TopBar
 * Displays a client selector for admin users to filter data across the entire app
 * Uses the ClientContext to maintain global client selection state
 */
const GlobalClientSelector: React.FC = () => {
  const { user } = useAuth();
  const { selectedClientId, setSelectedClientId, clients, loading, error } = useClient();
  
  // Only admin users can see all clients - memoize this check to prevent infinite render loops
  const canViewAllClients = useMemo(() => canViewSensitiveInfo(user), [user]);
  
  // If user is not an admin, don't render the component
  if (!canViewAllClients) return null;
  
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
};

export default GlobalClientSelector;
