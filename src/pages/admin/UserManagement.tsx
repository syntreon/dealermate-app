import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import UsersTable from '@/components/admin/users/UsersTable';
import UserForm from '@/components/admin/users/UserForm';
import UserFilters from '@/components/admin/users/UserFilters';
import { AdminService } from '@/services/adminService';
import { User, Client, UserFilters as UserFiltersType, CreateUserData, UpdateUserData } from '@/types/admin';

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [filters, setFilters] = useState<UserFiltersType>({
    sortBy: 'full_name',
    sortDirection: 'asc',
  });

  // Load users and clients on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [usersData, clientsData] = await Promise.all([
          AdminService.getUsers(filters),
          AdminService.getClients()
        ]);
        setUsers(usersData);
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [filters, toast]);

  const handleAddUser = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await AdminService.deleteUserWithAudit(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      toast({
        title: 'User Deleted',
        description: `${userToDelete.full_name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = async (data: CreateUserData | UpdateUserData) => {
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        // Update existing user
        const updatedUser = await AdminService.updateUserWithAudit(selectedUser.id, data);
        setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
        toast({
          title: 'User Updated',
          description: `${updatedUser.full_name} has been updated successfully.`,
        });
      } else {
        // Create new user
        const newUser = await AdminService.createUserWithAudit(data as CreateUserData);
        setUsers([...users, newUser]);
        toast({
          title: 'User Created',
          description: `${newUser.full_name} has been created successfully.`,
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilterChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      sortBy: 'full_name',
      sortDirection: 'asc',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users across all clients and assign roles
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <UserFilters
        filters={filters}
        clients={clients}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />

      <UsersTable
        users={users}
        clients={clients}
        isLoading={isLoading}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <UserForm
            user={selectedUser}
            clients={clients}
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
              This will permanently delete the user{' '}
              <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
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

export default UserManagement;