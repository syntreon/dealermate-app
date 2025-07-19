import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/hooks/useAuthSession';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Define validation schema using zod
const userSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal(''))
});

type UserSettingsFormValues = z.infer<typeof userSettingsSchema>;
interface UserSettingsFormProps {
  user: UserData;
  onUserUpdate: (updatedUser: UserData) => void;
}

export const UserSettingsForm: React.FC<UserSettingsFormProps> = ({ user, onUserUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof userSettingsSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update({
          name: values.name,
          phone: values.phone || null,
        })
        .eq('id', user.id);
      
      if (error) {
        toast.error("Failed to update profile");
        console.error("Error updating profile:", error);
        return;
      }
      
      // Update local user state
      const updatedUser = {
        ...user,
        name: values.name,
        phone: values.phone || null,
      };
      
      onUserUpdate(updatedUser);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error("Error in profile update:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-morphism rounded-lg overflow-hidden">
      <div className="border-b border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-lg font-medium text-gradient-primary">Personal Information</h2>
        <p className="text-sm text-zinc-400 mt-1">Update your personal details and contact information</p>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* User avatar section */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-purple/20 flex items-center justify-center text-purple border border-purple/30">
                <span className="text-xl font-medium">{user.name?.charAt(0) || user.email?.charAt(0) || '?'}</span>
              </div>
              <div>
                <h3 className="font-medium">{user.name || 'User'}</h3>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="bg-zinc-900/50 border-zinc-700 focus:border-purple/50 focus:ring-purple/10" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        {...field} 
                        className="bg-zinc-900/50 border-zinc-700 focus:border-purple/50 focus:ring-purple/10" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-2">
              <FormItem>
                <FormLabel className="text-zinc-300">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    value={user.email} 
                    disabled 
                    className="bg-zinc-900/30 border-zinc-800 text-zinc-400 cursor-not-allowed" 
                  />
                </FormControl>
                <FormDescription className="text-zinc-500">
                  Email cannot be changed. Contact support for assistance.
                </FormDescription>
              </FormItem>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                disabled={isSubmitting}
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-gradient-to-r from-purple to-indigo-600 hover:from-purple/90 hover:to-indigo-600/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes
                  </>
                ) : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
