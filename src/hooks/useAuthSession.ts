import { useState, useEffect, useCallback, useRef } from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { clearAuthData } from "@/utils/authHelpers";

export interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user';
  client_id?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  name?: string;
  phone?: string;
  is_admin?: boolean;
  webhookUrl?: string;
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

interface AuthState {
  user: UserData | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuthSession = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const loadUserProfile = useCallback(async (userId: string, retryCount = 0): Promise<UserData | null> => {
    const maxRetries = 2;
    const timeouts = [3000, 5000, 8000];
    const currentTimeout = timeouts[retryCount] || timeouts[timeouts.length - 1];
    
    console.log(`Loading user profile for ID: ${userId} (attempt ${retryCount + 1}/${maxRetries + 1}, timeout: ${currentTimeout}ms)`);
    
    try {
      const queryPromise = supabase
        .from('users')
        .select('id, email, full_name, role, client_id, last_login_at, created_at, preferences')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Query timeout after ${currentTimeout}ms`)), currentTimeout);
      });
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as { data: UserData | null, error: any };

      if (error) {
        if (retryCount < maxRetries) {
          const delay = 1000 * (retryCount + 1);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return loadUserProfile(userId, retryCount + 1);
        }
        return null;
      }

      if (!data) {
        console.error("No user data returned for ID:", userId);
        return null;
      }

      console.log("User profile loaded successfully:", data);
      
      const userData: UserData = {
        ...data,
        name: data.full_name,
        phone: "",
        is_admin: data.role === 'admin' || data.role === 'owner'
      };
      
      return userData;
    } catch (error) {
      console.error(`Exception loading user profile (attempt ${retryCount + 1}):`, error);
      if (retryCount < maxRetries) {
        const delay = 1000 * (retryCount + 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadUserProfile(userId, retryCount + 1);
      }
      console.log("Database query failed, will use fallback user profile");
      return null;
    }
  }, []);

  const processSession = useCallback(async (session: Session | null, event: AuthChangeEvent) => {
    if (event === 'SIGNED_IN') {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!mountedRef.current || processingRef.current) {
      return;
    }

    processingRef.current = true;
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      if (!session?.user) {
        setAuthState({ user: null, session: null, isAuthenticated: false, isLoading: false, error: null });
        return;
      }

      const userData = await loadUserProfile(session.user.id);
      
      if (!mountedRef.current) return;

      if (userData) {
        setAuthState({ user: userData, session, isAuthenticated: true, isLoading: false, error: null });
      } else {
        const fallbackUser: UserData = {
          id: session.user.id,
          email: session.user.email || "user@example.com",
          full_name: session.user.user_metadata?.full_name || session.user.email || "User",
          role: 'user',
          name: session.user.user_metadata?.full_name || session.user.email || "User",
          phone: "",
          is_admin: false
        };
        setAuthState({ user: fallbackUser, session, isAuthenticated: true, isLoading: false, error: null });
        toast.error("Unable to load full user profile. Some features may be limited.");
      }
    } finally {
      processingRef.current = false;
    }
  }, [loadUserProfile]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed. Please try again.");
    }
    clearAuthData();
    navigate("/login");
  }, [navigate]);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    processSession(session, 'TOKEN_REFRESHED');
  }, [processSession]);

  useEffect(() => {
    mountedRef.current = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mountedRef.current) {
        processSession(session, 'INITIAL_SESSION');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mountedRef.current) {
        if (event !== 'INITIAL_SESSION') { // Initial session is handled above
          processSession(session, event);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [processSession]);

  return {
    user: authState.user,
    setUser: (user: UserData | null) => setAuthState(prev => ({ ...prev, user })),
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    hasProfileError: !!authState.error,
    login,
    logout,
    refreshSession
  };
};