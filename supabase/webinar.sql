-- Webinar funnel (Supabase = source of truth on Vercel)
-- Run in Supabase SQL Editor once. Safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.webinars (
  id text primary key,
  title text not null,
  description text not null default '',
  zoom_webinar_id text not null default '',
  start_at timestamptz,
  end_at timestamptz,
  timezone text not null default 'Asia/Jerusalem',
  join_url text not null default '',
  status text not null default 'scheduled'
    check (status in ('draft', 'scheduled', 'live', 'ended', 'cancelled')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  webinar_id text not null default 'default'
    references public.webinars (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  normalized_email text not null,
  phone text not null default '',
  status text not null default 'registered',
  field text not null default '',
  interest text not null default '',
  blocker text not null default '',
  marketing_opt_in boolean not null default false,
  ab_variant text not null default 'a',
  zoom_registrant_id text not null default '',
  zoom_join_url text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  utm_content text not null default '',
  utm_term text not null default '',
  gclid text not null default '',
  fbclid text not null default '',
  landing_page text not null default '',
  referrer text not null default '',
  registered_at timestamptz not null default now(),
  confirmed_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_1h_sent_at timestamptz,
  reminder_15m_sent_at timestamptz,
  attended_at timestamptz,
  converted_at timestamptz,
  join_time timestamptz,
  leave_time timestamptz,
  first_join_time timestamptz,
  last_leave_time timestamptz,
  attendance_duration_seconds integer not null default 0,
  attendance_percentage numeric(5,2) not null default 0,
  attendance_segment text not null default 'unknown'
    check (attendance_segment in ('unknown', 'no_show', 'partial', 'full', 'attended')),
  person_picked_at timestamptz,
  confirmation_email_sent_at timestamptz,
  follow_up_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (webinar_id, normalized_email)
);

create index if not exists idx_webinar_reg_status on public.webinar_registrations (status);
create index if not exists idx_webinar_reg_webinar on public.webinar_registrations (webinar_id);
create index if not exists idx_webinar_reg_email on public.webinar_registrations (normalized_email);
create index if not exists idx_webinar_reg_created on public.webinar_registrations (created_at desc);

create table if not exists public.webinar_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  registration_id uuid references public.webinar_registrations (id) on delete set null,
  webinar_id text references public.webinars (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  external_event_id text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists idx_webinar_events_external
  on public.webinar_events (external_event_id)
  where external_event_id <> '';

create table if not exists public.webinar_webhook_dedupe (
  event_id text primary key,
  received_at timestamptz not null default now()
);

alter table public.webinars enable row level security;
alter table public.webinar_registrations enable row level security;
alter table public.webinar_events enable row level security;
alter table public.webinar_webhook_dedupe enable row level security;

-- Public read of active webinar config only (no secrets).
drop policy if exists webinars_public_read on public.webinars;
create policy webinars_public_read on public.webinars
  for select to anon, authenticated
  using (status in ('scheduled', 'live'));

-- No public access to registrations / events / dedupe (service role only).
drop policy if exists webinar_reg_deny_all on public.webinar_registrations;
create policy webinar_reg_deny_all on public.webinar_registrations
  for all to anon, authenticated
  using (false)
  with check (false);

insert into public.webinars (id, title, description, status, config)
values (
  'default',
  'וובינר פתיחה. Infinite Masterpiece',
  'ערב חי: ממסע השראה למערכת הכנסה',
  'scheduled',
  '{}'::jsonb
)
on conflict (id) do nothing;
