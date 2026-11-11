-- LOCAL/CI ONLY. Run after both resource-progress migrations and atomic grading.
-- Synthetic classifications, users and grades are rolled back together.
begin;
do $verify$
declare
  learner uuid:=gen_random_uuid();
  other_learner uuid:=gen_random_uuid();
  mixed_skill uuid;
  guides_skill uuid;
  v_role_id uuid;
  pending_guide uuid;
  historic_guide uuid;
  teaching_course uuid;
  submission uuid:=gen_random_uuid();
  grade jsonb;
  first_result jsonb;
  replay_result jsonb;
  guide_url text:='https://fixtures.invalid/ungraded-guide';
  url_count integer;
begin
  assert exists(select 1 from vf_ungraded_resource_urls), 'The reviewed URL seed was not applied';
  assert not has_table_privilege('anon','public.vf_ungraded_resource_urls','select,insert,update,delete'), 'Anonymous scope-table access';
  assert not has_table_privilege('authenticated','public.vf_ungraded_resource_urls','select,insert,update,delete'), 'Browser scope-table access';
  assert has_table_privilege('service_role','public.vf_ungraded_resource_urls','select'), 'Missing trusted scope read';
  assert not has_table_privilege('service_role','public.vf_ungraded_resource_urls','insert,update,delete'), 'App role can redefine scope';
  assert not has_function_privilege('authenticated','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute'), 'Browser grading access';
  assert has_function_privilege('service_role','public.vf_commit_assessment(uuid,uuid,jsonb,jsonb)','execute'), 'Missing server grading access';

  assert vf_resource_url_key(chr(9)||chr(160)||guide_url||chr(65279)||chr(10))=guide_url, 'URL trim differs from String.trim';
  assert vf_resource_url_key(guide_url||'#different')=guide_url||'#different', 'Unexpected fragment canonicalisation';
  assert vf_resource_url_key(null) is null, 'Unknown legacy URL was changed';

  select count(*) into url_count from vf_ungraded_resource_urls;
  insert into vf_ungraded_resource_urls(url) values(guide_url);
  insert into auth.users(id) values(learner),(other_learner);
  select id into mixed_skill from skills order by name limit 1;
  select id into guides_skill from skills where id<>mixed_skill order by name limit 1;
  select id into v_role_id from roles order by name limit 1;
  update profiles set target_role_id=v_role_id where id in (learner,other_learner);
  insert into user_roadmap(user_id,role_id,skill_id,category,priority,progress) values
    (learner,v_role_id,mixed_skill,'Missing',1,0),
    (learner,v_role_id,guides_skill,'Missing',1,0),
    (other_learner,v_role_id,mixed_skill,'Missing',1,19);
  insert into roadmap_courses(user_id,skill_id,title,type,url,completed) values
    (learner,mixed_skill,'Completed teaching','practice','https://fixtures.invalid/teaching-one',true),
    (learner,mixed_skill,'Pending teaching','practice','https://fixtures.invalid/teaching-two',false);
  insert into roadmap_courses(user_id,skill_id,title,type,url,completed)
    values(learner,mixed_skill,'Historic guide completion','practice',guide_url,true) returning id into historic_guide;
  insert into roadmap_courses(user_id,skill_id,title,type,url,completed)
    values(learner,mixed_skill,'Pending guide','practice',chr(9)||chr(160)||guide_url||chr(65279)||chr(10),false) returning id into pending_guide;
  insert into roadmap_courses(user_id,skill_id,title,type,url,completed) values
    (learner,guides_skill,'Only guide completed','practice',guide_url,true),
    (learner,guides_skill,'Only guide pending','practice',guide_url,false);

  grade:=jsonb_build_object('assessmentId',submission,
    'metadata',jsonb_build_object('purpose','skill','difficulty',2,'skillId',mixed_skill),
    'correct',1,'total',1,'score',100,'review','[]'::jsonb,
    'skills',jsonb_build_array(jsonb_build_object('skill_id',mixed_skill,'skill_name','Synthetic mixed skill','correct',1,'total',1,'score',100)));
  first_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  -- Half the teaching resources are complete. One completed and one pending
  -- guide must affect neither numerator nor denominator: 68 + 50*.32 = 84.
  assert (select progress from user_roadmap where user_id=learner and skill_id=mixed_skill)=84, 'Guide counted in resource fraction';
  assert (select progress from user_roadmap where user_id=other_learner and skill_id=mixed_skill)=19, 'Foreign progress changed';
  assert (select completed from roadmap_courses where id=historic_guide), 'Historical guide completion rewritten';
  assert not (select completed from roadmap_courses where id=pending_guide), 'Guide automatically completed';
  assert not exists(select 1 from course_assessments where user_id=learner), 'Skill check invented course history';
  assert coalesce((select xp from user_stats where user_id=learner),0)=0, 'Skill check changed XP';

  replay_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert replay_result=first_result, 'Scope-aware grading changed replay';
  assert (select count(*) from vf_submission_ledger where user_id=learner)=1, 'Replay wrote a second ledger row';

  submission:=gen_random_uuid();
  grade:=jsonb_set(jsonb_set(grade,'{assessmentId}',to_jsonb(submission)),'{metadata,skillId}',to_jsonb(guides_skill));
  grade:=jsonb_set(grade,'{skills,0,skill_id}',to_jsonb(guides_skill));
  perform vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (select progress from user_roadmap where user_id=learner and skill_id=guides_skill)=68, 'All-guide mastery semantics changed';

  -- A course token sealed before reclassification remains accepted. New token
  -- generation is blocked by the app/ML scope checks, not by rewriting history.
  submission:=gen_random_uuid();
  grade:=jsonb_set(jsonb_set(grade,'{assessmentId}',to_jsonb(submission)),'{metadata}',
    jsonb_build_object('purpose','course','difficulty',2,'courseId',pending_guide,'skillId',mixed_skill));
  grade:=jsonb_set(grade,'{skills,0,skill_id}',to_jsonb(mixed_skill));
  first_result:=vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (first_result->>'passed')::boolean, 'Previously sealed guide session rejected';
  assert (select completed from roadmap_courses where id=pending_guide), 'Previously sealed completion lost';
  assert (select progress from user_roadmap where user_id=learner and skill_id=mixed_skill)=84, 'Legacy guide completion inflated progress';
  replay_result:=vf_commit_assessment(submission,learner,grade,'{"q":1}');
  assert replay_result=first_result, 'Previously sealed guide replay changed';
  assert (select count(*) from course_assessments where user_id=learner and course_id=pending_guide)=1, 'Duplicate guide history';
  assert coalesce((select xp from user_stats where user_id=learner),0)=0, 'Course unexpectedly changed XP';

  -- Confirm an unknown legacy URL retains the ordinary completion semantics.
  insert into roadmap_courses(user_id,skill_id,title,type,url,completed)
    values(learner,guides_skill,'Legacy URL unknown','practice',null,true) returning id into teaching_course;
  submission:=gen_random_uuid();
  grade:=jsonb_set(jsonb_set(grade,'{assessmentId}',to_jsonb(submission)),'{metadata}',
    jsonb_build_object('purpose','skill','difficulty',2,'skillId',guides_skill));
  grade:=jsonb_set(grade,'{skills,0,skill_id}',to_jsonb(guides_skill));
  perform vf_commit_assessment(submission,learner,grade,'{"q":0}');
  assert (select progress from user_roadmap where user_id=learner and skill_id=guides_skill)=100, 'Unknown URL was treated as an ungraded guide';
  assert (select completed from roadmap_courses where id=teaching_course), 'Unknown legacy completion changed';
  assert (select count(*) from vf_ungraded_resource_urls)=url_count+1, 'Grading changed classification membership';
end $verify$;
rollback;
select true as resource_progress_scope_verified;
