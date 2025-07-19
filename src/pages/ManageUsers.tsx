import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AddUserForm } from '@/components/settings/AddUserForm';
import { ManageUsersTable } from '@/components/settings/ManageUsersTable';
import { UserData } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ManageUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.is_admin) {
      toast.error("You don't have permission to access this page");
      navigate('/settings');
    }
  }, [user, navigate]);

  const fetchUsers = async () => {
    if (!user?.is_admin) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data as UserData[]);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  if (!user || !user.is_admin) return null;

  return (
    <div className="space-y-8 pb-8 px-0"> 
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"> 
        <div className="space-y-2"> 
          <h1 className="text-3xl font-bold text-gradient">Manage Users</h1>
          <p className="text-zinc-400">View and manage all users in the system</p>
        </div>
        
        <Button 
          onClick={() => setAddUserDialogOpen(true)} 
          className="bg-purple hover:bg-purple/90 flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      <Card className="glass-morphism">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16"> 
              <div className="h-8 w-8 border-4 border-purple border-t-transparent animate-spin rounded-full" />
            </div>
          ) : users.length > 0 ? (
            <ManageUsersTable 
              users={users} 
              onRefresh={fetchUsers} 
              currentUser={user}
            />
          ) : (
            <div className="py-16 text-center"> 
              <p className="text-zinc-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddUserForm 
        open={addUserDialogOpen} 
        onOpenChange={setAddUserDialogOpen} 
        onUserAdded={fetchUsers}
      />
    </div>
  );
};

export default ManageUsers;
