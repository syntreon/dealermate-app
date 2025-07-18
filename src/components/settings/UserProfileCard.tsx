
import React from 'react';
import { User, Phone, LogOut, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

interface UserProfileCardProps {
  user: {
    name: string;
    email: string;
    phone: string;
    is_admin?: boolean;
  };
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  const { logout } = useAuth();
  return (
    <Card className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-gray-800">{user.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              {user.is_admin && (
                <>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-0">
                    Admin
                  </Badge>
                  <span className="text-gray-500 text-xs">•</span>
                </>
              )}
              <span className="text-gray-500 text-xs">{user.email}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">Full Name</Label>
            <Input 
              id="name" 
              value={user.name} 
              readOnly 
              className="bg-gray-50 border-gray-200 focus:border-primary cursor-not-allowed" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input 
              id="email" 
              value={user.email} 
              readOnly 
              className="bg-gray-50 border-gray-200 focus:border-primary cursor-not-allowed" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
          <div className="flex gap-3">
            <Input 
              id="phone" 
              value={user.phone} 
              readOnly 
              className="flex-1 bg-gray-50 border-gray-200 focus:border-primary cursor-not-allowed" 
            />
            <Button variant="outline" size="icon" className="bg-white border-gray-200 hover:bg-gray-50">
              <Phone className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-4">Account Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start bg-white border-gray-200 hover:bg-gray-50 text-gray-800">
              <KeyRound className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button 
              variant="outline" 
              className="justify-start bg-white border-gray-200 hover:bg-gray-50 text-red-500 hover:text-red-600" 
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
