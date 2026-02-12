-- Migration 003: AI-Generated Questions & Adaptive Difficulty
-- Run this in your Supabase SQL Editor

-- Store AI-generated questions for caching and reuse
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

-- Track what difficulty level each attempt was at
alter table public.daily_attempts add column if not exists difficulty_level int not null default 1;

-- RLS for ai_generated_questions
alter table public.ai_generated_questions enable row level security;

create policy "ai_questions_select_own" on public.ai_generated_questions
  for select using (auth.uid() = user_id);

create policy "ai_questions_insert_own" on public.ai_generated_questions
  for insert with check (auth.uid() = user_id);

-- Function to calculate adaptive difficulty based on recent performance
create or replace function public.get_user_difficulty(p_user_id uuid)
returns int
language sql
stable
as $$
  select coalesce(
    (
      select 
        case 
          when avg_pct >= 80 then least(prev_diff + 1, 5)
          when avg_pct <= 40 then greatest(prev_diff - 1, 1)
          else prev_diff
        end
      from (
        select 
          avg(correct_count::numeric / nullif(total_count, 0) * 100) as avg_pct,
          max(difficulty_level) as prev_diff
        from public.daily_attempts
        where user_id = p_user_id
          and completed_at is not null
        order by attempt_date desc
        limit 5
      ) sub
    ),
    1
  );
$$;
