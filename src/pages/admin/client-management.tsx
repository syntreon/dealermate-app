import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ClientsTable from '@/components/admin/clients/ClientsTable';
import ClientForm from '@/components/admin/clients/ClientForm';
import ClientFilters from '@/components/admin/clients/ClientFilters';
import { AdminService } from '@/services/adminService';
import { Client, ClientFilters as ClientFiltersType, CreateClientData, UpdateClientData, SavedFilter } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';

const ClientManagement = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [filters, setFilters] = useState<ClientFiltersType>({
    sortBy: 'name',
    sortDirection: 'asc',
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          // Load saved filters for this user
          const userSavedFilters = await AdminService.getSavedFilters(user.id);
          setSavedFilters(userSavedFilters);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  // Load clients on mount and when filters change
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        const data = await AdminService.getClients(filters);
        setClients(data);
      } catch (error) {
        console.error('Failed to load clients:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [filters, toast]);

  const handleAddClient = () => {
    setSelectedClient(undefined);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await AdminService.deleteClientWithAudit(clientToDelete.id);
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      toast({
        title: 'Client Deleted',
        description: `${clientToDelete.name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleActivateClient = async (client: Client) => {
    try {
      const updatedClient = await AdminService.activateClientWithAudit(client.id);
      setClients(clients.map(c => c.id === client.id ? updatedClient : c));
      toast({
        title: 'Client Activated',
        description: `${client.name} has been activated successfully.`,
      });
    } catch (error) {
      console.error('Failed to activate client:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate client. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivateClient = async (client: Client) => {
    try {
      const updatedClient = await AdminService.deactivateClientWithAudit(client.id);
      setClients(clients.map(c => c.id === client.id ? updatedClient : c));
      toast({
        title: 'Client Deactivated',
        description: `${client.name} has been deactivated successfully.`,
      });
    } catch (error) {
      console.error('Failed to deactivate client:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate client. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: CreateClientData | UpdateClientData) => {
    setIsSubmitting(true);
    try {
      if (selectedClient) {
        // Update existing client
        const updatedClient = await AdminService.updateClientWithAudit(selectedClient.id, data);
        setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
        toast({
          title: 'Client Updated',
          description: `${updatedClient.name} has been updated successfully.`,
        });
      } else {
        // Create new client
        const newClient = await AdminService.createClientWithAudit(data as CreateClientData);
        setClients([...clients, newClient]);
        toast({
          title: 'Client Created',
          description: `${newClient.name} has been created successfully.`,
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to save client:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (newFilters: ClientFiltersType) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      sortBy: 'name',
      sortDirection: 'asc',
    });
  };

  const handleSaveFilter = async (name: string, filterData: ClientFiltersType) => {
    if (!currentUserId) return;
    
    try {
      const savedFilter = await AdminService.saveFilter(currentUserId, name, filterData);
      setSavedFilters([...savedFilters, savedFilter]);
      toast({
        title: 'Filter Saved',
        description: `Filter "${name}" has been saved successfully.`,
      });
    } catch (error) {
      console.error('Failed to save filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to save filter. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setFilters(filter.filters);
    toast({
      title: 'Filter Loaded',
      description: `Filter "${filter.name}" has been applied.`,
    });
  };

  const handleDeleteFilter = async (filterId: string) => {
    if (!currentUserId) return;
    
    try {
      await AdminService.deleteSavedFilter(currentUserId, filterId);
      setSavedFilters(savedFilters.filter(f => f.id !== filterId));
      toast({
        title: 'Filter Deleted',
        description: 'Filter has been deleted successfully.',
      });
    } catch (error) {
      console.error('Failed to delete filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete filter. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage all clients, their settings, and configurations
          </p>
        </div>
        <Button onClick={handleAddClient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <ClientFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        savedFilters={savedFilters}
        onSaveFilter={handleSaveFilter}
        onLoadFilter={handleLoadFilter}
        onDeleteFilter={handleDeleteFilter}
        isLoading={isLoading}
      />

      <ClientsTable
        clients={clients}
        isLoading={isLoading}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        onActivate={handleActivateClient}
        onDeactivate={handleDeactivateClient}
      />

      {/* Client Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <ClientForm
            client={selectedClient}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client{' '}
              <strong>{clientToDelete?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientManagement;