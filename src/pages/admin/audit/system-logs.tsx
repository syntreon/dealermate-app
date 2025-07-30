import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Clock } from 'lucide-react';

const SystemLogs: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Logs</h1>
        <p className="text-muted-foreground">
          Monitor system events, errors, performance metrics, and infrastructure logs.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Server className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">System Logs</CardTitle>
          <CardDescription>
            This feature is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Coming Soon</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            System health monitoring, error tracking, performance logs, and infrastructure 
            monitoring will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemLogs;