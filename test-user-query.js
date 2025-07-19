import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zliugukiqtbifethrjse.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaXVndWtpcXRiaWZldGhyanNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzU0ODcsImV4cCI6MjA2NjcxMTQ4N30.ZCBl_Wiprz7Lze8tbeIqRkLawG72E6rTw9vZi_0hhz4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUserQuery() {
  try {
    console.log("Testing user query with specific ID...");
    
    const userId = "5306b64d-dbd4-4dd7-a9e4-029fd1b13086";
    
    // Test the exact query that's failing
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Query error:", error);
      return;
    }
    
    console.log("Query successful:", data);
    
  } catch (error) {
    console.error("Query exception:", error);
  }
}

testUserQuery();