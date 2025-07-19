import { useState } from 'react';
import { useCalls } from '@/context/CallsContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CallFormData } from '@/types/call';

/**
 * Hook for managing call form state and operations
 */
export const useCallForm = () => {
  const { addCall, sendWebhook, sendDatabaseWebhook } = useCalls();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>();
  const [isWebhookLoading, setIsWebhookLoading] = useState<boolean>(false);
  
  // Default webhook URL for demo purposes
  const webhookUrl = 'https://webhook.site/demo-webhook';
  
  const [formData, setFormData] = useState<CallFormData>({
    name: '',
    phoneNumber: '',
    appointmentTime: '',
    message: '',
  });

  const isValidWebhookUrl = (url?: string) => {
    if (!url || url === 'https://webhook.site/your-webhook-id' || url === 'https://webhook.site/demo-webhook') return false;
    
    try {
      new URL(url); // Will throw if URL is invalid
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Please select an appointment date');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const callData = {
        ...formData,
        appointmentDate: format(date, 'yyyy-MM-dd'),
      };
      
      // Add call to context state
      const success = await addCall(callData);
      
      if (success) {
        // Note: Webhook functionality is disabled
        toast.success('Call added successfully!');
        
        // Reset form
        setFormData({
          name: '',
          phoneNumber: '',
          appointmentTime: '',
          message: '',
        });
        setDate(undefined);
      } else {
        toast.error('Failed to add call');
      }
    } catch (error) {
      console.error('Error submitting call:', error);
      toast.error('An error occurred while submitting the call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseCall = async () => {
    setIsLoading(true);
    
    try {
      // Note: Webhook functionality is disabled
      // Simulate success without actually sending webhook
      setTimeout(() => {
        toast.success('Database calls initiated successfully!');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending database calls:', error);
      toast.error('Failed to send database calls');
      setIsLoading(false);
    }
  };

  return {
    formData,
    date,
    isLoading,
    isWebhookLoading,
    setDate,
    handleInputChange,
    handleManualSubmit,
    handleDatabaseCall,
    webhookUrl
  };
};
