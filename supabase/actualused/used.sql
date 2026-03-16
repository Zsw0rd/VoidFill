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

insert into public.skills (name, category, description) values
  ('Python Basics', 'Programming', 'Syntax, control flow, functions'),
  ('SQL Fundamentals', 'Data', 'Select, joins, aggregation'),
  ('Data Visualization', 'Data', 'Charts, storytelling, dashboards'),
  ('Web Fundamentals', 'Web', 'HTML/CSS/JS basics'),
  ('Git & Version Control', 'Tools', 'Branching, commits, PRs'),
  ('DSA Basics', 'CS', 'Arrays, stacks, queues, complexity')
on conflict (name) do nothing;

insert into public.roles (name, description) values
  ('Data Analyst', 'SQL + BI + basic Python'),
  ('Frontend Developer', 'Web fundamentals + JS + Git'),
  ('AI Applications Developer', 'Python + data handling + projects')
on conflict (name) do nothing;

with s as (select id,name from public.skills),
     r as (select id,name from public.roles)
insert into public.role_skills (role_id, skill_id, weight)
select r.id, s.id,
  case
    when r.name = 'Data Analyst' and s.name in ('SQL Fundamentals','Data Visualization') then 1.0
    when r.name = 'Data Analyst' and s.name = 'Python Basics' then 0.85
    when r.name = 'Frontend Developer' and s.name in ('Web Fundamentals','Git & Version Control') then 1.0
    when r.name = 'AI Applications Developer' and s.name in ('Python Basics','SQL Fundamentals') then 0.9
    else 0.75
  end
from r cross join s
where
  (r.name = 'Data Analyst' and s.name in ('SQL Fundamentals','Python Basics','Data Visualization','Git & Version Control'))
  or
  (r.name = 'Frontend Developer' and s.name in ('Web Fundamentals','Git & Version Control','DSA Basics'))
  or
  (r.name = 'AI Applications Developer' and s.name in ('Python Basics','SQL Fundamentals','Git & Version Control','DSA Basics','Data Visualization'))
on conflict do nothing;

with s as (select id,name from public.skills)
insert into public.skill_dependencies (prerequisite_skill_id, dependent_skill_id)
select a.id, b.id
from s a, s b
where (a.name,b.name) in (
  ('Python Basics','Data Visualization'),
  ('SQL Fundamentals','Data Visualization'),
  ('Git & Version Control','Web Fundamentals')
)
on conflict do nothing;

insert into public.questions (skill_id, prompt, options, correct_index, difficulty)
select s.id, q.prompt, q.options::jsonb, q.correct_index, q.difficulty
from public.skills s
join (values
  ('Python Basics','What does a function do in Python?','["Repeats code automatically","Groups reusable logic into a callable block","Stores images","Compiles the OS"]',1,1),
  ('Python Basics','Which is a valid Python list?','["(1,2,3)","{1,2,3}","[1,2,3]","<1,2,3>"]',2,1),
  ('SQL Fundamentals','Which clause filters rows after aggregation?','["WHERE","GROUP BY","HAVING","ORDER BY"]',2,2),
  ('SQL Fundamentals','What does JOIN do?','["Sorts data","Combines rows from tables","Deletes rows","Creates a DB"]',1,1),
  ('Data Visualization','Best chart for trend over time?','["Pie chart","Line chart","Scatter only","Radar"]',1,1),
  ('Web Fundamentals','What does CSS control?','["Database","Styling/layout","Server routing","CPU"]',1,1),
  ('Git & Version Control','What does git commit do?','["Uploads to cloud instantly","Records changes locally with a message","Deletes branch","Installs packages"]',1,1),
  ('DSA Basics','Big-O describes?','["Memory address","Time/space growth","UI styling","SQL joins"]',1,1),
  ('DSA Basics','Stack follows which order?','["FIFO","LIFO","Random","Sorted"]',1,1),
  ('Data Visualization','What improves readability most?','["More colors","Clear labels and scales","3D effects","Random axes"]',1,1)
) as q(skill_name,prompt,options,correct_index,difficulty)
on s.name = q.skill_name;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'student');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 001_profile_enhancements.sql
-- Adds student/professional profile fields + adds roadmap delete policy (safe)

create extension if not exists "pgcrypto";

-- Add new columns to profiles (all safe / idempotent)
alter table public.profiles
  add column if not exists user_type text not null default 'student'
    check (user_type in ('student', 'professional'));

alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists years_experience int;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists current_skills_text text;
alter table public.profiles add column if not exists education_level text;
alter table public.profiles add column if not exists graduation_year int;

