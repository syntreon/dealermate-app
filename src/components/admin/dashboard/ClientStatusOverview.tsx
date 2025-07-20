import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, Users, Phone } from 'lucide-react';
import { Client } from '@/types/admin';
import { formatNumber, formatCurrency } from '@/utils/formatting';

interface ClientStatusOverviewProps {
  clients: Client[];
}

export const ClientStatusOverview: React.FC<ClientStatusOverviewProps> = ({ clients }) => {
  const statusCounts = clients.reduce((acc, client) => {
    acc[client.status] = (acc[client.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalClients = clients.length;
  const activePercentage = totalClients > 0 ? (statusCounts.active || 0) / totalClients * 100 : 0;
  const trialPercentage = totalClients > 0 ? (statusCounts.trial || 0) / totalClients * 100 : 0;

  const topPerformers = clients
    .filter(c => c.metrics)
    .sort((a, b) => (b.metrics?.totalCalls || 0) - (a.metrics?.totalCalls || 0))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Client Overview
        </CardTitle>
        <CardDescription>Client status and performance summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Status Distribution</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active Clients</span>
              <span>{statusCounts.active || 0} ({activePercentage.toFixed(0)}%)</span>
            </div>
            <Progress value={activePercentage} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span>Trial Clients</span>
              <span>{statusCounts.trial || 0} ({trialPercentage.toFixed(0)}%)</span>
            </div>
            <Progress value={trialPercentage} className="h-2" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.active || 0}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.trial || 0}
            </div>
            <div className="text-xs text-muted-foreground">Trial</div>
          </div>
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Top Performers</h4>
            <div className="space-y-2">
              {topPerformers.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.metrics?.totalCalls || 0} calls
                      </p>
                    </div>
                  </div>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue Summary */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Monthly Revenue</span>
            <span className="font-medium">
              {formatCurrency(
                clients.reduce((sum, c) => sum + c.monthly_billing_amount_cad, 0),
                'CAD'
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};