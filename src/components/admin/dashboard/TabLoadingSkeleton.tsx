import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  CardSkeleton, 
  FinancialTabSkeleton, 
  ClientsTabSkeleton, 
  UsersTabSkeleton, 
  SystemTabSkeleton, 
  OperationsTabSkeleton,
  MetricCardSkeleton,
  TableLoadingSkeleton,
  ChartLoadingSkeleton
} from './LoadingSkeletons';

interface TabLoadingSkeletonProps {
  tabType?: 'financial' | 'clients' | 'users' | 'system' | 'operations' | 'generic';
  stage?: 'initial' | 'partial' | 'complete';
  showProgress?: boolean;
  progress?: number;
}

export const TabLoadingSkeleton: React.FC<TabLoadingSkeletonProps> = ({ 
  tabType = 'generic',
  stage = 'initial',
  showProgress = false,
  progress = 0
}) => {
  // Show specific skeleton based on tab type
  const getTabSpecificSkeleton = () => {
    switch (tabType) {
      case 'financial':
        return <FinancialTabSkeleton />;
      case 'clients':
        return <ClientsTabSkeleton />;
      case 'users':
        return <UsersTabSkeleton />;
      case 'system':
        return <SystemTabSkeleton />;
      case 'operations':
        return <OperationsTabSkeleton />;
      default:
        return (
          <div className="space-y-6">
            {/* Metric cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
            
            {/* Chart section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse w-48" />
                <div className="h-4 bg-muted rounded animate-pulse w-64" />
              </CardHeader>
              <CardContent>
                <ChartLoadingSkeleton />
              </CardContent>
            </Card>
            
            {/* Table section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse w-40" />
                <div className="h-4 bg-muted rounded animate-pulse w-56" />
              </CardHeader>
              <CardContent>
                <TableLoadingSkeleton columns={5} rows={6} />
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  // Initial loading state with centered spinner
  if (stage === 'initial') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Loading {tabType === 'generic' ? 'dashboard' : tabType} data...
            </p>
            {showProgress && progress > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {progress}% complete
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Partial loading state with progress indicator
  if (stage === 'partial') {
    return (
      <div className="space-y-4">
        {showProgress && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-md border border-border">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Loading additional data...</p>
              {progress > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        )}
        {getTabSpecificSkeleton()}
      </div>
    );
  }

  // Default skeleton for complete or unspecified stage
  return getTabSpecificSkeleton();
};