// Supabase admin client configuration with service role key
// This client bypasses RLS policies and should only be used for admin operations
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase URL and admin key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Log warning if environment variables are not set
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase admin environment variables are not set. Please check your .env file.');
}

// Import the admin supabase client like this:
// import { adminSupabase } from "@/integrations/supabase/adminClient";

export const adminSupabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-client-info': 'supabase-js-admin'
      }
    },
    db: {
      schema: 'public'
    }
  }
);
