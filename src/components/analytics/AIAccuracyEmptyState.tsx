import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  Calendar, 
  Bot, 
  User, 
  BarChart3,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAccuracyEmptyStateProps {
  title: string;
  message: string;
  suggestions: string[];
  onReset?: () => void;
  onRefresh?: () => void;
  type?: 'no-data' | 'no-results' | 'error';
  className?: string;
}

export const AIAccuracyEmptyState: React.FC<AIAccuracyEmptyStateProps> = ({
  title,
  message,
  suggestions,
  onReset,
  onRefresh,
  type = 'no-results',
  className
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      case 'no-data':
        return <BarChart3 className="h-12 w-12 text-muted-foreground" />;
      default:
        return <Search className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getAlertVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Card className={cn("min-h-[400px]", className)}>
      <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="mb-6">
          {getIcon()}
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
        
        {suggestions.length > 0 && (
          <Alert variant={getAlertVariant()} className="mb-6 max-w-md">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Try these suggestions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
          
          {onRefresh && (
            <Button variant="default" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Specialized empty state components for different scenarios

export const NoDataEmptyState: React.FC<{
  dataType: string;
  onRefresh?: () => void;
  className?: string;
}> = ({ dataType, onRefresh, className }) => (
  <AIAccuracyEmptyState
    title={`No ${dataType} Available`}
    message="There is no data available for the selected time period. This could be because no calls have been made or evaluations haven't been generated yet."
    suggestions={[
      'Check if calls have been made during this period',
      'Verify that AI models are properly configured',
      'Ensure evaluations are being generated for calls',
      'Contact support if the issue persists'
    ]}
    type="no-data"
    onRefresh={onRefresh}
    className={className}
  />
);

export const NoResultsEmptyState: React.FC<{
  dataType: string;
  hasFilters: boolean;
  onReset?: () => void;
  onRefresh?: () => void;
  className?: string;
}> = ({ dataType, hasFilters, onReset, onRefresh, className }) => (
  <AIAccuracyEmptyState
    title={`No ${dataType} Found`}
    message={hasFilters 
      ? "No data matches your current filter criteria. Try adjusting your filters to see more results."
      : "No data is available for the selected time period."
    }
    suggestions={hasFilters ? [
      'Try expanding the date range',
      'Remove some filters to see more data',
      'Select a different AI model or client',
      'Lower the accuracy threshold if applied',
      'Clear all filters to see all available data'
    ] : [
      'Check if calls have been made during this period',
      'Verify that AI models are properly configured',
      'Ensure evaluations are being generated for calls'
    ]}
    type="no-results"
    onReset={hasFilters ? onReset : undefined}
    onRefresh={onRefresh}
    className={className}
  />
);

export const ErrorEmptyState: React.FC<{
  error: string;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className }) => (
  <AIAccuracyEmptyState
    title="Error Loading Data"
    message={error || "An unexpected error occurred while loading the data."}
    suggestions={[
      'Check your internet connection',
      'Try refreshing the page',
      'Contact support if the issue persists'
    ]}
    type="error"
    onRefresh={onRetry}
    className={className}
  />
);

// Specialized empty states for different drill-down levels

export const ModelEmptyState: React.FC<{
  modelName?: string;
  onReset?: () => void;
  className?: string;
}> = ({ modelName, onReset, className }) => (
  <AIAccuracyEmptyState
    title={`No Data for ${modelName || 'Selected Model'}`}
    message="This model doesn't have any data for the selected time period or filter criteria."
    suggestions={[
      'Try expanding the date range',
      'Check if this model was used during the selected period',
      'Remove other filters to see if data exists',
      'Select a different model to analyze'
    ]}
    type="no-results"
    onReset={onReset}
    className={className}
  />
);

export const ClientEmptyState: React.FC<{
  clientName?: string;
  onReset?: () => void;
  className?: string;
}> = ({ clientName, onReset, className }) => (
  <AIAccuracyEmptyState
    title={`No Data for ${clientName || 'Selected Client'}`}
    message="This client doesn't have any call data for the selected time period or filter criteria."
    suggestions={[
      'Try expanding the date range',
      'Check if this client had calls during the selected period',
      'Remove other filters to see if data exists',
      'Select a different client to analyze'
    ]}
    type="no-results"
    onReset={onReset}
    className={className}
  />
);

export const FailureEmptyState: React.FC<{
  failureCategory?: string;
  onReset?: () => void;
  className?: string;
}> = ({ failureCategory, onReset, className }) => (
  <AIAccuracyEmptyState
    title={`No ${failureCategory || 'Failure'} Data Found`}
    message="No failures of this type were found for the selected time period or filter criteria."
    suggestions={[
      'Try expanding the date range',
      'Remove other filters to see if failures exist',
      'Check a different failure category',
      'This could indicate good performance - no failures of this type!'
    ]}
    type="no-results"
    onReset={onReset}
    className={className}
  />
);

// Loading state component for consistency
export const LoadingEmptyState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = "Loading data...", className }) => (
  <Card className={cn("min-h-[400px]", className)}>
    <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-6">
        <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Loading</h3>
      <p className="text-muted-foreground">{message}</p>
    </CardContent>
  </Card>
);