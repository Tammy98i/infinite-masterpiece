-- Run in Supabase SQL Editor (Project → SQL).
-- Keeps role/plan metadata next to auth.users for future Postgres migration.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('admin', 'lecturer', 'user')),
  subscription_plan text not null default 'none',
  staff_desk text not null default '',
  staff_status text not null default 'active',
  is_founder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own_name" on public.profiles;
create policy "profiles_update_own_name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Avoid recursive RLS: policies call this security-definer helper instead of querying profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1
      from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    or lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'tam98iiy@gmail.com',
      'infinite.masterpiece8@gmail.com'
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Users may only change their own display name; privileged fields stay server-side.
-- service_role and signed-in admins may update role and staff fields.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    new.updated_at = now();
    return new;
  end if;
  if new.role is distinct from old.role
     or new.subscription_plan is distinct from old.subscription_plan
     or new.staff_desk is distinct from old.staff_desk
     or new.staff_status is distinct from old.staff_status
     or new.is_founder is distinct from old.is_founder then
    raise exception 'לא ניתן לעדכן שדות הרשאה מפרופיל המשתמש';
  end if;
  -- Phone OTP users start with a blank email; they may fill it once.
  if new.email is distinct from old.email and coalesce(old.email, '') <> '' then
    raise exception 'לא ניתן לעדכן שדות הרשאה מפרופיל המשתמש';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(new.email, ''),
      case
        when coalesce(new.phone, '') <> '' then
          regexp_replace(new.phone, '[^0-9]', '', 'g') || '@phone.infinitemasterpiece.local'
        else ''
      end
    ),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when lower(coalesce(new.email, '')) in (
        'tam98iiy@gmail.com',
        'infinite.masterpiece8@gmail.com'
      ) then 'admin'
      else 'user'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
