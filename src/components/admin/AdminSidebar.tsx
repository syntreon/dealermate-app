import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

import Logo from '@/components/Logo';
import { mainNavItems, hasRequiredAccess, type MainNavItem } from '@/config/adminNav';

// Function to filter navigation items based on user role
const getFilteredNavItems = (user: unknown): MainNavItem[] => {
  return mainNavItems.filter(item => hasRequiredAccess(user, item.requiredAccess));
};

// Get active section based on current path
const getActiveSection = (pathname: string): string => {
  for (const item of mainNavItems) {
    for (const link of item.subSidebar.links) {
      if (pathname.startsWith(link.href)) {
        return item.id;
      }
    }
  }
  return mainNavItems[0]?.id || 'dashboard';
};

// Main Sidebar Component (Left sidebar with icons/categories)
interface MainSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onWidthChange?: (width: number) => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
  isHovered,
  onHoverChange,
  onWidthChange
}) => {
  const { user, logout } = useAuth();

  // Filter navigation items based on user role
  const filteredNavItems = getFilteredNavItems(user);

  // Calculate sidebar width based on state
  const sidebarWidth = isCollapsed ? (isHovered ? 'w-64' : 'w-16') : 'w-64';
  const isExpanded = !isCollapsed || isHovered;
  
  // Calculate numeric width and notify parent
  const numericWidth = isCollapsed ? (isHovered ? 256 : 64) : 256;
  
  useEffect(() => {
    onWidthChange?.(numericWidth);
    // Dispatch custom event for layout to listen to
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
      detail: { width: numericWidth } 
    }));
  }, [numericWidth, onWidthChange]);

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border shadow-sm transition-all duration-300 z-50",
        sidebarWidth,
        isCollapsed && isHovered && "shadow-lg" // Extra shadow when hovering over collapsed sidebar
      )}
      onMouseEnter={() => isCollapsed && onHoverChange(true)}
      onMouseLeave={() => isCollapsed && onHoverChange(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {isExpanded && <Logo />}
          {isExpanded && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Admin</span>
            </div>
          )}
          {!isExpanded && (
            <Shield className="h-6 w-6 text-primary mx-auto" />
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4">
        {/* Back to Main App - Hidden when collapsed */}
        {isExpanded && (
          <div className="px-4 mb-4">
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <NavLink to="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Main App
              </NavLink>
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="space-y-2 px-2">
          {filteredNavItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-4 border-primary" 
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary border-l-4 border-transparent",
                  !isExpanded && "justify-center px-3"
                )}
                title={!isExpanded ? item.title : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span className="font-medium">{item.title}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {/* User Info - Hidden when collapsed */}
        {isExpanded && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">{user?.full_name || user?.email}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role} Access</div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 text-foreground/70 hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-200",
            !isExpanded && "justify-center px-3"
          )}
          title={!isExpanded ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isExpanded && <span className="whitespace-nowrap">Logout</span>}
        </button>

        {/* Collapse Toggle Button - Below Logout */}
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200",
              !isExpanded && "justify-center px-3"
            )}
            title={!isExpanded ? (isCollapsed ? "Expand" : "Collapse") : undefined}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
            )}
            {isExpanded && (
              <span className="text-xs whitespace-nowrap">{isCollapsed ? "Expand" : "Collapse"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-Sidebar Component (Right sidebar with page links)
interface SubSidebarProps {
  activeSection: string;
  mainSidebarWidth: number;
}

const SubSidebar: React.FC<SubSidebarProps> = ({ activeSection, mainSidebarWidth }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Find the active main nav item
  const activeNavItem = mainNavItems.find(item => item.id === activeSection);
  
  const isVisible = activeNavItem && hasRequiredAccess(user, activeNavItem.requiredAccess);
  
  // Note: SubSidebar visibility is now calculated directly in AdminLayout
  // No need to communicate visibility via events
  
  if (!isVisible) {
    return null;
  }

  // Filter sub-navigation links based on user role
  const filteredLinks = activeNavItem.subSidebar.links.filter(link =>
    hasRequiredAccess(user, link.requiredAccess)
  );

  return (
    <div 
      className="fixed top-0 h-full w-64 bg-card border-r border-border shadow-sm transition-all duration-300 z-40"
      style={{ left: mainSidebarWidth }}
    >
      {/* Sub-sidebar Header */}
      <div className="p-6 border-b border-border bg-card">
        <h2 className="text-lg font-semibold text-foreground">
          {activeNavItem.subSidebar.title}
        </h2>
      </div>

      {/* Sub-navigation Links */}
      <nav className="p-4 space-y-2 bg-card">
        {filteredLinks.map((link) => {
          const isActive = location.pathname === link.href || 
                          location.pathname.startsWith(link.href + '/');
          
          return (
            <NavLink
              key={link.href}
              to={link.href}
              className={cn(
                "block px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-l-4 border-primary"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary/50 border-l-4 border-transparent"
              )}
            >
              <div className="font-medium">{link.title}</div>
              {link.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {link.description}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

// Desktop Admin Dual Sidebar Component
const DesktopAdminSidebar = () => {
  // Get user context for access checks
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(() => getActiveSection(location.pathname));
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isHovered, setIsHovered] = useState(false);
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    return isCollapsed ? 64 : 256;
  });

  // Update active section when location changes
  useEffect(() => {
    setActiveSection(getActiveSection(location.pathname));
  }, [location.pathname]);

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setIsHovered(false); // Reset hover state when toggling
  };

  // Automatically navigate to the first sub-sidebar link when a main section is selected
  useEffect(() => {
    const activeNavItem = mainNavItems.find(item => item.id === activeSection);
    if (!activeNavItem) return;
    const filteredLinks = activeNavItem.subSidebar.links.filter(link => hasRequiredAccess(user, link.requiredAccess));
    if (filteredLinks.length === 0) return;
    
    // Check if we're already on ANY valid sub-link, not just the first one
    const current = location.pathname;
    const isOnValidSubLink = filteredLinks.some(link => current === link.href || current.startsWith(link.href + '/'));
    
    // Only redirect if we're not already on a valid sub-link
    if (!isOnValidSubLink) {
      if (navigate) {
        navigate(filteredLinks[0].href, { replace: true });
      }
    }
  }, [activeSection, user, location.pathname, navigate]);

  const handleWidthChange = (width: number) => {
    // Update the main sidebar width state
    setMainSidebarWidth(width);
    
    // Also dispatch the event to ensure layout is updated
    window.dispatchEvent(new CustomEvent('admin-sidebar-resize', { 
      detail: { 
        width: width,
        subSidebarVisible: true // Default to true, SubSidebar will override if needed
      } 
    }));
  };

  return (
    <>
      <MainSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isHovered={isHovered}
        onHoverChange={setIsHovered}
        onWidthChange={handleWidthChange}
      />
      <SubSidebar
        activeSection={activeSection}
        mainSidebarWidth={mainSidebarWidth}
      />
    </>
  );
};

// Mobile Admin Navigation (Overlay/Drawer with touch support)
const MobileAdminNavigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => getActiveSection(location.pathname));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Get filtered navigation items based on user role
  const filteredNavItems = getFilteredNavItems(user);

  // Update active section when location changes
  useEffect(() => {
    setActiveSection(getActiveSection(location.pathname));
  }, [location.pathname]);

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
                  <NavLink to="/dashboard">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Main App
                  </NavLink>
                </Button>
              </div>
              
              {/* Hierarchical Navigation */}
              <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                {filteredNavItems.map((item) => {
                  const isActiveSection = activeSection === item.id;
                  const filteredLinks = item.subSidebar.links.filter(link =>
                    hasRequiredAccess(user, link.requiredAccess)
                  );
                  
                  return (
                    <div key={item.id} className="mb-6">
                      {/* Section Header */}
                      <div className={cn(
                        "flex items-center gap-3 px-4 py-3 mb-2 rounded-lg font-medium touch-manipulation",
                        isActiveSection 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground/70"
                      )}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-base">{item.title}</span>
                      </div>
                      
                      {/* Section Links */}
                      <div className="ml-6 space-y-1">
                        {filteredLinks.map((link) => {
                          const isActive = location.pathname === link.href || 
                                          location.pathname.startsWith(link.href + '/');
                          
                          return (
                            <NavLink
                              key={link.href}
                              to={link.href}
                              onClick={() => setIsDrawerOpen(false)}
                              className={cn(
                                "block px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation",
                                isActive
                                  ? "bg-primary/10 text-primary border-l-4 border-primary"
                                  : "text-foreground/60 hover:text-foreground hover:bg-secondary/50 active:bg-secondary border-l-4 border-transparent"
                              )}
                            >
                              <div className="font-medium text-sm">{link.title}</div>
                              {link.description && (
                                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                  {link.description}
                                </div>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* User Info and Logout */}
              <div className="p-4 border-t border-border">
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium">{user?.full_name || user?.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">{user?.role} Access</div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full flex items-center justify-center gap-2 touch-manipulation py-3"
                  onClick={() => {
                    logout();
                    setIsDrawerOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
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