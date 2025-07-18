
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
import { BusinessSettings } from '@/components/settings/BusinessSettings';
import { AgentSettings } from '@/components/settings/AgentSettings';
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
  const [activeTab, setActiveTab] = useState('user');

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
                onClick={() => setActiveTab('user')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'user' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>User</span>
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
              <button
                onClick={() => setActiveTab('business')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'business' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Business</span>
              </button>
              <button
                onClick={() => setActiveTab('agent')}
                className={`flex items-center gap-2 p-3 rounded-md text-left transition-colors ${activeTab === 'agent' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Agent</span>
              </button>
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
          
          {/* Account options at the bottom of any tab */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <SettingsOptions 
              onOpenWebhookDialog={() => setWebhookDialogOpen(true)} 
              onOpenAddUserDialog={() => setAddUserDialogOpen(true)}
              isAdmin={canViewSensitiveInfo(user as unknown as User)} 
            />
          </div>
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
