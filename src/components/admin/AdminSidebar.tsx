import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  Menu,
  X,
  Maximize2,
  Minimize2,
  MousePointer,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import Logo from '@/components/Logo';
import { mainNavItems, hasRequiredAccess, backToMainAppItem } from '@/config/adminNav';
import { useSidebarStatePersistence, type SidebarMode } from '@/hooks/useSidebarStatePersistence';
import { sidebarStateService } from '@/services/sidebarStateService';

// Function to filter navigation items based on user role
const getFilteredNavItems = (user: unknown) => {
  return mainNavItems.filter(item => hasRequiredAccess(user, item.requiredAccess));
};

// Get active section based on current path
const getActiveSection = (pathname: string): string => {
  for (const item of mainNavItems) {
    if (pathname.startsWith(item.href)) {
      return item.id;
    }
  }
  return mainNavItems[0]?.id || 'dashboard';
};

// Desktop Admin Sidebar Component with 3-state functionality
const DesktopAdminSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // Dynamic TopBar offset (including banner)
  const [topBarHeight, setTopBarHeight] = useState<number>(0);
  useEffect(() => {
    const onTopbarHeight = (e: Event) => {
      const detail = (e as CustomEvent).detail as { height?: number };
      if (detail && typeof detail.height === 'number') setTopBarHeight(detail.height);
    };
    window.addEventListener('admin-topbar-height', onTopbarHeight as EventListener);
    window.dispatchEvent(new CustomEvent('request-admin-topbar-height'));
    return () => window.removeEventListener('admin-topbar-height', onTopbarHeight as EventListener);
  }, []);

  // Use the enhanced sidebar state persistence hook
  const {
    sidebarState,
    changeSidebarMode,
    setHoverState,
    displayProperties,
    config,
    storageAvailable,
  } = useSidebarStatePersistence({
    persistState: true,
    defaultMode: 'collapsed',
    transitionDuration: 300,
    hoverDelay: 150,
  });

  // Get active section based on current path
  const activeSection = getActiveSection(location.pathname);

  // Filter navigation items based on user role
  const filteredNavItems = getFilteredNavItems(user);

  // Extract display properties from the hook
  const { isExpanded, showText, currentWidth, layoutWidth, isOverlay } = displayProperties;

  // Dispatch width changes to layout
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', {
      detail: { width: layoutWidth }
    }));
  }, [layoutWidth]);

  // Set up cross-tab synchronization
  useEffect(() => {
    const cleanup = sidebarStateService.addSyncListener((syncedState) => {
      // Update local state when other tabs change the sidebar state
      if (syncedState.mode !== sidebarState.mode) {
        changeSidebarMode(syncedState.mode);
      }
    });

    return cleanup;
  }, [sidebarState.mode, changeSidebarMode]);

  // Handle mouse enter with delay for expand-on-hover mode
  const handleMouseEnter = () => {
    if (sidebarState.mode === 'expand-on-hover') {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // Set hover state immediately for responsive feel
      setHoverState(true);
    }
  };

  // Handle mouse leave with delay for expand-on-hover mode
  const handleMouseLeave = () => {
    if (sidebarState.mode === 'expand-on-hover' && !isDropdownOpen) {
      // Add small delay before collapsing to prevent flickering
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState(false);
      }, config.hoverDelay);
    }
  };

  // Handle dropdown state changes
  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);

    // Clear any pending collapse timeout when dropdown opens
    if (open && hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // If dropdown closes and we're in expand-on-hover mode, check if we should collapse
    if (!open && sidebarState.mode === 'expand-on-hover') {
      // Small delay to allow user to move mouse back to sidebar if needed
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState(false);
      }, 300);
    }
  };

  // Add global mouse event listener when dropdown is open to prevent collapse
  useEffect(() => {
    if (isDropdownOpen && sidebarState.mode === 'expand-on-hover') {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        // Clear any pending timeout while dropdown is open
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isDropdownOpen, sidebarState.mode]);

  // Handle sidebar mode change
  const handleModeChange = (mode: SidebarMode) => {
    changeSidebarMode(mode);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Base sidebar - always 64px when collapsed or expand-on-hover */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 bg-card border-r border-border shadow-sm transition-all duration-300 z-40 overflow-y-auto",
          currentWidth === 64 ? "w-16" : "w-64"
        )}
        style={{ top: topBarHeight, height: `calc(100vh - ${topBarHeight}px)` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content when not expanded or when expanded mode */}
        {(!isOverlay || sidebarState.mode === 'expanded') && (
          <>
            {/* Navigation Items */}
            <div className="flex-1 py-4 pt-6">
              {/* Back to Main App */}
              {showText ? (
                <div className="px-4 mb-4">
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <NavLink to={backToMainAppItem.href}>
                      <backToMainAppItem.icon className="h-4 w-4 mr-2" />
                      {backToMainAppItem.title}
                    </NavLink>
                  </Button>
                </div>
              ) : (
                <div className="px-2 mb-4">
                  <Button variant="outline" size="icon" asChild className="w-full">
                    <NavLink to={backToMainAppItem.href} title={backToMainAppItem.title}>
                      <backToMainAppItem.icon className="h-4 w-4" />
                    </NavLink>
                  </Button>
                </div>
              )}

              {/* Main Navigation */}
              <nav className="space-y-2 px-2">
                {filteredNavItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.href}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary border-l-4 border-primary"
                          : "text-foreground/70 hover:text-foreground hover:bg-secondary border-l-4 border-transparent",
                        !showText && "justify-center px-3"
                      )}
                      title={!showText ? item.title : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {showText && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Footer with State Control */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
              <DropdownMenu onOpenChange={handleDropdownOpenChange}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Sidebar Options"
                    onMouseEnter={() => {
                      // Ensure sidebar stays expanded when hovering over dropdown trigger
                      if (sidebarState.mode === 'expand-on-hover' && hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                    }}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleModeChange('expanded')}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      sidebarState.mode === 'expanded' && "bg-primary/10 text-primary"
                    )}
                  >
                    <Maximize2 className="h-4 w-4" />
                    Expanded
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleModeChange('expand-on-hover')}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      sidebarState.mode === 'expand-on-hover' && "bg-primary/10 text-primary"
                    )}
                  >
                    <MousePointer className="h-4 w-4" />
                    Expand on Hover
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleModeChange('collapsed')}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      sidebarState.mode === 'collapsed' && "bg-primary/10 text-primary"
                    )}
                  >
                    <Minimize2 className="h-4 w-4" />
                    Collapsed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      {/* Overlay sidebar for expand-on-hover */}
      {isOverlay && (
        <div
          ref={overlayRef}
          className="fixed left-0 w-64 bg-card border-r border-border shadow-xl z-50 transition-all duration-300 overflow-y-auto"
          style={{ top: topBarHeight, height: `calc(100vh - ${topBarHeight}px)` }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Items */}
          <div className="flex-1 py-4 pt-6"> 
            {/* Back to Main App */}
            <div className="px-4 mb-4">
              <Button variant="outline" size="sm" asChild className="w-full justify-start">
                <NavLink to={backToMainAppItem.href}>
                  <backToMainAppItem.icon className="h-4 w-4 mr-2" />
                  {backToMainAppItem.title}
                </NavLink>
              </Button>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-2 px-2">
              {filteredNavItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "text-foreground/70 hover:text-foreground hover:bg-secondary border-l-4 border-transparent"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer with State Control */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
            <DropdownMenu onOpenChange={handleDropdownOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Sidebar Options"
                  onMouseEnter={() => {
                    // Ensure sidebar stays expanded when hovering over dropdown trigger
                    if (sidebarState.mode === 'expand-on-hover' && hoverTimeoutRef.current) {
                      clearTimeout(hoverTimeoutRef.current);
                      hoverTimeoutRef.current = null;
                    }
                  }}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleModeChange('expanded')}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    sidebarState.mode === 'expanded' && "bg-primary/10 text-primary"
                  )}
                >
                  <Maximize2 className="h-4 w-4" />
                  Expanded
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleModeChange('expand-on-hover')}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    sidebarState.mode === 'expand-on-hover' && "bg-primary/10 text-primary"
                  )}
                >
                  <MousePointer className="h-4 w-4" />
                  Expand on Hover
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleModeChange('collapsed')}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    sidebarState.mode === 'collapsed' && "bg-primary/10 text-primary"
                  )}
                >
                  <Minimize2 className="h-4 w-4" />
                  Collapsed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </>
  );
};

