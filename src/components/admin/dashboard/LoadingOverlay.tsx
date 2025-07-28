import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { LoadingState, LoadingSection } from '@/hooks/useLoadingStates';

interface LoadingOverlayProps {
  loadingState: LoadingState;
  onRetry?: (sectionId: string) => void;
  onCancel?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loadingState,
  onRetry,
  onCancel,
  showDetails = false,
  className = ""
}) => {
  const { stage, overallProgress, sections } = loadingState;
  
  if (stage === 'complete') return null;

  const loadingSections = Object.values(sections).filter(section => section.isLoading);
  const errorSections = Object.values(sections).filter(section => section.error);
  const completedSections = Object.values(sections).filter(
    section => !section.isLoading && section.lastUpdated && !section.error
  );

  const getStageMessage = () => {
    switch (stage) {
      case 'initial':
        return 'Initializing dashboard...';
      case 'partial':
        return `Loading ${loadingSections.length} remaining sections...`;
      default:
        return 'Loading...';
    }
  };

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <Card className="w-full max-w-md mx-4 bg-card border-border shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">
                {getStageMessage()}
              </h3>
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="text-card-foreground font-medium">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Section Details */}
            {showDetails && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-medium text-card-foreground">Section Status</h4>
                
                {/* Loading Sections */}
                {loadingSections.map((section) => (
                  <SectionStatus
                    key={section.id}
                    section={section}
                    status="loading"
                  />
                ))}
                
                {/* Completed Sections */}
                {completedSections.map((section) => (
                  <SectionStatus
                    key={section.id}
                    section={section}
                    status="completed"
                  />
                ))}
                
                {/* Error Sections */}
                {errorSections.map((section) => (
                  <SectionStatus
                    key={section.id}
                    section={section}
                    status="error"
                    onRetry={onRetry ? () => onRetry(section.id) : undefined}
                  />
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  {completedSections.length} completed
                </span>
                {errorSections.length > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    {errorSections.length} failed
                  </span>
                )}
              </div>
              <span>{loadingSections.length} loading</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface SectionStatusProps {
  section: LoadingSection;
  status: 'loading' | 'completed' | 'error';
  onRetry?: () => void;
}

const SectionStatus: React.FC<SectionStatusProps> = ({ section, status, onRetry }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return section.progress !== undefined && section.progress > 0 
          ? `${section.progress}%` 
          : 'Loading...';
      case 'completed':
        return 'Completed';
      case 'error':
        return section.error || 'Failed';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
      <div className="flex items-center gap-2 flex-1">
        {getStatusIcon()}
        <span className="text-sm text-card-foreground">{section.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {getStatusText()}
        </span>
        {status === 'error' && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;