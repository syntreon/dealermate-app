import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Generic card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <Card className={`bg-card border-border ${className}`}>
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </CardContent>
  </Card>
);

// Financial tab specific skeleton
export const FinancialTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Cost breakdown and profitability cards */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Client profitability table skeleton */}
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-border rounded">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Clients tab specific skeleton
export const ClientsTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Client status distribution */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Recent client activity */}
    <Card className="bg-card border-border">
      <CardHeader>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-border rounded">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Users tab specific skeleton
export const UsersTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* User distribution */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Recent user activity */}
    <Card className="bg-card border-border">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-border rounded">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// System tab specific skeleton
export const SystemTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* System resource monitoring */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-52" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* System messages */}
    <Card className="bg-card border-border">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-border rounded">
              <Skeleton className="h-5 w-16 rounded-full mt-1" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Operations tab specific skeleton
export const OperationsTabSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Operations metrics */}
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-card border-border">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Operations breakdown */}
    <Card className="bg-card border-border">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Recent operations */}
    <Card className="bg-card border-border">
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-border rounded">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Progressive loading skeleton that shows different states
export const ProgressiveLoadingSkeleton: React.FC<{ 
  stage: 'initial' | 'partial' | 'complete';
  tabType?: 'financial' | 'clients' | 'users' | 'system' | 'operations';
  loadedSections?: string[];
  totalSections?: number;
}> = ({ stage, tabType = 'financial', loadedSections = [], totalSections = 3 }) => {
  if (stage === 'initial') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Initializing {tabType} analytics...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'partial') {
    // Show skeleton with some loaded content and progress indicator
    const SkeletonComponent = {
      financial: FinancialTabSkeleton,
      clients: ClientsTabSkeleton,
      users: UsersTabSkeleton,
      system: SystemTabSkeleton,
      operations: OperationsTabSkeleton,
    }[tabType];

    const progress = Math.round((loadedSections.length / totalSections) * 100);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-md border border-border">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Loading additional data...</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          </div>
        </div>
        <SkeletonComponent />
      </div>
    );
  }

  return null; // Complete stage shows actual content
};

// Refresh loading indicator
export const RefreshLoadingIndicator: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 shadow-lg">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span className="text-sm text-muted-foreground">Refreshing...</span>
    </div>
  );
};

// Data loading indicator for individual sections
export const SectionLoadingIndicator: React.FC<{ 
  isLoading: boolean; 
  error?: string | null;
  onRetry?: () => void;
  sectionName?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isLoading, error, onRetry, sectionName, size = 'md' }) => {
  if (!isLoading && !error) return null;

  const sizeClasses = {
    sm: 'p-2 text-xs',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base'
  };

  const spinnerSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`flex items-center justify-center border border-border rounded-md bg-muted/20 ${sizeClasses[size]}`}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className={`animate-spin rounded-full border-b-2 border-primary ${spinnerSizes[size]}`}></div>
          <span className="text-muted-foreground">
            Loading{sectionName ? ` ${sectionName}` : ''}...
          </span>
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Try again
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

// Enhanced refresh loading indicator with more states
export const EnhancedRefreshIndicator: React.FC<{ 
  isVisible: boolean;
  stage?: 'fetching' | 'processing' | 'complete';
  progress?: number;
}> = ({ isVisible, stage = 'fetching', progress }) => {
  if (!isVisible) return null;

  const getStageText = () => {
    switch (stage) {
      case 'fetching':
        return 'Fetching data...';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete!';
      default:
        return 'Refreshing...';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 shadow-lg min-w-[140px]">
      {stage !== 'complete' ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      ) : (
        <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full"></div>
        </div>
      )}
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">{getStageText()}</span>
        {progress !== undefined && stage === 'processing' && (
          <div className="mt-1 bg-muted rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Shimmer loading effect for better visual feedback
export const ShimmerSkeleton: React.FC<{ 
  className?: string;
  lines?: number;
  showAvatar?: boolean;
}> = ({ className = "", lines = 3, showAvatar = false }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="flex items-start space-x-4">
      {showAvatar && (
        <div className="rounded-full bg-muted h-10 w-10 flex-shrink-0"></div>
      )}
      <div className="flex-1 space-y-2">
        {[...Array(lines)].map((_, i) => (
          <div 
            key={i}
            className={`h-4 bg-muted rounded ${
              i === 0 ? 'w-3/4' : 
              i === lines - 1 ? 'w-1/2' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  </div>
);

// Loading state for metric cards with pulsing animation
export const MetricCardSkeleton: React.FC<{ 
  showTrend?: boolean;
  showIcon?: boolean;
}> = ({ showTrend = true, showIcon = true }) => (
  <Card className="bg-card border-border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      {showIcon && <Skeleton className="h-4 w-4 rounded" />}
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        {showTrend && (
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Table loading skeleton with proper structure
export const TableLoadingSkeleton: React.FC<{ 
  columns: number;
  rows: number;
  showHeader?: boolean;
}> = ({ columns, rows, showHeader = true }) => (
  <div className="space-y-3">
    {showHeader && (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    )}
    <div className="space-y-2">
      {[...Array(rows)].map((_, rowIndex) => (
        <div 
          key={rowIndex}
          className="grid gap-4 p-3 border border-border rounded"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={`h-4 ${
                colIndex === 0 ? 'w-32' : 
                colIndex === columns - 1 ? 'w-16' : 'w-24'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Chart loading skeleton
export const ChartLoadingSkeleton: React.FC<{ 
  height?: number;
  showLegend?: boolean;
}> = ({ height = 300, showLegend = true }) => (
  <div className="space-y-4">
    {showLegend && (
      <div className="flex justify-center gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )}
    <div className="relative" style={{ height }}>
      <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
        {[...Array(7)].map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-8 bg-muted rounded-t" 
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  </div>
);