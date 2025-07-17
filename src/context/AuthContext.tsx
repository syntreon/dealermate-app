
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { UserData } from "@/hooks/useUserProfile";

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasProfileError: boolean;
  isLoading: boolean;
  networkErrorDetected?: boolean;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    profileError,
    networkErrorDetected,
    refreshUserSession,
    isInitializing
  } = useAuthSession();
  
  // Handle force refresh
  const handleForceRefresh = () => {
    window.location.reload();
  };

  // If still loading, show a better loading state
  if (isLoading || isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950">
        <div className="w-full max-w-md p-6 space-y-6 rounded-lg border border-zinc-800 bg-black/20">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 animate-spin text-purple-400" />
              <p className="text-zinc-300">Loading application...</p>
            </div>
            <Skeleton className="h-4 w-full bg-zinc-800 animate-pulse" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full bg-zinc-800 animate-pulse" />
            <Skeleton className="h-10 w-full bg-zinc-800 animate-pulse" />
          </div>
          <Button 
            onClick={handleForceRefresh} 
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reload Application
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      hasProfileError: profileError,
      isLoading,
      networkErrorDetected,
      refreshUserSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
