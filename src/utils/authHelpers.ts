import { supabase } from "@/integrations/supabase/client";

/**
 * Clears all authentication data and forces a clean state
 */
export const clearAuthData = async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all localStorage items related to Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('supabase.auth')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log("Authentication data cleared successfully");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Checks if the current session is valid
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log("Session validation error:", error.message);
      return false;
    }
    
    if (!session) {
      return false;
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.log("Session is expired");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error validating session:", error);
    return false;
  }
};