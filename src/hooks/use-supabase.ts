import { SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

// This is a simplified example. In a real app, you would likely use a context provider.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

const createSupabaseClient = () => {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
    }
    supabase = new SupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

export const useSupabase = () => {
  const client = useMemo(createSupabaseClient, []);

  return {
    supabase: client,
  };
};
