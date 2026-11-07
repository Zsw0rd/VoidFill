-- LOCAL/CI ONLY. Synthetic identities, grants, real RLS and transitions; rolled back.
begin;
do $verify$
declare
  learner uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  mentor_a uuid := gen_random_uuid();
  mentor_b uuid := gen_random_uuid();
  v_role uuid;
  assignment_a uuid;
  assignment_b uuid;
  project uuid;
  shared_a uuid;
  shared_b uuid;
  request uuid := gen_random_uuid();
  result jsonb;
  payload jsonb;
  work_brief jsonb;
  before_xp integer;
begin
  insert into auth.users(id) values(learner),(stranger),(mentor_a),(mentor_b);
  update public.profiles set full_name='Synthetic learner' where id=learner;
  insert into public.admin_users(id,admin_role,display_name) values(mentor_a,'mentor','Synthetic mentor A'),(mentor_b,'admin','Synthetic mentor B');
  select id into v_role from public.roles order by name limit 1;
  insert into public.mentor_assignments(mentor_id,user_id,assigned_at) values(mentor_a,learner,now()-interval '1 day') returning id into assignment_a;
  insert into public.user_stats(user_id,xp) values(learner,123) on conflict(user_id) do update set xp=123;
  select xp into before_xp from public.user_stats where user_id=learner;
  work_brief := jsonb_build_object('version','synthetic-v1','role_id',v_role,'role_name','Synthetic role','role_key','synthetic','level','foundation','title','Synthetic activity','instructions','Use fictional data','deliverable','A documented example','rubric',jsonb_build_array('Explain choices','Check result'),'note','Not a qualification');
  assert not has_function_privilege('authenticated','public.vf_practical_mutate(uuid,text,jsonb)','execute'), 'Browser can mutate trusted practical RPC';
  assert not has_function_privilege('anon','public.vf_practical_mutate(uuid,text,jsonb)','execute'), 'Anonymous practical RPC';
  assert has_function_privilege('service_role','public.vf_practical_mutate(uuid,text,jsonb)','execute'), 'Server mutation access missing';
  assert not has_table_privilege('authenticated','public.practical_projects','insert,update,delete'), 'Direct draft writes allowed';
  assert not has_table_privilege('authenticated','public.practical_reviews','insert,update,delete'), 'Learner can forge mentor feedback';
  payload:=jsonb_build_object('role_id',v_role,'level','foundation','brief',work_brief,'expected_version',0,'content','Synthetic evidence: I documented choices and checked the result against two cases.','links','[]'::jsonb);
  result:=public.vf_practical_mutate(learner,'save',payload);
  project:=(result->'project'->>'id')::uuid;
  begin
    perform public.vf_practical_mutate(stranger,'save',payload || jsonb_build_object('project_id',project,'expected_version',1));
    raise exception 'Foreign draft unexpectedly writable';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_FORBIDDEN:%' then raise; end if;
  end;
  begin
    perform public.vf_practical_mutate(learner,'save',payload || jsonb_build_object('project_id',project,'expected_version',0));
    raise exception 'Stale draft unexpectedly writable';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_CONFLICT:%' then raise; end if;
  end;
  payload:=jsonb_build_object('project_id',project,'expected_version',1,'mentor_id',mentor_a,'request_id',request,'consent',true);
  result:=public.vf_practical_mutate(learner,'submit',payload);
  shared_a:=(result->'submission'->>'id')::uuid;
  result:=public.vf_practical_mutate(learner,'submit',payload);
  assert (result->>'replayed')::boolean, 'Submission retry not idempotent';
  begin
    perform public.vf_practical_mutate(learner,'submit',payload-'consent');
    raise exception 'Replay bypassed explicit consent';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_INVALID:%' then raise; end if;
  end;
  begin
    perform public.vf_practical_mutate(learner,'submit',payload||jsonb_build_object('expected_version',99));
    raise exception 'Replay accepted a different intent';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_CONFLICT:%' then raise; end if;
  end;
  assert (select count(*) from public.practical_submissions where project_id=project)=1, 'Repeated share duplicated snapshot';
  result:=public.vf_practical_mutate(learner,'save',jsonb_build_object('project_id',project,'expected_version',1,'role_id',v_role,'level','foundation','brief',work_brief || '{"version":"synthetic-v2"}'::jsonb,'content','Private newer draft has not been shared with the mentor.','links','[]'::jsonb));
  assert (select content from public.practical_submissions where id=shared_a) <> (select content from public.practical_projects where id=project), 'Private edits changed shared snapshot';
  assert (select brief->>'version' from public.practical_projects where id=project)='synthetic-v1', 'Existing brief silently changed';

  perform set_config('request.jwt.claim.sub',mentor_a::text,true);
  execute 'set local role authenticated';
  assert exists(select 1 from public.practical_submissions where id=shared_a), 'Assigned shared work invisible';
  assert not exists(select 1 from public.practical_projects where id=project), 'Mentor can read private draft';
  begin
    perform public.vf_practical_mutate(mentor_a,'review','{}');
    raise exception 'Authenticated caller can invoke service RPC';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  payload:=jsonb_build_object('submission_id',shared_a,'verdict','ready','feedback','Document a second independently checked example.','criteria',jsonb_build_array(jsonb_build_object('criterion',0,'judgement','demonstrated','comment',''),jsonb_build_object('criterion',1,'judgement','developing','comment','')));
  begin
    perform public.vf_practical_mutate(mentor_a,'review',payload);
    raise exception 'Incomplete evidence unexpectedly marked ready';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_INVALID:%' then raise; end if;
  end;
  payload:=jsonb_set(payload,'{verdict}','"revise"');
  perform public.vf_practical_mutate(mentor_a,'review',payload);
  begin
    perform public.vf_practical_mutate(mentor_a,'review',payload);
    raise exception 'Review was overwritten';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_CONFLICT:%' then raise; end if;
  end;
  assert (select xp from public.user_stats where user_id=learner)=before_xp, 'Practical review changed XP';

  -- Latest assignment wins even if the old assignment record was not removed.
  insert into public.mentor_assignments(mentor_id,user_id,assigned_at) values(mentor_b,learner,now()) returning id into assignment_b;
  perform set_config('request.jwt.claim.sub',mentor_a::text,true);
  execute 'set local role authenticated';
  assert not exists(select 1 from public.practical_submissions where id=shared_a), 'Previous mentor retained evidence access';
  assert not exists(select 1 from public.practical_reviews where submission_id=shared_a), 'Previous mentor retained review access';
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',mentor_b::text,true);
  execute 'set local role authenticated';
  assert not exists(select 1 from public.practical_submissions where id=shared_a), 'New mentor inherited old evidence';
  assert not exists(select 1 from public.practical_reviews where submission_id=shared_a), 'New mentor inherited private feedback';
  execute 'reset role';
  begin
    perform public.vf_practical_mutate(mentor_a,'review',payload);
    raise exception 'Reassigned mentor accepted a review';
  exception when raise_exception then
    if sqlerrm not like 'VF_PRACTICAL_FORBIDDEN:%' then raise; end if;
  end;
  result:=public.vf_practical_mutate(learner,'submit',jsonb_build_object('project_id',project,'expected_version',2,'mentor_id',mentor_b,'request_id',gen_random_uuid(),'consent',true));
  shared_b:=(result->'submission'->>'id')::uuid;
  assert shared_b<>shared_a, 'New consent reused previous mentor snapshot';
  perform set_config('request.jwt.claim.sub',learner::text,true);
  execute 'set local role authenticated';
  assert (select count(*) from public.practical_submissions where project_id=project)=2, 'Learner lost iteration history';
  assert exists(select 1 from public.practical_reviews where submission_id=shared_a), 'Learner lost previous feedback';
  assert (public.vf_practical_current_mentor()->>'id')::uuid=mentor_b, 'Current mentor resolution mismatch';
  begin
    update public.practical_reviews set verdict='ready' where submission_id=shared_a;
    raise exception 'Learner forged mentor review';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',mentor_b::text,true);
  execute 'set local role authenticated';
  assert exists(select 1 from public.practical_submissions where id=shared_b), 'Fresh consent invisible to current mentor';
  assert not exists(select 1 from public.practical_submissions where id=shared_a), 'Fresh consent revealed older submission';
  execute 'reset role';
  perform public.vf_practical_mutate(learner,'withdraw',jsonb_build_object('submission_id',shared_b));
  execute 'set local role authenticated';
  assert not exists(select 1 from public.practical_submissions where id=shared_b), 'Withdrawn evidence remains mentor-visible';
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',stranger::text,true);
  execute 'set local role authenticated';
  assert not exists(select 1 from public.practical_projects where id=project), 'Stranger can read private work';
  assert not exists(select 1 from public.practical_submissions where project_id=project), 'Stranger can read submissions';
  assert not exists(select 1 from public.practical_reviews where submission_id=shared_a), 'Stranger can read feedback';
  assert public.vf_practical_current_mentor() is null, 'Unassigned learner sees another mentor';
  execute 'reset role';
  assert (select xp from public.user_stats where user_id=learner)=before_xp, 'Practical lifecycle changed XP';
end $verify$;
rollback;
select true as practical_learning_verified;
