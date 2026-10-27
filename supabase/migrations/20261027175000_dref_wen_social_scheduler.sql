-- Dref Wen has a separate queue. Older Gôl deployments and workers cannot
-- claim these rows while the new scheduler is being rolled out.
create table if not exists public.dref_wen_instagram_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  caption text not null,
  image_url text not null,
  image_name text,
  scheduled_for timestamptz not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'published', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  published_at timestamptz,
  instagram_media_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dref_wen_instagram_posts_owner_schedule_idx
  on public.dref_wen_instagram_scheduled_posts (created_by, scheduled_for);
create index if not exists dref_wen_instagram_posts_due_idx
  on public.dref_wen_instagram_scheduled_posts (scheduled_for)
  where status in ('queued', 'processing');

alter table public.dref_wen_instagram_scheduled_posts enable row level security;
revoke all on public.dref_wen_instagram_scheduled_posts from anon, authenticated;
grant select on public.dref_wen_instagram_scheduled_posts to authenticated;
grant all on public.dref_wen_instagram_scheduled_posts to service_role;

drop policy if exists "dref wen instagram posts are readable by owner"
  on public.dref_wen_instagram_scheduled_posts;
create policy "dref wen instagram posts are readable by owner"
  on public.dref_wen_instagram_scheduled_posts for select to authenticated
  using ((select auth.uid()) = created_by);

drop trigger if exists set_dref_wen_instagram_posts_updated_at
  on public.dref_wen_instagram_scheduled_posts;
create trigger set_dref_wen_instagram_posts_updated_at
  before update on public.dref_wen_instagram_scheduled_posts
  for each row execute function public.set_instagram_scheduled_posts_updated_at();

create table if not exists public.dref_wen_facebook_scheduled_post_images (
  post_id text primary key,
  image_name text not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.dref_wen_facebook_scheduled_post_images enable row level security;
revoke all on public.dref_wen_facebook_scheduled_post_images from anon, authenticated;
grant select on public.dref_wen_facebook_scheduled_post_images to authenticated;
grant all on public.dref_wen_facebook_scheduled_post_images to service_role;

drop policy if exists "dref wen facebook images are readable by owner"
  on public.dref_wen_facebook_scheduled_post_images;
create policy "dref wen facebook images are readable by owner"
  on public.dref_wen_facebook_scheduled_post_images for select to authenticated
  using ((select auth.uid()) = created_by);

-- Only the publishing service may claim jobs. The configured owner is an
-- explicit argument so a stray row belonging to another user stays untouched.
create or replace function public.claim_due_dref_wen_instagram_scheduled_posts(
  p_owner_id uuid,
  p_limit integer default 10
)
returns setof public.dref_wen_instagram_scheduled_posts
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  return query
  with due as (
    select post.id
    from public.dref_wen_instagram_scheduled_posts as post
    where post.created_by = p_owner_id
      and post.scheduled_for <= now()
      and (
        post.status = 'queued'
        or (post.status = 'processing' and post.last_attempt_at < now() - interval '15 minutes')
      )
    order by post.scheduled_for asc
    limit least(greatest(coalesce(p_limit, 10), 1), 25)
    for update skip locked
  )
  update public.dref_wen_instagram_scheduled_posts as post
  set status = 'processing',
      attempts = post.attempts + 1,
      last_attempt_at = now(),
      error_message = null
  from due
  where post.id = due.id
  returning post.*;
end;
$$;

revoke all on function public.claim_due_dref_wen_instagram_scheduled_posts(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_due_dref_wen_instagram_scheduled_posts(uuid, integer)
  to service_role;
