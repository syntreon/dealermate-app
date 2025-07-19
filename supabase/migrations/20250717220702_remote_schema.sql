create table public.calls (
  id uuid not null default extensions.uuid_generate_v4 (),
  client_id uuid not null,
  call_type text not null,
  call_start_time timestamp with time zone not null,
  call_end_time timestamp with time zone not null,
  call_duration_seconds double precision not null,
  recording_url text null,
  transcript text not null,
  caller_phone_number text null,
  caller_full_name text null,
  assistant_id text null,
  hangup_reason text null,
  transfer_flag boolean null default false,
  created_at timestamp with time zone null default now(),
  vapi_call_cost_usd numeric(10, 4) null default 0.0000,
  vapi_llm_cost_usd numeric(10, 4) null default 0.0000,
  openai_api_tokens_input integer null default 0,
  openai_api_tokens_output integer null default 0,
  openai_api_cost_usd numeric(10, 4) null default 0.0045,
  total_call_cost_usd numeric(10, 4) null default 0.0000,
  sms_cost_usd numeric(10, 4) null default 0.0000,
  tool_cost_usd numeric(10, 4) null default 0.0000,
  twillio_call_cost_usd numeric null default 0.00,
  call_summary text null,
  to_phone_number text null,
  call_duration_mins double precision null,
  total_cost_cad numeric null,
  constraint calls_pkey primary key (id),
  constraint calls_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_calls_client_id on public.calls using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_calls_call_start_time on public.calls using btree (call_start_time desc) TABLESPACE pg_default;

create index IF not exists idx_calls_call_end_time on public.calls using btree (call_end_time desc) TABLESPACE pg_default;

create index IF not exists idx_calls_call_duration_seconds on public.calls using btree (call_duration_seconds) TABLESPACE pg_default;

create index IF not exists idx_calls_caller_phone_number on public.calls using btree (caller_phone_number) TABLESPACE pg_default;

create index IF not exists idx_calls_to_phone_number on public.calls using btree (to_phone_number) TABLESPACE pg_default;

create index IF not exists idx_calls_transfer_flag on public.calls using btree (transfer_flag) TABLESPACE pg_default;

create index IF not exists idx_calls_created_at on public.calls using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_calls_total_call_cost_usd on public.calls using btree (total_call_cost_usd) TABLESPACE pg_default;

create trigger update_total_call_cost_trigger BEFORE INSERT
or
update on calls for EACH row
execute FUNCTION calculate_total_call_cost ();

create table public.clients (
  id uuid not null default extensions.uuid_generate_v4 (),
  type text not null,
  name text not null,
  contact_person text null,
  contact_email text null,
  phone_number text null,
  billing_address text null,
  subscription_plan text not null,
  joined_at timestamp with time zone null default now(),
  last_active_at timestamp with time zone null,
  config_json jsonb null default '{}'::jsonb,
  monthly_billing_amount_cad numeric(10, 2) not null default 0.00,
  finders_fee_cad numeric(10, 2) null default 0.00,
  partner_split_percentage numeric(3, 2) null default 0.50,
  average_monthly_ai_cost_usd numeric(10, 2) null default 0.00,
  average_monthly_misc_cost_usd numeric(10, 2) null default 0.00,
  status public.Client Status null default 'active'::"Client Status",
  slug text null default ''::text,
  address text null,
  constraint clients_pkey primary key (id),
  constraint clients_name_key unique (name),
  constraint clients_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_clients_status on public.clients using btree (status) TABLESPACE pg_default;

create index IF not exists idx_clients_type on public.clients using btree (type) TABLESPACE pg_default;

create index IF not exists idx_clients_subscription_plan on public.clients using btree (subscription_plan) TABLESPACE pg_default;

create index IF not exists idx_clients_joined_at on public.clients using btree (joined_at desc) TABLESPACE pg_default;

create index IF not exists idx_clients_last_active_at on public.clients using btree (last_active_at desc) TABLESPACE pg_default;

create index IF not exists idx_clients_slug on public.clients using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_clients_name_search on public.clients using gin (to_tsvector('english'::regconfig, name)) TABLESPACE pg_default;

create index IF not exists idx_clients_contact_email on public.clients using btree (contact_email) TABLESPACE pg_default;

create trigger "client-added"
after INSERT on clients for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://hook.us1.make.com/guu651kz83wkduhfkm4kvne8mwxcdcy7',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

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
  sent_to text null,
  constraint leads_pkey primary key (id),
  constraint leads_call_id_key unique (call_id),
  constraint leads_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint leads_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_leads_client_id on public.leads using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_leads_call_id on public.leads using btree (call_id) TABLESPACE pg_default;

create index IF not exists idx_leads_lead_status on public.leads using btree (lead_status) TABLESPACE pg_default;

create index IF not exists idx_leads_created_at on public.leads using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_leads_phone_number on public.leads using btree (phone_number) TABLESPACE pg_default;

create index IF not exists idx_leads_email on public.leads using btree (email) TABLESPACE pg_default;

create index IF not exists idx_leads_sent_to_client_at on public.leads using btree (sent_to_client_at) TABLESPACE pg_default;

create index IF not exists idx_leads_appointment_confirmed_at on public.leads using btree (appointment_confirmed_at) TABLESPACE pg_default;

create index IF not exists idx_leads_full_name_search on public.leads using gin (
  to_tsvector(
    'english'::regconfig,
    COALESCE(
      full_name,
      ((first_name || ' '::text) || last_name)
    )
  )
) TABLESPACE pg_default;

create table public.lead_evaluations (
  id uuid not null default extensions.uuid_generate_v4 (),
  call_id uuid not null,
  client_id uuid not null,
  lead_completion_score integer not null,
  clarity_politeness_score integer not null,
  clarity_politeness_rationale text null,
  relevance_questions_score integer not null,
  relevance_questions_rationale text null,
  objection_handling_score integer not null,
  objection_handling_rationale text null,
  naturalness_score integer not null,
  naturalness_rationale text null,
  lead_intent_score integer not null,
  lead_intent_rationale text null,
  sentiment public.sentiment not null,
  sentiment_rationale text null,
  failure_risk_score integer not null,
  failure_risk_rationale text null,
  negative_call_flag boolean not null default false,
  human_review_required boolean not null default false,
  review_reason text null,
  evaluated_at timestamp with time zone null default now(),
  overall_evaluation_score numeric(4, 2) null,
  constraint lead_evaluations_pkey primary key (id),
  constraint lead_evaluations_call_id_key unique (call_id),
  constraint lead_evaluations_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint lead_evaluations_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lead_evaluations_client_id on public.lead_evaluations using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_lead_evaluations_call_id on public.lead_evaluations using btree (call_id) TABLESPACE pg_default;

create index IF not exists idx_lead_evaluations_sentiment on public.lead_evaluations using btree (sentiment) TABLESPACE pg_default;

create index IF not exists idx_lead_evaluations_evaluated_at on public.lead_evaluations using btree (evaluated_at desc) TABLESPACE pg_default;

create index IF not exists idx_lead_evaluations_human_review_required on public.lead_evaluations using btree (human_review_required) TABLESPACE pg_default;

create table public.users (
  id uuid not null,
  client_id uuid null,
  full_name text null,
  email text not null,
  created_at timestamp with time zone null default now(),
  last_login_at timestamp with time zone null,
  role public.role not null default 'user'::role,
  preferences jsonb null default '{"language": "en", "timezone": "America/Toronto", "notifications": {"email": true, "leadAlerts": true, "systemAlerts": true, "notificationEmails": []}, "displaySettings": {"theme": "light", "dashboardLayout": "detailed"}}'::jsonb,
  phone text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_users_id on public.users using btree (id) TABLESPACE pg_default;

create index IF not exists idx_users_role on public.users using btree (role) TABLESPACE pg_default;

create index IF not exists idx_users_client_id on public.users using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_users_last_login_at on public.users using btree (last_login_at desc) TABLESPACE pg_default;

create index IF not exists idx_users_created_at on public.users using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_users_email_search on public.users using gin (to_tsvector('english'::regconfig, email)) TABLESPACE pg_default;

create index IF not exists idx_users_full_name_search on public.users using gin (to_tsvector('english'::regconfig, full_name)) TABLESPACE pg_default;

create table public.clients (
  id uuid not null default extensions.uuid_generate_v4 (),
  type text not null,
  name text not null,
  contact_person text null,
  contact_email text null,
  phone_number text null,
  billing_address text null,
  subscription_plan text not null,
  joined_at timestamp with time zone null default now(),
  last_active_at timestamp with time zone null,
  config_json jsonb null default '{}'::jsonb,
  monthly_billing_amount_cad numeric(10, 2) not null default 0.00,
  finders_fee_cad numeric(10, 2) null default 0.00,
  partner_split_percentage numeric(3, 2) null default 0.50,
  average_monthly_ai_cost_usd numeric(10, 2) null default 0.00,
  average_monthly_misc_cost_usd numeric(10, 2) null default 0.00,
  status public.Client Status null default 'active'::"Client Status",
  slug text null default ''::text,
  address text null,
  constraint clients_pkey primary key (id),
  constraint clients_name_key unique (name),
  constraint clients_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_clients_status on public.clients using btree (status) TABLESPACE pg_default;

create index IF not exists idx_clients_type on public.clients using btree (type) TABLESPACE pg_default;

create index IF not exists idx_clients_subscription_plan on public.clients using btree (subscription_plan) TABLESPACE pg_default;

create index IF not exists idx_clients_joined_at on public.clients using btree (joined_at desc) TABLESPACE pg_default;

create index IF not exists idx_clients_last_active_at on public.clients using btree (last_active_at desc) TABLESPACE pg_default;

create index IF not exists idx_clients_slug on public.clients using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_clients_name_search on public.clients using gin (to_tsvector('english'::regconfig, name)) TABLESPACE pg_default;

create index IF not exists idx_clients_contact_email on public.clients using btree (contact_email) TABLESPACE pg_default;

create trigger "client-added"
after INSERT on clients for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://hook.us1.make.com/guu651kz83wkduhfkm4kvne8mwxcdcy7',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

