import React, { Suspense } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { auditNavItems } from '@/config/auditNav';
import { cn } from '@/lib/utils';
import SectionErrorBoundary from '@/components/admin/layout/SectionErrorBoundary';
import { MinimalSectionLoading } from '@/components/admin/layout/SectionLoadingFallback';

const AuditLayout: React.FC = () => {
  return (
    <SectionErrorBoundary sectionName="Audit">
      {/* CRITICAL: Remove h-full from outer container to prevent height conflicts */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* CRITICAL: Use min-h-0 and flex-1 instead of h-full to work with parent constraints */}
        <div className="flex min-h-0 flex-1 lg:flex-row lg:space-x-8">
          {/* CRITICAL: Fixed sidebar - use min-h-0 and maintain flex structure */}
          <aside className="lg:w-56 lg:flex-shrink-0 lg:border-r lg:border-border flex flex-col min-h-0">
            {/* Section heading and description, minimal style */}
            <div className="flex-shrink-0 py-6">
              <div className="px-6">
                <h2 className="text-lg font-bold text-foreground">Audit Logs</h2>
                <p className="text-xs text-muted-foreground mt-1">Monitor system activities, user actions, and audit trails.</p>
              </div>
              <div className="border-b border-border my-3" />
            </div>
            <nav className="flex-1 flex flex-col space-y-1 overflow-y-auto px-2 min-h-0">
              {auditNavItems.map((item) => (
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
          {/* CRITICAL: Scrollable content area - use min-h-0 and flex-1 for proper scrolling */}
          <div className="flex-1 min-w-0 p-4 overflow-y-auto overflow-x-hidden min-h-0">
            <Suspense fallback={<MinimalSectionLoading sectionName="Audit Page" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
};

export default AuditLayout;