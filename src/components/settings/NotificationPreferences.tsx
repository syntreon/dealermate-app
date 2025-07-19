import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/hooks/useAuthSession';
import { Plus, X } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define a more specific type that ensures preferences exist
type UserWithPreferences = UserData & {
  preferences: {
    notifications: {
      email: boolean;
      leadAlerts: boolean;
      systemAlerts: boolean;
      notificationEmails: string[];
    };
    displaySettings: {
      theme: 'light' | 'dark' | 'system';
      dashboardLayout: 'compact' | 'detailed';
    };
  };
};

interface NotificationPreferencesProps {
  user: UserData;
  onUserUpdate: (updatedUser: UserWithPreferences) => void;
}

// Define form schema with zod
const formSchema = z.object({
  email: z.boolean(),
  leadAlerts: z.boolean(),
  systemAlerts: z.boolean(),
  notificationEmails: z.array(z.object({ value: z.string().email('Invalid email address') }))
});

// Default preferences structure
const defaultPreferences = {
  notifications: {
    email: true,
    leadAlerts: true,
    systemAlerts: true,
    notificationEmails: [] as string[]
  },
  displaySettings: {
    theme: 'light' as 'light' | 'dark' | 'system',
    dashboardLayout: 'detailed' as 'compact' | 'detailed'
  }
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ user, onUserUpdate }) => {
  // Initialize preferences from user data or use defaults
  const [preferences, setPreferences] = useState(() => {
    // Check if user has preferences property, otherwise use defaults
    // This handles the TypeScript error by properly checking for the property
    const userPrefs = (user && 'preferences' in user && user.preferences) || {};
    return {
      notifications: {
        ...defaultPreferences.notifications,
        ...(userPrefs as any).notifications,
      },
      displaySettings: {
        ...defaultPreferences.displaySettings,
        ...(userPrefs as any).displaySettings,
      },
    };
  });
  
  // Setup react-hook-form with zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: preferences.notifications.email,
      leadAlerts: preferences.notifications.leadAlerts,
      systemAlerts: preferences.notifications.systemAlerts,
      notificationEmails: preferences.notifications.notificationEmails.map(email => ({ value: email }))
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "notificationEmails"
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Add a useEffect to reset the form if the user prop changes
  React.useEffect(() => {
    const userPrefs = (user && 'preferences' in user && user.preferences) || {};
    const newPreferences = {
      notifications: {
        ...defaultPreferences.notifications,
        ...(userPrefs as any).notifications,
      },
      displaySettings: {
        ...defaultPreferences.displaySettings,
        ...(userPrefs as any).displaySettings,
      },
    };

    form.reset({
      email: newPreferences.notifications.email,
      leadAlerts: newPreferences.notifications.leadAlerts,
      systemAlerts: newPreferences.notifications.systemAlerts,
      notificationEmails: newPreferences.notifications.notificationEmails.map(email => ({ value: email }))
    });
  }, [user, form.reset]);

  // This function is no longer needed as we're using react-hook-form
  // Keeping it commented for reference
  /*
  const handleToggleChange = (key: 'email' | 'leadAlerts' | 'systemAlerts') => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };
  */

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // This function is no longer needed as we're handling email addition directly in the UI
  // Keeping it commented for reference
  /*
  const handleAddEmail = () => {
    if (!newEmail) {
      setEmailError('Email cannot be empty');
      return;
    }
    
    if (!validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Check if email already exists
    if (preferences.notifications.notificationEmails.includes(newEmail)) {
      setEmailError('This email is already added');
      return;
    }
    
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        notificationEmails: [...prev.notifications.notificationEmails, newEmail]
      }
    }));
    
    setNewEmail('');
    setEmailError('');
  };
  */



  // We're now using the form's onSubmit handler instead of this separate function

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Update preferences with form values
      const updatedPreferences = {
        ...preferences,
        notifications: {
          ...preferences.notifications,
          email: values.email,
          leadAlerts: values.leadAlerts,
          systemAlerts: values.systemAlerts,
          notificationEmails: values.notificationEmails.map(email => email.value)
        }
      };
      
      // Update user in database
      // Use a type assertion to avoid TypeScript errors with the preferences property
      const updateData = { preferences: updatedPreferences } as any;
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setPreferences(updatedPreferences);
      
      // Create properly typed updated user object
      const updatedUser: UserWithPreferences = {
        ...user,
        preferences: updatedPreferences
      } as UserWithPreferences;
      
      // Pass the updated user to the parent component
      onUserUpdate(updatedUser);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
      <div className="border-b border-border bg-muted/50 p-4">
        <h2 className="text-lg font-medium text-card-foreground">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure how and when you receive notifications</p>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Notifications Toggle */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-card-foreground">Email Notifications</FormLabel>
                    <FormDescription className="text-muted-foreground">
                      Receive email notifications for important updates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          
            {/* Lead Alerts Toggle */}
            <FormField
              control={form.control}
              name="leadAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-card-foreground">Lead Alerts</FormLabel>
                    <FormDescription className="text-muted-foreground">
                      Get notified when new leads are created
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          
            {/* System Alerts Toggle */}
            <FormField
              control={form.control}
              name="systemAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/50">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-card-foreground">System Alerts</FormLabel>
                    <FormDescription className="text-muted-foreground">
                      Receive notifications about system updates and maintenance
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          
            {/* Notification Recipients */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-base font-medium mb-2 text-card-foreground">Notification Recipients</h3>
              <p className="text-sm text-muted-foreground mb-4">Add email addresses that should receive notifications</p>
              
              <div className="space-y-3">
                {/* List of current notification emails */}
                <div className="space-y-2 mb-4">
                  {fields.map((field, index) => (
                     <FormField
                      control={form.control}
                      key={field.id}
                      name={`notificationEmails.${index}.value`}
                      render={({ field: itemField }) => (
                        <FormItem className="flex items-center justify-between bg-muted/50 p-3 rounded-md border border-border">
                          <FormControl>
                            <Input {...itemField} className="border-none bg-transparent focus-visible:ring-0 text-sm text-card-foreground" readOnly />
                          </FormControl>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            type="button"
                          >
                            <X size={16} />
                          </Button>
                        </FormItem>
                      )}
                    />
                  ))}
                  {fields.length === 0 && (
                     <div className="text-center py-4 text-muted-foreground italic text-sm bg-muted/50 rounded-md border border-border">
                        No notification recipients added yet
                      </div>
                  )}
                </div>
              
              {/* Add new email form */}
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={`bg-background border-input focus:border-primary/50 focus:ring-primary/10 ${emailError ? 'border-destructive' : ''}`}
                  />
                  {emailError && <p className="text-destructive text-xs mt-1">{emailError}</p>}
                </div>
                <Button 
                  type="button"
                  onClick={() => {
                    const emailValidation = z.string().email().safeParse(newEmail);
                    if (!emailValidation.success) {
                      setEmailError('Please enter a valid email address');
                      return;
                    }

                    if (fields.some(field => field.value === newEmail)) {
                      setEmailError('This email is already in the list');
                      return;
                    }

                    append({ value: newEmail });
                    setNewEmail('');
                    setEmailError('');
                  }}
                  variant="outline"
                  className="bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-800 text-gray-700"
                >
                  <Plus size={16} className="mr-1" /> Add
                </Button>
              </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
