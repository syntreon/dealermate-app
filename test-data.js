// Test script to insert sample call logs into Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleCalls = [
  {
    caller_full_name: 'John Smith',
    caller_phone_number: '+1 (555) 123-4567',
    call_type: 'inbound',
    call_start_time: new Date(2025, 6, 15, 10, 30).toISOString(),
    call_end_time: new Date(2025, 6, 15, 10, 35).toISOString(),
    call_duration_seconds: 300,
    call_duration_mins: 5,
    call_summary: 'Customer called about scheduling a consultation for next week. Interested in our premium service package.',
    client_id: 'client_001'
  },
  {
    caller_full_name: 'Sarah Johnson',
    caller_phone_number: '+1 (555) 987-6543',
    call_type: 'outbound',
    call_start_time: new Date(2025, 6, 16, 14, 15).toISOString(),
    call_end_time: new Date(2025, 6, 16, 14, 22).toISOString(),
    call_duration_seconds: 420,
    call_duration_mins: 7,
    call_summary: 'Follow-up call regarding the quote sent last week. Client requested additional information about service options.',
    client_id: 'client_002'
  },
  {
    caller_full_name: 'Michael Brown',
    caller_phone_number: '+1 (555) 456-7890',
    call_type: 'missed',
    call_start_time: new Date(2025, 6, 16, 16, 45).toISOString(),
    call_end_time: new Date(2025, 6, 16, 16, 45).toISOString(),
    call_duration_seconds: 0,
    call_duration_mins: 0,
    call_summary: 'Missed call from existing client. No voicemail left.',
    client_id: 'client_003'
  },
  {
    caller_full_name: 'Emily Davis',
    caller_phone_number: '+1 (555) 234-5678',
    call_type: 'voicemail',
    call_start_time: new Date(2025, 6, 17, 9, 10).toISOString(),
    call_end_time: new Date(2025, 6, 17, 9, 11).toISOString(),
    call_duration_seconds: 60,
    call_duration_mins: 1,
    call_summary: 'Left voicemail requesting a callback regarding billing question on recent invoice.',
    client_id: 'client_004'
  },
  {
    caller_full_name: 'David Wilson',
    caller_phone_number: '+1 (555) 345-6789',
    call_type: 'inbound',
    call_start_time: new Date(2025, 6, 17, 11, 20).toISOString(),
    call_end_time: new Date(2025, 6, 17, 11, 28).toISOString(),
    call_duration_seconds: 480,
    call_duration_mins: 8,
    call_summary: 'New potential client inquiring about services and pricing. Scheduled a follow-up call for next Monday.',
    client_id: null
  }
];

async function insertSampleData() {
  console.log('Inserting sample call logs...');
  
  const { data, error } = await supabase
    .from('calls')
    .insert(sampleCalls)
    .select();
  
  if (error) {
    console.error('Error inserting data:', error);
    return;
  }
  
  console.log('Successfully inserted sample data:', data);
}

insertSampleData();
