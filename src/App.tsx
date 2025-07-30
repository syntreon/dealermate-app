import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CallsProvider } from "@/context/CallsContext";
import { LeadProvider } from "@/context/LeadContext";
import { ThemeInitProvider } from "@/context/ThemeInitProvider";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { RouteGroups, preloadCriticalRoutes } from "@/utils/routeCodeSplitting";
import bundleAnalyzer from "@/utils/bundleAnalyzer";

const queryClient = new QueryClient();

const App = () => {
  // Preload critical routes after app initialization
  useEffect(() => {
    preloadCriticalRoutes();
    
    // Clean up bundle analyzer on unmount
    return () => {
      bundleAnalyzer.destroy();
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeInitProvider>
            <CallsProvider>
              <LeadProvider>
                <Suspense fallback={<LoadingSpinner text="Loading application..." />}>
                  <Routes>
                    <Route path="/login" element={
                      <Suspense fallback={<LoadingSpinner text="Loading login..." />}>
                        <RouteGroups.auth.Login />
                      </Suspense>
                    } />
                    <Route path="/auth/callback" element={
                      <Suspense fallback={<LoadingSpinner text="Processing authentication..." />}>
                        <RouteGroups.auth.AuthCallback />
                      </Suspense>
                    } />
                    <Route path="/reset-password" element={
                      <Suspense fallback={<LoadingSpinner text="Loading reset password..." />}>
                        <RouteGroups.auth.ResetPassword />
                      </Suspense>
                    } />
                    <Route path="/auth-test" element={
                      <Suspense fallback={<LoadingSpinner text="Loading auth test..." />}>
                        <RouteGroups.test.AuthTest />
                      </Suspense>
                    } />
                    
                    <Route element={
                      <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
                        <RouteGroups.layouts.AppLayout />
                      </Suspense>
                    }>
                      <Route path="/" element={
                        <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
                          <RouteGroups.main.Dashboard />
                        </Suspense>
                      } />
                      <Route path="/dashboard" element={
                        <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
                          <RouteGroups.main.Dashboard />
                        </Suspense>
                      } />
                      <Route path="/call" element={
                        <Suspense fallback={<LoadingSpinner text="Loading call interface..." />}>
                          <RouteGroups.main.Call />
                        </Suspense>
                      } />
                      <Route path="/logs" element={
                        <Suspense fallback={<LoadingSpinner text="Loading call logs..." />}>
                          <RouteGroups.main.Logs />
                        </Suspense>
                      } />
                      <Route path="/leads" element={
                        <Suspense fallback={<LoadingSpinner text="Loading leads..." />}>
                          <RouteGroups.main.Leads />
                        </Suspense>
                      } />
                      <Route path="/analytics" element={
                        <Suspense fallback={<LoadingSpinner text="Loading analytics..." />}>
                          <RouteGroups.main.Analytics />
                        </Suspense>
                      } />
                      <Route path="/agents" element={
                        <Suspense fallback={<LoadingSpinner text="Loading agents..." />}>
                          <RouteGroups.main.Agents />
                        </Suspense>
                      } />
                      <Route path="/settings" element={
                        <Suspense fallback={<LoadingSpinner text="Loading settings..." />}>
                          <RouteGroups.main.Settings />
                        </Suspense>
                      } />
                      <Route path="/manage-users" element={
                        <Suspense fallback={<LoadingSpinner text="Loading user management..." />}>
                          <RouteGroups.main.ManageUsers />
                        </Suspense>
                      } />
                    </Route>

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <Suspense fallback={<LoadingSpinner text="Loading admin panel..." />}>
                        <RouteGroups.layouts.AdminLayout />
                      </Suspense>
                    }>
                      {/* Redirect /admin to /admin/dashboard */}
                      <Route index element={<Navigate to="dashboard" replace />} />
                      
                      {/* Dashboard - Single page, no sub-navigation */}
                      <Route path="dashboard" element={
                        <Suspense fallback={<LoadingSpinner text="Loading admin dashboard..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                            <RouteGroups.admin.Dashboard />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      } />
                      
                      {/* Management Section with Nested Routes */}
                      <Route path="management" element={
                        <Suspense fallback={<LoadingSpinner text="Loading management..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={false}>
                            <RouteGroups.layouts.ManagementLayout />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      }>
                        {/* Default redirect for /admin/management */}
                        <Route index element={<Navigate to="users" replace />} />
                        
                        {/* Management sub-pages */}
                        <Route path="users" element={
                          <Suspense fallback={<LoadingSpinner text="Loading user management..." />}>
                            <RouteGroups.admin.UserManagement />
                          </Suspense>
                        } />
                        <Route path="clients" element={
                          <Suspense fallback={<LoadingSpinner text="Loading client management..." />}>
                            <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                              <RouteGroups.admin.ClientManagement />
                            </RouteGroups.common.ProtectedAdminRoute>
                          </Suspense>
                        } />
                        <Route path="clients/:id" element={
                          <Suspense fallback={<LoadingSpinner text="Loading client details..." />}>
                            <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                              <RouteGroups.admin.ClientDetails />
                            </RouteGroups.common.ProtectedAdminRoute>
                          </Suspense>
                        } />
                        <Route path="business" element={
                          <Suspense fallback={<LoadingSpinner text="Loading business management..." />}>
                            <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                              <RouteGroups.admin.BusinessManagement />
                            </RouteGroups.common.ProtectedAdminRoute>
                          </Suspense>
                        } />
                        <Route path="roles" element={
                          <Suspense fallback={<LoadingSpinner text="Loading roles & permissions..." />}>
                            <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                              <RouteGroups.admin.RolesPermissions />
                            </RouteGroups.common.ProtectedAdminRoute>
                          </Suspense>
                        } />
                      </Route>
                      
                      {/* Analytics Section with Nested Routes */}
                      <Route path="analytics" element={
                        <Suspense fallback={<LoadingSpinner text="Loading analytics..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                            <RouteGroups.layouts.AnalyticsLayout />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      }>
                        {/* Default redirect for /admin/analytics */}
                        <Route index element={<Navigate to="financials" replace />} />
                        
                        {/* Analytics sub-pages */}
                        <Route path="financials" element={
                          <Suspense fallback={<LoadingSpinner text="Loading financial analytics..." />}>
                            <RouteGroups.admin.AnalyticsFinancials />
                          </Suspense>
                        } />
                        <Route path="clients" element={
                          <Suspense fallback={<LoadingSpinner text="Loading client analytics..." />}>
                            <RouteGroups.admin.AnalyticsClients />
                          </Suspense>
                        } />
                        <Route path="users" element={
                          <Suspense fallback={<LoadingSpinner text="Loading user analytics..." />}>
                            <RouteGroups.admin.AnalyticsUsers />
                          </Suspense>
                        } />
                        <Route path="platform" element={
                          <Suspense fallback={<LoadingSpinner text="Loading platform analytics..." />}>
                            <RouteGroups.admin.AnalyticsPlatform />
                          </Suspense>
                        } />
                        <Route path="system-ops" element={
                          <Suspense fallback={<LoadingSpinner text="Loading system operations..." />}>
                            <RouteGroups.admin.AnalyticsSystemOps />
                          </Suspense>
                        } />
                      </Route>
                      
                      {/* Audit Section with Nested Routes */}
                      <Route path="audit" element={
                        <Suspense fallback={<LoadingSpinner text="Loading audit logs..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                            <RouteGroups.layouts.AuditLayout />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      }>
                        {/* Default redirect for /admin/audit */}
                        <Route index element={<Navigate to="all" replace />} />
                        
                        {/* Audit sub-pages */}
                        <Route path="all" element={
                          <Suspense fallback={<LoadingSpinner text="Loading all audit logs..." />}>
                            <RouteGroups.admin.AdminAudit />
                          </Suspense>
                        } />
                        <Route path="users" element={
                          <Suspense fallback={<LoadingSpinner text="Loading user logs..." />}>
                            <RouteGroups.admin.UserLogs />
                          </Suspense>
                        } />
                        <Route path="clients" element={
                          <Suspense fallback={<LoadingSpinner text="Loading client logs..." />}>
                            <RouteGroups.admin.ClientLogs />
                          </Suspense>
                        } />
                        <Route path="system" element={
                          <Suspense fallback={<LoadingSpinner text="Loading system logs..." />}>
                            <RouteGroups.admin.SystemLogs />
                          </Suspense>
                        } />
                      </Route>
                      
                      {/* Settings Section with Nested Routes */}
                      <Route path="settings" element={
                        <Suspense fallback={<LoadingSpinner text="Loading settings..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                            <RouteGroups.layouts.SettingsLayout />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      }>
                        {/* Default redirect for /admin/settings */}
                        <Route index element={<Navigate to="general" replace />} />
                        
                        {/* Settings sub-pages */}
                        <Route path="general" element={
                          <Suspense fallback={<LoadingSpinner text="Loading general settings..." />}>
                            <RouteGroups.admin.AdminSettings />
                          </Suspense>
                        } />
                        <Route path="agent-status" element={
                          <Suspense fallback={<LoadingSpinner text="Loading agent status..." />}>
                            <RouteGroups.admin.AgentStatusSettings />
                          </Suspense>
                        } />
                      </Route>
                      
                      {/* Legacy Routes - Keep for backward compatibility */}
                      <Route path="system-status" element={
                        <Suspense fallback={<LoadingSpinner text="Loading system status..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                            <RouteGroups.admin.AdminSystemStatus />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      } />
                      <Route path="system-health" element={
                        <Suspense fallback={<LoadingSpinner text="Loading system health..." />}>
                          <RouteGroups.common.ProtectedAdminRoute requireSystemAccess={true}>
                            <RouteGroups.admin.SystemHealthMonitoring />
                          </RouteGroups.common.ProtectedAdminRoute>
                        </Suspense>
                      } />
                      
                      {/* Backward Compatibility Redirects */}
                      <Route path="user-management" element={<Navigate to="/admin/management/users" replace />} />
                      <Route path="clients" element={<Navigate to="/admin/management/clients" replace />} />
                    </Route>
                    
                    <Route path="*" element={
                      <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                        <RouteGroups.common.NotFound />
                      </Suspense>
                    } />
                  </Routes>
                </Suspense>
              </LeadProvider>
            </CallsProvider>
          </ThemeInitProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
