import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRetryWithBackoff } from '@/hooks/useRetryWithBackoff';
import { useToast } from '@/hooks/use-toast';

interface DataSection {
  id: string;
  name: string;
  data: any;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isStale: boolean;
}

interface PartialDataContextType {
  sections: Record<string, DataSection>;
  updateSection: (id: string, updates: Partial<DataSection>) => void;
  loadSection: <T>(id: string, loader: () => Promise<T>, options?: LoadSectionOptions) => Promise<T | null>;
  refreshSection: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  hasErrors: boolean;
  hasStaleData: boolean;
  isAnyLoading: boolean;
}

interface LoadSectionOptions {
  showToastOnError?: boolean;
  retryOnError?: boolean;
  staleThreshold?: number; // in minutes
}

const PartialDataContext = createContext<PartialDataContextType | null>(null);

interface PartialDataProviderProps {
  children: React.ReactNode;
  staleThreshold?: number; // global stale threshold in minutes
}

export const PartialDataProvider: React.FC<PartialDataProviderProps> = ({ 
  children, 
  staleThreshold = 10 
}) => {
  const [sections, setSections] = useState<Record<string, DataSection>>({});
  const { toast } = useToast();
  const retryHook = useRetryWithBackoff({
    maxRetries: 3,
    initialDelay: 2000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt} for data loading:`, error.message);
    },
    onMaxRetriesReached: (error) => {
      toast({
        title: 'Failed to Load Data',
        description: `Unable to load data after multiple attempts: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update a specific section
  const updateSection = useCallback((id: string, updates: Partial<DataSection>) => {
    setSections(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
        // Update stale status if lastUpdated is being set
        ...(updates.lastUpdated && {
          isStale: updates.lastUpdated 
            ? (Date.now() - updates.lastUpdated.getTime()) > (staleThreshold * 60 * 1000)
            : false
        })
      }
    }));
  }, [staleThreshold]);

  // Initialize a section if it doesn't exist
  const initializeSection = useCallback((id: string, name: string) => {
    setSections(prev => {
      if (prev[id]) return prev;
      
      return {
        ...prev,
        [id]: {
          id,
          name,
          data: null,
          isLoading: false,
          error: null,
          lastUpdated: null,
          isStale: false
        }
      };
    });
  }, []);

  // Load data for a specific section
  const loadSection = useCallback(async <T>(
    id: string, 
    loader: () => Promise<T>,
    options: LoadSectionOptions = {}
  ): Promise<T | null> => {
    const { 
      showToastOnError = true, 
      retryOnError = true,
      staleThreshold: sectionStaleThreshold = staleThreshold 
    } = options;

    // Initialize section if it doesn't exist
    if (!sections[id]) {
      initializeSection(id, id);
    }

    // Set loading state
    updateSection(id, { isLoading: true, error: null });

    try {
      const loadWithRetry = retryOnError ? retryHook.executeWithRetry : (op: () => Promise<T>) => op();
      
      const data = await loadWithRetry(loader);
      
      // Update section with successful data
      updateSection(id, {
        data,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
        isStale: false
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update section with error
      updateSection(id, {
        isLoading: false,
        error: errorMessage
      });

      if (showToastOnError) {
        toast({
          title: `Failed to Load ${sections[id]?.name || id}`,
          description: errorMessage,
          variant: 'destructive',
        });
      }

      return null;
    }
  }, [sections, updateSection, initializeSection, retryHook, toast, staleThreshold]);

  // Refresh a specific section
  const refreshSection = useCallback(async (id: string) => {
    const section = sections[id];
    if (!section) return;

    // This would need to be implemented by the consumer
    // For now, we just clear the error and mark as loading
    updateSection(id, { isLoading: true, error: null });
  }, [sections, updateSection]);

  // Refresh all sections
  const refreshAll = useCallback(async () => {
    const refreshPromises = Object.keys(sections).map(id => refreshSection(id));
    await Promise.allSettled(refreshPromises);
  }, [sections, refreshSection]);

  // Check for stale data periodically
  useEffect(() => {
    const checkStaleData = () => {
      const now = Date.now();
      setSections(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(id => {
          const section = updated[id];
          if (section.lastUpdated) {
            const isStale = (now - section.lastUpdated.getTime()) > (staleThreshold * 60 * 1000);
            if (section.isStale !== isStale) {
              updated[id] = { ...section, isStale };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    };

    // Check immediately and then every minute
    checkStaleData();
    const interval = setInterval(checkStaleData, 60000);
    
    return () => clearInterval(interval);
  }, [staleThreshold]);

  // Computed properties
  const hasErrors = Object.values(sections).some(section => section.error !== null);
  const hasStaleData = Object.values(sections).some(section => section.isStale);
  const isAnyLoading = Object.values(sections).some(section => section.isLoading);

  const contextValue: PartialDataContextType = {
    sections,
    updateSection,
    loadSection,
    refreshSection,
    refreshAll,
    hasErrors,
    hasStaleData,
    isAnyLoading
  };

  return (
    <PartialDataContext.Provider value={contextValue}>
      {children}
    </PartialDataContext.Provider>
  );
};

// Hook to use the partial data context
export const usePartialData = () => {
  const context = useContext(PartialDataContext);
  if (!context) {
    throw new Error('usePartialData must be used within a PartialDataProvider');
  }
  return context;
};

// Hook to use a specific data section
export const useDataSection = (id: string, name?: string) => {
  const { sections, updateSection, loadSection, refreshSection } = usePartialData();
  
  const section = sections[id] || {
    id,
    name: name || id,
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    isStale: false
  };

  const load = useCallback(<T>(
    loader: () => Promise<T>,
    options?: LoadSectionOptions
  ) => {
    return loadSection(id, loader, options);
  }, [id, loadSection]);

  const refresh = useCallback(() => {
    return refreshSection(id);
  }, [id, refreshSection]);

  const update = useCallback((updates: Partial<DataSection>) => {
    updateSection(id, updates);
  }, [id, updateSection]);

  return {
    ...section,
    load,
    refresh,
    update
  };
};

export default PartialDataProvider;