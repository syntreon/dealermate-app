import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, BarChart3 } from 'lucide-react';

interface ClientsTabProps {
  // Props will be added when implementing task 5
}

export const ClientsTab: React.FC<ClientsTabProps> = () => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              Client Status Distribution
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Breakdown of clients by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Client analytics will be implemented in task 5</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Distribution by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Subscription analysis will be implemented in task 5</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};