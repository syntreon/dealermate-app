// src/services/platformAnalyticsService.ts
import { createClient } from '@supabase/supabase-js';
import { UserPlatformSession } from '@/types/UserPlatformSession';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export async function logPlatformSession(session: Omit<UserPlatformSession, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('user_platform_sessions')
    .insert([session]);
  if (error) throw error;
  return data;
}