-- Keep the application workspace behind the authenticated API so the server
-- can filter reads and validate each section against project permissions.
alter table public.farm_projects
  add column if not exists data jsonb not null default '{}'::jsonb;

-- Browser clients must not read or write complete project snapshots directly.
-- The authenticated API validates the caller and uses its server-only key.
revoke all on public.farm_projects, public.farm_project_members from anon, authenticated;