-- Ensure RLS is on (safe even if already enabled)
alter table public.user_roadmap enable row level security;

-- Allow users to delete their own roadmap entries (for regeneration)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'user_roadmap'
      and policyname = 'roadmap_delete_own'
  ) then
    execute 'create policy "roadmap_delete_own" on public.user_roadmap
      for delete to authenticated
      using (auth.uid() = user_id)';
  end if;
end $$;

-- 002_roadmap_courses_and_assessments.sql
-- Adds roadmap_courses + course_assessments + progress column + RLS policies (safe)

create extension if not exists "pgcrypto";

-- Courses/books/projects recommended for each roadmap skill
create table if not exists public.roadmap_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  title text not null,
  type text not null check (type in ('course', 'book', 'project', 'tutorial', 'practice')),
  provider text,
  url text,
  estimated_hours numeric,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  description text,
  sort_order int not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Assessment results for each course
create table if not exists public.course_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.roadmap_courses(id) on delete cascade,
  score int not null default 0,
  total int not null default 5,
  passed boolean not null default false,
  attempt_number int not null default 1,
  answers jsonb,
  created_at timestamptz not null default now()
);

-- Add progress column to user_roadmap (safe)
alter table public.user_roadmap
  add column if not exists progress int not null default 0;

-- Enable RLS (safe)
alter table public.roadmap_courses enable row level security;
alter table public.course_assessments enable row level security;

-- Policies for roadmap_courses (create only if missing)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roadmap_courses' and policyname='roadmap_courses_select_own') then
    execute 'create policy "roadmap_courses_select_own" on public.roadmap_courses
      for select to authenticated
      using (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roadmap_courses' and policyname='roadmap_courses_insert_own') then
    execute 'create policy "roadmap_courses_insert_own" on public.roadmap_courses
      for insert to authenticated
      with check (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roadmap_courses' and policyname='roadmap_courses_update_own') then
    execute 'create policy "roadmap_courses_update_own" on public.roadmap_courses
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='roadmap_courses' and policyname='roadmap_courses_delete_own') then
    execute 'create policy "roadmap_courses_delete_own" on public.roadmap_courses
      for delete to authenticated
      using (auth.uid() = user_id)';
  end if;
end $$;

-- Policies for course_assessments (create only if missing)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_assessments' and policyname='course_assessments_select_own') then
    execute 'create policy "course_assessments_select_own" on public.course_assessments
      for select to authenticated
      using (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_assessments' and policyname='course_assessments_insert_own') then
    execute 'create policy "course_assessments_insert_own" on public.course_assessments
      for insert to authenticated
      with check (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='course_assessments' and policyname='course_assessments_update_own') then
    execute 'create policy "course_assessments_update_own" on public.course_assessments
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;

-- 003_ai_generated_questions_and_adaptive_difficulty.sql
-- Adds ai_generated_questions + daily_attempt difficulty level + fixed adaptive function (safe)

create extension if not exists "pgcrypto";

-- Cache AI-generated questions
create table if not exists public.ai_generated_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  prompt text not null,
  options jsonb not null,
  correct_index int not null,
  difficulty int not null default 1 check (difficulty between 1 and 5),
  explanation text,
  created_at timestamptz not null default now()
);

-- Track attempt difficulty level
alter table public.daily_attempts
  add column if not exists difficulty_level int not null default 1
    check (difficulty_level between 1 and 5);

-- RLS
alter table public.ai_generated_questions enable row level security;

-- Policies for ai_generated_questions (create only if missing)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_generated_questions' and policyname='ai_questions_select_own') then
    execute 'create policy "ai_questions_select_own" on public.ai_generated_questions
      for select to authenticated
      using (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_generated_questions' and policyname='ai_questions_insert_own') then
    execute 'create policy "ai_questions_insert_own" on public.ai_generated_questions
      for insert to authenticated
      with check (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_generated_questions' and policyname='ai_questions_update_own') then
    execute 'create policy "ai_questions_update_own" on public.ai_generated_questions
      for update to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_generated_questions' and policyname='ai_questions_delete_own') then
    execute 'create policy "ai_questions_delete_own" on public.ai_generated_questions
      for delete to authenticated
      using (auth.uid() = user_id)';
  end if;
end $$;

-- Adaptive difficulty function (fixed)
-- Uses last 5 completed attempts for the user:
-- - avg% >= 80 => difficulty +1 (max 5)
-- - avg% <= 40 => difficulty -1 (min 1)
-- - else stays same
create or replace function public.get_user_difficulty(p_user_id uuid)
returns int
language sql
stable
as $$
with last_attempts as (
  select
    difficulty_level,
    correct_count,
    total_count
  from public.daily_attempts
  where user_id = p_user_id
    and completed_at is not null
  order by attempt_date desc
  limit 5
),
stats as (
  select
    avg((correct_count::numeric / nullif(total_count, 0)) * 100) as avg_pct,
    coalesce(max(difficulty_level), 1) as prev_diff
  from last_attempts
)
select
  case
    when coalesce((select avg_pct from stats), 0) >= 80 then least((select prev_diff from stats) + 1, 5)
    when coalesce((select avg_pct from stats), 0) <= 40 then greatest((select prev_diff from stats) - 1, 1)
    else (select prev_diff from stats)
  end;
$$;

grant execute on function public.get_user_difficulty(uuid) to authenticated;

create table if not exists public.ai_insights (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    analysis jsonb not null default '{}'::jsonb,
    meta jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id)
);

alter table public.ai_insights enable row level security;

create policy "Users can view own insights"
on public.ai_insights
for select
using (auth.uid() = user_id);

create policy "Users can insert own insights"
on public.ai_insights
for insert
with check (auth.uid() = user_id);

create policy "Users can update own insights"
on public.ai_insights
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.practice_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    score int not null default 0,
    correct_count int not null default 0,
    total_count int not null default 0,
    difficulty_level int not null default 1,
    skill_scores jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.practice_attempts enable row level security;

create policy "practice_attempts_select_own"
on public.practice_attempts
for select
using (auth.uid() = user_id);

create policy "practice_attempts_insert_own"
on public.practice_attempts
for insert
with check (auth.uid() = user_id);

-- ============================================
-- Admin Users
-- ============================================
create table if not exists public.admin_users (
    id uuid primary key references auth.users(id) on delete cascade,
    admin_role text not null check (admin_role in ('super_admin', 'admin', 'mentor')),
    display_name text not null default '',
    created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists admin_users_select_admins on public.admin_users;
drop policy if exists admin_users_insert_super on public.admin_users;
drop policy if exists admin_users_update_super on public.admin_users;
drop policy if exists admin_users_delete_super on public.admin_users;

create policy "admin_users_select_admins" on public.admin_users
for select to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
  or auth.uid() = id
);

create policy "admin_users_insert_super" on public.admin_users
for insert
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role = 'super_admin'
  )
);

