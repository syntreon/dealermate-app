import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers to allow requests from your web app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Service Role Key
    const supabaseAdmin = createClient(
      // These environment variables are automatically available in Supabase Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Extract user data from the request body
    const { email, full_name, role, client_id } = await req.json();

    // Get the app URL from environment or use production default
    // For local development, use localhost:4001
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:4001';

    if (!email || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, full_name, role' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Step 1: Invite the user using the admin client
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name,
          role,
        },
        // The redirect URL should point to your app, not Supabase
        // Using a fully qualified URL with explicit next parameter for better compatibility
        redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
        // Set email redirect explicitly to match the redirectTo
        emailRedirectTo: `${appUrl}/auth/callback?next=/reset-password`,
      }
    );

    if (inviteError) {
      console.error('Invite Error:', inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const user = inviteData.user;
    if (!user) {
      throw new Error('User not created in auth schema.');
    }

    // Step 2: Create the corresponding user profile in the public.users table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id, // Use the ID from the newly created auth user
        email,
        full_name,
        role,
        client_id: client_id || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile Creation Error:', profileError);
      // If creating the profile fails, we should delete the auth user to avoid orphans
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return new Response(JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Return the newly created user profile
    return new Response(JSON.stringify(profileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Main Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
