import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshLoadingIndicator,
  EnhancedRefreshIndicator,
  ProgressiveLoadingSkeleton,
  SectionLoadingIndicator,
  ShimmerSkeleton,
  MetricCardSkeleton,
  TableLoadingSkeleton,
  ChartLoadingSkeleton,
  FinancialTabSkeleton,
  ClientsTabSkeleton,
  UsersTabSkeleton,
  SystemTabSkeleton,
  OperationsTabSkeleton
} from './LoadingSkeletons';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';
import LoadingOverlay from './LoadingOverlay';
import LoadingStatesProvider, { useLoadingStatesContext } from './LoadingStatesProvider';

// Demo component to showcase all loading states
const LoadingStatesDemoContent: React.FC = () => {
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  const [showEnhancedRefresh, setShowEnhancedRefresh] = useState(false);
  const [refreshStage, setRefreshStage] = useState<'fetching' | 'processing' | 'complete'>('fetching');
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [progressiveStage, setProgressiveStage] = useState<'initial' | 'partial' | 'complete'>('initial');
  
  const { loadingState, loadAllSections, reset } = useLoadingStatesContext();

  const simulateRefresh = () => {
    setShowRefreshIndicator(true);
    setTimeout(() => setShowRefreshIndicator(false), 3000);
  };

  const simulateEnhancedRefresh = () => {
    setShowEnhancedRefresh(true);
    setRefreshStage('fetching');
    setRefreshProgress(0);
    
    // Simulate fetching stage
    setTimeout(() => {
      setRefreshStage('processing');
      const interval = setInterval(() => {
        setRefreshProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setRefreshStage('complete');
            setTimeout(() => setShowEnhancedRefresh(false), 1000);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }, 1000);
  };

  const simulateOverlay = () => {
    setShowOverlay(true);
    
    // Simulate loading sections
    const sections = ['financial-metrics', 'client-data', 'user-analytics'];
    loadAllSections({
      'financial-metrics': () => new Promise(resolve => setTimeout(resolve, 2000)),
      'client-data': () => new Promise(resolve => setTimeout(resolve, 3000)),
      'user-analytics': () => new Promise(resolve => setTimeout(resolve, 4000))
    }).finally(() => {
      setTimeout(() => {
        setShowOverlay(false);
        reset();
      }, 1000);
    });
  };

  const cycleProgressiveStage = () => {
    const stages: Array<'initial' | 'partial' | 'complete'> = ['initial', 'partial', 'complete'];
    const currentIndex = stages.indexOf(progressiveStage);
    const nextIndex = (currentIndex + 1) % stages.length;
    setProgressiveStage(stages[nextIndex]);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-card-foreground mb-2">Loading States Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive showcase of all loading states and skeletons used in the admin dashboard
        </p>
      </div>

      <Tabs defaultValue="indicators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
          <TabsTrigger value="tabs">Tab Skeletons</TabsTrigger>
          <TabsTrigger value="overlays">Overlays</TabsTrigger>
        </TabsList>

        <TabsContent value="indicators" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading Indicators</CardTitle>
              <CardDescription>Various loading indicators for different use cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Refresh Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Basic Refresh Indicator</h3>
                  <Button onClick={simulateRefresh} variant="outline" size="sm">
                    Show Indicator
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Simple refresh indicator that appears in the top-right corner
                </p>
              </div>

              {/* Enhanced Refresh Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Enhanced Refresh Indicator</h3>
                  <Button onClick={simulateEnhancedRefresh} variant="outline" size="sm">
                    Show Enhanced
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enhanced indicator with stages and progress tracking
                </p>
              </div>

              {/* Section Loading Indicators */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Section Loading Indicators</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Badge variant="outline">Small</Badge>
                    <SectionLoadingIndicator 
                      isLoading={true} 
                      sectionName="Metrics"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Medium</Badge>
                    <SectionLoadingIndicator 
                      isLoading={true} 
                      sectionName="Analytics"
                      size="md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Large</Badge>
                    <SectionLoadingIndicator 
                      isLoading={true} 
                      sectionName="Reports"
                      size="lg"
                    />
                  </div>
                </div>
              </div>

              {/* Error States */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Error States</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <SectionLoadingIndicator 
                    isLoading={false} 
                    error="Failed to load data"
                    onRetry={() => console.log('Retry clicked')}
                  />
                  <SectionLoadingIndicator 
                    isLoading={false} 
                    error="Network timeout"
                    sectionName="User Data"
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skeletons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Component Skeletons</CardTitle>
              <CardDescription>Skeleton loaders for different component types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shimmer Skeleton */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Shimmer Skeleton</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <ShimmerSkeleton lines={3} />
                  <ShimmerSkeleton lines={2} showAvatar={true} />
                </div>
              </div>

              {/* Metric Cards */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Metric Card Skeletons</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCardSkeleton />
                  <MetricCardSkeleton showTrend={false} />
                  <MetricCardSkeleton showIcon={false} />
                </div>
              </div>

              {/* Table Skeleton */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Table Skeleton</h3>
                <TableLoadingSkeleton columns={4} rows={5} />
              </div>

              {/* Chart Skeleton */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Chart Skeleton</h3>
                <ChartLoadingSkeleton height={200} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tab-Specific Skeletons</CardTitle>
              <CardDescription>Specialized skeletons for each dashboard tab</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progressive Loading */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Progressive Loading</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{progressiveStage}</Badge>
                    <Button onClick={cycleProgressiveStage} variant="outline" size="sm">
                      Next Stage
                    </Button>
                  </div>
                </div>
                <ProgressiveLoadingSkeleton 
                  stage={progressiveStage}
                  tabType="financial"
                  loadedSections={progressiveStage === 'partial' ? ['metrics'] : []}
                  totalSections={3}
                />
              </div>

              {/* Tab Skeletons */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tab-Specific Skeletons</h3>
                <Tabs defaultValue="financial" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                    <TabsTrigger value="operations">Operations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="financial">
                    <FinancialTabSkeleton />
                  </TabsContent>
                  <TabsContent value="clients">
                    <ClientsTabSkeleton />
                  </TabsContent>
                  <TabsContent value="users">
                    <UsersTabSkeleton />
                  </TabsContent>
                  <TabsContent value="system">
                    <SystemTabSkeleton />
                  </TabsContent>
                  <TabsContent value="operations">
                    <OperationsTabSkeleton />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading Overlays</CardTitle>
              <CardDescription>Full-screen loading overlays with progress tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Loading Overlay with Progress</h3>
                  <Button onClick={simulateOverlay} variant="outline" size="sm">
                    Show Overlay
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full-screen overlay that shows loading progress for multiple sections
                </p>
              </div>

              {/* Current Loading State */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Current Loading State</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Overall Progress:</span>
                      <span>{Math.round(loadingState.overallProgress)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stage:</span>
                      <Badge variant="outline">{loadingState.stage}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Loading Sections:</span>
                      <span>{Object.values(loadingState.sections).filter(s => s.isLoading).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Sections:</span>
                      <span>{Object.values(loadingState.sections).filter(s => s.error).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Indicators */}
      <RefreshLoadingIndicator isVisible={showRefreshIndicator} />
      <EnhancedRefreshIndicator 
        isVisible={showEnhancedRefresh}
        stage={refreshStage}
        progress={refreshStage === 'processing' ? refreshProgress : undefined}
      />
      
      {/* Loading Overlay */}
      {showOverlay && (
        <LoadingOverlay
          loadingState={loadingState}
          showDetails={true}
          onRetry={(sectionId) => console.log('Retry section:', sectionId)}
          onCancel={() => {
            setShowOverlay(false);
            reset();
          }}
        />
      )}
    </div>
  );
};

// Main demo component with provider
export const LoadingStatesDemo: React.FC = () => {
  const demoSections = [
    { id: 'financial-metrics', name: 'Financial Metrics' },
    { id: 'client-data', name: 'Client Data' },
    { id: 'user-analytics', name: 'User Analytics' },
    { id: 'system-health', name: 'System Health' },
    { id: 'operations-data', name: 'Operations Data' }
  ];

  return (
    <LoadingStatesProvider sections={demoSections} showToasts={false}>
      <LoadingStatesDemoContent />
    </LoadingStatesProvider>
  );
};

export default LoadingStatesDemo;