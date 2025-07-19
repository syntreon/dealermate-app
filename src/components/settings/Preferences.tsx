import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Use next-themes hook for theme management
  const { setTheme: setNextTheme, theme: activeTheme } = useTheme();
  
  // Sync local state with next-themes on mount
  useEffect(() => {
    if (activeTheme && activeTheme !== localTheme) {
      setLocalTheme(activeTheme as 'light' | 'dark' | 'system');
    }
  }, [activeTheme]);

  // Handle theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setLocalTheme(newTheme);
    setIsLoading(true);

    try {
      // Prepare updated preferences
      const updatedPreferences = {
        ...user.preferences,
        displaySettings: {
          ...(user.preferences?.displaySettings || {}),
          theme: newTheme
        }
      };

      // Update preferences in database
      const { error } = await supabase
        .from('users')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id);

      if (error) throw error;

      // Update user context
      const updatedUser = {
        ...user,
        preferences: updatedPreferences
      } as typeof user;
      onUserUpdate(updatedUser);

      // Use next-themes to set theme - this will handle the data-theme attribute
      setNextTheme(newTheme);

      toast.success('Theme preferences updated');
    } catch (error) {
      console.error('Error updating theme preferences:', error);
      toast.error('Failed to update theme preferences');
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
          <h3 className="text-lg font-medium mb-4">Display Preferences</h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="theme">Theme</Label>
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
