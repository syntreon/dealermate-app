import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  sectionName: string;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void; sectionName: string }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showNavigation?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary specifically designed for admin section layouts
 * Provides recovery options and navigation fallbacks
 */
class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`${this.props.sectionName} section error:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error tracking service if available
    if (typeof window !== 'undefined' && (window as any).errorTracker) {
      (window as any).errorTracker.captureException(error, {
        tags: {
          section: this.props.sectionName,
          component: 'SectionErrorBoundary'
        },
        extra: errorInfo
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.resetError}
            sectionName={this.props.sectionName}
          />
        );
      }

      // Default error display with recovery options
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full bg-card text-card-foreground border-destructive/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  {this.props.sectionName} Section Error
                </h2>
                <p className="text-muted-foreground mb-6">
                  Something went wrong while loading this section. This might be due to a 
                  temporary issue or a problem with the data source.
                </p>
                
                {/* Error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2">
                      Technical Details
                    </summary>
                    <div className="p-3 bg-muted rounded-md text-xs font-mono text-left overflow-auto max-h-40">
                      <div className="text-destructive font-semibold mb-2">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="text-muted-foreground whitespace-pre-wrap text-xs">
                          {this.state.error.stack}
                        </pre>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="text-muted-foreground text-xs mb-1">Component Stack:</div>
                          <pre className="text-muted-foreground whitespace-pre-wrap text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
                
                {/* Recovery actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={this.resetError}
                    className="gap-2"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  
                  {this.props.showNavigation !== false && (
                    <NavigationButtons />
                  )}
                </div>
                
                {/* Additional help */}
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    If this problem persists, try refreshing the page or contact support.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Navigation buttons component for error recovery
 */
const NavigationButtons: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Button 
        onClick={() => navigate(-1)}
        variant="outline"
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Button>
      
      <Button 
        onClick={() => navigate('/admin/dashboard')}
        variant="outline"
        className="gap-2"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Button>
    </>
  );
};

export default SectionErrorBoundary;