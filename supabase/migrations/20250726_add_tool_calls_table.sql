create table public.tool_calls (
  id text not null,
  call_id uuid not null,
  client_id uuid not null,
  role text not null,
  tool_name text null,
  arguments jsonb null,
  result text null,
  created_at timestamp with time zone not null default now(),
  constraint tool_calls_pkey primary key (id, role),
  constraint tool_calls_call_id_fkey foreign KEY (call_id) references calls (id) on delete CASCADE,
  constraint tool_calls_client_id_fkey foreign KEY (client_id) references clients (id) on delete CASCADE,
  constraint tool_calls_role_check check (
    (
      role = any (
        array['tool_calls'::text, 'tool_call_result'::text]
      )
    )
  ),
  constraint tool_calls_role_content_check check (
    (
      (
        (role = 'tool_calls'::text)
        and (arguments is not null)
        and (result is null)
      )
      or (
        (role = 'tool_call_result'::text)
        and (arguments is null)
        and (result is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tool_calls_call_id on public.tool_calls using btree (call_id) TABLESPACE pg_default;

create index IF not exists idx_tool_calls_client_id on public.tool_calls using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_tool_calls_role on public.tool_calls using btree (role) TABLESPACE pg_default;