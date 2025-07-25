import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for preflight requests and responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemStatusPayload {
  clientId?: string | null;
  status?: 'active' | 'inactive' | 'maintenance';
  message?: string;
  messageType?: 'info' | 'warning' | 'error' | 'success';
}

// Helper function to get user and check for admin role
async function getAdminUser(supabase: SupabaseClient, authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) {
    throw new Error('Authentication failed');
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    throw new Error('Could not retrieve user profile.');
  }

  if (userProfile.role !== 'admin' && userProfile.role !== 'owner') {
    throw new Error('Permission denied. User must be an admin or owner.');
  }

  return user;
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const user = await getAdminUser(supabaseAdmin, req.headers.get('Authorization'));

    const { clientId, status, message, messageType }: SystemStatusPayload = await req.json();

    // 2. Update agent status if provided
    if (status) {
      const { error: statusError } = await supabaseAdmin
        .from('agent_status')
        .upsert({
          client_id: clientId || null, // Handle global vs. client-specific
          status: status,
          message: message || null, // Optional message with status
          updated_by: user.id,
        }, { onConflict: 'client_id' });

      if (statusError) throw new Error(`Failed to update agent status: ${statusError.message}`);
    }

    // 3. Insert a new system message if provided
    if (message && messageType) {
      const { error: messageError } = await supabaseAdmin
        .from('system_messages')
        .insert({
          client_id: clientId || null,
          message: message,
          type: messageType,
          created_by: user.id,
          updated_by: user.id,
        });

      if (messageError) throw new Error(`Failed to create system message: ${messageError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'System status updated successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
