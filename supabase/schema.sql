create extension if not exists "pgcrypto";

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  course text,
  role text not null default 'student',
  onboarded boolean not null default false,
  target_role_id uuid references public.roles(id) on delete set null,
  future_plans text,
  strengths text,
  weaknesses text,
  previous_academics jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  streak int not null default 0,
  last_activity_date date,
  updated_at timestamptz
);

create table if not exists public.role_skills (
  role_id uuid references public.roles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  weight numeric not null default 0.8,
  primary key (role_id, skill_id)
);

create table if not exists public.skill_dependencies (
  prerequisite_skill_id uuid references public.skills(id) on delete cascade,
  dependent_skill_id uuid references public.skills(id) on delete cascade,
  primary key (prerequisite_skill_id, dependent_skill_id)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  provider text,
  url text,
  difficulty text,
  tags text[],
  created_at timestamptz not null default now()
);

create table if not exists public.skill_resources (
  skill_id uuid references public.skills(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  primary key (skill_id, resource_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills(id) on delete set null,
  prompt text not null,
  options jsonb not null,
  correct_index int not null,
  difficulty int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  attempt_date date not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  correct_count int not null default 0,
  total_count int not null default 0,
  xp_earned int not null default 0,
  unique (user_id, attempt_date)
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.daily_attempts(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  selected_index int not null,
  is_correct boolean not null,
  points int not null,
  skill_id uuid references public.skills(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.attempt_skill_scores (
  attempt_id uuid references public.daily_attempts(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  score int not null,
  primary key (attempt_id, skill_id)
);

create table if not exists public.user_skill_scores (
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  score int not null default 0,
  updated_at timestamptz,
  primary key (user_id, skill_id)
);

create table if not exists public.user_roadmap (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  category text not null,
  priority numeric not null,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (user_id, role_id, skill_id)
);

create table if not exists public.user_resource_completions (
  user_id uuid references public.profiles(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create or replace function public.get_random_questions(p_limit int)
returns setof public.questions
language sql
stable
as $$
  select * from public.questions order by random() limit p_limit;
$$;

alter table public.profiles enable row level security;
alter table public.user_stats enable row level security;
alter table public.daily_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.attempt_skill_scores enable row level security;
alter table public.user_skill_scores enable row level security;
alter table public.user_roadmap enable row level security;
alter table public.user_resource_completions enable row level security;

alter table public.skills enable row level security;
alter table public.roles enable row level security;
alter table public.role_skills enable row level security;
alter table public.skill_dependencies enable row level security;
alter table public.resources enable row level security;
alter table public.skill_resources enable row level security;
alter table public.questions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "user_stats_select_own" on public.user_stats
  for select using (auth.uid() = user_id);

create policy "user_stats_upsert_own" on public.user_stats
  for insert with check (auth.uid() = user_id);

create policy "user_stats_update_own" on public.user_stats
  for update using (auth.uid() = user_id);

create policy "attempts_select_own" on public.daily_attempts
  for select using (auth.uid() = user_id);

create policy "attempts_insert_own" on public.daily_attempts
  for insert with check (auth.uid() = user_id);

create policy "attempts_update_own" on public.daily_attempts
  for update using (auth.uid() = user_id);

create policy "answers_select_own" on public.attempt_answers
  for select using (exists (select 1 from public.daily_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "answers_insert_own" on public.attempt_answers
  for insert with check (exists (select 1 from public.daily_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "attempt_skill_scores_select_own" on public.attempt_skill_scores
  for select using (exists (select 1 from public.daily_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "attempt_skill_scores_upsert_own" on public.attempt_skill_scores
  for insert with check (exists (select 1 from public.daily_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

create policy "user_skill_scores_select_own" on public.user_skill_scores
  for select using (auth.uid() = user_id);

create policy "user_skill_scores_upsert_own" on public.user_skill_scores
  for insert with check (auth.uid() = user_id);

create policy "user_skill_scores_update_own" on public.user_skill_scores
  for update using (auth.uid() = user_id);

create policy "roadmap_select_own" on public.user_roadmap
  for select using (auth.uid() = user_id);

create policy "roadmap_upsert_own" on public.user_roadmap
  for insert with check (auth.uid() = user_id);

create policy "roadmap_update_own" on public.user_roadmap
  for update using (auth.uid() = user_id);

create policy "resource_completion_select_own" on public.user_resource_completions
  for select using (auth.uid() = user_id);

create policy "resource_completion_insert_own" on public.user_resource_completions
  for insert with check (auth.uid() = user_id);

create policy "catalog_select_auth" on public.skills
  for select to authenticated using (true);

create policy "catalog_select_auth_roles" on public.roles
  for select to authenticated using (true);

create policy "catalog_select_auth_role_skills" on public.role_skills
  for select to authenticated using (true);

create policy "catalog_select_auth_skill_deps" on public.skill_dependencies
  for select to authenticated using (true);

create policy "catalog_select_auth_resources" on public.resources
  for select to authenticated using (true);

create policy "catalog_select_auth_skill_resources" on public.skill_resources
  for select to authenticated using (true);

create policy "catalog_select_auth_questions" on public.questions
  for select to authenticated using (true);
