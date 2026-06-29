-- Vyra Agents Phase 2 gym migration foundation.
-- Foundation stub only. Do not run against production until reviewed.

create extension if not exists pgcrypto;

create table if not exists gym_migration_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  gym_name text not null,
  source text not null,
  status text not null default 'validation_review',
  imported_members integer not null default 0,
  created_by text not null default 'Migration Agent',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_migration_staging_members (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  organization_id text not null,
  external_member_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  date_of_birth date,
  membership_status text,
  membership_type text,
  membership_level text,
  membership_start_date date,
  renewal_date date,
  billing_status text,
  emergency_contact jsonb not null default '{}'::jsonb,
  coach_assignment text,
  class_enrollments jsonb not null default '[]'::jsonb,
  attendance_history jsonb not null default '[]'::jsonb,
  notes text,
  raw_payload jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending',
  match_status text not null default 'pending',
  member_state text not null default 'pending_app_user'
    check (member_state in ('active_app_user', 'pending_app_user', 'offline_non_app_member')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_migration_validation_issues (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  staging_member_id uuid references gym_migration_staging_members(id),
  organization_id text not null,
  issue_type text not null,
  severity text not null,
  recommended_action text not null,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_migration_member_matches (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  staging_member_id uuid not null references gym_migration_staging_members(id),
  organization_id text not null,
  match_type text not null,
  match_status text not null default 'review',
  existing_user_id text,
  existing_user_label text,
  organization_membership_ready boolean not null default false,
  member_state text not null
    check (member_state in ('active_app_user', 'pending_app_user', 'offline_non_app_member')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_pending_member_profiles (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  staging_member_id uuid references gym_migration_staging_members(id),
  organization_id text not null,
  external_member_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  membership_status text,
  membership_type text,
  billing_status text,
  organization_membership_ready boolean not null default true,
  activation_status text not null default 'pending_app_activation',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_offline_members (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  staging_member_id uuid references gym_migration_staging_members(id),
  organization_id text not null,
  external_member_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  membership_status text,
  membership_type text,
  billing_status text,
  coach_assignment text,
  notes text,
  organization_membership_ready boolean not null default true,
  dashboard_manageable boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_migration_review_items (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  organization_id text not null,
  review_key text not null,
  label text not null,
  status text not null default 'pending',
  required boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gym_migration_invitations (
  id uuid primary key default gen_random_uuid(),
  migration_batch_id uuid not null references gym_migration_batches(id),
  staging_member_id uuid references gym_migration_staging_members(id),
  organization_id text not null,
  channel text not null,
  status text not null default 'prepared',
  recipient_email text,
  recipient_phone text,
  message_preview text,
  metadata jsonb not null default '{}'::jsonb,
  prepared_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

