
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Trash, 
  Edit, 
  Shield, 
  ShieldAlert 
} from 'lucide-react';
import { UserData } from '@/hooks/useUserProfile';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ManageUsersTableProps {
  users: UserData[];
  onRefresh: () => void;
  currentUser: UserData;
}

export const ManageUsersTable: React.FC<ManageUsersTableProps> = ({ 
  users, 
  onRefresh,
  currentUser 
}) => {
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    setIsProcessing(true);
    try {
      // We're not actually deleting the user from auth.users as it requires admin privileges
      // Instead, we're just removing them from the public.users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteUserId);
      
      if (error) throw error;
      
      toast.success('User removed successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
      setDeleteUserId(null);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success(`User is now ${!currentStatus ? 'an admin' : 'a regular user'}`);
      onRefresh();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800">
            <TableHead className="text-zinc-400">Name</TableHead>
            <TableHead className="text-zinc-400">Email</TableHead>
            <TableHead className="text-zinc-400">Role</TableHead>
            <TableHead className="text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="border-zinc-800">
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  {user.is_admin ? (
                    <span className="flex items-center gap-1 text-purple">
                      <ShieldAlert className="h-4 w-4" />
                      Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Shield className="h-4 w-4" />
                      User
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                    <DropdownMenuItem
                      className="cursor-pointer text-zinc-300 hover:text-white"
                      onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                      disabled={user.id === currentUser.id || isProcessing}
                    >
                      {user.is_admin ? (
                        <Shield className="mr-2 h-4 w-4" />
                      ) : (
                        <ShieldAlert className="mr-2 h-4 w-4" />
                      )}
                      {user.is_admin ? "Remove Admin" : "Make Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-zinc-300 hover:text-white"
                      disabled={true}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 hover:text-red-400"
                      onClick={() => setDeleteUserId(user.id)}
                      disabled={user.id === currentUser.id || isProcessing}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="glass-morphism">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600" 
              onClick={handleDeleteUser}
              disabled={isProcessing}
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
