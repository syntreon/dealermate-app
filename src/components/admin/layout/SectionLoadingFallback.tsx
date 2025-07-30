import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, LayoutDashboard, Users, BarChart3, Shield, Settings } from 'lucide-react';

interface SectionLoadingFallbackProps {
  sectionName?: string;
  message?: string;
  showSkeleton?: boolean;
  className?: string;
}

/**
 * Loading fallback component for admin section layouts
 * Provides contextual loading states with section-specific icons and messages
 */
const SectionLoadingFallback: React.FC<SectionLoadingFallbackProps> = ({
  sectionName = 'Section',
  message,
  showSkeleton = true,
  className = ''
}) => {
  const getSectionIcon = (section: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'Dashboard': LayoutDashboard,
      'Management': Users,
      'Analytics': BarChart3,
      'Audit': Shield,
      'Logs': Shield,
      'Settings': Settings,
    };
    
    return iconMap[section] || LayoutDashboard;
  };

  const getSectionMessage = (section: string) => {
    const messageMap: Record<string, string> = {
      'Dashboard': 'Loading dashboard overview...',
      'Management': 'Loading management tools...',
      'Analytics': 'Loading analytics data...',
      'Audit': 'Loading audit logs...',
      'Logs': 'Loading audit logs...',
      'Settings': 'Loading settings...',
    };
    
    return messageMap[section] || `Loading ${section.toLowerCase()}...`;
  };

  const IconComponent = getSectionIcon(sectionName);
  const loadingMessage = message || getSectionMessage(sectionName);

  if (!showSkeleton) {
    // Simple loading spinner
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  // Full skeleton layout
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <IconComponent className="h-8 w-8 text-muted-foreground animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>

      {/* Layout skeleton */}
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
        {/* Sidebar skeleton */}
        <aside className="lg:w-56 lg:flex-shrink-0">
          <nav className="space-y-1">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="flex items-center space-x-3 px-4 py-2 rounded-md"
              >
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </nav>
        </aside>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Content header */}
                <div className="space-y-2">
                  <div className="h-6 w-64 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </div>
                
                {/* Content body */}
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((line) => (
                    <div
                      key={line}
                      className={`h-4 bg-muted animate-pulse rounded ${
                        line === 5 ? 'w-3/4' : 'w-full'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Action buttons skeleton */}
                <div className="flex gap-2 pt-4">
                  <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingMessage}
        </div>
      </div>
    </div>
  );
};

/**
 * Minimal loading fallback for quick transitions
 */
export const MinimalSectionLoading: React.FC<{ sectionName?: string }> = ({ 
  sectionName = 'Section' 
}) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading {sectionName}...</span>
    </div>
  </div>
);

/**
 * Page-level loading fallback with full layout
 */
export const PageLoadingFallback: React.FC<{ pageName?: string }> = ({ 
  pageName = 'Page' 
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading {pageName}</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare your content...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default SectionLoadingFallback;