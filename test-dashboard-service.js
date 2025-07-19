import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zliugukiqtbifethrjse.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaXVndWtpcXRiaWZldGhyanNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzU0ODcsImV4cCI6MjA2NjcxMTQ4N30.ZCBl_Wiprz7Lze8tbeIqRkLawG72E6rTw9vZi_0hhz4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDashboardData() {
  try {
    console.log("Testing dashboard data retrieval...");

    // Test calls data
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .limit(5);

    if (callsError) {
      console.error("Error fetching calls:", callsError);
    } else {
      console.log(`Found ${calls.length} calls`);
      if (calls.length > 0) {
        console.log("Sample call:", {
          id: calls[0].id,
          caller_name: calls[0].caller_full_name,
          duration: calls[0].call_duration_seconds,
          created_at: calls[0].created_at
        });
      }
    }

    // Test leads data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5);

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
    } else {
      console.log(`Found ${leads.length} leads`);
      if (leads.length > 0) {
        console.log("Sample lead:", {
          id: leads[0].id,
          full_name: leads[0].full_name,
          status: leads[0].lead_status,
          created_at: leads[0].created_at
        });
      }
    }

    // Test clients data
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
    } else {
      console.log(`Found ${clients.length} clients`);
      if (clients.length > 0) {
        console.log("Sample client:", {
          id: clients[0].id,
          name: clients[0].name,
          status: clients[0].status,
          type: clients[0].type
        });
      }
    }

    // Test agent status
    const { data: agentStatus, error: agentError } = await supabase
      .from('agent_status')
      .select('*')
      .limit(5);

    if (agentError) {
      console.error("Error fetching agent status:", agentError);
    } else {
      console.log(`Found ${agentStatus.length} agent status records`);
    }

    // Test system messages
    const { data: messages, error: messagesError } = await supabase
      .from('system_messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.error("Error fetching system messages:", messagesError);
    } else {
      console.log(`Found ${messages.length} system messages`);
    }

    console.log("Dashboard data test completed!");

  } catch (error) {
    console.error("Dashboard data test failed:", error);
  }
}

testDashboardData();