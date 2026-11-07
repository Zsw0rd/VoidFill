-- Synthetic administrators and learners exist only inside this rollback test.
begin;
do $$ begin
  if exists (select 1 from auth.users where id in ('fc0f0000-0000-4000-8000-000000000011','fc0f0000-0000-4000-8000-000000000012')) then raise exception 'Synthetic staff test identifiers are in use'; end if;
end $$;
insert into auth.users(id,email,raw_user_meta_data) values
  ('fc0f0000-0000-4000-8000-000000000011','staff-test@example.invalid','{}'),
  ('fc0f0000-0000-4000-8000-000000000012','learner-test@example.invalid','{}');
insert into public.profiles(id) values ('fc0f0000-0000-4000-8000-000000000011'),('fc0f0000-0000-4000-8000-000000000012') on conflict(id) do nothing;
insert into public.admin_users(id,admin_role,display_name) values ('fc0f0000-0000-4000-8000-000000000011','admin','Synthetic administrator');
set local role authenticated;
select set_config('request.jwt.claim.sub','fc0f0000-0000-4000-8000-000000000011',true);
do $$ begin
  if not public.is_admin() or public.is_super_admin() then raise exception 'Administrator capability mismatch'; end if;
end $$;
insert into public.mentor_assignments(mentor_id,user_id) values ('fc0f0000-0000-4000-8000-000000000011','fc0f0000-0000-4000-8000-000000000012');
insert into public.chat_conversations(id,user_id,mentor_id,is_ai,title) values ('fc0f0000-0000-4000-8000-000000000013','fc0f0000-0000-4000-8000-000000000012','fc0f0000-0000-4000-8000-000000000011',false,'Synthetic staff capability check');
insert into public.chat_messages(conversation_id,sender_id,sender_role,content) values ('fc0f0000-0000-4000-8000-000000000013','fc0f0000-0000-4000-8000-000000000011','mentor','Synthetic rollback-only reply');
do $$ declare changed integer; begin
  if (select count(*) from public.profiles where id='fc0f0000-0000-4000-8000-000000000012') <> 1 then raise exception 'Administrator cannot read learner profile'; end if;
  if (select count(*) from public.chat_messages where conversation_id='fc0f0000-0000-4000-8000-000000000013') <> 1 then raise exception 'Administrator cannot use assigned mentor conversation'; end if;
  begin
    update public.admin_users set admin_role='super_admin' where id=auth.uid();
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Administrator can self-promote to super administrator'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'PASS: administrator access, learner assignments and mentor replies; self-promotion denied; all synthetic data rolled back' as staff_access_check;
rollback;
