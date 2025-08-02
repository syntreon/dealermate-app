import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Client, CreateClientData, UpdateClientData } from '@/types/admin';
import { AdminService } from '@/services/adminService';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle } from 'lucide-react';

// Define form validation schema
const clientFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(1, 'Type is required'),
  subscription_plan: z.enum(['Free Trial', 'Basic', 'Pro', 'Custom'], {
    required_error: 'Subscription plan is required',
  }),
  contact_person: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone_number: z.string().optional(),
  billing_address: z.string().optional(),
  monthly_billing_amount_cad: z.coerce.number().min(0, 'Amount must be positive'),
  finders_fee_cad: z.coerce.number().min(0, 'Amount must be positive'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  status: z.enum(['active', 'inactive', 'trial', 'churned', 'pending']).optional(),
  is_in_test_mode: z.boolean().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientData | UpdateClientData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const queryClient = useQueryClient();
  // If editing, fetch latest client data
  const { data: clientData, isLoading } = useQuery<Client | undefined>({
  queryKey: ['client', client?.id],
  queryFn: () => client?.id ? AdminService.getClientById(client.id) : Promise.resolve(undefined),
  enabled: !!client?.id,
});
  const isEditing = !!client;
  
  // Initialize form with default values or existing client data
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: clientData?.name || client?.name || '',
      type: clientData?.type || client?.type || '',
      subscription_plan: clientData?.subscription_plan || client?.subscription_plan || 'Free Trial',
      contact_person: clientData?.contact_person || client?.contact_person || '',
      contact_email: clientData?.contact_email || client?.contact_email || '',
      phone_number: clientData?.phone_number || client?.phone_number || '',
      billing_address: clientData?.billing_address || client?.billing_address || '',
      monthly_billing_amount_cad: clientData?.monthly_billing_amount_cad || client?.monthly_billing_amount_cad || 0,
      finders_fee_cad: clientData?.finders_fee_cad || client?.finders_fee_cad || 0,
      slug: clientData?.slug || client?.slug || '',
      status: clientData?.status || client?.status,
      is_in_test_mode: clientData?.is_in_test_mode ?? client?.is_in_test_mode ?? false,
    },
  });

  const watchedName = form.watch('name');
  const isSlugManuallyEdited = form.formState.dirtyFields.slug;

  useEffect(() => {
    if (watchedName && !isSlugManuallyEdited) {
      const slug = watchedName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
      form.setValue('slug', slug, { shouldValidate: true });
    }
  }, [watchedName, isSlugManuallyEdited, form]);

  const handleSubmit = async (values: ClientFormValues) => {
    await onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Client' : 'Add New Client'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                          <SelectItem value="SMB">SMB</SelectItem>
                          <SelectItem value="Startup">Startup</SelectItem>
                          <SelectItem value="Agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subscription_plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subscription plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Free Trial">Free Trial</SelectItem>
                          <SelectItem value="Basic">Basic</SelectItem>
                          <SelectItem value="Pro">Pro</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="client-slug" {...field} />
                      </FormControl>
                      <FormDescription>
                        Used for URL identification. Use lowercase letters, numbers, and hyphens only.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isEditing && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="churned">Churned</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                
                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="555-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="billing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter billing address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Billing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Billing Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="monthly_billing_amount_cad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Billing Amount (CAD)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="finders_fee_cad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finder's Fee (CAD)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-2">
                    <FormLabel>Average Monthly AI Cost (USD)</FormLabel>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      ${client?.average_monthly_ai_cost_usd?.toFixed(2) || '0.00'} (Calculated)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Average Monthly Misc Cost (USD)</FormLabel>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      ${client?.average_monthly_misc_cost_usd?.toFixed(2) || '0.00'} (Calculated)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel>Partner Split Percentage</FormLabel>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {client?.partner_split_percentage || 0}% (Backend Managed)
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Test Mode Toggle */}
            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-card-foreground">Test Mode</h3>
                      <p className="text-sm text-muted-foreground">Enable or disable test mode for this client</p>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_in_test_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    When test mode is enabled, calls for this client will be marked as test calls. 
                    This is useful for development and testing purposes.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Client' : 'Create Client'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ClientForm;