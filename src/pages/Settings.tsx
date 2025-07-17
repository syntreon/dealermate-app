
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddUserForm } from '@/components/settings/AddUserForm';
import { WebhookConfig } from '@/components/settings/WebhookConfig';
import { UserProfileCard } from '@/components/settings/UserProfileCard';
import { SettingsOptions } from '@/components/settings/SettingsOptions';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const isValidWebhookUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const Settings = () => {
  const {
    user
  } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/your-webhook-id');
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch global webhook URL from app_settings table
  useEffect(() => {
    const fetchWebhookUrl = async () => {
      try {
        setIsLoading(true);
        const {
          data,
          error
        } = await supabase.from('app_settings').select('value').eq('id', 'webhook_url').single();
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
        setIsLoading(false);
      }
    };
    fetchWebhookUrl();
  }, []);
  
  const handleSaveWebhook = async (url: string) => {
    if (!isValidWebhookUrl(url)) {
      toast.error('Invalid webhook URL format');
      return;
    }
    setWebhookUrl(url);
    try {
      const {
        data,
        error
      } = await supabase.from('app_settings').update({
        value: url
      }).eq('id', 'webhook_url').single();
      if (error) throw error;
      toast.success('Webhook URL updated successfully');
    } catch (err) {
      console.error('Error updating webhook:', err);
      toast.error('Failed to update webhook URL');
    }
  };
  
  if (!user) return null;
  return <div className="space-y-6 pb-8 px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
        </div>
        
        {user.is_admin && <Button onClick={() => setAddUserDialogOpen(true)} className="bg-purple hover:bg-purple/90 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>}
      </div>

      <UserProfileCard user={user} />
      
      <SettingsOptions 
        onOpenWebhookDialog={() => setWebhookDialogOpen(true)} 
        onOpenAddUserDialog={() => setAddUserDialogOpen(true)}
        isAdmin={!!user.is_admin} 
      />

      <WebhookConfig open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen} initialUrl={webhookUrl} onSave={handleSaveWebhook} />

      <AddUserForm open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen} />
    </div>;
};
export default Settings;
