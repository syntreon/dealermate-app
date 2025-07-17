import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface WebhookConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl: string;
  onSave: (url: string) => void;
}

const isValidWebhookUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const WebhookConfig: React.FC<WebhookConfigProps> = ({ 
  open, 
  onOpenChange, 
  initialUrl, 
  onSave 
}) => {
  const [webhookUrl, setWebhookUrl] = useState(initialUrl);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user?.is_admin) {
      toast.error('Only admins can update the webhook URL');
      return;
    }

    if (!webhookUrl.trim()) {
      toast.error('Webhook URL cannot be empty');
      return;
    }

    if (!isValidWebhookUrl(webhookUrl)) {
      toast.error('Invalid webhook URL format');
      return;
    }

    setIsSaving(true);
    
    try {
      // Update the webhook URL in the app_settings table
      // We're omitting the updated_by field since it's causing issues
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'webhook_url');
      
      if (error) {
        console.error('Error saving webhook URL:', error);
        toast.error('Failed to save webhook URL');
        return;
      }
      
      // Call the onSave callback
      onSave(webhookUrl);
      
      toast.success('Webhook URL saved successfully');
      onOpenChange(false);
    } catch (err) {
      console.error('Error in webhook save:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-morphism">
        <DialogHeader>
          <DialogTitle>Webhook Configuration</DialogTitle>
          <DialogDescription>
            Enter the webhook URL to send call data
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full items-center gap-4 pt-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input 
              id="webhookUrl" 
              name="webhookUrl" 
              value={webhookUrl} 
              onChange={e => setWebhookUrl(e.target.value)} 
              placeholder="https://webhook.site/your-webhook-id" 
              className="bg-zinc-900 border-zinc-800 focus:border-purple" 
            />
          </div>
          <Button 
            onClick={handleSave} 
            className="w-full bg-purple hover:bg-purple-dark text-white mt-4"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Webhook URL'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