create policy "admin_users_update_super" on public.admin_users
for update
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role = 'super_admin'
  )
)
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role = 'super_admin'
  )
);

create policy "admin_users_delete_super" on public.admin_users
for delete
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role = 'super_admin'
  )
);

-- ============================================
-- Mentor Assignments
-- ============================================
create table if not exists public.mentor_assignments (
    id uuid primary key default gen_random_uuid(),
    mentor_id uuid references public.admin_users(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    assigned_at timestamptz not null default now(),
    unique (mentor_id, user_id)
);

alter table public.mentor_assignments enable row level security;

drop policy if exists mentor_assignments_select on public.mentor_assignments;
drop policy if exists mentor_assignments_insert on public.mentor_assignments;
drop policy if exists mentor_assignments_delete on public.mentor_assignments;

create policy "mentor_assignments_select" on public.mentor_assignments
for select to authenticated
using (
  auth.uid() = user_id
  or mentor_id = auth.uid()
  or exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
);

create policy "mentor_assignments_insert" on public.mentor_assignments
for insert
with check (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
);

create policy "mentor_assignments_delete" on public.mentor_assignments
for delete
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
);

-- ============================================
-- Chat Conversations
-- ============================================
create table if not exists public.chat_conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    mentor_id uuid references public.admin_users(id) on delete set null,
    is_ai boolean not null default true,
    title text not null default 'AI Mentor Chat',
    created_at timestamptz not null default now()
);

alter table public.chat_conversations enable row level security;

drop policy if exists chat_conv_select on public.chat_conversations;
drop policy if exists chat_conv_insert on public.chat_conversations;

create policy "chat_conv_select" on public.chat_conversations
for select to authenticated
using (
  auth.uid() = user_id
  or auth.uid() = mentor_id
  or exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
);

-- Optional tighten: only allow mentor_id if actually assigned
create policy "chat_conv_insert" on public.chat_conversations
for insert
with check (
  auth.uid() = user_id
  and (
    mentor_id is null
    or exists (
      select 1 from public.mentor_assignments ma
      where ma.user_id = auth.uid() and ma.mentor_id = mentor_id
    )
  )
);

