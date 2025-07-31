import React, { Suspense } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { managementNavItems } from '@/config/managementNav';
import { cn } from '@/lib/utils';
import SectionErrorBoundary from '@/components/admin/layout/SectionErrorBoundary';
import { MinimalSectionLoading } from '@/components/admin/layout/SectionLoadingFallback';

const ManagementLayout: React.FC = () => {
  return (
    <SectionErrorBoundary sectionName="Management">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:space-x-8 lg:h-[calc(100vh-56px)]">
          {/*
            Sub-sidebar: sticky and separated on desktop/tablet only.
            - Sticks below the top bar (h-14 = 56px)
            - Adds right border for clear separation
            - No width or nav logic changes
          */}
          <aside
  className="lg:w-56 lg:flex-shrink-0 lg:border-r lg:border-border"
>
  {/* Section heading and description, minimal style */}
  <div className="py-3">
    <div className="px-6">
      <h2 className="text-lg font-bold text-foreground">Management</h2>
      <p className="text-xs text-muted-foreground mt-1">Manage users, clients, business settings, and permissions.</p>
    </div>
    <div className="border-b border-border my-3" />
  </div>
  <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto lg:overflow-x-visible px-2">
              {managementNavItems.map((item) => (
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
          <div className="flex-1 min-w-0 space-y-6 p-4 h-full overflow-y-auto">
  <Suspense fallback={<MinimalSectionLoading sectionName="Management Page" />}>
    <Outlet />
  </Suspense>
</div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default ManagementLayout;