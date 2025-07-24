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
  make_com_operations smallint null default '20'::smallint,
  tts_cost numeric null,
  transcriber_cost numeric null,
  voice_provider text null,
  voice_model text null,
  transcriber_provider text null,
  transcriber_model text null,
  call_llm_model text null,
  call_summary_cost numeric null,
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