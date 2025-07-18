
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SettingsOptionsProps {
  onOpenWebhookDialog: () => void;
  onOpenAddUserDialog: () => void;
  isAdmin: boolean;
}

export const SettingsOptions: React.FC<SettingsOptionsProps> = ({ 
  onOpenWebhookDialog,
  onOpenAddUserDialog,
  isAdmin
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <Card className="glass-morphism">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Account Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                Change Password
              </Button>
              <Button variant="outline" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                Notification Settings
              </Button>
              <Button variant="outline" className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
                Privacy Settings
              </Button>
              <Button 
                variant="outline" 
                className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-red-400 hover:text-red-300" 
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="glass-morphism">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Admin Settings</h3>
              {/* Admin settings buttons - visible on all screen sizes */}
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800" 
                  onClick={() => navigate('/admin/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Settings Panel
                </Button>
              </div>
              
              {/* Other admin options - grid layout for responsive design */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800" 
                  onClick={onOpenWebhookDialog}
                >
                  Webhook Configuration
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800" 
                  onClick={onOpenAddUserDialog}
                >
                  Add New User
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start bg-zinc-900 border-zinc-800 hover:bg-zinc-800" 
                  onClick={() => navigate('/manage-users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
