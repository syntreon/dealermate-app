
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canViewSensitiveInfo } from '@/utils/clientDataIsolation';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { AddUserForm } from '@/components/settings/AddUserForm';
import { WebhookConfig } from '@/components/settings/WebhookConfig';
import { UserProfileCard } from '@/components/settings/UserProfileCard';
import { UserSettingsForm } from '@/components/settings/UserSettingsForm';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { ClientSettings } from '@/components/settings/ClientSettings';
import { SettingsOptions } from '@/components/settings/SettingsOptions';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/hooks/useUserProfile';

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
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/your-webhook-id');
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

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
          <div className="sticky top-4 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Settings</h3>
            </div>
            <nav className="flex flex-col p-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'account' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Account</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                <span>Notifications</span>
              </button>
              {canViewSensitiveInfo(user as unknown as User) && (
                <button
                  onClick={() => setActiveTab('client')}
                  className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'client' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Client Settings</span>
                </button>
              )}
              {/* Admin panel button */}
              {canViewSensitiveInfo(user as unknown as User) && (
                <button
                  onClick={() => navigate('/admin/settings')}
                  className="flex items-center gap-2 p-3 rounded-md text-left transition-colors hover:bg-gray-50 text-gray-700 mt-2 border-t border-gray-200 pt-4"
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
        
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <UserProfileCard user={user} />
              <UserSettingsForm user={user} onUserUpdate={handleUserUpdate} />
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="space-y-6">
              <SettingsOptions 
                onOpenWebhookDialog={() => setWebhookDialogOpen(true)} 
                onOpenAddUserDialog={() => setAddUserDialogOpen(true)}
                isAdmin={canViewSensitiveInfo(user as unknown as User)} 
              />
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
          
          {activeTab === 'client' && (
            <div className="space-y-6">
              <ClientSettings clientId={user.client_id || null} isAdmin={canViewSensitiveInfo(user as unknown as User)} />
            </div>
          )}
        </div>
      </div>

      <WebhookConfig 
        open={webhookDialogOpen} 
        onOpenChange={setWebhookDialogOpen} 
        initialUrl={webhookUrl} 
        onSave={handleSaveWebhook} 
      />

      <AddUserForm open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen} />
    </div>
  );
};
export default Settings;
