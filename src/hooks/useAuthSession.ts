
import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserData } from "./useUserProfile";
import { useSessionProcessor } from "./useSessionProcessor";
import { useAuthActions } from "./useAuthActions";

export const useAuthSession = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  
  // Get session processor hook
  const {
    processSession,
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    profileError,
    networkErrorDetected,
    retryCount,
    resetRetryCount
  } = useSessionProcessor();

  // Get authentication actions
  const {
    login,
    logout,
    isLoginInProgress
  } = useAuthActions(setIsLoading);

  // Helper to finalize loading state
  const finalizeLoadingState = useCallback(() => {
    setIsLoading(false);
    setIsInitializing(false);
  }, []);

  // Manual refresh function
  const refreshUserSession = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      resetRetryCount();
      await processSession(session, true);
    } finally {
      setIsLoading(false);
    }
  }, [session, processSession, resetRetryCount]);

  // Initial session setup - only once
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(currentSession);
        
        // Process the session (or lack thereof)
        await processSession(currentSession, isMounted);
        
        if (isMounted) {
          setAuthInitialized(true);
          finalizeLoadingState();
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        if (isMounted) {
          setAuthInitialized(true);
          finalizeLoadingState();
        }
      }
    };

    if (!authInitialized) {
      console.log("Starting auth initialization");
      initializeAuth();
    }
    
    return () => {
      isMounted = false;
    };
  }, [authInitialized, processSession, finalizeLoadingState]);

  // Set up auth state listener - separate from initialization
  useEffect(() => {
    if (!authInitialized) return;
    
    console.log("Setting up auth state listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        // Only process significant auth events
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setSession(currentSession);
          await processSession(currentSession, true);
          finalizeLoadingState();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [authInitialized, processSession, finalizeLoadingState]);

  return {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    setIsLoading,
    session,
    setSession,
    isLoginInProgress,
    profileError,
    retryCount,
    networkErrorDetected,
    processSession,
    login,
    logout,
    finalizeLoadingState,
    refreshUserSession,
    isInitializing
  };
};
