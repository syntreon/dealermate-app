import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/**
 * AnalyticsLayout - Provides layout structure for Analytics section pages
 * 
 * This layout enables proper nested routing for analytics sub-pages.
 * It's intentionally minimal as the main UI structure (sidebar, header)
 * is already handled by the parent AdminLayout.
 */
const AnalyticsLayout: React.FC = () => {
  // Get current location to help with debugging
  const location = useLocation();
  
  useEffect(() => {
    // Log routing information to help diagnose issues
    console.log('AnalyticsLayout mounted - current path:', location.pathname);
    console.log('AnalyticsLayout is rendering an Outlet for nested routes');
    
    // Add more detailed debugging
    const pathSegments = location.pathname.split('/');
    console.log('Path segments:', pathSegments);
    console.log('Current page:', pathSegments[pathSegments.length - 1]);
    
    // Check if there's any issue with the DOM
    setTimeout(() => {
      console.log('DOM after render:', document.querySelector('.analytics-debug-info')?.textContent);
    }, 100);
  }, [location.pathname]);

  // Simply render the outlet to enable proper nested routing
  // Any shared analytics UI elements could be added here in the future
  return (
    <div className="relative">
      {/* Visible debug information - TEMPORARY */}
      <div className="analytics-debug-info bg-muted/20 text-xs p-1 mb-2 rounded">
        Current path: {location.pathname}
      </div>
      
      {/* The actual content from the child route */}
      <Outlet />
    </div>
  );
};

export default AnalyticsLayout;
