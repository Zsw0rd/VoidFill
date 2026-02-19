-- Migration 002: Roadmap Courses & Course Assessments
-- Run this in your Supabase SQL Editor

-- Courses/books recommended by AI for each roadmap skill
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

-- Add progress column to user_roadmap
alter table public.user_roadmap add column if not exists progress int not null default 0;

-- RLS for roadmap_courses
alter table public.roadmap_courses enable row level security;

create policy "roadmap_courses_select_own" on public.roadmap_courses
  for select using (auth.uid() = user_id);

create policy "roadmap_courses_insert_own" on public.roadmap_courses
  for insert with check (auth.uid() = user_id);

create policy "roadmap_courses_update_own" on public.roadmap_courses
  for update using (auth.uid() = user_id);

create policy "roadmap_courses_delete_own" on public.roadmap_courses
  for delete using (auth.uid() = user_id);

-- RLS for course_assessments
alter table public.course_assessments enable row level security;

create policy "course_assessments_select_own" on public.course_assessments
  for select using (auth.uid() = user_id);

create policy "course_assessments_insert_own" on public.course_assessments
  for insert with check (auth.uid() = user_id);

create policy "course_assessments_update_own" on public.course_assessments
  for update using (auth.uid() = user_id);
