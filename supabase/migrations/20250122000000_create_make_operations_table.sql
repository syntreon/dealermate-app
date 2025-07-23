-- Create Make.com operations tracking table
create table public.make_operations (
  id uuid not null default gen_random_uuid(),
  client_id uuid null, -- NULL for company operations (admin, marketing, etc.)
  call_id uuid null, -- NULL for non-call operations (admin, marketing, etc.)
  scenario_name text not null,
  scenario_id text null, -- Make.com scenario ID for reference
  operation_type text not null default 'general', -- 'call', 'admin', 'marketing', 'notification', 'evaluation', 'general'
  date date not null,
  operations_count integer not null default 0,
  operations_limit integer null, -- Daily limit if applicable
  cost_usd decimal(10,4) not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  status text not null default 'active',
  description text null, -- Optional description of what this scenario does
  last_sync_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint make_operations_pkey primary key (id),
  constraint make_operations_client_id_fkey foreign key (client_id) references clients (id) on delete cascade,
  constraint make_operations_call_id_fkey foreign key (call_id) references calls (id) on delete cascade,
  constraint make_operations_status_check check (
    status = any (array['active'::text, 'paused'::text, 'error'::text, 'disabled'::text])
  ),
  constraint make_operations_operation_type_check check (
    operation_type = any (array['call'::text, 'admin'::text, 'marketing'::text, 'notification'::text, 'evaluation'::text, 'general'::text])
  ),
  -- Unique constraints will be handled by partial indexes below
);

-- Create indexes for efficient querying
create index idx_make_operations_client_id on public.make_operations using btree (client_id) where client_id is not null;
create index idx_make_operations_call_id on public.make_operations using btree (call_id) where call_id is not null;
create index idx_make_operations_date on public.make_operations using btree (date desc);
create index idx_make_operations_scenario_name on public.make_operations using btree (scenario_name);
create index idx_make_operations_operation_type on public.make_operations using btree (operation_type);
create index idx_make_operations_status on public.make_operations using btree (status);
create index idx_make_operations_last_sync_at on public.make_operations using btree (last_sync_at desc);

-- Create composite indexes for common queries
create index idx_make_operations_client_date on public.make_operations using btree (client_id, date desc) where client_id is not null;
create index idx_make_operations_client_scenario on public.make_operations using btree (client_id, scenario_name) where client_id is not null;
create index idx_make_operations_type_date on public.make_operations using btree (operation_type, date desc);
create index idx_make_operations_company_ops on public.make_operations using btree (date desc, operation_type) where client_id is null;

-- Create unique indexes to prevent duplicates
-- For client operations (client_id is not null)
create unique index idx_make_operations_unique_client_scenario_date 
  on public.make_operations (scenario_name, date, client_id, call_id) 
  where client_id is not null;

-- For company operations (client_id is null)
create unique index idx_make_operations_unique_company_scenario_date 
  on public.make_operations (scenario_name, date, call_id) 
  where client_id is null;

-- Add trigger for updated_at
create trigger update_make_operations_updated_at 
  before update on make_operations 
  for each row 
  execute function update_updated_at_column();

-- Add RLS policies
alter table public.make_operations enable row level security;

-- Policy for admins and owners to see all operations (including company operations)
create policy "Admins and owners can view all make operations" on public.make_operations
  for select using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.role in ('admin', 'owner')
    )
  );

-- Policy for client users to see only their operations (not company operations where client_id is null)
create policy "Client users can view their make operations" on public.make_operations
  for select using (
    client_id is not null and
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.client_id = make_operations.client_id
    )
  );

-- Policy for admins to insert/update operations (for Make.com sync)
create policy "Admins can manage make operations" on public.make_operations
  for all using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
      and users.role in ('admin', 'owner')
    )
  );

-- Add comments for documentation
comment on table public.make_operations is 'Tracks daily Make.com operations usage per client, scenario, and operation type';
comment on column public.make_operations.client_id is 'Client ID for client-specific operations, NULL for company operations';
comment on column public.make_operations.call_id is 'Call ID for call-related operations, NULL for non-call operations';
comment on column public.make_operations.scenario_name is 'Human-readable name of the Make.com scenario';
comment on column public.make_operations.scenario_id is 'Make.com internal scenario ID for API reference';
comment on column public.make_operations.operation_type is 'Type of operation: call, admin, marketing, notification, evaluation, general';
comment on column public.make_operations.operations_count is 'Total operations executed for this scenario on this date';
comment on column public.make_operations.operations_limit is 'Daily operations limit for this scenario (if applicable)';
comment on column public.make_operations.cost_usd is 'Cost in USD for operations on this date';
comment on column public.make_operations.success_count is 'Number of successful operations';
comment on column public.make_operations.error_count is 'Number of failed operations';
comment on column public.make_operations.status is 'Current status of the scenario (active, paused, error, disabled)';
comment on column public.make_operations.description is 'Optional description of what this scenario does';
comment on column public.make_operations.last_sync_at is 'Last time this record was synced from Make.com';