import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Phone, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/utils/formatting';

interface RealtimeMetrics {
  callsToday: number;
  leadsToday: number;
  callsThisHour: number;
  leadsThisHour: number;
  avgResponseTime: number;
  activeAgents: number;
}

export const RealtimeMetricsWidget = () => {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    callsToday: 0,
    leadsToday: 0,
    callsThisHour: 0,
    leadsThisHour: 0,
    avgResponseTime: 0,
    activeAgents: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadRealtimeMetrics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisHour = new Date();
      thisHour.setMinutes(0, 0, 0);

      // Get calls today and this hour
      const { data: callsToday } = await supabase
        .from('calls')
        .select('id, call_duration_seconds, created_at')
        .gte('created_at', today.toISOString());

      const { data: leadsToday } = await supabase
        .from('leads')
        .select('id, created_at')
        .gte('created_at', today.toISOString());

      const callsThisHour = callsToday?.filter(call => 
        new Date(call.created_at) >= thisHour
      ).length || 0;

      const leadsThisHour = leadsToday?.filter(lead => 
        new Date(lead.created_at) >= thisHour
      ).length || 0;

      // Calculate average response time (mock for now)
      const avgResponseTime = callsToday?.length ? 
        Math.round(Math.random() * 5 + 2) : 0; // 2-7 seconds

      // Get active agents
      const { data: activeAgents } = await supabase
        .from('agent_status')
        .select('id')
        .eq('status', 'active');

      setMetrics({
        callsToday: callsToday?.length || 0,
        leadsToday: leadsToday?.length || 0,
        callsThisHour,
        leadsThisHour,
        avgResponseTime,
        activeAgents: activeAgents?.length || 0
      });
    } catch (error) {
      console.error('Failed to load realtime metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRealtimeMetrics();
    
    // Update every minute
    const interval = setInterval(loadRealtimeMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Metrics
          </CardTitle>
          <CardDescription>Live system activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Metrics
        </CardTitle>
        <CardDescription>Live system activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Calls Today</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(metrics.callsToday)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {metrics.callsThisHour} this hour
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Leads Today</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(metrics.leadsToday)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {metrics.leadsThisHour} this hour
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Response Time</span>
            <Badge variant="outline">{metrics.avgResponseTime}s</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active Agents</span>
            <Badge variant={metrics.activeAgents > 0 ? "default" : "secondary"}>
              {metrics.activeAgents}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Conversion Rate</span>
            <Badge variant="outline">
              {metrics.callsToday > 0 ? 
                ((metrics.leadsToday / metrics.callsToday) * 100).toFixed(1) : 0}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};