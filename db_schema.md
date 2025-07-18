## Data Models

### User Model

```typescript
interface User {
  id: string; // UUID
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'user' | 'client_admin' | 'client_user' ; // USER-DEFINED enum
  client_id: string | null; // UUID, Foreign key to clients, if NULL can access all clients (usually for admins)
  last_login_at: Date | null;
  created_at: Date;
  
  // Additional fields for dashboard functionality
  preferences?: {
    notifications: {
      email: boolean;
      leadAlerts: boolean;
      systemAlerts: boolean;
      notificationEmails: string[];
    };
    displaySettings: {
      theme: 'light' | 'dark' | 'system';
      dashboardLayout: 'compact' | 'detailed';
    };
  };
}
```

### Client Model

```typescript
interface Client {
  id: string; // UUID
  name: string;
  status: 'active' | 'inactive' | 'pending'; // USER-DEFINED enum "Client Status"
  type: string;
  subscription_plan: string;
  contact_person: string | null;
  contact_email: string | null;
  phone_number: string | null;
  billing_address: string | null;
  monthly_billing_amount_cad: number;
  average_monthly_ai_cost_usd: number;
  average_monthly_misc_cost_usd: number;
  partner_split_percentage: number;
  finders_fee_cad: number;
  slug: string;
  config_json: any; // JSONB for custom configuration
  joined_at: Date;
  last_active_at: Date | null;
  
  // Dashboard-specific computed metrics (to be calculated on the frontend)
  metrics?: {
    totalCalls: number;
    totalLeads: number;
    avgCallDuration: number;
    callsToday: number;
    leadsToday: number;
  };
}
```

### Call Model

```typescript
interface Call {
  id: string; // UUID
  client_id: string; // UUID, Foreign key to clients
  call_type: string;
  caller_phone_number: string | null;
  to_phone_number: string | null;
  caller_full_name: string | null;
  call_start_time: Date;
  call_end_time: Date;
  call_duration_seconds: number;
  call_duration_mins: number | null;
  transcript: string;
  call_summary: string | null;
  recording_url: string | null;
  assistant_id: string | null;
  hangup_reason: string | null;
  transfer_flag: boolean;
  
  // Cost tracking fields
  vapi_call_cost_usd: number;
  vapi_llm_cost_usd: number;
  openai_api_cost_usd: number;
  openai_api_tokens_input: number;
  openai_api_tokens_output: number;
  twillio_call_cost_usd: number;
  sms_cost_usd: number;
  tool_cost_usd: number;
  total_call_cost_usd: number;
  total_cost_cad: number | null;
  
  created_at: Date;
  
  // Dashboard-specific computed fields
  status?: 'in-progress' | 'completed' | 'failed' | 'transferred'; // Derived from existing fields
  outcome?: 'successful' | 'unsuccessful' | 'lead-generated' | 'transferred' | null; // Derived from existing fields
}
```

### Lead Model

```typescript
interface Lead {
  id: string; // UUID
  client_id: string; // UUID, Foreign key to clients
  call_id: string; // UUID, Foreign key to calls
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  from_phone_number: string | null;
  email: string | null;
  lead_status: string;
  callback_timing_captured: boolean | null;
  callback_timing_value: string | null;
  appointment_confirmed_at: Date | null;
  sent_to_client_at: Date | null;
  custom_lead_data: any | null; // JSONB for custom lead data
  created_at: Date;
}
```

### Lead Evaluation Model

```typescript
interface LeadEvaluation {
  id: string; // UUID
  client_id: string; // UUID, Foreign key to clients
  call_id: string; // UUID, Foreign key to calls
  
  // Evaluation scores
  clarity_politeness_score: number;
  clarity_politeness_rationale: string | null;
  naturalness_score: number;
  naturalness_rationale: string | null;
  relevance_questions_score: number;
  relevance_questions_rationale: string | null;
  objection_handling_score: number;
  objection_handling_rationale: string | null;
  lead_intent_score: number;
  lead_intent_rationale: string | null;
  lead_completion_score: number;
  failure_risk_score: number;
  failure_risk_rationale: string | null;
  
  // Overall evaluation
  sentiment: 'positive' | 'neutral' | 'negative'; // USER-DEFINED enum
  sentiment_rationale: string | null;
  overall_evaluation_score: number | null;
  negative_call_flag: boolean;
  human_review_required: boolean;
  review_reason: string | null;
  evaluated_at: Date;
}
```

### Cost Event Model

```typescript
interface CostEvent {
  id: string; // UUID
  client_id: string; // UUID, Foreign key to clients
  call_id: string | null; // UUID, Foreign key to calls
  event_type: string;
  cost_usd: number;
  related_data_json: any; // JSONB for additional data
  timestamp: Date;
}
```

### Monthly Billing Summary Model

```typescript
interface MonthlyBillingSummary {
  id: string; // UUID
  month: Date;
  total_calls_processed: number;
  total_leads_captured: number;
  total_appointments_confirmed: number;
  total_gross_revenue_cad: number;
  total_variable_costs_usd: number;
  total_fixed_costs_usd: number;
  total_finders_fees_cad: number;
  total_partner_payout_cad: number;
  net_profit_usd_cad: number;
}

create table public.leads (
  id uuid not null default extensions.uuid_generate_v4 (),
  call_id uuid not null,
  client_id uuid not null,
  first_name text null,
  last_name text null,
  full_name text null,
  phone_number text null,
  email text null,
  callback_timing_captured boolean null,
  callback_timing_value text null,
  lead_status text not null default 'new'::text,
  sent_to_client_at timestamp with time zone null,
  appointment_confirmed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  custom_lead_data jsonb null,
  from_phone_number text null,
  notes text null,
  constraint leads_pkey primary key (id),
  constraint leads_call_id_key unique (call_id),
  constraint leads_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint leads_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE
) TABLESPACE pg_default;