import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CallsProvider } from "@/context/CallsContext";
import { LeadProvider } from "@/context/LeadContext";
import { ThemeInitProvider } from "@/context/ThemeInitProvider";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Call from "./pages/Call";
import Settings from "./pages/Settings";
import ManageUsers from "./pages/ManageUsers";
import NotFound from "./pages/NotFound";
import Logs from "./pages/Logs";
import Analytics from "./pages/Analytics";
import Leads from "./pages/Leads";
import Agents from "./pages/Agents";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSystemStatus from "./pages/AdminSystemStatus";
import ClientManagement from "./pages/admin/ClientManagement";
import ClientDetails from "./pages/admin/ClientDetails";
import UserManagement from "./pages/admin/UserManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import SystemHealthMonitoring from "./pages/admin/SystemHealthMonitoring";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminIndex from "./pages/admin/AdminIndex";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import AuthTest from "./test/AuthTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ThemeInitProvider>
            <CallsProvider>
              <LeadProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth-test" element={<AuthTest />} />
                
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/call" element={<Call />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="clients" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <ClientManagement />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="clients/:id" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <ClientDetails />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="analytics" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <AdminAnalytics />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="audit" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <AdminAudit />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="system-status" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <AdminSystemStatus />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="system-health" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <SystemHealthMonitoring />
                    </ProtectedAdminRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedAdminRoute requireSystemAccess={true}>
                      <AdminSettings />
                    </ProtectedAdminRoute>
                  } />
                  <Route index element={<AdminIndex />} />
                </Route>

                
                
                <Route path="*" element={<NotFound />} />
              </Routes>
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

export default App;
