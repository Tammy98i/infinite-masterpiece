-- Team founders catalog + internal messages (Vercel admin)
-- Run once in Supabase SQL Editor.

create table if not exists public.team_founders (
  id text primary key,
  founder_id text not null unique,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  title text not null default 'יזם',
  bio text not null default '',
  avatar_url text not null default '',
  credentials jsonb not null default '[]'::jsonb,
  external_links jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_founders_sort on public.team_founders (sort_order, name);

create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  to_user_id uuid references public.profiles (id) on delete set null,
  subject text not null default '',
  body text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_messages_created on public.team_messages (created_at desc);

alter table public.team_founders enable row level security;
alter table public.team_messages enable row level security;

drop policy if exists team_founders_public_read on public.team_founders;
create policy team_founders_public_read on public.team_founders
  for select to anon, authenticated
  using (true);

drop policy if exists team_founders_admin_write on public.team_founders;
create policy team_founders_admin_write on public.team_founders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists team_messages_admin on public.team_messages;
create policy team_messages_admin on public.team_messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
