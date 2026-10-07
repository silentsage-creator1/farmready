create table if not exists public.farm_projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  farm_type text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farm_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.farm_projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  invited_email text not null,
  display_name text,
  user_type text not null check (user_type in ('Farm Manager', 'Farm Worker', 'Accountant / Finance Officer', 'Production Officer', 'Viewer / Adviser')),
  permission_overrides jsonb not null default '{}'::jsonb,
  permissions text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  invited_by uuid not null references auth.users(id),
  invited_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, invited_email)
);

create index if not exists farm_project_members_user_project_idx on public.farm_project_members(user_id, project_id) where status = 'active';
create index if not exists farm_project_members_email_idx on public.farm_project_members(lower(invited_email));

create schema if not exists private;

create or replace function private.is_farm_project_owner(target_project_id text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.farm_projects p
    where p.id = target_project_id and p.owner_id = (select auth.uid())
  );
$$;

create or replace function private.has_farm_project_permission(target_project_id text, required_permission text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_farm_project_owner(target_project_id) or exists (
    select 1 from public.farm_project_members m
    where m.project_id = target_project_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and required_permission = any(m.permissions)
  );
$$;

revoke execute on function private.is_farm_project_owner(text) from public;
revoke execute on function private.has_farm_project_permission(text, text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_farm_project_owner(text) to authenticated;
grant execute on function private.has_farm_project_permission(text, text) to authenticated;

alter table public.farm_projects enable row level security;
alter table public.farm_project_members enable row level security;
revoke all on public.farm_projects, public.farm_project_members from anon, authenticated;
grant select on public.farm_projects to authenticated;
grant insert, update, delete on public.farm_projects to authenticated;
grant select on public.farm_project_members to authenticated;
grant insert, update, delete on public.farm_project_members to authenticated;

drop policy if exists "Owners and authorized members can view projects" on public.farm_projects;
create policy "Owners and authorized members can view projects"
  on public.farm_projects for select to authenticated
  using (private.has_farm_project_permission(id, 'project.view'));

drop policy if exists "Owners create their own projects" on public.farm_projects;
create policy "Owners create their own projects"
  on public.farm_projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners update projects" on public.farm_projects;
create policy "Owners update projects"
  on public.farm_projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners delete projects" on public.farm_projects;
create policy "Owners delete projects"
  on public.farm_projects for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Owners and members view their memberships" on public.farm_project_members;
create policy "Owners and members view their memberships"
  on public.farm_project_members for select to authenticated
  using (private.is_farm_project_owner(project_id) or user_id = (select auth.uid()));

drop policy if exists "Owners add project members" on public.farm_project_members;
create policy "Owners add project members"
  on public.farm_project_members for insert to authenticated
  with check (private.is_farm_project_owner(project_id) and invited_by = (select auth.uid()));

drop policy if exists "Owners update project members" on public.farm_project_members;
create policy "Owners update project members"
  on public.farm_project_members for update to authenticated
  using (private.is_farm_project_owner(project_id))
  with check (private.is_farm_project_owner(project_id));

drop policy if exists "Owners remove project members" on public.farm_project_members;
create policy "Owners remove project members"
  on public.farm_project_members for delete to authenticated
  using (private.is_farm_project_owner(project_id));

create or replace function private.activate_project_invitations_for_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.email is not null and new.email_confirmed_at is not null then
    update public.farm_project_members
      set user_id = new.id, status = 'active', updated_at = now()
      where lower(invited_email) = lower(new.email) and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists activate_farm_project_invitation on auth.users;
create trigger activate_farm_project_invitation
  after insert or update of email_confirmed_at on auth.users
  for each row execute function private.activate_project_invitations_for_new_user();
