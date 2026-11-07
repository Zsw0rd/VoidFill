-- Run after the two career migrations. Synthetic users and all writes roll back.
begin;
do $$ begin
  if exists (select 1 from auth.users where id in ('fc0f0000-0000-4000-8000-000000000001','fc0f0000-0000-4000-8000-000000000002')) then
    raise exception 'Synthetic test identifiers are already in use';
  end if;
end $$;
insert into auth.users(id,email,raw_user_meta_data) values
  ('fc0f0000-0000-4000-8000-000000000001','career-a@example.invalid','{}'),
  ('fc0f0000-0000-4000-8000-000000000002','career-b@example.invalid','{}');
insert into public.profiles(id) values ('fc0f0000-0000-4000-8000-000000000001'),('fc0f0000-0000-4000-8000-000000000002') on conflict(id) do nothing;
insert into public.user_skill_scores(user_id,skill_id,score)
select 'fc0f0000-0000-4000-8000-000000000001',id,77 from public.skills where name='Python Basics';
set local role authenticated;
select set_config('request.jwt.claim.sub','fc0f0000-0000-4000-8000-000000000001',true);
update public.profiles set target_role_id=(select id from public.roles where name='Recruitment Associate'), career_level='intermediate', career_focus_skill_ids=array[(select id from public.skills where name='Digital Marketing')], custom_target_role='Synthetic renewable-energy recruitment', career_goal_context='Coordinate candidate outreach' where id=auth.uid();
insert into public.career_reflections(user_id,role_id,content)
select auth.uid(),id,'Synthetic private reflection' from public.roles where name='Recruitment Associate';
do $$ begin
  if (select count(*) from public.career_reflections) <> 1 then raise exception 'Owner cannot read own reflection'; end if;
  if (select score from public.user_skill_scores where user_id=auth.uid()) <> 77 then raise exception 'Career update changed earned score'; end if;
  if (select career_level from public.profiles where id=auth.uid()) <> 'intermediate' then raise exception 'Career preference update failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','fc0f0000-0000-4000-8000-000000000002',true);
do $$ declare changed integer; begin
  if (select count(*) from public.career_reflections where user_id='fc0f0000-0000-4000-8000-000000000001') <> 0 then raise exception 'Foreign reflection is visible'; end if;
  update public.career_reflections set content='Foreign overwrite' where user_id='fc0f0000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Foreign reflection can be updated'; end if;
  begin
    insert into public.career_reflections(user_id,role_id,content) select 'fc0f0000-0000-4000-8000-000000000001',id,'Foreign insert' from public.roles where name='Accounting Associate';
    raise exception 'Foreign reflection insert succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'PASS: own preferences and reflection; foreign read/update/insert denied; score retained; all test data rolled back' as career_rls_check;
rollback;
