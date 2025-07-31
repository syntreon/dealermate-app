import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminService } from '@/services/adminService';
import { Client } from '@/types/admin';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';

interface ClientContextType {
  selectedClientId: string | null;
  setSelectedClientId: (clientId: string | null) => void;
  clients: Client[];
  loading: boolean;
  error: Error | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (canViewSensitiveInfo(user)) {
      const fetchClients = async () => {
        setLoading(true);
        try {
          const clientsData = await AdminService.getClients();
          setClients(clientsData);
        } catch (err) {
          setError(err as Error);
          console.error("Failed to fetch clients:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchClients();
    } else {
      setLoading(false);
    }
  }, [user]);

  const value = useMemo(() => ({
    selectedClientId,
    setSelectedClientId,
    clients,
    loading,
    error
  }), [selectedClientId, clients, loading, error]);

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
