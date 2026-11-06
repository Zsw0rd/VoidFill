-- Additive, idempotent career profile foundation. Existing IDs and progress stay.
begin;

alter table public.profiles add column if not exists career_level text not null default 'foundation';
alter table public.profiles add column if not exists career_focus_skill_ids uuid[] not null default '{}';
alter table public.profiles add column if not exists career_goal_context text not null default '';
alter table public.role_skills add column if not exists required_score numeric not null default 75;
alter table public.role_skills add column if not exists essential boolean not null default true;
alter table public.role_skills add column if not exists catalogue_version text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_career_level_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_career_level_check check (career_level in ('foundation','intermediate'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_career_focus_limit' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_career_focus_limit check (cardinality(career_focus_skill_ids) <= 4);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_career_context_limit' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_career_context_limit check (char_length(career_goal_context) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'role_skills_required_score_check' and conrelid = 'public.role_skills'::regclass) then
    alter table public.role_skills add constraint role_skills_required_score_check check (required_score >= 0 and required_score <= 100);
  end if;
end $$;

create table if not exists public.career_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  content text not null check (char_length(content) <= 10000),
  updated_at timestamptz not null default now(),
  unique(user_id, role_id)
);
alter table public.career_reflections enable row level security;
revoke all on public.career_reflections from anon;
grant select, insert, update, delete on public.career_reflections to authenticated;
grant all on public.career_reflections to service_role;
drop policy if exists career_reflections_own on public.career_reflections;
create policy career_reflections_own on public.career_reflections for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
comment on table public.career_reflections is 'Private ungraded learning reflections. No skill score or XP is awarded. Sharing with a mentor is a separate user action.';

commit;
