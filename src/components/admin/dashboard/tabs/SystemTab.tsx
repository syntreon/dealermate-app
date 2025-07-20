import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Shield } from 'lucide-react';

interface SystemTabProps {
  // Props will be added when implementing task 7
}

export const SystemTab: React.FC<SystemTabProps> = () => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Cpu className="h-5 w-5" />
              System Resource Monitoring
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              CPU, memory, and storage usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">System monitoring will be implemented in task 7</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5" />
              System Health Status
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Database, API, and service health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Health monitoring will be implemented in task 7</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};