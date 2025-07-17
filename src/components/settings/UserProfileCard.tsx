
import React from 'react';
import { User, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface UserProfileCardProps {
  user: {
    name: string;
    email: string;
    phone: string;
    is_admin?: boolean;
  };
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-purple/10 flex items-center justify-center">
            <User className="h-8 w-8 text-purple" />
          </div>
          <div>
            <CardTitle className="text-gradient-primary">{user.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              {user.is_admin && (
                <>
                  <Badge variant="outline" className="bg-zinc-900/50 text-purple border-purple/20 py-0">
                    Admin
                  </Badge>
                  <span className="text-zinc-500 text-xs">•</span>
                </>
              )}
              <span className="text-zinc-500 text-xs">{user.email}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={user.name} 
              readOnly 
              className="bg-zinc-900 border-zinc-800 focus:border-purple cursor-not-allowed" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={user.email} 
              readOnly 
              className="bg-zinc-900 border-zinc-800 focus:border-purple cursor-not-allowed" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-3">
            <Input 
              id="phone" 
              value={user.phone} 
              readOnly 
              className="flex-1 bg-zinc-900 border-zinc-800 focus:border-purple cursor-not-allowed" 
            />
            <Button variant="outline" size="icon" className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
