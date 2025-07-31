import React, { useState } from 'react';
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
import { Client } from '@/types';

interface ClientSelectorProps {
  onClientChange: (clientId: string | null) => void;
  selectedClientId: string | null;
  clients: Client[];
  loading: boolean;
  error: Error | null;
  className?: string;
}

/**
 * ClientSelector component for selecting a client from a dropdown
 * This is a presentational component that receives clients and state as props
 */
const ClientSelector: React.FC<ClientSelectorProps> = ({
  onClientChange,
  selectedClientId,
  clients,
  loading,
  error,
  className,
}) => {
  const [open, setOpen] = useState(false);

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
                        client.status === 'trial' ? "bg-blue-100 text-blue-800" :
                        client.status === 'churned' ? "bg-gray-100 text-gray-800" :
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