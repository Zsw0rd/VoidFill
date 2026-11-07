-- LOCAL/CI ONLY: run after the canonical baseline, cloud/career and grading SQL.
-- Synthetic records and injected failures are rolled back at the end.
begin;
do $verify$
declare
  learner uuid:=gen_random_uuid();
  other_learner uuid:=gen_random_uuid();
  skill uuid;
  v_role_id uuid;
  v_course_id uuid;
  submission uuid:=gen_random_uuid();
  failing_submission uuid:=gen_random_uuid();
  grade jsonb;
  first_result jsonb;
  next_result jsonb;
  xp_before integer;
  score_before integer;
  count_before integer;
begin
  insert into auth.users(id) values(learner),(other_learner);
  select id into skill from skills order by name limit 1;
  select id into v_role_id from roles order by name limit 1;
  update profiles set target_role_id=v_role_id where id=learner;
  insert into user_roadmap(user_id,role_id,skill_id,category,priority) values(learner,v_role_id,skill,'Missing',1);
  insert into roadmap_courses(user_id,skill_id,title,type) values(learner,skill,'Synthetic learning activity','practice') returning id into v_course_id;
  grade:=jsonb_build_object('assessmentId',submission,'metadata',jsonb_build_object('purpose','practice','difficulty',2),
    'correct',1,'total',1,'score',100,'review','[]'::jsonb,
    'skills',jsonb_build_array(jsonb_build_object('skill_id',skill,'skill_name','Synthetic skill','correct',1,'total',1,'score',100)));

  assert not has_function_privilege('anon','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute'), 'Anonymous grading access';
  assert not has_function_privilege('authenticated','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute'), 'Browser grading access';
  assert has_function_privilege('service_role','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute'), 'Missing server grading access';
  assert not has_table_privilege('authenticated','public.user_skill_scores','insert,update,delete'), 'Direct score writes allowed';
  assert not has_table_privilege('authenticated','public.daily_attempts','insert,update,delete'), 'Direct daily writes allowed';
  assert not has_table_privilege('authenticated','public.roadmap_courses','insert,update,delete'), 'Forged completion allowed';
  assert not has_table_privilege('authenticated','public.user_roadmap','insert,update,delete'), 'Forged roadmap progress allowed';
  assert not has_table_privilege('authenticated','public.user_stats','update,delete'), 'Direct XP writes allowed';
  assert has_column_privilege('authenticated','public.user_stats','user_id','insert'), 'Default login bootstrap missing';
  assert not has_column_privilege('authenticated','public.user_stats','xp','insert'), 'Client can choose initial XP';

  first_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (first_result->>'xp_total')::integer=33, 'Practice award mismatch';
  next_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert next_result=first_result, 'Replay did not return exact saved result';
  assert (select count(*) from practice_attempts where user_id=learner)=1, 'Duplicate practice attempt';
  assert (select xp from user_stats where user_id=learner)=33, 'Replay awarded XP twice';
  assert (select score from user_skill_scores where user_id=learner and skill_id=skill)=100, 'Missing score';
  assert (select progress from user_roadmap where user_id=learner and skill_id=skill)=68, 'Roadmap score blend mismatch';
  begin
    perform vf_commit_assessment(submission,other_learner,grade,'{}');
    raise exception 'Cross-owner replay unexpectedly accepted';
  exception when insufficient_privilege then null; end;

  -- Inject a real failure AFTER earlier writes. PostgreSQL must roll back them all.
  select xp into xp_before from user_stats where user_id=learner;
  select score into score_before from user_skill_scores where user_id=learner and skill_id=skill;
  select count(*) into count_before from practice_attempts where user_id=learner;
  execute 'create function public.vf_test_reject_ledger() returns trigger language plpgsql as $body$ begin raise exception ''Injected final-write failure''; end $body$';
  execute 'create trigger vf_test_reject_ledger before insert on public.vf_submission_ledger for each row execute function public.vf_test_reject_ledger()';
  grade:=jsonb_set(grade,'{assessmentId}',to_jsonb(failing_submission));
  grade:=jsonb_set(jsonb_set(jsonb_set(grade,'{correct}','0'),'{score}','0'),'{skills,0}',
    jsonb_build_object('skill_id',skill,'skill_name','Synthetic skill','correct',0,'total',1,'score',0));
  begin
    perform vf_commit_assessment(failing_submission,learner,grade,'{"q":1}');
    raise exception 'Injected failure unexpectedly accepted';
  exception when raise_exception then
    if sqlerrm<>'Injected final-write failure' then raise; end if;
  end;
  assert (select xp from user_stats where user_id=learner)=xp_before, 'Partial XP survived';
  assert (select score from user_skill_scores where user_id=learner and skill_id=skill)=score_before, 'Partial score survived';
  assert (select count(*) from practice_attempts where user_id=learner)=count_before, 'Partial attempt survived';
  assert not exists(select 1 from vf_submission_ledger where id=failing_submission), 'Failed transaction consumed token';
  execute 'drop trigger vf_test_reject_ledger on public.vf_submission_ledger';
  execute 'drop function public.vf_test_reject_ledger()';
  next_result:=vf_commit_assessment(failing_submission,learner,grade,'{"q":1}');
  assert (next_result->>'xp_total')::integer=xp_before+30, 'Safe retry did not succeed';
  assert (select score from user_skill_scores where user_id=learner and skill_id=skill)=70, 'Blended score changed';

  submission:=gen_random_uuid();
  grade:=jsonb_set(jsonb_set(grade,'{assessmentId}',to_jsonb(submission)),'{metadata}',
    jsonb_build_object('purpose','course','difficulty',2,'courseId',v_course_id,'skillId',skill));
  grade:=jsonb_set(jsonb_set(jsonb_set(grade,'{correct}','1'),'{score}','100'),'{skills,0}',
    jsonb_build_object('skill_id',skill,'skill_name','Synthetic skill','correct',1,'total',1,'score',100));
  first_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (first_result->>'passed')::boolean, 'Course did not pass';
  assert (select completed from roadmap_courses where id=v_course_id), 'Course completion missing';
  assert (select progress from user_roadmap where user_id=learner and skill_id=skill)=86, 'Course/knowledge progress not atomic';
  assert (select xp from user_stats where user_id=learner)=xp_before+30, 'Course unexpectedly awards XP';
  perform vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (select count(*) from course_assessments where course_id=v_course_id and user_id=learner)=1, 'Duplicate course assessment';

  submission:=gen_random_uuid();
  grade:=jsonb_set(jsonb_set(grade,'{assessmentId}',to_jsonb(submission)),'{metadata}',jsonb_build_object('purpose','daily','difficulty',2));
  first_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (first_result->>'xp_earned')::integer=55, 'Daily award mismatch';
  submission:=gen_random_uuid();
  grade:=jsonb_set(grade,'{assessmentId}',to_jsonb(submission));
  grade:=jsonb_set(grade,'{review}','[{"id":"different-token-question","is_correct":true}]'::jsonb);
  next_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert jsonb_array_length(next_result->'review')=0, 'A second daily token received mismatched review details';
  assert (next_result->>'alreadyCompleted')::boolean, 'Second daily token overwrote existing completion';
  assert (select xp from user_stats where user_id=learner)=xp_before+30+55, 'Daily awarded twice';

  -- Exercise grants and row policies as an actual authenticated database role.
  perform set_config('request.jwt.claim.sub',other_learner::text,true);
  execute 'set local role authenticated';
  insert into public.user_stats(user_id) values(other_learner) on conflict(user_id) do nothing;
  assert (select xp from public.user_stats where user_id=other_learner)=0, 'Default stats bootstrap failed';
  assert not exists(select 1 from public.user_stats where user_id=learner), 'Foreign progress readable';
  begin
    update public.user_stats set xp=999999 where user_id=other_learner;
    raise exception 'Forged XP unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.user_skill_scores(user_id,skill_id,score) values(other_learner,skill,100);
    raise exception 'Forged skill unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.vf_commit_assessment(gen_random_uuid(),other_learner,grade,'{}');
    raise exception 'Browser grade RPC unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
end $verify$;
rollback;
select true as atomic_grading_verified;
