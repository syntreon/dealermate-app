import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { UserData } from '@/hooks/useAuthSession';

interface PreferencesProps {
  user: UserData & {
    preferences?: {
      displaySettings?: {
        theme?: 'light' | 'dark' | 'system';
        dashboardLayout?: 'compact' | 'detailed';
      };
      language?: string;
      timezone?: string;
    };
  };
  onUserUpdate: (updatedUser: any) => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ user, onUserUpdate }) => {
  // Get current theme from user preferences or default to system
  const currentTheme = user.preferences?.displaySettings?.theme || 'system';
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>(currentTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Use next-themes hook for theme management
  const { setTheme: setNextTheme, theme: activeTheme } = useTheme();
  
  // Sync local state with next-themes on mount
  useEffect(() => {
    if (activeTheme && activeTheme !== localTheme) {
      setLocalTheme(activeTheme as 'light' | 'dark' | 'system');
    }
  }, [activeTheme]);

  // Handle theme change using theme service - instant update
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setLocalTheme(newTheme);
    setIsLoading(true);

    try {
      const { themeService } = await import('@/services/themeService');
      // Instant theme update - no await needed
      themeService.updateTheme(
        user.id,
        newTheme,
        'settings',
        user,
        onUserUpdate,
        setNextTheme
      );

      setLastSyncTime(new Date());
      toast.success('Theme updated');
    } catch (error) {
      console.error('Error updating theme preferences:', error);
      toast.error('Failed to update theme');
      
      // Revert to previous theme
      setLocalTheme(currentTheme);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-lg overflow-hidden shadow-sm">
      <CardContent className="space-y-6 pt-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Display Preferences</h3>
            {lastSyncTime && (
              <span className="text-xs text-muted-foreground">
                Last synced: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="theme">Theme</Label>
                {isLoading && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    Syncing...
                  </div>
                )}
              </div>
              <RadioGroup 
                id="theme" 
                value={localTheme} 
                onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className={`flex items-center space-x-2 rounded-md border p-4 ${localTheme === 'light' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="light" id="light" disabled={isLoading} />
                  <Label htmlFor="light" className="flex items-center cursor-pointer">
                    <Sun className="h-4 w-4 mr-2 text-yellow-500" />
                    <span>Light</span>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-2 rounded-md border p-4 ${localTheme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="dark" id="dark" disabled={isLoading} />
                  <Label htmlFor="dark" className="flex items-center cursor-pointer">
                    <Moon className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Dark</span>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-2 rounded-md border p-4 ${localTheme === 'system' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="system" id="system" disabled={isLoading} />
                  <Label htmlFor="system" className="flex items-center cursor-pointer">
                    <Monitor className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>System</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Language preference could be added here */}
            
            {/* Timezone preference could be added here */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
