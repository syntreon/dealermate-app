import { useState, useEffect, useCallback } from 'react';
import { withErrorRecovery } from '@/utils/sidebarErrorRecovery';

// Sidebar state type definition
export type SidebarMode = 'expanded' | 'collapsed' | 'expand-on-hover';

export interface SidebarState {
  mode: SidebarMode;
  isHovered: boolean;
  width: number;
  isTransitioning: boolean;
}

export interface SidebarConfig {
  persistState: boolean;
  defaultMode: SidebarMode;
  transitionDuration: number;
  hoverDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: SidebarConfig = {
  persistState: true,
  defaultMode: 'collapsed',
  transitionDuration: 300,
  hoverDelay: 150,
};

// Default state
const DEFAULT_STATE: SidebarState = {
  mode: 'collapsed',
  isHovered: false,
  width: 64,
  isTransitioning: false,
};

// Storage key for sidebar state
const STORAGE_KEY = 'admin-sidebar-state';

// Utility functions for localStorage operations with error handling
const saveToStorage = async (state: Partial<SidebarState>): Promise<boolean> => {
  return withErrorRecovery(
    () => {
      const dataToSave = {
        mode: state.mode,
        timestamp: Date.now(),
        version: '1.0', // For future compatibility
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      return true;
    },
    'saveToStorage',
    false
  );
};

const loadFromStorage = async (): Promise<Partial<SidebarState> | null> => {
  return withErrorRecovery(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      
      // Validate the loaded data
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid saved data format');
      }

      // Check if data is too old (optional: expire after 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (parsed.timestamp && parsed.timestamp < thirtyDaysAgo) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Validate mode value
      const validModes: SidebarMode[] = ['expanded', 'collapsed', 'expand-on-hover'];
      if (!validModes.includes(parsed.mode)) {
        throw new Error('Invalid sidebar mode');
      }

      return {
        mode: parsed.mode,
      };
    },
    'loadFromStorage',
    null
  );
};

// Test localStorage availability
const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__sidebar_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Custom hook for managing sidebar state with persistence
 * 
 * Features:
 * - Automatic state persistence to localStorage
 * - Error handling for localStorage failures
 * - State recovery on page reload
 * - Configurable default behavior
 * - Cross-browser session persistence
 */
export const useSidebarStatePersistence = (config: Partial<SidebarConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const storageAvailable = isStorageAvailable();

  // Initialize state with persistence recovery
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    // If persistence is disabled or storage unavailable, use default
    if (!finalConfig.persistState || !storageAvailable) {
      return {
        ...DEFAULT_STATE,
        mode: finalConfig.defaultMode,
        width: finalConfig.defaultMode === 'expanded' ? 256 : 64,
      };
    }

    // Default state for initial render (will be updated by useEffect)
    return {
      ...DEFAULT_STATE,
      mode: finalConfig.defaultMode,
      width: finalConfig.defaultMode === 'expanded' ? 256 : 64,
    };
  });

  // Load state from storage after component mounts
  useEffect(() => {
    if (!finalConfig.persistState || !storageAvailable) return;

    const loadState = async () => {
      const savedState = await loadFromStorage();
      if (savedState && savedState.mode) {
        setSidebarState(prev => ({
          ...prev,
          mode: savedState.mode!,
          width: savedState.mode === 'expanded' ? 256 : 64,
        }));
      }
    };

    loadState();
  }, [finalConfig.persistState, storageAvailable]);

  // Save state to localStorage when mode changes
  useEffect(() => {
    if (finalConfig.persistState && storageAvailable) {
      const saveState = async () => {
        const success = await saveToStorage(sidebarState);
        if (!success) {
          console.warn('Sidebar state persistence failed - continuing without persistence');
        }
      };
      
      saveState();
    }
  }, [sidebarState.mode, finalConfig.persistState, storageAvailable]);

  // Update sidebar state with validation
  const updateSidebarState = useCallback((updates: Partial<SidebarState>) => {
    setSidebarState(prev => {
      const newState = { ...prev, ...updates };
      
      // Ensure width is consistent with mode
      if (updates.mode) {
        newState.width = updates.mode === 'expanded' ? 256 : 64;
      }
      
      return newState;
    });
  }, []);

  // Change sidebar mode with transition handling
  const changeSidebarMode = useCallback((mode: SidebarMode) => {
    setSidebarState(prev => ({
      ...prev,
      mode,
      width: mode === 'expanded' ? 256 : 64,
      isHovered: mode === 'expand-on-hover' ? prev.isHovered : false,
      isTransitioning: true,
    }));

    // Clear transition state after animation
    setTimeout(() => {
      setSidebarState(prev => ({ ...prev, isTransitioning: false }));
    }, finalConfig.transitionDuration);
  }, [finalConfig.transitionDuration]);

  // Set hover state for expand-on-hover mode
  const setHoverState = useCallback((isHovered: boolean) => {
    setSidebarState(prev => ({
      ...prev,
      isHovered: prev.mode === 'expand-on-hover' ? isHovered : false,
    }));
  }, []);

  // Clear all stored state (useful for debugging or reset functionality)
  const clearStoredState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.warn('Failed to clear stored sidebar state:', error);
      return false;
    }
  }, []);

  // Get current display properties
  const displayProperties = {
    isExpanded: sidebarState.mode === 'expanded' || 
                (sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered),
    showText: sidebarState.mode === 'expanded' || 
              (sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered),
    currentWidth: sidebarState.mode === 'expanded' ? 256 : 64,
    layoutWidth: sidebarState.mode === 'expanded' ? 256 : 64, // Width that affects layout
    isOverlay: sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered,
  };

  return {
    sidebarState,
    updateSidebarState,
    changeSidebarMode,
    setHoverState,
    clearStoredState,
    displayProperties,
    config: finalConfig,
    storageAvailable,
  };
};

// Utility hook for components that need to listen to sidebar width changes
export const useSidebarWidth = () => {
  const [width, setWidth] = useState(64); // Default collapsed width

  useEffect(() => {
    const handleSidebarResize = (event: CustomEvent<{ width: number }>) => {
      setWidth(event.detail.width);
    };

    window.addEventListener('admin-sidebar-resize', handleSidebarResize as EventListener);
    
    return () => {
      window.removeEventListener('admin-sidebar-resize', handleSidebarResize as EventListener);
    };
  }, []);

  return width;
};

export default useSidebarStatePersistence;