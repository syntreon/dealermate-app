import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AnalyticsLayout - Provides layout structure for Analytics section pages
 * 
 * This layout enables proper nested routing for analytics sub-pages.
 * It's intentionally minimal as the main UI structure (sidebar, header)
 * is already handled by the parent AdminLayout.
 */
const AnalyticsLayout: React.FC = () => {
  // Simply render the outlet to enable proper nested routing
  // Any shared analytics UI elements could be added here in the future
  return <Outlet />;
};

export default AnalyticsLayout;
