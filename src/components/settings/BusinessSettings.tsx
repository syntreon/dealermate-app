import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { hasClientAdminAccess } from '@/utils/clientDataIsolation';
import { AuditService } from '@/services/auditService';
import { useToast } from '@/hooks/use-toast';

interface BusinessSettingsProps {
  clientId: string | null;
  isAdmin: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'trial' | 'churned';
  contact_person: string | null;
  contact_email: string | null;
  phone_number: string | null;
  address: string | null;
}

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
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user can edit business information
  const canEditBusiness = isAdmin || hasClientAdminAccess(user);

  // Initialize form
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

  // Fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, status, contact_person, contact_email, phone_number, address')
          .eq('id', clientId)
          .single();
        
        if (error) {
          throw error;
        }
        
        // Safely cast data to BusinessData after error check
        const businessInfo = data as unknown as BusinessData;
        setBusinessData(businessInfo);
        
        // Update form with fetched data
        form.reset({
          name: businessInfo.name || '',
          contact_person: businessInfo.contact_person || '',
          contact_email: businessInfo.contact_email || '',
          phone_number: businessInfo.phone_number || '',
          address: businessInfo.address || '',
        });
      } catch (err) {
        console.error('Error fetching business data:', err);
        setError('Failed to load business information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessData();
  }, [clientId, form]);

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
        address: values.address || null,
      };

      // Store old values for audit log
      const oldValues = {
        name: businessData.name,
        contact_person: businessData.contact_person,
        contact_email: businessData.contact_email,
        phone_number: businessData.phone_number,
        address: businessData.address,
      };

      // Update business information
      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', businessData.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      const updatedBusinessData = data as unknown as BusinessData;
      setBusinessData(updatedBusinessData);

      // Log audit event
      try {
        await AuditService.logClientAction(
          user.id,
          'update',
          businessData.id,
          oldValues,
          updateData,
          undefined, // IP address - could be obtained from request
          navigator.userAgent
        );
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
        // Don't fail the main operation if audit logging fails
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Business information updated successfully.',
      });

      // Close dialog
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating business data:', err);
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
            <span>{error}</span>
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
              {businessData.address && (
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-md">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Address</p>
                    <p className="font-medium text-card-foreground">{businessData.address}</p>
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
