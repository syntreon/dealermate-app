import React, { Suspense } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { analyticsNavItems } from '@/config/analyticsNav';
import { cn } from '@/lib/utils';
import SectionErrorBoundary from '@/components/admin/layout/SectionErrorBoundary';
import { MinimalSectionLoading } from '@/components/admin/layout/SectionLoadingFallback';

/**
 * AnalyticsLayout - Provides layout structure for Analytics section pages
 * 
 * This layout includes a sub-sidebar navigation for analytics sub-pages
 * and follows the same pattern as ManagementLayout and AuditLayout.
 * Now includes error boundaries and loading states for better UX.
 */
const AnalyticsLayout: React.FC = () => {
  return (
    <SectionErrorBoundary sectionName="Analytics">
      {/* Use h-full to fill available height from AdminLayout */}
      <div className="h-full flex flex-col">
        {/* Main container with full height */}
        <div className="flex h-full lg:flex-row lg:space-x-8">
          {/* Sidebar with flex-col to allow internal elements to stretch */}
          <aside className="lg:w-56 lg:flex-shrink-0 lg:border-r lg:border-border flex flex-col h-full">
            {/* Fixed header section */}
            <div className="flex-shrink-0 py-6">
              <div className="px-6">
                <h2 className="text-lg font-bold text-foreground">Analytics</h2>
                <p className="text-xs text-muted-foreground mt-1">Comprehensive analytics and insights across all business metrics.</p>
              </div>
              <div className="border-b border-border my-3" />
            </div>
            {/* Navigation that fills remaining height */}
            <nav className="flex-grow flex flex-col space-y-1 overflow-y-auto px-2">
              {analyticsNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end // Use 'end' to match the route exactly
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                        'hover:bg-secondary hover:text-secondary-foreground',
                        'px-4 py-2 whitespace-nowrap',
                        isActive
                          ? 'bg-secondary hover:bg-secondary text-secondary-foreground'
                          : 'text-secondary-foreground hover:text-secondary-foreground',
                        'justify-start'
                    )
                  }
                >
                  <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
          {/* Content area with explicit height and scroll */}
          <div className="flex-1 min-w-0 p-4 overflow-y-auto overflow-x-hidden h-full">
            <Suspense fallback={<MinimalSectionLoading sectionName="Analytics Page" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default AnalyticsLayout;