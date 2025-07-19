import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zliugukiqtbifethrjse.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaXVndWtpcXRiaWZldGhyanNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzU0ODcsImV4cCI6MjA2NjcxMTQ4N30.ZCBl_Wiprz7Lze8tbeIqRkLawG72E6rTw9vZi_0hhz4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initTestData() {
  try {
    console.log("Initializing test data...");

    // Check if we have any clients
    const { data: existingClients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1);

    if (clientsError) {
      console.error("Error checking clients:", clientsError);
      return;
    }

    let clientId;
    if (existingClients.length === 0) {
      console.log("Creating test client...");
      
      // Create a test client
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert({
          name: 'Test Client Corp',
          status: 'active',
          type: 'Enterprise',
          subscription_plan: 'Pro',
          contact_person: 'John Doe',
          contact_email: 'john@testclient.com',
          phone_number: '+1-555-0123',
          monthly_billing_amount_cad: 2500.00,
          average_monthly_ai_cost_usd: 150.00,
          average_monthly_misc_cost_usd: 50.00,
          partner_split_percentage: 20.0,
          finders_fee_cad: 500.00,
          slug: 'test-client-corp',
          config_json: {
            features: ['call_recording', 'lead_tracking', 'analytics'],
            settings: {
              timezone: 'America/Toronto',
              business_hours: '9:00-17:00'
            }
          }
        })
        .select()
        .single();

      if (createClientError) {
        console.error("Error creating client:", createClientError);
        return;
      }

      clientId = newClient.id;
      console.log("Created test client:", newClient.name);
    } else {
      clientId = existingClients[0].id;
      console.log("Using existing client:", existingClients[0].name);
    }

    // Check if we have calls data
    const { data: existingCalls, error: callsError } = await supabase
      .from('calls')
      .select('id')
      .eq('client_id', clientId)
      .limit(1);

    if (callsError) {
      console.error("Error checking calls:", callsError);
      return;
    }

    if (existingCalls.length === 0) {
      console.log("Creating test calls...");
      
      // Create test calls
      const testCalls = [];
      const now = new Date();
      
      for (let i = 0; i < 20; i++) {
        const callDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Spread over 20 days
        const callStartTime = new Date(callDate.getTime() + Math.random() * 8 * 60 * 60 * 1000); // Random time during business hours
        const duration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
        const callEndTime = new Date(callStartTime.getTime() + duration * 1000);
        
        testCalls.push({
          client_id: clientId,
          call_type: 'inbound',
          caller_phone_number: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          to_phone_number: '+1-555-0100',
          caller_full_name: `Test Caller ${i + 1}`,
          call_start_time: callStartTime.toISOString(),
          call_end_time: callEndTime.toISOString(),
          call_duration_seconds: duration,
          call_duration_mins: Math.round(duration / 60),
          transcript: `This is a test call transcript for call ${i + 1}. The caller was interested in our services and asked several questions about pricing and availability.`,
          call_summary: `Call ${i + 1}: Customer inquiry about services, ${Math.random() > 0.5 ? 'positive' : 'neutral'} interaction.`,
          recording_url: `https://example.com/recordings/call-${i + 1}.mp3`,
          assistant_id: 'test-assistant-001',
          hangup_reason: Math.random() > 0.8 ? 'failed_connection' : 'completed_normally',
          transfer_flag: Math.random() > 0.85, // 15% chance of transfer
          vapi_call_cost_usd: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
          vapi_llm_cost_usd: Math.round((Math.random() * 0.5 + 0.1) * 100) / 100,
          openai_api_cost_usd: Math.round((Math.random() * 0.3 + 0.05) * 100) / 100,
          openai_api_tokens_input: Math.floor(Math.random() * 1000) + 100,
          openai_api_tokens_output: Math.floor(Math.random() * 500) + 50,
          twillio_call_cost_usd: Math.round((Math.random() * 1 + 0.2) * 100) / 100,
          sms_cost_usd: 0,
          tool_cost_usd: 0,
          total_call_cost_usd: Math.round((Math.random() * 4 + 1) * 100) / 100,
          total_cost_cad: Math.round((Math.random() * 5 + 1.3) * 100) / 100,
          created_at: callDate.toISOString()
        });
      }

      const { data: createdCalls, error: createCallsError } = await supabase
        .from('calls')
        .insert(testCalls)
        .select();

      if (createCallsError) {
        console.error("Error creating calls:", createCallsError);
        return;
      }

      console.log(`Created ${createdCalls.length} test calls`);

      // Create some test leads
      console.log("Creating test leads...");
      
      const testLeads = [];
      const callsWithLeads = createdCalls.filter(() => Math.random() > 0.6); // 40% of calls generate leads
      
      callsWithLeads.forEach((call, index) => {
        testLeads.push({
          client_id: clientId,
          call_id: call.id,
          full_name: `Lead ${index + 1}`,
          first_name: `First${index + 1}`,
          last_name: `Last${index + 1}`,
          phone_number: call.caller_phone_number,
          from_phone_number: call.to_phone_number,
          email: `lead${index + 1}@example.com`,
          lead_status: ['new', 'contacted', 'qualified', 'converted'][Math.floor(Math.random() * 4)],
          callback_timing_captured: Math.random() > 0.5,
          callback_timing_value: Math.random() > 0.5 ? 'morning' : 'afternoon',
          appointment_confirmed_at: Math.random() > 0.7 ? new Date().toISOString() : null,
          sent_to_client_at: Math.random() > 0.3 ? new Date().toISOString() : null,
          custom_lead_data: {
            interest_level: Math.floor(Math.random() * 5) + 1,
            budget_range: ['$1k-5k', '$5k-10k', '$10k+'][Math.floor(Math.random() * 3)],
            timeline: ['immediate', '1-3 months', '3-6 months'][Math.floor(Math.random() * 3)]
          },
          created_at: new Date(call.created_at).toISOString()
        });
      });

      if (testLeads.length > 0) {
        const { data: createdLeads, error: createLeadsError } = await supabase
          .from('leads')
          .insert(testLeads)
          .select();

        if (createLeadsError) {
          console.error("Error creating leads:", createLeadsError);
          return;
        }

        console.log(`Created ${createdLeads.length} test leads`);
      }
    } else {
      console.log("Test calls already exist, skipping creation");
    }

    // Set up agent status
    console.log("Setting up agent status...");
    
    const { data: existingStatus, error: statusError } = await supabase
      .from('agent_status')
      .select('id')
      .eq('client_id', clientId)
      .single();

    if (statusError && statusError.code === 'PGRST116') {
      // No status exists, create one
      const { error: createStatusError } = await supabase
        .from('agent_status')
        .insert({
          client_id: clientId,
          status: 'active',
          message: 'All systems operational',
          updated_by: clientId // This would normally be a user ID
        });

      if (createStatusError) {
        console.error("Error creating agent status:", createStatusError);
      } else {
        console.log("Created agent status");
      }
    }

    // Create some system messages
    console.log("Creating system messages...");
    
    const { data: existingMessages, error: messagesError } = await supabase
      .from('system_messages')
      .select('id')
      .limit(1);

    if (messagesError) {
      console.error("Error checking system messages:", messagesError);
      return;
    }

    if (existingMessages.length === 0) {
      const testMessages = [
        {
          client_id: clientId,
          type: 'info',
          message: 'Welcome to your new dashboard! All systems are operational.',
          timestamp: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
          created_by: clientId
        },
        {
          client_id: null, // Global message
          type: 'success',
          message: 'Platform maintenance completed successfully. All features are now available.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          expires_at: null,
          created_by: clientId
        },
        {
          client_id: clientId,
          type: 'warning',
          message: 'Monthly call limit approaching. Consider upgrading your plan.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 3 days
          created_by: clientId
        }
      ];

      const { error: createMessagesError } = await supabase
        .from('system_messages')
        .insert(testMessages);

      if (createMessagesError) {
        console.error("Error creating system messages:", createMessagesError);
      } else {
        console.log("Created system messages");
      }
    }

    console.log("Test data initialization completed successfully!");
    
  } catch (error) {
    console.error("Test data initialization failed:", error);
  }
}

initTestData();