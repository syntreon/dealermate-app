
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { UserPlus, Settings as SettingsIcon, User as UserIcon, Bell, Building2, Bot, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { AddUserForm } from '@/components/settings/AddUserForm';
import { UserProfileCard } from '@/components/settings/UserProfileCard';
import { UserSettingsForm } from '@/components/settings/UserSettingsForm';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { BusinessSettings } from '@/components/settings/BusinessSettings';
import { AgentSettings } from '@/components/settings/AgentSettings';
import { Preferences } from '@/components/settings/Preferences';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/hooks/useAuthSession';

// Import User type
import { User } from '@/types/user';

// Extended user type with preferences
type UserWithPreferences = UserData & {
  preferences?: {
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
  // Add required User properties
  created_at?: string;
};

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
    user,
    setUser
  } = useAuth();
  const navigate = useNavigate();
  // Removed webhook-related state as it's not used in the new app
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user');

  // Loading state for initial data fetching
  useEffect(() => {
    // Set loading to false after initial render
    setIsLoading(false);
  }, []);
  
  // Handle user updates
  const handleUserUpdate = (updatedUser: UserWithPreferences) => {
    if (setUser) {
      setUser(updatedUser as UserData);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="space-y-6 pb-8 px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
        
        {canViewSensitiveInfo(user as unknown as User) && (
          <Button 
            onClick={() => setAddUserDialogOpen(true)} 
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="sticky top-4 bg-card rounded-lg overflow-hidden border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-card-foreground">Settings</h3>
            </div>
            <nav className="flex flex-col p-2">
              <button
                onClick={() => setActiveTab('user')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'user' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <UserIcon className="h-4 w-4" />
                <span>User</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'preferences' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Sliders className="h-4 w-4" />
                <span>Preferences</span>
              </button>
              <button
                onClick={() => setActiveTab('business')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'business' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Building2 className="h-4 w-4" />
                <span>Business</span>
              </button>
              <button
                onClick={() => setActiveTab('agent')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'agent' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Bot className="h-4 w-4" />
                <span>Agent</span>
              </button>
              {/* Admin panel button */}
              {canViewSensitiveInfo(user as unknown as User) && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="flex items-center gap-2 p-3 rounded-md text-left transition-colors hover:bg-muted text-muted-foreground mt-2 border-t border-border pt-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1">
        
          {activeTab === 'user' && (
            <div className="space-y-6">
              <UserProfileCard user={user} />
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <NotificationPreferences 
                user={user} 
                onUserUpdate={(updatedUser) => handleUserUpdate(updatedUser)} 
              />
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Preferences 
                user={user} 
                onUserUpdate={(updatedUser) => handleUserUpdate(updatedUser)} 
              />
            </div>
          )}
          
          {activeTab === 'business' && (
            <div className="space-y-6">
              <BusinessSettings clientId={user.client_id || null} isAdmin={canViewSensitiveInfo(user as unknown as User)} />
            </div>
          )}
          
          {activeTab === 'agent' && (
            <div className="space-y-6">
              <AgentSettings clientId={user.client_id || null} />
            </div>
          )}
          
          {/* Admin options - only shown for admin users */}
          {canViewSensitiveInfo(user as unknown as User) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-800">Admin Settings</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-800 text-gray-800" 
                      onClick={() => setAddUserDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddUserForm open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen} />
    </div>
  );
};
export default Settings;
