import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Phone, UserCheck, TrendingUp } from 'lucide-react';
import { Client } from '@/types/admin';
import { formatNumber, formatCurrency } from '@/utils/formatting';

interface TopPerformingClientsProps {
  clients: Client[];
}

export const TopPerformingClients: React.FC<TopPerformingClientsProps> = ({ clients }) => {
  const clientsWithMetrics = clients.filter(c => c.metrics);
  
  // Sort by total calls and take top 5
  const topByCallVolume = [...clientsWithMetrics]
    .sort((a, b) => (b.metrics?.totalCalls || 0) - (a.metrics?.totalCalls || 0))
    .slice(0, 5);

  // Sort by conversion rate and take top 5
  const topByConversion = [...clientsWithMetrics]
    .filter(c => (c.metrics?.totalCalls || 0) > 0)
    .sort((a, b) => {
      const aRate = ((a.metrics?.totalLeads || 0) / (a.metrics?.totalCalls || 1)) * 100;
      const bRate = ((b.metrics?.totalLeads || 0) / (b.metrics?.totalCalls || 1)) * 100;
      return bRate - aRate;
    })
    .slice(0, 3);

  const maxCalls = Math.max(...topByCallVolume.map(c => c.metrics?.totalCalls || 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Performing Clients
        </CardTitle>
        <CardDescription>Clients ranked by call volume and conversion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top by Call Volume */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Highest Call Volume
          </h4>
          <div className="space-y-3">
            {topByCallVolume.map((client, index) => {
              const callPercentage = maxCalls > 0 ? ((client.metrics?.totalCalls || 0) / maxCalls) * 100 : 0;
              return (
                <div key={client.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(client.metrics?.totalCalls || 0)} calls • 
                          {formatNumber(client.metrics?.totalLeads || 0)} leads
                        </p>
                      </div>
                    </div>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status}
                    </Badge>
                  </div>
                  <Progress value={callPercentage} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top by Conversion Rate */}
        {topByConversion.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Best Conversion Rates
            </h4>
            <div className="space-y-3">
              {topByConversion.map((client, index) => {
                const conversionRate = ((client.metrics?.totalLeads || 0) / (client.metrics?.totalCalls || 1)) * 100;
                return (
                  <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(client.metrics?.totalCalls || 0)} calls
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(client.metrics?.totalLeads || 0)} leads
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Revenue Leaders */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Revenue Leaders</h4>
          <div className="space-y-2">
            {clients
              .sort((a, b) => b.monthly_billing_amount_cad - a.monthly_billing_amount_cad)
              .slice(0, 3)
              .map((client, index) => (
                <div key={client.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{client.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(client.monthly_billing_amount_cad, 'CAD')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};