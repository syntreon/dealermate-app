
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
    name?: string;
    email?: string;
    phone?: string;
    is_admin?: boolean;
    full_name?: string;
  };
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  const { logout } = useAuth();
  return (
    <Card className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">{user.full_name || user.name || 'User'}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              {user.is_admin && (
                <>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-0">
                    Admin
                  </Badge>
                  <span className="text-muted-foreground text-xs">•</span>
                </>
              )}
              <span className="text-muted-foreground text-xs">{user.email || 'No email available'}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-card-foreground">Full Name</Label>
            <Input 
              id="name" 
              value={user.full_name || user.name || ''} 
              readOnly 
              className="bg-muted border-border focus:border-primary cursor-not-allowed" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground">Email</Label>
            <Input 
              id="email" 
              value={user.email || ''} 
              readOnly 
              className="bg-muted border-border focus:border-primary cursor-not-allowed" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-card-foreground">Phone Number</Label>
          <div className="flex gap-3">
            <Input 
              id="phone" 
              value={user.phone || ''} 
              readOnly 
              className="flex-1 bg-muted border-border focus:border-primary cursor-not-allowed" 
            />
            <Button variant="outline" size="icon" className="bg-card border-border hover:bg-muted">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Account Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start bg-card border-border hover:bg-muted hover:text-card-foreground text-card-foreground">
              <KeyRound className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button 
              variant="outline" 
              className="justify-start bg-card border-border hover:bg-muted text-destructive hover:text-destructive/90" 
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
