import React from 'react';
import { EGRESS_CONFIG, logOptimization } from '@/config/egressOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';

interface OptimizedRealtimeWidgetProps {
  title: string;
  children: React.ReactNode;
  fallbackMessage?: string;
  showOptimizationNotice?: boolean;
}

/**
 * Wrapper component that conditionally renders realtime widgets based on egress optimization settings
 */
export const OptimizedRealtimeWidget: React.FC<OptimizedRealtimeWidgetProps> = ({
  title,
  children,
  fallbackMessage = "Real-time updates disabled to optimize database usage",
  showOptimizationNotice = true
}) => {
  // Check if realtime widgets are enabled
  if (EGRESS_CONFIG.components.realtimeWidgets.enabled) {
    logOptimization(`Rendering realtime widget: ${title}`);
    return <>{children}</>;
  }

  // Show optimization notice instead
  logOptimization(`Skipping realtime widget: ${title} (optimization enabled)`);
  
  if (!showOptimizationNotice) {
    return null;
  }

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {title} (Optimized)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>{fallbackMessage}</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Real-time updates are disabled to reduce database costs. 
          Use the refresh button to get the latest data.
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizedRealtimeWidget;