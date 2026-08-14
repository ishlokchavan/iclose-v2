-- Simple custom login table: loginid (email) + bcrypt-hashed password.
-- Passwords are NEVER stored in plaintext; they are hashed with bcrypt via pgcrypto.
--
-- Helper functions:
--   upsert_app_user(loginid, password, role) -> inserts a user, or if the
--       loginid already exists, updates its password (and role if provided).
--   verify_app_user(loginid, password)       -> returns the user row on a
--       correct password, nothing otherwise. Login id is case-insensitive.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  loginid       text not null,
  password_hash text not null,
  role          text not null default 'user',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint app_users_loginid_key unique (loginid)
);

comment on table public.app_users is 'Simple username/password login table. Passwords stored as bcrypt hashes.';

-- Normalize loginid (lowercase, trimmed) and keep updated_at fresh.
create or replace function public.app_users_normalize()
returns trigger
language plpgsql
as $$
begin
  new.loginid := lower(trim(new.loginid));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_normalize on public.app_users;
create trigger trg_app_users_normalize
  before insert or update on public.app_users
  for each row execute function public.app_users_normalize();

-- Lock the table down: RLS on, no policies => no direct anon/authenticated access.
-- All access goes through the SECURITY DEFINER functions below (or the service role).
alter table public.app_users enable row level security;

-- Insert a new user, or if the loginid (email) already exists, update its password.
create or replace function public.upsert_app_user(
  p_loginid  text,
  p_password text,
  p_role     text default null
)
returns table(id uuid, loginid text, role text, action text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_action text;
begin
  if p_loginid is null or length(trim(p_loginid)) = 0 then
    raise exception 'loginid is required';
  end if;
  if p_password is null or length(p_password) = 0 then
    raise exception 'password is required';
  end if;

  update public.app_users u
     set password_hash = crypt(p_password, gen_salt('bf', 10)),
         role          = coalesce(p_role, u.role)
   where u.loginid = lower(trim(p_loginid))
  returning u.id into v_id;

  if v_id is null then
    insert into public.app_users(loginid, password_hash, role)
    values (lower(trim(p_loginid)), crypt(p_password, gen_salt('bf', 10)), coalesce(p_role, 'user'))
    returning app_users.id into v_id;
    v_action := 'created';
  else
    v_action := 'updated';
  end if;

  return query
    select u.id, u.loginid, u.role, v_action
    from public.app_users u
    where u.id = v_id;
end;
$$;

-- Verify a login. Returns the user row on success, nothing on failure.
create or replace function public.verify_app_user(
  p_loginid  text,
  p_password text
)
returns table(id uuid, loginid text, role text)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select u.id, u.loginid, u.role
  from public.app_users u
  where u.loginid = lower(trim(p_loginid))
    and u.password_hash = crypt(p_password, u.password_hash);
$$;

-- Login check is safe for anon (needed before a session exists).
grant execute on function public.verify_app_user(text, text) to anon, authenticated;
-- Creating/updating users is privileged: service role only (not anon/authenticated).
revoke all on function public.upsert_app_user(text, text, text) from public;
grant execute on function public.upsert_app_user(text, text, text) to service_role;

-- Seed the Super Admin. Re-running this migration updates the password in place
-- (upsert-on-existing-email), it never creates a duplicate.
select public.upsert_app_user('hello@iclose.ae', 'He110@dm1#', 'super_admin');
