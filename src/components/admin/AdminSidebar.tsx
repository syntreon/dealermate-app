import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield,
  ChevronLeft,
  Menu,
  X,
  MoreVertical,
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

// Sidebar state type definition
type SidebarMode = 'expanded' | 'collapsed' | 'expand-on-hover';

interface SidebarState {
  mode: SidebarMode;
  isHovered: boolean;
  width: number;
}

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
  
  // Initialize sidebar state from localStorage
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    const saved = localStorage.getItem('admin-sidebar-state');
    const defaultState: SidebarState = {
      mode: 'collapsed', // Default to collapsed
      isHovered: false,
      width: 64
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          mode: parsed.mode || 'collapsed',
          isHovered: false, // Always start with false
          width: parsed.mode === 'collapsed' || parsed.mode === 'expand-on-hover' ? 64 : 256
        };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  // Get active section based on current path
  const activeSection = getActiveSection(location.pathname);
  
  // Filter navigation items based on user role
  const filteredNavItems = getFilteredNavItems(user);

  // Calculate display properties
  const isExpanded = sidebarState.mode === 'expanded' || 
                    (sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered);
  const showText = isExpanded;
  const currentWidth = sidebarState.mode === 'expanded' ? 256 : 64;
  const isOverlay = sidebarState.mode === 'expand-on-hover' && sidebarState.isHovered;

  // Save state to localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('admin-sidebar-state', JSON.stringify({
      mode: sidebarState.mode
    }));
  }, [sidebarState.mode]);

  // Dispatch width changes to layout (always 64px for collapsed/expand-on-hover)
  useEffect(() => {
    const layoutWidth = sidebarState.mode === 'expanded' ? 256 : 64;
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
      detail: { width: layoutWidth } 
    }));
  }, [sidebarState.mode]);

  // Initial width dispatch on mount to ensure layout adjusts correctly
  useEffect(() => {
    const layoutWidth = sidebarState.mode === 'expanded' ? 256 : 64;
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
      detail: { width: layoutWidth } 
    }));
  }, []); // Run once on mount

  // Handle mouse enter with delay for expand-on-hover mode
  const handleMouseEnter = () => {
    if (sidebarState.mode === 'expand-on-hover') {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      // Set hover state immediately for responsive feel
      setSidebarState(prev => ({ ...prev, isHovered: true }));
    }
  };

  // Handle mouse leave with delay for expand-on-hover mode
  const handleMouseLeave = () => {
    if (sidebarState.mode === 'expand-on-hover' && !isDropdownOpen) {
      // Add small delay before collapsing to prevent flickering
      hoverTimeoutRef.current = setTimeout(() => {
        setSidebarState(prev => ({ ...prev, isHovered: false }));
      }, 150); // Slightly longer delay for better UX
    }
  };

  // Handle sidebar mode change
  const handleModeChange = (mode: SidebarMode) => {
    setSidebarState(prev => ({
      ...prev,
      mode,
      // Only reset hover state if not in expand-on-hover mode or switching away from it
      isHovered: mode === 'expand-on-hover' ? prev.isHovered : false,
      width: mode === 'collapsed' || mode === 'expand-on-hover' ? 64 : 256
    }));
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
        className={cn(
          "fixed left-0 top-0 h-full bg-card border-r border-border shadow-sm transition-all duration-300 z-40",
          currentWidth === 64 ? "w-16" : "w-64"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Content when not expanded or when expanded mode */}
        {(!isOverlay || sidebarState.mode === 'expanded') && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                {showText ? (
                  <>
                    <Logo />
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Admin</span>
                    </div>
                  </>
                ) : (
                  <Shield className="h-6 w-6 text-primary mx-auto" />
                )}
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 py-4">
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
              <div className="flex justify-center">
                <DropdownMenu onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Sidebar Options"
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
          </>
        )}
      </div>

      {/* Overlay sidebar for expand-on-hover */}
      {isOverlay && (
        <div 
          className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-xl z-50 transition-all duration-300"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Admin</span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-4">
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
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Sidebar Options"
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
  
  // Get filtered navigation items based on user role
  const filteredNavItems = getFilteredNavItems(user);
  const activeSection = getActiveSection(location.pathname);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
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
    
    // Open drawer on right swipe (from left edge)
    if (isRightSwipe && !isDrawerOpen && touchStart < 50) {
      setIsDrawerOpen(true);
    }
  };

  // Handle tap outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDrawerOpen(false);
    }
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-card shadow-lg touch-manipulation"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={handleOverlayClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drawer Content */}
          <div 
            className={cn(
              "fixed left-0 top-0 h-full w-[85%] max-w-sm bg-card shadow-xl transform transition-transform duration-300 ease-out",
              isDrawerOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between touch-manipulation">
                <div className="flex items-center gap-2">
                  <Logo />
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Admin</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="touch-manipulation"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Back to Main App */}
              <div className="p-4 border-b border-border">
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-start touch-manipulation"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <NavLink to={backToMainAppItem.href}>
                    <backToMainAppItem.icon className="h-4 w-4 mr-2" />
                    {backToMainAppItem.title}
                  </NavLink>
                </Button>
              </div>
              
              {/* Simple Navigation */}
              <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                <nav className="space-y-2">
                  {filteredNavItems.map((item) => {
                    const isActive = activeSection === item.id;
                    
                    return (
                      <NavLink
                        key={item.id}
                        to={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation",
                          isActive
                            ? "bg-primary/10 text-primary border-l-4 border-primary"
                            : "text-foreground/70 hover:text-foreground hover:bg-secondary/50 active:bg-secondary border-l-4 border-transparent"
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipe area for opening drawer */}
      <div 
        className="fixed left-0 top-0 w-4 h-full z-40 md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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