-- Enable Row Level Security on the project-tracker tables.
--
-- The policies mirror the access model the app already enforces in its own
-- queries: a project belongs to the users listed in projects.allowed_users
-- (older rows instead carry owner_id), and its tasks/KPIs/documents inherit
-- that membership. Tasks are additionally visible to their assignee, because
-- MyTasks and the dashboard fetch by assigned_to.
--
-- Server routes that need to bypass these rules already use the service role
-- key, which is not subject to RLS.

-- Membership check as SECURITY DEFINER so evaluating it inside another table's
-- policy does not re-enter the policy on projects. It lives in `private` so it
-- is not reachable as a PostgREST RPC.
create schema if not exists private;

create or replace function private.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        auth.uid() = any (coalesce(p.allowed_users, '{}'::uuid[]))
        or p.owner_id = auth.uid()
      )
  );
$$;

revoke all on function private.has_project_access(uuid) from public;
revoke all on function private.has_project_access(uuid) from anon;
grant usage on schema private to authenticated;
grant execute on function private.has_project_access(uuid) to authenticated;

-- ── projects ────────────────────────────────────────────────────────────────

alter table public.projects enable row level security;

drop policy if exists "projects are viewable by members" on public.projects;
create policy "projects are viewable by members"
  on public.projects for select to authenticated
  using (
    auth.uid() = any (coalesce(allowed_users, '{}'::uuid[]))
    or owner_id = auth.uid()
  );

drop policy if exists "projects are insertable by members" on public.projects;
create policy "projects are insertable by members"
  on public.projects for insert to authenticated
  with check (
    auth.uid() = any (coalesce(allowed_users, '{}'::uuid[]))
    or owner_id = auth.uid()
  );

-- The USING clause gates who may edit; the check stays open so a member can
-- rewrite allowed_users (which is exactly what EditProjectDialog does).
drop policy if exists "projects are updatable by members" on public.projects;
create policy "projects are updatable by members"
  on public.projects for update to authenticated
  using (
    auth.uid() = any (coalesce(allowed_users, '{}'::uuid[]))
    or owner_id = auth.uid()
  )
  with check (true);

drop policy if exists "projects are deletable by members" on public.projects;
create policy "projects are deletable by members"
  on public.projects for delete to authenticated
  using (
    auth.uid() = any (coalesce(allowed_users, '{}'::uuid[]))
    or owner_id = auth.uid()
  );

-- ── tasks ───────────────────────────────────────────────────────────────────

alter table public.tasks enable row level security;

drop policy if exists "tasks are viewable by members or assignee" on public.tasks;
create policy "tasks are viewable by members or assignee"
  on public.tasks for select to authenticated
  using (
    assigned_to = auth.uid()
    or (project_id is not null and private.has_project_access(project_id))
  );

drop policy if exists "tasks are insertable by members" on public.tasks;
create policy "tasks are insertable by members"
  on public.tasks for insert to authenticated
  with check (
    assigned_to = auth.uid()
    or (project_id is not null and private.has_project_access(project_id))
  );

drop policy if exists "tasks are updatable by members or assignee" on public.tasks;
create policy "tasks are updatable by members or assignee"
  on public.tasks for update to authenticated
  using (
    assigned_to = auth.uid()
    or (project_id is not null and private.has_project_access(project_id))
  )
  with check (true);

drop policy if exists "tasks are deletable by members or assignee" on public.tasks;
create policy "tasks are deletable by members or assignee"
  on public.tasks for delete to authenticated
  using (
    assigned_to = auth.uid()
    or (project_id is not null and private.has_project_access(project_id))
  );

-- ── kpis ────────────────────────────────────────────────────────────────────

alter table public.kpis enable row level security;

-- Replaces an inert "insert for authenticated users only" policy that allowed
-- writing a KPI onto any project.
drop policy if exists "Enable insert for authenticated users only" on public.kpis;

drop policy if exists "kpis are viewable by project members" on public.kpis;
create policy "kpis are viewable by project members"
  on public.kpis for select to authenticated
  using (project_id is not null and private.has_project_access(project_id));

drop policy if exists "kpis are insertable by project members" on public.kpis;
create policy "kpis are insertable by project members"
  on public.kpis for insert to authenticated
  with check (project_id is not null and private.has_project_access(project_id));

drop policy if exists "kpis are updatable by project members" on public.kpis;
create policy "kpis are updatable by project members"
  on public.kpis for update to authenticated
  using (project_id is not null and private.has_project_access(project_id))
  with check (true);

drop policy if exists "kpis are deletable by project members" on public.kpis;
create policy "kpis are deletable by project members"
  on public.kpis for delete to authenticated
  using (project_id is not null and private.has_project_access(project_id));

-- ── project_documents ───────────────────────────────────────────────────────

alter table public.project_documents enable row level security;

drop policy if exists "project documents are viewable by project members" on public.project_documents;
create policy "project documents are viewable by project members"
  on public.project_documents for select to authenticated
  using (private.has_project_access(project_id));

drop policy if exists "project documents are insertable by project members" on public.project_documents;
create policy "project documents are insertable by project members"
  on public.project_documents for insert to authenticated
  with check (private.has_project_access(project_id));

drop policy if exists "project documents are updatable by project members" on public.project_documents;
create policy "project documents are updatable by project members"
  on public.project_documents for update to authenticated
  using (private.has_project_access(project_id))
  with check (true);

drop policy if exists "project documents are deletable by project members" on public.project_documents;
create policy "project documents are deletable by project members"
  on public.project_documents for delete to authenticated
  using (private.has_project_access(project_id));

-- ── profiles ────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Every signed-in user needs to read all profiles: assignee pickers, @mentions
-- and comment author names all resolve display names this way.
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "profiles are insertable by their owner" on public.profiles;
create policy "profiles are insertable by their owner"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles are updatable by their owner" on public.profiles;
create policy "profiles are updatable by their owner"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
