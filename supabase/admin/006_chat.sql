-- Migration 006: Admin, Chat & Mentor System
-- Run this in your Supabase SQL Editor
-- Placed in supabase/admin/ as requested

-- ============================================
-- Admin Users: super_admin, admin, mentor roles
-- ============================================
create table if not exists public.admin_users (
    id uuid primary key references auth.users(id) on delete cascade,
    admin_role text not null check (admin_role in ('super_admin', 'admin', 'mentor')),
    display_name text not null default '',
    created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Super admins can see all admin users
create policy "admin_users_select_admins" on public.admin_users
    for select to authenticated
    using (
        exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin'))
        or auth.uid() = id
    );

-- Only super admins can insert/update/delete admin users
create policy "admin_users_insert_super" on public.admin_users
    for insert with check (
        exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role = 'super_admin')
    );

create policy "admin_users_update_super" on public.admin_users
    for update using (
        exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role = 'super_admin')
    );

create policy "admin_users_delete_super" on public.admin_users
    for delete using (
        exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role = 'super_admin')
    );

-- ============================================
-- Mentor Assignments: which students a mentor oversees
-- ============================================
create table if not exists public.mentor_assignments (
    id uuid primary key default gen_random_uuid(),
    mentor_id uuid references public.admin_users(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    assigned_at timestamptz not null default now(),
    unique (mentor_id, user_id)
);

alter table public.mentor_assignments enable row level security;

-- Admins and mentors can see assignments
create policy "mentor_assignments_select" on public.mentor_assignments
    for select to authenticated
    using (
        exists (select 1 from public.admin_users au where au.id = auth.uid())
        or auth.uid() = user_id
    );

-- Only admins/super_admins can manage assignments
create policy "mentor_assignments_insert" on public.mentor_assignments
    for insert with check (
        exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin'))
    );

create policy "mentor_assignments_delete" on public.mentor_assignments
    for delete using (
        exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin'))
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

-- Users see their own conversations, mentors/admins see assigned ones
create policy "chat_conv_select" on public.chat_conversations
    for select to authenticated
    using (
        auth.uid() = user_id
        or auth.uid() = mentor_id
        or exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin'))
    );

create policy "chat_conv_insert" on public.chat_conversations
    for insert with check (auth.uid() = user_id);

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

-- Users see messages in their conversations, mentors/admins see relevant conversations
create policy "chat_msg_select" on public.chat_messages
    for select to authenticated
    using (
        exists (
            select 1 from public.chat_conversations cc
            where cc.id = conversation_id
            and (
                cc.user_id = auth.uid()
                or cc.mentor_id = auth.uid()
                or exists (select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin'))
            )
        )
    );

create policy "chat_msg_insert" on public.chat_messages
    for insert with check (
        exists (
            select 1 from public.chat_conversations cc
            where cc.id = conversation_id
            and (cc.user_id = auth.uid() or cc.mentor_id = auth.uid())
        )
        or sender_role = 'ai'
        or sender_role = 'system'
    );

-- Allow admins to update flag status
create policy "chat_msg_update_flag" on public.chat_messages
    for update using (
        exists (select 1 from public.admin_users au where au.id = auth.uid())
    );

-- ============================================
-- Allow admins to read student profiles (education data only)
-- ============================================
create policy "profiles_select_admin" on public.profiles
    for select to authenticated
    using (
        exists (select 1 from public.admin_users au where au.id = auth.uid())
    );

-- Allow admins to read user skill scores
create policy "user_skill_scores_select_admin" on public.user_skill_scores
    for select to authenticated
    using (
        exists (select 1 from public.admin_users au where au.id = auth.uid())
    );

-- Allow admins to read user stats
create policy "user_stats_select_admin" on public.user_stats
    for select to authenticated
    using (
        exists (select 1 from public.admin_users au where au.id = auth.uid())
    );

-- Allow admins to read daily attempts
create policy "attempts_select_admin" on public.daily_attempts
    for select to authenticated
    using (
        exists (select 1 from public.admin_users au where au.id = auth.uid())
    );
