-- SpecArt CRM - Full Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- PROFILES TABLE (mirrors auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('admin', 'manager', 'user')),
  is_active boolean not null default true,
  phone text,
  avatar text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index idx_profiles_email on public.profiles(email);

-- ============================================
-- WORKSPACES TABLE
-- ============================================
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  icon text not null default 'Target',
  color text not null default 'from-[#7567F8] to-[#9B9BFF]',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),
  is_active boolean not null default true
);

-- ============================================
-- USER_WORKSPACES (many-to-many join)
-- ============================================
create table public.user_workspaces (
  user_id uuid not null references public.profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  primary key (user_id, workspace_id)
);

create index idx_user_workspaces_user on public.user_workspaces(user_id);
create index idx_user_workspaces_workspace on public.user_workspaces(workspace_id);

-- ============================================
-- LEAD_CLIENTS TABLE
-- ============================================
create table public.lead_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text not null default '',
  email text not null default '',
  company_name text not null default '',
  notes text not null default '',
  last_follow_up_date timestamptz,
  next_follow_up_date timestamptz,
  follow_up_category text not null default 'other'
    check (follow_up_category in ('call', 'email', 'meeting', 'follow_up', 'other')),
  category text not null check (category in ('lead', 'client')),
  sub_category text not null
    check (sub_category in ('hot', 'warm', 'cold', 'dead', 'active', 'inactive')),
  assigned_to text not null default '',
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id)
);

create index idx_lead_clients_workspace on public.lead_clients(workspace_id);
create index idx_lead_clients_category on public.lead_clients(category);

-- Auto-update updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger lead_clients_updated_at
  before update on public.lead_clients
  for each row execute function public.update_updated_at();

-- ============================================
-- FOLLOW_UPS TABLE
-- ============================================
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_client_id uuid not null references public.lead_clients(id) on delete cascade,
  date timestamptz not null,
  category text not null check (category in ('call', 'email', 'meeting', 'follow_up', 'other')),
  notes text not null default '',
  completed boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id)
);

create index idx_follow_ups_lead_client on public.follow_ups(lead_client_id);
create index idx_follow_ups_completed on public.follow_ups(completed);

-- ============================================
-- TAGS TABLE
-- ============================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#7567F8',
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  unique(name, workspace_id)
);

create index idx_tags_workspace on public.tags(workspace_id);

-- ============================================
-- CUSTOM_FIELDS TABLE
-- ============================================
create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('text', 'number', 'date', 'select', 'textarea')),
  options text[],
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  is_required boolean not null default false,
  "order" integer not null default 0
);

create index idx_custom_fields_workspace on public.custom_fields(workspace_id);

-- ============================================
-- LEAD_SOURCES TABLE
-- ============================================
create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  unique(name, workspace_id)
);

create index idx_lead_sources_workspace on public.lead_sources(workspace_id);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'created', 'updated', 'deleted',
    'follow_up_added', 'follow_up_completed',
    'status_changed', 'assigned_changed'
  )),
  entity_type text not null check (entity_type in ('lead', 'client', 'follow_up', 'user', 'workspace')),
  entity_id text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  user_name text not null default '',
  description text not null default '',
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_activities_workspace on public.activities(workspace_id);
create index idx_activities_created_at on public.activities(created_at desc);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.user_workspaces enable row level security;
alter table public.lead_clients enable row level security;
alter table public.follow_ups enable row level security;
alter table public.tags enable row level security;
alter table public.custom_fields enable row level security;
alter table public.lead_sources enable row level security;
alter table public.activities enable row level security;

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: check workspace access
create or replace function public.has_workspace_access(ws_id uuid)
returns boolean as $$
  select public.is_admin() or exists (
    select 1 from public.user_workspaces
    where user_id = auth.uid() and workspace_id = ws_id
  );
$$ language sql security definer stable;

-- PROFILES
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());
create policy "profiles_update_admin" on public.profiles for update using (public.is_admin());
create policy "profiles_insert_admin" on public.profiles for insert with check (public.is_admin());
create policy "profiles_delete_admin" on public.profiles for delete using (public.is_admin());

-- WORKSPACES
create policy "workspaces_select" on public.workspaces for select using (
  public.is_admin() or id in (select workspace_id from public.user_workspaces where user_id = auth.uid())
);
create policy "workspaces_insert" on public.workspaces for insert with check (public.is_admin());
create policy "workspaces_update" on public.workspaces for update using (public.is_admin());
create policy "workspaces_delete" on public.workspaces for delete using (public.is_admin());

-- USER_WORKSPACES
create policy "user_workspaces_select" on public.user_workspaces for select using (true);
create policy "user_workspaces_insert" on public.user_workspaces for insert with check (public.is_admin());
create policy "user_workspaces_delete" on public.user_workspaces for delete using (public.is_admin());

-- LEAD_CLIENTS
create policy "lead_clients_select" on public.lead_clients for select using (public.has_workspace_access(workspace_id));
create policy "lead_clients_insert" on public.lead_clients for insert with check (public.has_workspace_access(workspace_id));
create policy "lead_clients_update" on public.lead_clients for update using (public.has_workspace_access(workspace_id));
create policy "lead_clients_delete" on public.lead_clients for delete using (public.has_workspace_access(workspace_id));

-- FOLLOW_UPS
create policy "follow_ups_select" on public.follow_ups for select using (
  lead_client_id in (select id from public.lead_clients where public.has_workspace_access(workspace_id))
);
create policy "follow_ups_insert" on public.follow_ups for insert with check (
  lead_client_id in (select id from public.lead_clients where public.has_workspace_access(workspace_id))
);
create policy "follow_ups_update" on public.follow_ups for update using (
  lead_client_id in (select id from public.lead_clients where public.has_workspace_access(workspace_id))
);
create policy "follow_ups_delete" on public.follow_ups for delete using (
  lead_client_id in (select id from public.lead_clients where public.has_workspace_access(workspace_id))
);

-- TAGS
create policy "tags_select" on public.tags for select using (public.has_workspace_access(workspace_id));
create policy "tags_insert" on public.tags for insert with check (public.has_workspace_access(workspace_id));
create policy "tags_update" on public.tags for update using (public.has_workspace_access(workspace_id));
create policy "tags_delete" on public.tags for delete using (public.has_workspace_access(workspace_id));

-- CUSTOM_FIELDS
create policy "custom_fields_select" on public.custom_fields for select using (public.has_workspace_access(workspace_id));
create policy "custom_fields_insert" on public.custom_fields for insert with check (public.has_workspace_access(workspace_id));
create policy "custom_fields_update" on public.custom_fields for update using (public.has_workspace_access(workspace_id));
create policy "custom_fields_delete" on public.custom_fields for delete using (public.has_workspace_access(workspace_id));

-- LEAD_SOURCES
create policy "lead_sources_select" on public.lead_sources for select using (public.has_workspace_access(workspace_id));
create policy "lead_sources_insert" on public.lead_sources for insert with check (public.has_workspace_access(workspace_id));
create policy "lead_sources_delete" on public.lead_sources for delete using (public.has_workspace_access(workspace_id));

-- ACTIVITIES
create policy "activities_select" on public.activities for select using (public.has_workspace_access(workspace_id));
create policy "activities_insert" on public.activities for insert with check (public.has_workspace_access(workspace_id));
