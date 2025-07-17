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
import AppLayout from "./components/AppLayout";

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
                
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/call" element={<Call />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
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
