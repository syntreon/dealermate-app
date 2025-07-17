
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { UserData } from "@/hooks/useUserProfile";

// Create a temporary user profile when network issues are detected
export const createTemporaryUserProfile = (session: Session | null): UserData => {
  return {
    id: session?.user?.id || "temp-user-id", // Use the actual user ID from session if available
    name: "Temporary User",
    email: session?.user?.email || "user@example.com",
    phone: "",
    is_admin: false
  };
};

// More comprehensive check for network-related errors
export const isNetworkError = (error: unknown): boolean => {
  // Check if browser is offline
  if (navigator.onLine === false) {
    return true;
  }
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Check for common network error patterns
    return errorMessage.includes("failed to fetch") || 
           errorMessage.includes("network") ||
           errorMessage.includes("timeout") ||
           errorMessage.includes("abort") ||
           errorMessage.includes("offline") ||
           errorMessage.includes("internet") ||
           errorMessage.includes("connection");
  }
  
  // Unknown error type
  return false;
};

// Handle session processing errors
export const handleSessionError = (error: unknown): {
  isNetworkError: boolean;
  errorMessage: string;
} => {
  console.error("Error processing session:", error);
  
  if (isNetworkError(error)) {
    return {
      isNetworkError: true,
      errorMessage: "Network connection issue detected."
    };
  }
  
  return {
    isNetworkError: false,
    errorMessage: error instanceof Error 
      ? error.message 
      : "An unexpected error occurred during session processing."
  };
};

// Check connection status
export const checkConnectionStatus = (): boolean => {
  return navigator.onLine;
};

// Cache timeout helper
export const setCachedTimeout = (key: string, callback: () => void, delay: number): number => {
  clearCachedTimeout(key); // Always clear existing timeout first
  
  const timeoutId = window.setTimeout(() => {
    callback();
    sessionStorage.removeItem(`timeout_${key}`); // Clean up storage after timeout
  }, delay);
  
  sessionStorage.setItem(`timeout_${key}`, timeoutId.toString());
  return timeoutId;
};

// Clear cached timeout
export const clearCachedTimeout = (key: string): void => {
  const existingTimeout = parseInt(sessionStorage.getItem(`timeout_${key}`) || '0');
  if (existingTimeout) {
    window.clearTimeout(existingTimeout);
    sessionStorage.removeItem(`timeout_${key}`);
  }
};
