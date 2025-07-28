import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadingStates, LoadingState, UseLoadingStatesOptions } from '@/hooks/useLoadingStates';
import { useToast } from '@/hooks/use-toast';

interface LoadingStatesContextValue {
  loadingState: LoadingState;
  startLoading: (sectionId: string, progress?: number) => void;
  setProgress: (sectionId: string, progress: number) => void;
  completeLoading: (sectionId: string, data?: any) => void;
  setError: (sectionId: string, error: string) => void;
  loadSection: (sectionId: string, loadFn: () => Promise<any>, options?: { timeout?: number; retries?: number }) => Promise<any>;
  loadAllSections: (loadFunctions: Record<string, () => Promise<any>>, options?: { parallel?: boolean; timeout?: number }) => Promise<any>;
  retrySection: (sectionId: string, retryFn: () => Promise<any>) => Promise<any>;
  reset: () => void;
  getSection: (sectionId: string) => any;
  getSectionRetry: (sectionId: string) => (retryFn: () => Promise<any>) => Promise<any>;
  isLoading: boolean;
  hasErrors: boolean;
  completedSections: any[];
  loadingSections: any[];
  errorSections: any[];
}

const LoadingStatesContext = createContext<LoadingStatesContextValue | null>(null);

interface LoadingStatesProviderProps {
  children: ReactNode;
  sections: Array<{ id: string; name: string }>;
  showToasts?: boolean;
}

export const LoadingStatesProvider: React.FC<LoadingStatesProviderProps> = ({
  children,
  sections,
  showToasts = true
}) => {
  const { toast } = useToast();

  const options: UseLoadingStatesOptions = {
    sections,
    onError: showToasts ? (sectionId: string, error: string) => {
      const section = sections.find(s => s.id === sectionId);
      toast({
        title: `Error Loading ${section?.name || sectionId}`,
        description: error,
        variant: 'destructive',
      });
    } : undefined,
    onComplete: showToasts ? () => {
      toast({
        title: 'Dashboard Loaded',
        description: 'All sections have been loaded successfully.',
        variant: 'default',
      });
    } : undefined
  };

  const loadingStates = useLoadingStates(options);

  const contextValue: LoadingStatesContextValue = {
    loadingState: loadingStates.state,
    ...loadingStates
  };

  return (
    <LoadingStatesContext.Provider value={contextValue}>
      {children}
    </LoadingStatesContext.Provider>
  );
};

export const useLoadingStatesContext = (): LoadingStatesContextValue => {
  const context = useContext(LoadingStatesContext);
  if (!context) {
    throw new Error('useLoadingStatesContext must be used within a LoadingStatesProvider');
  }
  return context;
};

// Hook for individual sections to manage their loading state
export const useSectionLoading = (sectionId: string) => {
  const context = useLoadingStatesContext();
  const section = context.getSection(sectionId);
  
  return {
    section,
    isLoading: section?.isLoading || false,
    error: section?.error || null,
    lastUpdated: section?.lastUpdated || null,
    progress: section?.progress || 0,
    startLoading: (progress?: number) => context.startLoading(sectionId, progress),
    setProgress: (progress: number) => context.setProgress(sectionId, progress),
    completeLoading: (data?: any) => context.completeLoading(sectionId, data),
    setError: (error: string) => context.setError(sectionId, error),
    loadSection: (loadFn: () => Promise<any>, options?: { timeout?: number; retries?: number }) => 
      context.loadSection(sectionId, loadFn, options),
    retry: context.getSectionRetry(sectionId)
  };
};

export default LoadingStatesProvider;