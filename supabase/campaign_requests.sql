-- Apply after supabase/schema.sql. Requests for legitimate video distribution,
-- not orders for artificial social media metrics.
create table if not exists public.campaign_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','facebook','youtube','tiktok')),
  category text not null check (category in ('video_ads','organic_distribution','creative_review')),
  service_key text not null check (length(service_key) between 3 and 100),
  video_url text not null check (length(video_url) between 12 and 1000),
  target_views bigint not null check (target_views between 100 and 1000000000),
  proposed_budget_brl numeric(12,2) not null check (proposed_budget_brl between 0 and 10000000),
  notes text not null default '' check (length(notes) <= 1500),
  status text not null default 'received' check (status in
    ('received','reviewing','awaiting_approval','approved','in_progress','completed','canceled')),
  admin_notes text not null default '' check (length(admin_notes) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaign_requests_user_idx on public.campaign_requests(user_id,created_at desc);
create index if not exists campaign_requests_status_idx on public.campaign_requests(status,created_at desc);
alter table public.campaign_requests enable row level security;

drop policy if exists "Campaign users can read own" on public.campaign_requests;
create policy "Campaign users can read own" on public.campaign_requests
  for select to authenticated
  using ((select auth.uid()) = user_id or exists(select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true));

drop policy if exists "Campaign users can create own" on public.campaign_requests;
create policy "Campaign users can create own" on public.campaign_requests
  for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'received' and admin_notes = '');

drop policy if exists "Only admins update campaigns" on public.campaign_requests;
create policy "Only admins update campaigns" on public.campaign_requests
  for update to authenticated
  using (exists(select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true))
  with check (exists(select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_admin = true));

grant select,insert,update on public.campaign_requests to authenticated;
revoke all on public.campaign_requests from anon;
