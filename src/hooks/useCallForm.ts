import { useState, useEffect } from 'react';
import { useCalls } from '@/context/CallsContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CallFormData } from '@/types/call';
import { supabase } from '@/integrations/supabase/client';

export const useCallForm = () => {
  const { addCall, sendWebhook, sendDatabaseWebhook } = useCalls();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [date, setDate] = useState<Date | undefined>();
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isWebhookLoading, setIsWebhookLoading] = useState<boolean>(true);
  
  const [formData, setFormData] = useState<CallFormData>({
    name: '',
    phoneNumber: '',
    appointmentTime: '',
    message: '',
  });

  // Fetch global webhook URL when the component mounts
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      try {
        setIsWebhookLoading(true);
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'webhook_url')
          .single();
        
        if (error) {
          console.error('Error fetching webhook URL:', error);
          return;
        }
        
        if (data?.value) {
          setWebhookUrl(data.value);
        }
      } catch (err) {
        console.error('Error in fetch webhook:', err);
      } finally {
        setIsWebhookLoading(false);
      }
    };

    fetchWebhookUrl();
  }, []);

  const isValidWebhookUrl = (url?: string) => {
    if (!url || url === 'https://webhook.site/your-webhook-id') return false;
    
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
        // Send webhook if URL is provided and valid
        if (isValidWebhookUrl(webhookUrl)) {
          try {
            // Add type field to identify this as a manual call
            const webhookData = {
              ...callData,
              type: "manual" // Add type identifier for manual calls
            };
            await sendWebhook(webhookUrl, webhookData);
            toast.success('Call initiated successfully!');
          } catch (error) {
            console.error('Webhook error:', error);
            toast.error('Call was added but webhook failed to send');
          }
        } else {
          toast.success('Call added successfully!');
          toast.warning('No valid webhook URL configured');
        }
        
        // Reset form
        setFormData({
          name: '',
          phoneNumber: '',
          appointmentTime: '',
          message: '',
        });
        setDate(undefined);
      } else {
        toast.error('Failed to initiate call');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatabaseCall = async () => {
    setIsLoading(true);
    
    try {
      // Validate webhook URL
      if (!isValidWebhookUrl(webhookUrl)) {
        toast.error('Please configure a valid webhook URL in Settings');
        return;
      }
      
      await sendDatabaseWebhook(webhookUrl);
      toast.success('Database calls initiated successfully!');
    } catch (error) {
      console.error('Error sending database calls:', error);
      toast.error('Failed to send database calls. Check your webhook configuration.');
    } finally {
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
