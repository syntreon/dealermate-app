import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  status?: 'active' | 'inactive' | 'pending';
}

interface ClientSelectorProps {
  onClientChange: (clientId: string | null) => void;
  selectedClientId: string | null;
  className?: string;
}

/**
 * ClientSelector component for admin users to filter data by client
 * Only visible to admin users, automatically hidden for regular users
 */
const ClientSelector: React.FC<ClientSelectorProps> = ({
  onClientChange,
  selectedClientId,
  className,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  // Only admin users can see all clients
  const canViewAllClients = canViewSensitiveInfo(user);

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      if (!canViewAllClients) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, status')
          .order('name');
        
        if (error) {
          console.error('Error fetching clients:', error);
          return;
        }
        
        setClients(data || []);
      } catch (err) {
        console.error('Error in fetchClients:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [canViewAllClients]);

  // If user is not an admin, don't render the component
  if (!canViewAllClients) return null;

  // Find the selected client name
  const selectedClient = clients.find(client => client.id === selectedClientId);
  
  return (
    <div className={cn("flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[200px] justify-between"
            disabled={loading}
          >
            <div className="flex items-center gap-2 truncate">
              <Users className="h-4 w-4 shrink-0 opacity-50" />
              <span className="truncate">
                {selectedClientId
                  ? selectedClient?.name || 'Unknown Client'
                  : 'All Clients'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search clients..." />
            <CommandList>
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onClientChange(null);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !selectedClientId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Clients
                </CommandItem>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    onSelect={() => {
                      onClientChange(client.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate">{client.name}</span>
                    {client.status && (
                      <span className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-xs",
                        client.status === 'active' ? "bg-green-100 text-green-800" :
                        client.status === 'inactive' ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      )}>
                        {client.status}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ClientSelector;