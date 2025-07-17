
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface AuthActionsResult {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoginInProgress: boolean;
}

export const useAuthActions = (
  setIsLoading: (isLoading: boolean) => void
): AuthActionsResult => {
  const [isLoginInProgress, setIsLoginInProgress] = useState<boolean>(false);
  const navigate = useNavigate();

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // Prevent multiple login attempts
      if (isLoginInProgress) {
        console.log("Login already in progress");
        return false;
      }
      
      console.log("Attempting login for:", email);
      setIsLoginInProgress(true);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error.message);
        toast.error(error.message);
        setIsLoginInProgress(false);
        setIsLoading(false);
        return false;
      }

      if (data && data.user) {
        console.log("Login successful");
        // Auth state change will handle the rest
        return true;
      }
      
      setIsLoginInProgress(false);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Login exception:", error);
      toast.error("An unexpected error occurred during login");
      setIsLoginInProgress(false);
      setIsLoading(false);
      return false;
    }
  }, [isLoginInProgress, setIsLoading]);

  const logout = useCallback(async () => {
    try {
      console.log("Logging out");
      setIsLoading(true);
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setIsLoading]);

  return {
    login,
    logout,
    isLoginInProgress
  };
};
