import { supabase } from '@/integrations/supabase/client';

export const debugAuth = async () => {
  try {
    console.log('=== Authentication Debug Info ===');
    
    // Get current session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Session Error:', sessionError);
    
    // Get current user
    const { data: user, error: userError } = await supabase.auth.getUser();
    console.log('Auth User:', user);
    console.log('User Error:', userError);
    
    if (user?.user?.id) {
      // Get user info from database
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.user.id)
        .single();
      
      console.log('Database User:', dbUser);
      console.log('Database User Error:', dbUserError);
      
      // Test the debug function
      const { data: userInfo, error: userInfoError } = await supabase
        .rpc('get_current_user_info');
      
      console.log('Current User Info (RPC):', userInfo);
      console.log('User Info Error:', userInfoError);
      
      // Test agent status permissions
      const { data: agentStatusTest, error: agentStatusError } = await supabase
        .from('agent_status')
        .select('*')
        .limit(1);
      
      console.log('Agent Status Test:', agentStatusTest);
      console.log('Agent Status Error:', agentStatusError);
      
      // Test system messages permissions
      const { data: systemMessagesTest, error: systemMessagesError } = await supabase
        .from('system_messages')
        .select('*')
        .limit(1);
      
      console.log('System Messages Test:', systemMessagesTest);
      console.log('System Messages Error:', systemMessagesError);
    }
    
    console.log('=== End Debug Info ===');
  } catch (error) {
    console.error('Debug Auth Error:', error);
  }
};

// Helper function to check if user is admin
export const checkAdminStatus = async (): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return false;
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.user.id)
      .single();
    
    return dbUser?.role === 'admin' || dbUser?.role === 'owner';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Helper function to get current user's client_id
export const getCurrentUserClientId = async (): Promise<string | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return null;
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('client_id')
      .eq('id', user.user.id)
      .single();
    
    return dbUser?.client_id || null;
  } catch (error) {
    console.error('Error getting user client_id:', error);
    return null;
  }
};