-- ============================================
-- Chat Messages
-- ============================================
create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
    sender_id uuid references auth.users(id) on delete set null,
    sender_role text not null check (sender_role in ('user', 'mentor', 'ai', 'system')),
    content text not null,
    flagged boolean not null default false,
    flag_reason text,
    created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists chat_msg_select on public.chat_messages;
drop policy if exists chat_msg_insert on public.chat_messages;
drop policy if exists chat_msg_update_flag on public.chat_messages;

create policy "chat_msg_select" on public.chat_messages
for select to authenticated
using (
  exists (
    select 1
    from public.chat_conversations cc
    where cc.id = conversation_id
      and (
        cc.user_id = auth.uid()
        or cc.mentor_id = auth.uid()
        or exists (
          select 1 from public.admin_users au
          where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
        )
      )
  )
);

-- IMPORTANT: no 'ai'/'system' bypass here (server/service-role inserts those)
create policy "chat_msg_insert" on public.chat_messages
for insert
with check (
  exists (
    select 1
    from public.chat_conversations cc
    where cc.id = conversation_id
      and (
        (cc.user_id = auth.uid() and sender_role = 'user' and sender_id = auth.uid())
        or (cc.mentor_id = auth.uid() and sender_role = 'mentor' and sender_id = auth.uid())
      )
  )
);

-- Only admin/super_admin can flag/update moderation fields
create policy "chat_msg_update_flag" on public.chat_messages
for update
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
);

-- ============================================
-- Admin/Mentor read access to student data (scoped)
-- ============================================
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists user_skill_scores_select_admin on public.user_skill_scores;
drop policy if exists user_stats_select_admin on public.user_stats;
drop policy if exists attempts_select_admin on public.daily_attempts;

-- Admins: all profiles. Mentors: only assigned students.
create policy "profiles_select_admin" on public.profiles
for select to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
  or exists (
    select 1
    from public.mentor_assignments ma
    join public.admin_users au on au.id = ma.mentor_id
    where au.id = auth.uid()
      and au.admin_role = 'mentor'
      and ma.user_id = public.profiles.id
  )
);

create policy "user_skill_scores_select_admin" on public.user_skill_scores
for select to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
  or exists (
    select 1 from public.mentor_assignments ma
    join public.admin_users au on au.id = ma.mentor_id
    where au.id = auth.uid()
      and au.admin_role = 'mentor'
      and ma.user_id = public.user_skill_scores.user_id
  )
);

create policy "user_stats_select_admin" on public.user_stats
for select to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
  or exists (
    select 1 from public.mentor_assignments ma
    join public.admin_users au on au.id = ma.mentor_id
    where au.id = auth.uid()
      and au.admin_role = 'mentor'
      and ma.user_id = public.user_stats.user_id
  )
);

create policy "attempts_select_admin" on public.daily_attempts
for select to authenticated
using (
  exists (
    select 1 from public.admin_users au
    where au.id = auth.uid() and au.admin_role in ('super_admin','admin')
  )
  or exists (
    select 1 from public.mentor_assignments ma
    join public.admin_users au on au.id = ma.mentor_id
    where au.id = auth.uid()
      and au.admin_role = 'mentor'
      and ma.user_id = public.daily_attempts.user_id
  )
);

-- Helpful indexes
create index if not exists mentor_assignments_mentor_idx on public.mentor_assignments (mentor_id);
create index if not exists mentor_assignments_user_idx on public.mentor_assignments (user_id);
create index if not exists chat_messages_conv_time_idx on public.chat_messages (conversation_id, created_at desc);
create index if not exists chat_conversations_user_idx on public.chat_conversations (user_id);
create index if not exists chat_conversations_mentor_idx on public.chat_conversations (mentor_id);

insert into public.admin_users (id, admin_role, display_name)
values ('818fab26-0c0b-42ee-b07d-cc1a37de3bcd', 'super_admin', 'Platform Admin')
on conflict (id) do update
set admin_role = excluded.admin_role,
    display_name = excluded.display_name;

-- 1) Drop the recursive policies
drop policy if exists "admin_users_select_admins" on public.admin_users;
drop policy if exists "admin_users_insert_super" on public.admin_users;
drop policy if exists "admin_users_update_super" on public.admin_users;
drop policy if exists "admin_users_delete_super" on public.admin_users;

-- 2) Helper functions (bypass RLS safely)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and admin_role in ('super_admin','admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and admin_role = 'super_admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- 3) Recreate non-recursive policies
create policy "admin_users_select_admins"
on public.admin_users
for select to authenticated
using (public.is_admin() or auth.uid() = id);

