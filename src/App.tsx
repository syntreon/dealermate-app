import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CallsProvider } from "@/context/CallsContext";
import { LeadProvider } from "@/context/LeadContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Call from "./pages/Call";
import Settings from "./pages/Settings";
import ManageUsers from "./pages/ManageUsers";
import NotFound from "./pages/NotFound";
import Logs from "./pages/Logs";
import Analytics from "./pages/Analytics";
import Leads from "./pages/Leads";
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
import AuthTest from "./test/AuthTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
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
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="clients" element={<ClientManagement />} />
                  <Route path="clients/:id" element={<ClientDetails />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="audit" element={<AdminAudit />} />
                  <Route path="system-status" element={<AdminSystemStatus />} />
                  <Route path="system-health" element={<SystemHealthMonitoring />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route index element={<AdminDashboard />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LeadProvider>
          </CallsProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
