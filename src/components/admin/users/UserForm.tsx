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

// --- User Form Validation Schema ---
// - client_id is required for client_user and client_admin roles
// - client_id must be null/blank for owner, admin, user roles
const userFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'client_admin', 'client_user', 'user']),
  client_id: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  const needsClient = data.role === 'client_user' || data.role === 'client_admin';
  if (needsClient && (!data.client_id || data.client_id === '')) {
    ctx.addIssue({
      path: ['client_id'],
      code: z.ZodIssueCode.custom,
      message: 'Client is required for this role',
    });
  }
  if (!needsClient && data.client_id) {
    ctx.addIssue({
      path: ['client_id'],
      code: z.ZodIssueCode.custom,
      message: 'Client must be blank for this role',
    });
  }
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

  // No password validation needed since we use invitation flow

  // --- Form Initialization (Add & Edit) ---
  // The same validation rules apply for both add and edit user flows.
  // - For editing, default values are set from the current user record.
  // - For adding, defaults are blank or current admin's client.
  // - Role/client cross-field validation is enforced by the schema.
  // - Switching roles (even in edit mode) will reset client_id as needed.
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
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
    if (!isEditing) {
      await onSubmit(values as CreateUserData);
    } else {
      await onSubmit({ ...values, id: user.id } as UpdateUserData);
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

            {/* Password setup is handled via invitation email */}
            {!isEditing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Password Setup</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      The user will receive an invitation email with a link to set up their password securely.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
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