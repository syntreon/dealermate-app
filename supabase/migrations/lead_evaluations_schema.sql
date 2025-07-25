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