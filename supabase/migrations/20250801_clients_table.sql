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
  one_time_setup_charge smallint null default '1500'::smallint,
  is_in_test_mode boolean not null default false,
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

create trigger audit_clients_trigger
after INSERT
or DELETE
or
update on clients for EACH row
execute FUNCTION audit_trigger_function ();

create trigger "client-added"
after INSERT on clients for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://hook.us1.make.com/guu651kz83wkduhfkm4kvne8mwxcdcy7',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);

create trigger validate_client_data_trigger BEFORE INSERT
or
update on clients for EACH row
execute FUNCTION validate_client_data ();