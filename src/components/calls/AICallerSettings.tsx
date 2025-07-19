
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

/**
 * AICallerSettings component for configuring AI caller preferences
 * Responsive layout for mobile and desktop
 */
const AICallerSettings: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('aiCallerEnabled');
    if (savedState !== null) {
      setIsEnabled(savedState === 'true');
    }
  }, []);

  const handleToggleChange = async (checked: boolean) => {
    setIsLoading(true);
    
    try {
      // Update local state for responsive UI
      setIsEnabled(checked);
      
      // Save to localStorage
      localStorage.setItem('aiCallerEnabled', checked.toString());
      
      // Show success message
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
    <Card className="mt-4">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted p-2 rounded-full">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle>Call Settings</CardTitle>
            <CardDescription>
              Configure your AI caller preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-background p-3 rounded-full">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">AI Caller</h4>
              <p className="text-xs text-muted-foreground">
                {isEnabled ? 'Automated calls are enabled' : 'Automated calls are disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="ai-caller" 
              checked={isEnabled}
              onCheckedChange={handleToggleChange}
              disabled={isLoading}
            />
            <Label htmlFor="ai-caller" className="sr-only">AI Caller</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AICallerSettings;