// Mobile Admin Navigation (Overlay/Drawer with touch support)
const MobileAdminNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get filtered navigation items based on user role
  const filteredNavItems = getFilteredNavItems(user);
  const activeSection = getActiveSection(location.pathname);

  // Enhanced touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // Detect if user is dragging
    if (touchStart !== null && Math.abs(currentTouch - touchStart) > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Close drawer on left swipe
    if (isLeftSwipe && isDrawerOpen) {
      setIsDrawerOpen(false);
    }

    // Open drawer on right swipe (from left edge only)
    if (isRightSwipe && !isDrawerOpen && touchStart < 50) {
      setIsDrawerOpen(true);
    }
  };

  // Always close the drawer on overlay click for reliable UX
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDrawerOpen(false);
    }
  };

  const handleOpenSidebar = () => {
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    window.addEventListener('open-admin-sidebar', handleOpenSidebar);
    return () => {
      window.removeEventListener('open-admin-sidebar', handleOpenSidebar);
    };
  }, []);

  // Prevent body scroll when drawer is open and handle escape key
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsDrawerOpen(false);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isDrawerOpen]);

  return (
    <>
      {/* Hamburger button removed. TopBar now controls sidebar opening. */}

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          onClick={handleOverlayClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drawer Content */}
          <div
            className={cn(
              "fixed left-0 top-0 h-full w-[85%] max-w-sm bg-card shadow-xl transform transition-transform duration-300 ease-out border-r border-border",
              isDrawerOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between touch-manipulation bg-card/95 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  {/* Removed Logo - now in TopBar */}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Admin</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="touch-manipulation h-10 w-10"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Back to Main App */}
              <div className="p-4 border-b border-border bg-muted/30">
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-start touch-manipulation h-12 text-base"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <NavLink to={backToMainAppItem.href}>
                    <backToMainAppItem.icon className="h-5 w-5 mr-3" />
                    {backToMainAppItem.title}
                  </NavLink>
                </Button>
              </div>

              {/* Simplified Navigation - No sub-sidebars */}
              <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                <nav className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-4">
                    Admin Sections
                  </div>
                  {filteredNavItems.map((item) => {
                    const isActive = activeSection === item.id;

                    return (
                      <NavLink
                        key={item.id}
                        to={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 touch-manipulation text-base font-medium",
                          isActive
                            ? "bg-primary/15 text-primary border-l-4 border-primary shadow-sm"
                            : "text-foreground/80 hover:text-foreground hover:bg-secondary/60 active:bg-secondary/80 border-l-4 border-transparent hover:border-l-4 hover:border-primary/30"
                        )}
                        aria-label={`Navigate to ${item.title}`}
                      >
                        <item.icon className="h-6 w-6 flex-shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Footer with app info */}
              <div className="p-4 border-t border-border bg-muted/20">
                <div className="text-center text-xs text-muted-foreground">
                  Dealermate Admin Panel
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced swipe area for opening drawer */}
      <div
        className="fixed left-0 top-0 w-6 h-full z-40 md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-x' }}
        aria-label="Swipe right to open navigation"
      />
    </>
  );
};

// Main AdminSidebar component that decides which version to show
const AdminSidebar = () => {
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && <DesktopAdminSidebar />}
      {isMobile && <MobileAdminNavigation />}
    </>
  );
};

export default AdminSidebar;