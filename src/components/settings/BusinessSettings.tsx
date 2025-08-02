import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InfoIcon, AlertTriangle, Building2, Mail, Phone, User, Edit, Save, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { hasClientAdminAccess } from '@/utils/clientDataIsolation';
import { AdminService } from '@/services/adminService';
import { AuditService } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface BusinessSettingsProps {
  clientId: string | null;
  isAdmin: boolean;
}

// Define Client type to match what AdminService returns
type Client = {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'trial' | 'churned';
  contact_person: string | null;
  contact_email: string | null;
  phone_number: string | null;
  billing_address: string | null;
  is_in_test_mode: boolean;
};

// Form validation schema
const businessFormSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  contact_person: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone_number: z.string().optional(),
  address: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

export const BusinessSettings: React.FC<BusinessSettingsProps> = ({ clientId, isAdmin }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTestModeUpdating, setIsTestModeUpdating] = React.useState(false);

  // Fetch client data using React Query v5 object syntax
  const { data: businessData, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required');
      return await AdminService.getClientById(clientId) as Client;
    },
    enabled: !!clientId
  });

  // Check if current user can edit business information
  const canEditBusiness = isAdmin || hasClientAdminAccess(user);

  // Initialize form with React Hook Form
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      contact_email: '',
      phone_number: '',
      address: '',
    },
  });

  // Update form when business data changes
  useEffect(() => {
    if (businessData) {
      // Reset form with the mapped business data
      // Use type-safe setValue calls to avoid TypeScript errors
      form.setValue('name', businessData.name || '');
      form.setValue('contact_person', businessData.contact_person || '');
      form.setValue('contact_email', businessData.contact_email || '');
      form.setValue('phone_number', businessData.phone_number || '');
      form.setValue('address', businessData.billing_address || '');
    }
  }, [businessData, form]);

  // Handle test mode toggle
  const handleTestModeToggle = async (checked: boolean) => {
    if (!businessData || !user || !canEditBusiness) return;
    
    setIsTestModeUpdating(true);
    
    // Optimistically update the cache first
    const queryKey = ['client', businessData.id];
    const previousData = queryClient.getQueryData<Client>(queryKey);
    
    // Apply optimistic update
    queryClient.setQueryData<Client>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        is_in_test_mode: checked
      };
    });
    
    try {
      // Update client with audit (this already logs the audit event internally)
      await AdminService.updateClientWithAudit(businessData.id, { is_in_test_mode: checked }, user.id);
      
      // Force refresh all client queries to ensure sync across components
      await queryClient.invalidateQueries({ 
        queryKey: ['client'], 
        exact: false // This will invalidate all queries starting with ['client']
      });
      
      toast({
        title: 'Success',
        description: `Test mode ${checked ? 'enabled' : 'disabled'} successfully.`,
      });
    } catch (err) {
      // Revert optimistic update on error
      if (previousData) {
        queryClient.setQueryData(queryKey, previousData);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to update test mode. Please try again.',
        variant: 'destructive',
      });
      console.error('Test mode toggle error:', err);
    } finally {
      setIsTestModeUpdating(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (values: BusinessFormValues) => {
    if (!businessData || !user) return;

    setIsSubmitting(true);
    try {
      // Prepare update data
      const updateData = {
        name: values.name,
        contact_person: values.contact_person || null,
        contact_email: values.contact_email || null,
        phone_number: values.phone_number || null,
        billing_address: values.address || null, // Map address to billing_address
        is_in_test_mode: businessData.is_in_test_mode
      };

      // Store old values for audit log
      const oldValues = {
        name: businessData.name,
        contact_person: businessData.contact_person,
        contact_email: businessData.contact_email,
        phone_number: businessData.phone_number,
        billing_address: businessData.billing_address,
      };

      // Update client with audit
      await AdminService.updateClientWithAudit(businessData.id, updateData, user.id);
      
      // Invalidate query to refresh data
      await queryClient.invalidateQueries({ queryKey: ['client', businessData.id] });

      // Log audit event
      try {
        await AuditService.logClientAction(
          user.id,
          'update',
          businessData.id,
          oldValues,
          updateData,
          undefined, // ipAddress
          navigator.userAgent
        );
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Business information updated successfully.',
      });
      
      setIsEditDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update business information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
        <div className="border-b border-border bg-muted/50 p-4">
          <Skeleton className="h-8 w-64 bg-muted" />
          <Skeleton className="h-4 w-48 bg-muted mt-2" />
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full bg-muted rounded-lg" />
              <Skeleton className="h-16 w-full bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
        <div className="border-b border-border bg-muted/50 p-4">
          <h2 className="text-lg font-medium text-card-foreground">Business Information</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-6 text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Failed to load business information. Please try again.</span>
          </div>
        </div>
      </div>
    );
  }

  // Render when no client is associated
  if (!clientId || !businessData) {
    return (
      <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
        <div className="border-b border-border bg-muted/50 p-4">
          <h2 className="text-lg font-medium text-card-foreground">Business Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Your business details</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center p-8 text-muted-foreground flex-col bg-muted/50 rounded-lg border border-border/50">
            <InfoIcon className="h-12 w-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-card-foreground">No Business Association</h3>
            <p className="text-center text-muted-foreground">
              You are not associated with any business organization.
              {isAdmin && " As an admin, you have access to all system features."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render business information
  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
      <div className="border-b border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-card-foreground">Business Information</h2>
            <p className="text-sm text-muted-foreground mt-1">Your business details</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`
                ${businessData.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                  businessData.status === 'trial' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                  businessData.status === 'churned' ? 'bg-muted text-muted-foreground border-muted-foreground/20' :
                  'bg-destructive/10 text-destructive border-destructive/20'}
              `}
            >
              {businessData.status.charAt(0).toUpperCase() + businessData.status.slice(1)}
            </Badge>
            
            {/* Edit button for client admins */}
            {canEditBusiness && (
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Business Information</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter business name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contact_person"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter contact person name" {...field} />
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
                              <Input type="email" placeholder="Enter contact email" {...field} />
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
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter business address" 
                                className="resize-none" 
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={isSubmitting} className="flex-1">
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditDialogOpen(false)}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Business information */}
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium text-lg text-card-foreground">{businessData.name}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-4">
              {businessData.billing_address && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Address</p>
                    <p className="font-medium text-card-foreground">{businessData.billing_address}</p>
                  </div>
                </div>
              )}
              
              {businessData.contact_person && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Main Contact</p>
                    <p className="font-medium text-card-foreground">{businessData.contact_person}</p>
                  </div>
                </div>
              )}
              
              {businessData.phone_number && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Phone</p>
                    <p className="font-medium text-card-foreground">{businessData.phone_number}</p>
                  </div>
                </div>
              )}
              
              {businessData.contact_email && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Email</p>
                    <p className="font-medium text-card-foreground">{businessData.contact_email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Mode Toggle */}
        {businessData && (
  <div className="space-y-4">
    <div className="bg-muted/50 p-4 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-md">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-lg text-card-foreground">Test Mode</h3>
            <p className="text-sm text-muted-foreground">Enable or disable test mode for this client</p>
          </div>
        </div>
        <Switch
          checked={businessData.is_in_test_mode ?? false}
          onCheckedChange={canEditBusiness ? handleTestModeToggle : undefined}
          disabled={!canEditBusiness || isTestModeUpdating}
        />
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          When test mode is enabled, calls for this client will be marked as test calls. 
          This is useful for development and testing purposes.
        </p>
        {!canEditBusiness && (
          <span className="text-xs text-muted-foreground italic block mt-2">
            Only admins or client admins can change test mode.
          </span>
        )}
      </div>
    </div>
  </div>
)}

        {/* Admin message for users without edit permissions */}
        {!canEditBusiness && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-primary mb-1">Edit Access Required</p>
                <p className="text-muted-foreground">
                  To modify business information, please contact your client administrator or system administrator. 
                  Only users with admin or client admin privileges can change business-level settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
