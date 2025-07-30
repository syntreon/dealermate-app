import { renderHook, act } from '@testing-library/react';
import { useSidebarStatePersistence } from '../useSidebarStatePersistence';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

beforeEach(() => {
  localStorageMock.clear();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
});

describe('useSidebarStatePersistence', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    expect(result.current.sidebarState.mode).toBe('collapsed');
    expect(result.current.sidebarState.width).toBe(64);
    expect(result.current.sidebarState.isHovered).toBe(false);
    expect(result.current.sidebarState.isTransitioning).toBe(false);
  });

  it('should initialize with custom default mode', () => {
    const { result } = renderHook(() => 
      useSidebarStatePersistence({ defaultMode: 'expanded' })
    );

    expect(result.current.sidebarState.mode).toBe('expanded');
    expect(result.current.sidebarState.width).toBe(256);
  });

  it('should change sidebar mode correctly', async () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    expect(result.current.sidebarState.mode).toBe('expanded');
    expect(result.current.sidebarState.width).toBe(256);
  });

  it('should set hover state for expand-on-hover mode', async () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      result.current.changeSidebarMode('expand-on-hover');
    });

    await act(async () => {
      result.current.setHoverState(true);
    });

    expect(result.current.sidebarState.isHovered).toBe(true);
  });

  it('should not set hover state for non-expand-on-hover modes', async () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    await act(async () => {
      result.current.setHoverState(true);
    });

    expect(result.current.sidebarState.isHovered).toBe(false);
  });

  it('should calculate display properties correctly', async () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    // Test collapsed mode
    expect(result.current.displayProperties.isExpanded).toBe(false);
    expect(result.current.displayProperties.showText).toBe(false);
    expect(result.current.displayProperties.currentWidth).toBe(64);
    expect(result.current.displayProperties.isOverlay).toBe(false);

    // Test expanded mode
    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    expect(result.current.displayProperties.isExpanded).toBe(true);
    expect(result.current.displayProperties.showText).toBe(true);
    expect(result.current.displayProperties.currentWidth).toBe(256);
    expect(result.current.displayProperties.isOverlay).toBe(false);

    // Test expand-on-hover mode with hover
    await act(async () => {
      result.current.changeSidebarMode('expand-on-hover');
    });

    await act(async () => {
      result.current.setHoverState(true);
    });

    expect(result.current.displayProperties.isExpanded).toBe(true);
    expect(result.current.displayProperties.showText).toBe(true);
    expect(result.current.displayProperties.currentWidth).toBe(64); // Base width
    expect(result.current.displayProperties.isOverlay).toBe(true);
  });

  it('should persist state to localStorage', async () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    // Wait for async save
    await new Promise(resolve => setTimeout(resolve, 100));

    const saved = localStorage.getItem('admin-sidebar-state');
    expect(saved).toBeTruthy();
    
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.mode).toBe('expanded');
    }
  });

  it('should load state from localStorage', async () => {
    // Pre-populate localStorage
    const savedState = {
      mode: 'expand-on-hover',
      timestamp: Date.now(),
      version: '1.0',
    };
    localStorage.setItem('admin-sidebar-state', JSON.stringify(savedState));

    const { result } = renderHook(() => useSidebarStatePersistence());

    // Wait for async load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.sidebarState.mode).toBe('expand-on-hover');
  });

  it('should handle corrupted localStorage data gracefully', async () => {
    // Set corrupted data
    localStorage.setItem('admin-sidebar-state', 'invalid json');

    const { result } = renderHook(() => useSidebarStatePersistence());

    // Should fall back to default
    expect(result.current.sidebarState.mode).toBe('collapsed');
  });

  it('should clear stored state', async () => {
    const { result } = renderHook(() => useSidebarStatePersistence());

    await act(async () => {
      result.current.changeSidebarMode('expanded');
    });

    // Wait for save
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(localStorage.getItem('admin-sidebar-state')).toBeTruthy();

    await act(async () => {
      result.current.clearStoredState();
    });

    expect(localStorage.getItem('admin-sidebar-state')).toBeNull();
  });

  it('should work without localStorage', () => {
    // Mock localStorage as unavailable
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useSidebarStatePersistence());

    expect(result.current.storageAvailable).toBe(false);
    expect(result.current.sidebarState.mode).toBe('collapsed');

    // Should still allow mode changes
    act(() => {
      result.current.changeSidebarMode('expanded');
    });

    expect(result.current.sidebarState.mode).toBe('expanded');

    // Restore localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it('should handle expired data', async () => {
    // Set expired data (older than 30 days)
    const expiredState = {
      mode: 'expanded',
      timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 days ago
      version: '1.0',
    };
    localStorage.setItem('admin-sidebar-state', JSON.stringify(expiredState));

    const { result } = renderHook(() => useSidebarStatePersistence());

    // Wait for async load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should use default mode, not expired data
    expect(result.current.sidebarState.mode).toBe('collapsed');
    
    // Expired data should be cleaned up
    expect(localStorage.getItem('admin-sidebar-state')).toBeNull();
  });

  it('should disable persistence when configured', () => {
    const { result } = renderHook(() => 
      useSidebarStatePersistence({ persistState: false })
    );

    act(() => {
      result.current.changeSidebarMode('expanded');
    });

    // Should not save to localStorage
    expect(localStorage.getItem('admin-sidebar-state')).toBeNull();
  });
});

describe('useSidebarWidth', () => {
  it('should initialize with default width', () => {
    const { useSidebarWidth } = require('../useSidebarStatePersistence');
    const { result } = renderHook(() => useSidebarWidth());

    expect(result.current).toBe(64);
  });

  it('should update width on custom event', () => {
    const { useSidebarWidth } = require('../useSidebarStatePersistence');
    const { result } = renderHook(() => useSidebarWidth());

    act(() => {
      window.dispatchEvent(new CustomEvent('admin-sidebar-resize', {
        detail: { width: 256 }
      }));
    });

    expect(result.current).toBe(256);
  });
});