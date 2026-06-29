-- Vyra Agents MVP memory schema stubs.
-- Do not run against production. These tables are placeholders for future review.

create table if not exists agent_runs (
  id uuid primary key,
  agent_key text not null,
  workflow_key text,
  status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_events (
  id uuid primary key,
  run_id uuid,
  agent_key text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_tasks (
  id uuid primary key,
  agent_key text not null,
  title text not null,
  status text not null,
  priority text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_status (
  id uuid primary key,
  agent_key text not null,
  status text not null,
  summary text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_memory (
  id uuid primary key,
  agent_key text not null,
  memory_type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_logs (
  id uuid primary key,
  run_id uuid,
  agent_key text not null,
  level text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_approvals (
  id uuid primary key,
  agent_key text not null,
  action_key text not null,
  risk_level text not null,
  status text not null,
  requested_by text,
  approved_by text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists agent_workflows (
  id uuid primary key,
  workflow_key text not null unique,
  agent_key text not null,
  status text not null,
  definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_integrations (
  id uuid primary key,
  integration_key text not null unique,
  status text not null,
  mode text not null default 'read_only',
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

