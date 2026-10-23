-- Run once in Supabase SQL Editor. Safe multi-tenant RLS, no client-editable billing roles.
create extension if not exists pgcrypto;
create schema if not exists viewnow_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','starter','growth','scale')),
  is_admin boolean not null default false,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);
create or replace function viewnow_private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id) on conflict(id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure viewnow_private.handle_new_user();

-- Backfill profiles when schema is installed after existing users are registered.
insert into public.profiles(id) select id from auth.users on conflict do nothing;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  url text not null check (length(url) <= 1000),
  platform text not null check (platform in ('youtube','instagram','facebook','tiktok')),
  embed_url text,
  current_views bigint not null default 0 check (current_views between 0 and 1000000000000),
  target_views bigint not null default 10000 check (target_views between 1 and 1000000000000),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists videos_user_idx on public.videos(user_id, created_at desc);

create table if not exists public.video_clicks (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists clicks_video_idx on public.video_clicks(video_id);

create or replace function viewnow_private.enforce_video_plan() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p record;
  max_allowed integer;
  count_now integer;
begin
  select plan, is_admin into p from public.profiles where id = new.user_id;
  if p.is_admin then return new; end if;
  max_allowed := case coalesce(p.plan, 'free')
    when 'starter' then 20 when 'growth' then 100 when 'scale' then 500 else 3 end;
  select count(*) into count_now from public.videos where user_id = new.user_id;
  if count_now >= max_allowed then
    raise exception 'Limite de vídeos do seu plano atingido';
  end if;
  return new;
end $$;
drop trigger if exists limit_video_creation on public.videos;
create trigger limit_video_creation before insert on public.videos
for each row execute procedure viewnow_private.enforce_video_plan();

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.video_clicks enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
-- No public client UPDATE, INSERT or DELETE policy for profiles. Service role only.

drop policy if exists "read owned and public videos" on public.videos;
create policy "read owned and public videos" on public.videos for select to anon, authenticated
  using (is_public or user_id = (select auth.uid()));
drop policy if exists "create own videos" on public.videos;
create policy "create own videos" on public.videos for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "update own videos" on public.videos;
create policy "update own videos" on public.videos for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "delete own videos" on public.videos;
create policy "delete own videos" on public.videos for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "record public share clicks" on public.video_clicks;
create policy "record public share clicks" on public.video_clicks for insert to anon, authenticated
  with check (exists(select 1 from public.videos v where v.id = video_id and v.is_public));
drop policy if exists "owner reads outbound clicks" on public.video_clicks;
create policy "owner reads outbound clicks" on public.video_clicks for select to authenticated
  using (exists(select 1 from public.videos v where v.id = video_id and v.user_id = (select auth.uid())));

revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.videos to authenticated;
grant select on public.videos to anon;
grant insert on public.video_clicks to anon, authenticated;
grant select on public.video_clicks to authenticated;

-- Prevent direct invocation of privileged trigger functions by API roles.
revoke all on schema viewnow_private from public, anon, authenticated;
revoke all on function viewnow_private.handle_new_user() from public, anon, authenticated;
revoke all on function viewnow_private.enforce_video_plan() from public, anon, authenticated;

-- Admins always remain on the free plan while retaining unlimited video capacity.
create or replace function viewnow_private.ensure_admin_free_plan()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_admin is true then
    new.plan := 'free';
  end if;
  return new;
end $$;
drop trigger if exists ensure_admin_free_plan on public.profiles;
create trigger ensure_admin_free_plan
before insert or update of plan, is_admin on public.profiles
for each row execute function viewnow_private.ensure_admin_free_plan();
update public.profiles set plan = 'free' where is_admin = true and plan <> 'free';
revoke all on function viewnow_private.ensure_admin_free_plan() from public, anon, authenticated;
