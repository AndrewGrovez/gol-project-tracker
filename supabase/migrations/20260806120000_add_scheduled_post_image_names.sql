-- Track the original uploaded file name for scheduled posts so the scheduler UI
-- can show which image is attached to each post.

-- Instagram: the queue row already owns the image, so the name belongs on it.
alter table public.instagram_scheduled_posts
  add column if not exists image_name text;

-- Facebook: Meta owns the post record and does not retain the uploaded file
-- name, so we keep a sidecar row keyed by the Graph post id.
create table if not exists public.facebook_scheduled_post_images (
  post_id text primary key,
  image_name text not null,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.facebook_scheduled_post_images enable row level security;

-- The Facebook Page is shared by the whole team, so any signed-in user may read
-- these names. Writes only happen through the service role.
drop policy if exists "facebook scheduled post images are readable" on public.facebook_scheduled_post_images;
create policy "facebook scheduled post images are readable"
  on public.facebook_scheduled_post_images
  for select
  to authenticated
  using (true);

grant select on public.facebook_scheduled_post_images to authenticated;
