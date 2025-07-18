import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  type: string;
}

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: string | 'all';
  onClientChange: (clientId: string | 'all') => void;
  isLoading?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onClientChange,
  isLoading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedClientData = selectedClient === 'all' 
    ? null 
    : clients.find(c => c.id === selectedClient);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Client:</span>
      </div>
      
      <Select
        value={selectedClient}
        onValueChange={onClientChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-64">
          <SelectValue>
            {selectedClient === 'all' ? (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>All Clients</span>
                <Badge variant="secondary" className="ml-2">
                  {clients.length}
                </Badge>
              </div>
            ) : selectedClientData ? (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{selectedClientData.name}</span>
                <Badge className={getStatusColor(selectedClientData.status)}>
                  {selectedClientData.status}
                </Badge>
              </div>
            ) : (
              <span>Select a client...</span>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>All Clients</span>
              <Badge variant="secondary" className="ml-2">
                {clients.length}
              </Badge>
            </div>
          </SelectItem>
          
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center gap-2 w-full">
                <Building2 className="h-4 w-4" />
                <span className="flex-1">{client.name}</span>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedClient !== 'all' && selectedClientData && (
        <div className="text-sm text-muted-foreground">
          Type: {selectedClientData.type}
        </div>
      )}
    </div>
  );
};

export default ClientSelector;