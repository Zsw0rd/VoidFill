-- Migration 001: Profile Enhancements for Student/Professional support
-- Run this in your Supabase SQL Editor

-- Add new columns to profiles
alter table public.profiles add column if not exists user_type text not null default 'student' check (user_type in ('student', 'professional'));
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists years_experience int;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists current_skills_text text;
alter table public.profiles add column if not exists education_level text;
alter table public.profiles add column if not exists graduation_year int;

-- Allow users to delete their own roadmap entries (for regeneration)
create policy "roadmap_delete_own" on public.user_roadmap
  for delete using (auth.uid() = user_id);
