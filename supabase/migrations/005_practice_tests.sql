-- Migration 005: Practice Tests (unlimited, adaptive difficulty)
-- Stores results for unlimited practice tests separate from daily tests

create table if not exists public.practice_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    score int not null default 0,
    correct_count int not null default 0,
    total_count int not null default 0,
    difficulty_level int not null default 1,
    skill_scores jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.practice_attempts enable row level security;

create policy "practice_attempts_select_own" on public.practice_attempts
    for select using (auth.uid() = user_id);

create policy "practice_attempts_insert_own" on public.practice_attempts
    for insert with check (auth.uid() = user_id);
