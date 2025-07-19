import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

/**
 * Simple authentication test component
 * This bypasses all custom hooks and complex logic to test basic Supabase auth
 */
const AuthTest = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Simple session listener - no complex processing
  useEffect(() => {
    console.log('AuthTest: Setting up auth listener');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthTest: Initial session:', session?.user?.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthTest: Auth event:', event, session?.user?.id || 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Simple sign in - no custom logic
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    console.log('AuthTest: Attempting sign in...');
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (error) {
        console.log('AuthTest: Sign in error:', error);
        setMessage(`Sign in failed: ${error.message}`);
      } else {
        console.log('AuthTest: Sign in successful in', duration, 'ms');
        setMessage(`Sign in successful! (${duration}ms)`);
      }
    } catch (error) {
      console.log('AuthTest: Sign in exception:', error);
      setMessage('Sign in exception occurred');
    } finally {
      setLoading(false);
    }
  };

  // Simple sign out - no custom logic
  const handleSignOut = async () => {
    console.log('AuthTest: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('AuthTest: Sign out error:', error);
      setMessage(`Sign out failed: ${error.message}`);
    } else {
      console.log('AuthTest: Sign out successful');
      setMessage('Signed out successfully');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading auth test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Auth Test</h1>
          <p className="mt-2 text-sm text-gray-600">
            Simple Supabase authentication test (bypasses custom hooks)
          </p>
        </div>

        {/* Status Display */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Status</h2>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span>{' '}
              <span className={session ? 'text-green-600' : 'text-red-600'}>
                {session ? 'Yes' : 'No'}
              </span>
            </div>
            
            {user && (
              <>
                <div>
                  <span className="font-medium">User ID:</span>{' '}
                  <span className="text-gray-600 font-mono text-xs">{user.id}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  <span className="text-gray-600">
                    {new Date(user.created_at).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sign In Form */}
        {!session && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Sign In</h2>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        )}

        {/* Sign Out Button */}
        {session && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Message</h2>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Test Instructions</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• This test bypasses all custom authentication hooks</li>
            <li>• It only uses basic Supabase auth methods</li>
            <li>• Check the browser console for detailed timing logs</li>
            <li>• If this is fast, the issue is in your custom code</li>
            <li>• If this is slow, the issue is with Supabase itself</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
