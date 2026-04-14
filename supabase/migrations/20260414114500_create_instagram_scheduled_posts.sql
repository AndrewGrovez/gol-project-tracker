create table if not exists public.instagram_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  caption text not null,
  image_url text not null,
  scheduled_for timestamptz not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'published', 'failed', 'cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  published_at timestamptz,
  instagram_media_id text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists instagram_scheduled_posts_created_by_scheduled_for_idx
  on public.instagram_scheduled_posts (created_by, scheduled_for desc);

create index if not exists instagram_scheduled_posts_due_idx
  on public.instagram_scheduled_posts (scheduled_for)
  where status in ('queued', 'processing');

alter table public.instagram_scheduled_posts enable row level security;

drop policy if exists "instagram scheduled posts are readable by owner" on public.instagram_scheduled_posts;
create policy "instagram scheduled posts are readable by owner"
  on public.instagram_scheduled_posts
  for select
  to authenticated
  using (auth.uid() = created_by);

grant select on public.instagram_scheduled_posts to authenticated;

create or replace function public.set_instagram_scheduled_posts_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_instagram_scheduled_posts_updated_at on public.instagram_scheduled_posts;
create trigger set_instagram_scheduled_posts_updated_at
before update on public.instagram_scheduled_posts
for each row
execute function public.set_instagram_scheduled_posts_updated_at();

create or replace function public.claim_due_instagram_scheduled_posts(p_limit integer default 10)
returns setof public.instagram_scheduled_posts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with due as (
    select post.id
    from public.instagram_scheduled_posts as post
    where post.scheduled_for <= timezone('utc', now())
      and (
        post.status = 'queued'
        or (
          post.status = 'processing'
          and post.last_attempt_at < timezone('utc', now()) - interval '15 minutes'
        )
      )
    order by post.scheduled_for asc
    limit greatest(coalesce(p_limit, 10), 1)
    for update skip locked
  ),
  claimed as (
    update public.instagram_scheduled_posts as post
    set status = 'processing',
        attempts = post.attempts + 1,
        last_attempt_at = timezone('utc', now()),
        error_message = null,
        updated_at = timezone('utc', now())
    from due
    where post.id = due.id
    returning post.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_due_instagram_scheduled_posts(integer) from public;
revoke all on function public.claim_due_instagram_scheduled_posts(integer) from anon;
revoke all on function public.claim_due_instagram_scheduled_posts(integer) from authenticated;
grant execute on function public.claim_due_instagram_scheduled_posts(integer) to service_role;
