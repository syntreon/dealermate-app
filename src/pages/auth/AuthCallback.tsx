import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * AuthCallback component handles authentication redirects from Supabase
 * Supports both token-based and code-based auth flows
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    // Main function to handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // First check if we're handling a callback with tokens in the URL hash
        const hashFragment = window.location.hash;
        
        if (hashFragment && hashFragment.length > 1) {
          // Get the hash fragment from URL (Supabase puts tokens here)
          const hashParams = new URLSearchParams(hashFragment.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (accessToken && refreshToken) {
            // Process the tokens we found in the hash
            await processTokens(accessToken, refreshToken, type);
            return;
          }
        }
        
        // If no tokens in hash, try to exchange the code for a session
        // This handles the OAuth2 PKCE flow where code is in query params
        if (window.location.search && window.location.search.includes('code=')) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.search);
          
          if (error) {
            throw error;
          }
          
          if (!data.session) {
            throw new Error('No session data received');
          }
          
          // Process the session we got from code exchange
          await processSession(data.session);
          return;
        }
        
        // If we get here, we couldn't find any authentication data
        throw new Error('No authentication data found in URL');
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };
    
    // Helper function to process tokens from URL hash
    const processTokens = async (accessToken: string, refreshToken: string, type: string | null) => {
      // Set the session with the tokens
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data received');
      }
      
      handleSuccessfulAuth(data.user, type);
    };
    
    // Helper function to process session from code exchange
    const processSession = async (session: any) => {
      if (!session.user) {
        throw new Error('No user data in session');
      }
      
      // Determine the auth type from the user's metadata or other session info
      const type = session.user.email_confirmed_at ? 'signin' : 'signup';
      
      handleSuccessfulAuth(session.user, type);
    };
    
    // Common handler for successful authentication
    const handleSuccessfulAuth = (user: any, type: string | null) => {
      // Check if this is an email confirmation or password reset
      if (type === 'signup' || type === 'invite' || !user.last_sign_in_at) {
        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting to password setup...');
        
        // Redirect to password reset page after a short delay
        setTimeout(() => {
          const nextUrl = searchParams.get('next') || '/reset-password';
          navigate(nextUrl);
        }, 2000);
      } else {
        // For other auth types, redirect to dashboard
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    };
    
    // Execute the auth callback handler
    handleAuthCallback();
  }, [navigate, searchParams]);

  // Handler for retry button
  const handleRetry = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'error' && (
            <Button onClick={handleRetry} className="w-full">
              Return to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
