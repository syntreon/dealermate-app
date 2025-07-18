
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isNetworkError } from "@/utils/authUtils";
import { 
  createTimeoutPromise, 
  handleRequestError, 
  createFallbackUserObject 
} from "@/utils/networkUtils";

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_admin?: boolean;
  webhookUrl?: string;
  client_id?: string | null; // UUID, Foreign key to clients
  role?: 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user';
  full_name?: string;
  preferences?: {
    notifications: {
      email: boolean;
      leadAlerts: boolean;
      systemAlerts: boolean;
      notificationEmails: string[];
    };
    displaySettings: {
      theme: 'light' | 'dark' | 'system';
      dashboardLayout: 'compact' | 'detailed';
    };
  };
}

export const useUserProfile = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [networkError, setNetworkError] = useState<boolean>(false);

  // Load user profile data from Supabase
  const loadUserProfile = async (userId: string, retryAttempt = 0): Promise<UserData | null> => {
    setIsLoading(true);
    setError(null);
    setNetworkError(false);
    
    try {
      console.log("Loading user profile for:", userId);
      
      // Race between fetch and timeout
      const { data, error } = await Promise.race([
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single(),
        createTimeoutPromise().then(() => { 
          throw new Error("Network request timed out");
        })
      ]) as any;
        
      if (error) {
        console.error("Error fetching user profile:", error);
        
        // Check if it's a network error
        if (isNetworkError(error)) {
          setNetworkError(true);
          
          // Use the error handling utility for retries or fallback
          const fallbackResult = await handleRequestError<UserData>(
            error,
            retryAttempt,
            (nextAttempt) => loadUserProfile(userId, nextAttempt),
            createFallbackUserObject
          );
          
          if (fallbackResult) return fallbackResult;
        }
        
        setError(error);
        toast.error("Failed to load user profile. Please try again.");
        return null;
      }
      
      if (!data) {
        console.error("User profile not found for ID:", userId);
        setError(new Error("User profile not found"));
        return null;
      }
      
      console.log("User profile loaded successfully:", data);
      return data as UserData;
    } catch (error) {
      console.error("Exception in loadUserProfile:", error);
      
      // Use the error handling utility for retries or fallback
      const fallbackResult = await handleRequestError<UserData>(
        error,
        retryAttempt,
        (nextAttempt) => loadUserProfile(userId, nextAttempt),
        createFallbackUserObject
      );
      
      if (fallbackResult) {
        setNetworkError(true);
        return fallbackResult;
      }
      
      setError(error instanceof Error ? error : new Error("An unexpected error occurred"));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { loadUserProfile, isLoading, error, networkError };
};
