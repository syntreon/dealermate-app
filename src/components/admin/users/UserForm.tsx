import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getClientIdFilter } from '@/utils/clientDataIsolation';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Client, CreateUserData, UpdateUserData } from '@/types/admin';

// Define form validation schema
const userFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'client_admin', 'client_user', 'user']),
  client_id: z.string().nullable().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  clients: Client[];
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  hasSystemAccess?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  clients,
  onSubmit,
  onCancel,
  hasSystemAccess = true,
  isSubmitting,
}) => {
  const { user: currentUser } = useAuth();
  const isEditing = !!user;
  const currentUserClientId = getClientIdFilter(currentUser);

  const refinedSchema = userFormSchema.refine(
    (data) => {
      // Password is required for new users
      if (!isEditing && !data.password) return false;
      return true;
    },
    {
      message: 'Password is required',
      path: ['password'],
    }
  ).refine(
    (data) => {
      // If password is provided, it must be at least 6 characters
      if (data.password && data.password.length < 6) return false;
      return true;
    },
    {
      message: 'Password must be at least 6 characters',
      path: ['password'],
    }
  ).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

  // Initialize form with default values or existing user data
  const form = useForm<UserFormValues>({
    resolver: zodResolver(refinedSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      role: user?.role || 'client_user',
      // For client_admin users, auto-set to their client_id
      client_id: user?.client_id || (hasSystemAccess ? null : currentUserClientId),
    },
  });

  const watchRole = form.watch('role');
  const isGlobalRole = watchRole === 'owner' || watchRole === 'admin' || watchRole === 'user';
  
  // For client_admin users, client selection should be disabled and set to their client
  const shouldDisableClientSelection = !hasSystemAccess || isGlobalRole;

  // Reset client_id when switching to a global role
  useEffect(() => {
    if (isGlobalRole) {
      form.setValue('client_id', null);
    }
  }, [isGlobalRole, form]);

  const handleSubmit = async (values: UserFormValues) => {
    const { confirmPassword, ...submissionData } = values;
    if (!isEditing) {
      await onSubmit(submissionData as CreateUserData);
    } else {
      // For updates, don't send an empty password
      if (!submissionData.password) {
        delete submissionData.password;
      }
      await onSubmit({ ...submissionData, id: user.id } as UpdateUserData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit User' : 'Add New User'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be used for login and notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hasSystemAccess && (
                          <>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </>
                        )}
                        <SelectItem value="client_admin">Client Admin</SelectItem>
                        <SelectItem value="client_user">Client User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isGlobalRole 
                        ? 'This role has access to all clients' 
                        : 'This role is limited to a specific client'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                      disabled={shouldDisableClientSelection}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hasSystemAccess ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))
                        ) : (
                          // For client_admin users, only show their client
                          clients
                            .filter(client => client.id === currentUserClientId)
                            .map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isGlobalRole 
                        ? 'Global roles have access to all clients' 
                        : hasSystemAccess 
                          ? 'Select which client this user belongs to'
                          : 'Users will be assigned to your client'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormDescription>
                      {isEditing ? 'Leave blank to keep current password' : 'Set an initial password for the user'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UserForm;