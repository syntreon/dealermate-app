import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity } from 'lucide-react';

interface UsersTabProps {
  // Props will be added when implementing task 6
}

export const UsersTab: React.FC<UsersTabProps> = () => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              User Distribution by Role
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Breakdown of users by role and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">User analytics will be implemented in task 6</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5" />
              User Activity Metrics
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Login frequency and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity metrics will be implemented in task 6</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};