create policy "admin_users_insert_super"
on public.admin_users
for insert to authenticated
with check (public.is_super_admin());

create policy "admin_users_update_super"
on public.admin_users
for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "admin_users_delete_super"
on public.admin_users
for delete to authenticated
using (public.is_super_admin());

ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS clear_requested_by uuid REFERENCES auth.users(id) DEFAULT NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_target_role text DEFAULT NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_custom_target_role_chk
CHECK (custom_target_role is null or length(trim(custom_target_role)) > 0);

-- Add clear_requested_by column to chat_conversations for 2-way clear approval
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS clear_requested_by uuid REFERENCES auth.users(id) DEFAULT NULL;

-- Add custom_target_role column to profiles for "Others/Custom" role selection
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_target_role text DEFAULT NULL;

create index if not exists chat_conversations_clear_requested_by_idx
on public.chat_conversations (clear_requested_by);

-- ============================================
-- Chat policy fixes for mentor/student messaging
-- ============================================
drop policy if exists "chat_conv_select" on public.chat_conversations;
drop policy if exists "chat_conv_insert" on public.chat_conversations;
drop policy if exists "chat_conv_update_owner_or_assigned_mentor" on public.chat_conversations;
drop policy if exists "chat_msg_select" on public.chat_messages;
drop policy if exists "chat_msg_insert" on public.chat_messages;
drop policy if exists "chat_msg_delete_owner_or_assigned_mentor" on public.chat_messages;

create policy "chat_conv_select"
on public.chat_conversations
for select to authenticated
using (
  auth.uid() = user_id
  or auth.uid() = mentor_id
  or exists (
    select 1
    from public.mentor_assignments ma
    where ma.user_id = public.chat_conversations.user_id
      and ma.mentor_id = auth.uid()
  )
  or public.is_admin()
);

create policy "chat_conv_insert"
on public.chat_conversations
for insert to authenticated
with check (
  (
    auth.uid() = user_id
    and (
      mentor_id is null
      or exists (
        select 1
        from public.mentor_assignments ma
        where ma.user_id = auth.uid()
          and ma.mentor_id = mentor_id
      )
    )
  )
  or (
    mentor_id = auth.uid()
    and exists (
      select 1
      from public.mentor_assignments ma
      where ma.user_id = user_id
        and ma.mentor_id = auth.uid()
    )
  )
  or public.is_admin()
);

create policy "chat_conv_update_owner_or_assigned_mentor"
on public.chat_conversations
for update to authenticated
using (
  auth.uid() = user_id
  or auth.uid() = mentor_id
  or exists (
    select 1
    from public.mentor_assignments ma
    where ma.user_id = public.chat_conversations.user_id
      and ma.mentor_id = auth.uid()
  )
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or auth.uid() = mentor_id
  or exists (
    select 1
    from public.mentor_assignments ma
    where ma.user_id = public.chat_conversations.user_id
      and ma.mentor_id = auth.uid()
  )
  or public.is_admin()
);

create policy "chat_msg_select"
on public.chat_messages
for select to authenticated
using (
  exists (
    select 1
    from public.chat_conversations cc
    where cc.id = conversation_id
      and (
        cc.user_id = auth.uid()
        or cc.mentor_id = auth.uid()
        or exists (
          select 1
          from public.mentor_assignments ma
          where ma.user_id = cc.user_id
            and ma.mentor_id = auth.uid()
        )
        or public.is_admin()
      )
  )
);

create policy "chat_msg_insert"
on public.chat_messages
for insert to authenticated
with check (
  exists (
    select 1
    from public.chat_conversations cc
    where cc.id = conversation_id
      and (
        (cc.user_id = auth.uid() and sender_role = 'user' and sender_id = auth.uid())
        or (
          (
            cc.mentor_id = auth.uid()
            or exists (
              select 1
              from public.mentor_assignments ma
              where ma.user_id = cc.user_id
                and ma.mentor_id = auth.uid()
            )
            or public.is_admin()
          )
          and sender_role = 'mentor'
          and sender_id = auth.uid()
        )
      )
  )
);

create policy "chat_msg_delete_owner_or_assigned_mentor"
on public.chat_messages
for delete to authenticated
using (
  exists (
    select 1
    from public.chat_conversations cc
    where cc.id = conversation_id
      and (
        cc.user_id = auth.uid()
        or cc.mentor_id = auth.uid()
        or exists (
          select 1
          from public.mentor_assignments ma
          where ma.user_id = cc.user_id
            and ma.mentor_id = auth.uid()
        )
        or public.is_admin()
      )
  )
);

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end $$;
