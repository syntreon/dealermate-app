import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CardSkeleton } from './LoadingSkeletons';

interface TabLoadingSkeletonProps {
  tabType?: 'financial' | 'clients' | 'users' | 'system' | 'operations' | 'generic';
}

export const TabLoadingSkeleton: React.FC<TabLoadingSkeletonProps> = ({ tabType = 'generic' }) => {
  // For backward compatibility, keep the generic skeleton as default
  if (tabType === 'generic') {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  // For specific tab types, show a more detailed skeleton
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading {tabType} data...</p>
        </div>
      </div>
    </div>
  );
};