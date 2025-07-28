import { useState, useCallback, useRef } from 'react';

export interface LoadingSection {
  id: string;
  name: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  progress?: number;
}

export interface LoadingState {
  isInitialLoading: boolean;
  isRefreshing: boolean;
  sections: Record<string, LoadingSection>;
  overallProgress: number;
  stage: 'initial' | 'partial' | 'complete';
}

export interface UseLoadingStatesOptions {
  sections: Array<{ id: string; name: string }>;
  onError?: (sectionId: string, error: string) => void;
  onComplete?: () => void;
}

export const useLoadingStates = (options: UseLoadingStatesOptions) => {
  const { sections: sectionConfigs, onError, onComplete } = options;
  
  const [state, setState] = useState<LoadingState>(() => {
    const sections: Record<string, LoadingSection> = {};
    sectionConfigs.forEach(({ id, name }) => {
      sections[id] = {
        id,
        name,
        isLoading: false,
        error: null,
        lastUpdated: null,
        progress: 0
      };
    });

    return {
      isInitialLoading: false,
      isRefreshing: false,
      sections,
      overallProgress: 0,
      stage: 'initial'
    };
  });

  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const updateSection = useCallback((sectionId: string, updates: Partial<LoadingSection>) => {
    setState(prevState => {
      const updatedSection = { ...prevState.sections[sectionId], ...updates };
      const updatedSections = { ...prevState.sections, [sectionId]: updatedSection };
      
      // Calculate overall progress
      const totalSections = Object.keys(updatedSections).length;
      const completedSections = Object.values(updatedSections).filter(
        section => !section.isLoading && !section.error
      ).length;
      const overallProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
      
      // Determine stage
      const hasLoadingSections = Object.values(updatedSections).some(section => section.isLoading);
      const hasCompletedSections = Object.values(updatedSections).some(
        section => !section.isLoading && section.lastUpdated
      );
      
      let stage: 'initial' | 'partial' | 'complete' = 'initial';
      if (overallProgress === 100) {
        stage = 'complete';
      } else if (hasCompletedSections) {
        stage = 'partial';
      }

      const newState = {
        ...prevState,
        sections: updatedSections,
        overallProgress,
        stage,
        isInitialLoading: hasLoadingSections && !hasCompletedSections,
        isRefreshing: hasLoadingSections && hasCompletedSections
      };

      // Call completion callback if all sections are done
      if (stage === 'complete' && onComplete) {
        setTimeout(onComplete, 0);
      }

      return newState;
    });
  }, [onComplete]);

  const startLoading = useCallback((sectionId: string, progress = 0) => {
    updateSection(sectionId, {
      isLoading: true,
      error: null,
      progress
    });
  }, [updateSection]);

  const setProgress = useCallback((sectionId: string, progress: number) => {
    updateSection(sectionId, { progress });
  }, [updateSection]);

  const completeLoading = useCallback((sectionId: string, data?: any) => {
    updateSection(sectionId, {
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      progress: 100
    });
  }, [updateSection]);

  const setError = useCallback((sectionId: string, error: string) => {
    updateSection(sectionId, {
      isLoading: false,
      error,
      progress: 0
    });
    
    if (onError) {
      onError(sectionId, error);
    }
  }, [updateSection, onError]);

  const retrySection = useCallback(async (sectionId: string, retryFn: () => Promise<any>) => {
    try {
      startLoading(sectionId);
      const result = await retryFn();
      completeLoading(sectionId, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(sectionId, errorMessage);
      throw error;
    }
  }, [startLoading, completeLoading, setError]);

  const loadSection = useCallback(async (
    sectionId: string, 
    loadFn: () => Promise<any>,
    options?: { timeout?: number; retries?: number }
  ) => {
    const { timeout = 30000, retries = 2 } = options || {};
    
    let attempt = 0;
    
    const attemptLoad = async (): Promise<any> => {
      try {
        startLoading(sectionId);
        
        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
          timeoutRefs.current[sectionId] = setTimeout(() => {
            reject(new Error(`Loading ${sectionId} timed out after ${timeout}ms`));
          }, timeout);
        });
        
        // Race between load function and timeout
        const result = await Promise.race([loadFn(), timeoutPromise]);
        
        // Clear timeout
        if (timeoutRefs.current[sectionId]) {
          clearTimeout(timeoutRefs.current[sectionId]);
          delete timeoutRefs.current[sectionId];
        }
        
        completeLoading(sectionId, result);
        return result;
      } catch (error) {
        // Clear timeout on error
        if (timeoutRefs.current[sectionId]) {
          clearTimeout(timeoutRefs.current[sectionId]);
          delete timeoutRefs.current[sectionId];
        }
        
        attempt++;
        if (attempt <= retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          return attemptLoad();
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(sectionId, errorMessage);
          throw error;
        }
      }
    };
    
    return attemptLoad();
  }, [startLoading, completeLoading, setError]);

  const loadAllSections = useCallback(async (
    loadFunctions: Record<string, () => Promise<any>>,
    options?: { parallel?: boolean; timeout?: number }
  ) => {
    const { parallel = true, timeout = 30000 } = options || {};
    
    if (parallel) {
      // Load all sections in parallel
      const promises = Object.entries(loadFunctions).map(([sectionId, loadFn]) =>
        loadSection(sectionId, loadFn, { timeout })
      );
      
      return Promise.allSettled(promises);
    } else {
      // Load sections sequentially
      const results: any[] = [];
      for (const [sectionId, loadFn] of Object.entries(loadFunctions)) {
        try {
          const result = await loadSection(sectionId, loadFn, { timeout });
          results.push({ status: 'fulfilled', value: result });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        }
      }
      return results;
    }
  }, [loadSection]);

  const reset = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = {};
    
    setState(prevState => {
      const resetSections: Record<string, LoadingSection> = {};
      Object.keys(prevState.sections).forEach(sectionId => {
        resetSections[sectionId] = {
          ...prevState.sections[sectionId],
          isLoading: false,
          error: null,
          lastUpdated: null,
          progress: 0
        };
      });
      
      return {
        isInitialLoading: false,
        isRefreshing: false,
        sections: resetSections,
        overallProgress: 0,
        stage: 'initial'
      };
    });
  }, []);

  const getSection = useCallback((sectionId: string) => {
    return state.sections[sectionId];
  }, [state.sections]);

  const getSectionRetry = useCallback((sectionId: string) => {
    return (retryFn: () => Promise<any>) => retrySection(sectionId, retryFn);
  }, [retrySection]);

  return {
    state,
    startLoading,
    setProgress,
    completeLoading,
    setError,
    loadSection,
    loadAllSections,
    retrySection,
    reset,
    getSection,
    getSectionRetry,
    
    // Computed values
    isLoading: state.isInitialLoading || state.isRefreshing,
    hasErrors: Object.values(state.sections).some(section => section.error),
    completedSections: Object.values(state.sections).filter(
      section => !section.isLoading && section.lastUpdated
    ),
    loadingSections: Object.values(state.sections).filter(section => section.isLoading),
    errorSections: Object.values(state.sections).filter(section => section.error)
  };
};

export default useLoadingStates;