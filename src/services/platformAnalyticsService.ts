// src/services/platformAnalyticsService.ts
import { supabase } from "@/integrations/supabase/client";
import { UserPlatformSession } from "@/types/UserPlatformSession";

export async function logPlatformSession(sessionData: Omit<UserPlatformSession, 'id' | 'created_at' | 'ip_address' | 'geo_country' | 'geo_city'>) {
  const { data, error } = await supabase.functions.invoke('log-session', {
    body: sessionData,
  });

  if (error) {
    console.error('Error invoking log-session function:', error);
    throw error;
  }

  return data;
}