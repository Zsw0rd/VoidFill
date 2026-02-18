-- Migration 004: AI Insights persistence
-- Stores Gemini analysis results so users don't lose them on navigation/logout

create table if not exists public.ai_insights (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    analysis jsonb not null default '{}'::jsonb,
    meta jsonb not null default '{}'::jsonb,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique (user_id)
);

-- Enable RLS
alter table public.ai_insights enable row level security;

-- Users can read their own insights
create policy "Users can view own insights"
    on public.ai_insights for select
    using (auth.uid() = user_id);

-- Users can insert their own insights
create policy "Users can insert own insights"
    on public.ai_insights for insert
    with check (auth.uid() = user_id);

-- Users can update their own insights
create policy "Users can update own insights"
    on public.ai_insights for update
    using (auth.uid() = user_id);
