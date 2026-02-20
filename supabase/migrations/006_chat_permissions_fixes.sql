-- Fix mentor-student chat permissions + clear chat flow

-- Allow mentors assigned to a student to set/clear clear_requested_by and attach themselves as mentor.
create policy "chat_conv_update_owner_or_assigned_mentor" on public.chat_conversations
    for update to authenticated
    using (
        auth.uid() = user_id
        or exists (
            select 1 from public.mentor_assignments ma
            where ma.user_id = chat_conversations.user_id
              and ma.mentor_id = auth.uid()
        )
        or exists (
            select 1 from public.admin_users au
            where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin')
        )
    )
    with check (
        auth.uid() = user_id
        or exists (
            select 1 from public.mentor_assignments ma
            where ma.user_id = chat_conversations.user_id
              and ma.mentor_id = auth.uid()
        )
        or exists (
            select 1 from public.admin_users au
            where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin')
        )
    );

-- Let assigned mentors insert messages even when chat_conversations.mentor_id is null.
drop policy if exists "chat_msg_insert" on public.chat_messages;

create policy "chat_msg_insert" on public.chat_messages
    for insert to authenticated
    with check (
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
              )
        )
        or sender_role = 'ai'
        or sender_role = 'system'
    );

-- Clear chat endpoint deletes messages; allow owner/assigned mentor/admin to delete.
create policy "chat_msg_delete_owner_or_assigned_mentor" on public.chat_messages
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
                      select 1 from public.mentor_assignments ma
                      where ma.user_id = cc.user_id
                        and ma.mentor_id = auth.uid()
                  )
                  or exists (
                      select 1 from public.admin_users au
                      where au.id = auth.uid() and au.admin_role in ('super_admin', 'admin')
                  )
              )
        )
    );
