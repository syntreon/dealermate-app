create table public.notifications (
  id uuid not null default gen_random_uuid (),
  type text null,
  created_at timestamp with time zone null default now(),
  title text null,
  body text null,
  listen_url text null,
  payload jsonb null,
  call_id uuid null,
  client_id uuid null,
  from_number text null,
  from_name text null,
  constraint notifications_pkey primary key (id),
  constraint notifications_call_id_fkey foreign KEY (call_id) references calls (id),
  constraint notifications_client_id_fkey foreign KEY (client_id) references clients (id)
) TABLESPACE pg_default;