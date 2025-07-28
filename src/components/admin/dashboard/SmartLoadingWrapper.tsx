import React, { ReactNode, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';
import { SectionLoadingIndicator } from './LoadingSkeletons';
import { useSectionLoading } from './LoadingStatesProvider';

interface SmartLoadingWrapperProps {
  children: ReactNode;
  sectionId: string;
  fallback?: ReactNode;
  tabType?: 'financial' | 'clients' | 'users' | 'system' | 'operations' | 'generic';
  showInlineLoading?: boolean;
  onRetry?: () => Promise<void>;
  className?: string;
}

export const SmartLoadingWrapper: React.FC<SmartLoadingWrapperProps> = ({
  children,
  sectionId,
  fallback,
  tabType = 'generic',
  showInlineLoading = true,
  onRetry,
  className = ""
}) => {
  const {
    section,
    isLoading,
    error,
    lastUpdated,
    progress,
    retry
  } = useSectionLoading(sectionId);

  // Handle retry logic
  const handleRetry = async () => {
    if (onRetry) {
      try {
        await retry(onRetry);
      } catch (err) {
        console.error(`Retry failed for section ${sectionId}:`, err);
      }
    }
  };

  // Show error state
  if (error && !isLoading) {
    return (
      <div className={className}>
        <Card className="bg-card text-card-foreground border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Failed to Load {section?.name || 'Section'}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {error}
              </p>
              {(onRetry || retry) && (
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading && !lastUpdated) {
    return (
      <div className={className}>
        {fallback || (
          <TabLoadingSkeleton 
            tabType={tabType}
            stage="initial"
            showProgress={progress !== undefined}
            progress={progress}
          />
        )}
      </div>
    );
  }

  // Show partial loading state (refreshing with existing data)
  if (isLoading && lastUpdated && showInlineLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <SectionLoadingIndicator
            isLoading={true}
            sectionName={section?.name}
            size="sm"
          />
          <Suspense fallback={
            <TabLoadingSkeleton 
              tabType={tabType}
              stage="partial"
              showProgress={progress !== undefined}
              progress={progress}
            />
          }>
            {children}
          </Suspense>
        </div>
      </div>
    );
  }

  // Show content
  return (
    <div className={className}>
      <Suspense fallback={
        <TabLoadingSkeleton 
          tabType={tabType}
          stage="initial"
        />
      }>
        {children}
      </Suspense>
    </div>
  );
};

// Higher-order component version for easier usage
export const withSmartLoading = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    sectionId: string;
    tabType?: 'financial' | 'clients' | 'users' | 'system' | 'operations' | 'generic';
    showInlineLoading?: boolean;
  }
) => {
  const WrappedComponent = (props: P) => (
    <SmartLoadingWrapper
      sectionId={options.sectionId}
      tabType={options.tabType}
      showInlineLoading={options.showInlineLoading}
    >
      <Component {...props} />
    </SmartLoadingWrapper>
  );

  WrappedComponent.displayName = `withSmartLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default SmartLoadingWrapper;