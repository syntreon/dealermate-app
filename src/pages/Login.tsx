
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { clearAuthData } from '@/utils/authHelpers';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated, hasProfileError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (isAuthenticated && !hasProfileError) {
      console.log("User is authenticated, redirecting to dashboard");
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, hasProfileError, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      
      if (!password) {
        setError('Password is required');
        return;
      }
      
      console.log("Attempting login in Login component");
      setIsLoading(true);
      
      const success = await login(email, password);
      
      if (success) {
        toast.success('Login successful!');
        // Navigation will be handled by the useEffect when isAuthenticated changes
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAuthData = async () => {
    try {
      await clearAuthData();
      toast.success('Authentication data cleared. Please try logging in again.');
      setError(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      toast.error('Error clearing authentication data');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-purple/10 rounded-full blur-[150px] transform -translate-y-1/2" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple/10 rounded-full blur-[150px] transform translate-y-1/2" />
      </div>
      
      <Card className="w-full max-w-md glass-morphism animate-slideIn">
        <CardHeader className="space-y-1 items-center text-center">
          <div className="mb-4 mt-2">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-purple"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" size="sm" className="text-zinc-400 hover:text-purple h-auto p-0">
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-purple"
                disabled={isLoading}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full bg-purple hover:bg-purple-dark text-white" 
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          {error && (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full text-xs"
              onClick={handleClearAuthData}
              disabled={isLoading}
            >
              Clear Authentication Data
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
