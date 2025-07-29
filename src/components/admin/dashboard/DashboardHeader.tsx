import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  lastUpdated: Date;
  isLoading: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = "Admin Dashboard",
  subtitle = "System overview and key metrics",
  lastUpdated,
  isLoading,
  onRefresh
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          {subtitle} • Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
      <Button 
        onClick={onRefresh} 
        disabled={isLoading} 
        className="flex items-center gap-2"
        variant="outline"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {!isMobile && "Refresh"}
      </Button>
    </div>
  );
};