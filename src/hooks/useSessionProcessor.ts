import { useCallback, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile, UserData } from "./useUserProfile";
import { createTemporaryUserProfile, handleSessionError, checkConnectionStatus } from "@/utils/authUtils";

export interface SessionProcessorResult {
  processSession: (currentSession: Session | null, isMounted: boolean) => Promise<void>;
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  profileError: boolean;
  networkErrorDetected: boolean;
  retryCount: number;
  resetRetryCount: () => void;
}

export const useSessionProcessor = (): SessionProcessorResult => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [networkErrorDetected, setNetworkErrorDetected] = useState<boolean>(!checkConnectionStatus());
  const [processingSession, setProcessingSession] = useState<boolean>(false);
  
  const { loadUserProfile, networkError } = useUserProfile();

  // Reset retry counter
  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    setNetworkErrorDetected(false);
  }, []);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      if (networkErrorDetected) {
        console.log("Connection restored, resetting network error state");
        setNetworkErrorDetected(false);
      }
    };

    const handleOffline = () => {
      console.log("Connection lost, setting network error state");
      setNetworkErrorDetected(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [networkErrorDetected]);

  const processSession = useCallback(async (currentSession: Session | null, isMounted: boolean) => {
    // Prevent concurrent processing
    if (processingSession) {
      console.log("Session already being processed, skipping");
      return;
    }
    
    if (!isMounted) return;
    
    try {
      setProcessingSession(true);
      
      // If there's no session, user is not authenticated
      if (!currentSession?.user) {
        console.log("No session found, user is not authenticated");
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setProfileError(false);
          setNetworkErrorDetected(false);
          setRetryCount(0);
        }
        return;
      }
      
      console.log("Processing session for user:", currentSession.user.id);
      
      // Guard against too many retries to prevent infinite loops
      const MAX_RETRIES = 2;
      if ((networkError || networkErrorDetected) && retryCount >= MAX_RETRIES) {
        console.log(`Max retries (${MAX_RETRIES}) reached, using temporary profile`);
        if (isMounted) {
          const tempUser = createTemporaryUserProfile(currentSession);
          console.log("User profile loaded, setting authenticated state", tempUser);
          setUser(tempUser);
          setIsAuthenticated(true);
          setProfileError(false);
          setNetworkErrorDetected(true);
        }
        return;
      }
      
      const userData = await loadUserProfile(currentSession.user.id);
      
      if (!isMounted) return;
      
      if (userData) {
        console.log("User profile loaded successfully", userData);
        setUser(userData);
        setIsAuthenticated(true);
        setProfileError(false);
        setNetworkErrorDetected(false);
        setRetryCount(0);
      } else if (networkError) {
        console.log("Network error while loading profile, using temporary profile");
        const tempUser = createTemporaryUserProfile(currentSession);
        console.log("User profile loaded, setting authenticated state", tempUser);
        setUser(tempUser);
        setIsAuthenticated(true);
        setProfileError(false);
        setNetworkErrorDetected(true);
        setRetryCount(prev => Math.min(prev + 1, 2)); // Cap retry count lower
      } else {
        console.error("User authenticated but profile not found");
        setUser(null);
        setIsAuthenticated(false);
        setProfileError(true);
        setNetworkErrorDetected(false);
        toast.error("User profile not found. Please contact an administrator.");
      }
    } catch (error) {
      if (!isMounted) return;
      
      const { isNetworkError: isNetErr, errorMessage } = handleSessionError(error);
      
      if (isNetErr) {
        console.log("Network error detected in processSession, using temporary profile");
        const tempUser = createTemporaryUserProfile(currentSession);
        console.log("User profile loaded, setting authenticated state", tempUser);
        setUser(tempUser);
        setIsAuthenticated(true);
        setProfileError(false);
        setNetworkErrorDetected(true);
        setRetryCount(prev => Math.min(prev + 1, 2)); // Cap retry count lower
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setProfileError(true);
        setNetworkErrorDetected(false);
        toast.error("Error processing your session. Please try logging in again.");
      }
    } finally {
      if (isMounted) {
        setProcessingSession(false);
      }
    }
  }, [loadUserProfile, networkError, networkErrorDetected, retryCount, processingSession]);

  return {
    processSession,
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    profileError,
    networkErrorDetected,
    retryCount,
    resetRetryCount
  };
};
