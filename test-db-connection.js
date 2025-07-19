import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zliugukiqtbifethrjse.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaXVndWtpcXRiaWZldGhyanNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzU0ODcsImV4cCI6MjA2NjcxMTQ4N30.ZCBl_Wiprz7Lze8tbeIqRkLawG72E6rTw9vZi_0hhz4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return;
    }

    console.log("Database connection successful!");

    // Check if users table exists and has data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .limit(5);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return;
    }

    console.log("Users in database:", users);

    if (users.length === 0) {
      console.log("No users found in database. You may need to create a user first.");
    }

  } catch (error) {
    console.error("Connection test failed:", error);
  }
}

testConnection();