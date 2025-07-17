
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { useCalls } from '@/context/CallsContext';

const AICallerSettings: React.FC<{ webhookUrl?: string }> = ({ webhookUrl }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { sendWebhook } = useCalls();

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('aiCallerEnabled');
    if (savedState !== null) {
      setIsEnabled(savedState === 'true');
    }
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

  const handleToggleChange = async (checked: boolean) => {
    // Don't proceed if no valid webhook URL
    if (!isValidWebhookUrl(webhookUrl)) {
      toast.error('Please configure a valid webhook URL in Settings first');
      return;
    }

    setIsLoading(true);
    
    try {
      // Update local state first for responsive UI
      setIsEnabled(checked);
      
      // Save to localStorage
      localStorage.setItem('aiCallerEnabled', checked.toString());
      
      // Send webhook notification
      await sendWebhook(webhookUrl!, {
        setting: 'aiCaller',
        enabled: checked,
        timestamp: new Date().toISOString()
      });
      
      toast.success(`AI Caller ${checked ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error toggling AI Caller:', error);
      // Revert state on error
      setIsEnabled(!checked);
      localStorage.setItem('aiCallerEnabled', (!checked).toString());
      toast.error('Failed to update AI Caller setting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-morphism mt-4">
      <CardHeader>
        <CardTitle>Call Settings</CardTitle>
        <CardDescription>
          Configure your AI caller preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-4">
            <div className="bg-zinc-900/70 p-3 rounded-full">
              <Mic className="h-5 w-5 text-purple" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">AI Caller</h4>
              <p className="text-xs text-zinc-400">
                {isEnabled ? 'Automated calls are enabled' : 'Automated calls are disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="ai-caller" 
              checked={isEnabled}
              onCheckedChange={handleToggleChange}
              disabled={isLoading || !isValidWebhookUrl(webhookUrl)}
              className="data-[state=checked]:bg-purple"
            />
            <Label htmlFor="ai-caller" className="sr-only">AI Caller</Label>
          </div>
        </div>
        
        {!isValidWebhookUrl(webhookUrl) && (
          <p className="text-xs text-red-400 mt-4 px-2">
            No valid webhook configured. Please set one in Settings.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AICallerSettings;
