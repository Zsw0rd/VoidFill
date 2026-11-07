-- Apply BEFORE the matching application release. Existing progress is preserved.
-- A server-verified grade and its replay result are committed together.
begin;

create or replace function public.vf_commit_assessment(
  p_id uuid, p_user_id uuid, p_grade jsonb, p_answers jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  prior public.vf_submission_ledger;
  daily public.daily_attempts;
  practice public.practice_attempts;
  course public.roadmap_courses;
  stats public.user_stats;
  item jsonb;
  blended jsonb := '[]'::jsonb;
  result jsonb;
  purpose text := p_grade#>>'{metadata,purpose}';
  difficulty integer := (p_grade#>>'{metadata,difficulty}')::integer;
  correct integer := (p_grade->>'correct')::integer;
  total integer := (p_grade->>'total')::integer;
  score integer := (p_grade->>'score')::integer;
  v_skill_id uuid;
  new_score integer;
  skill_total integer := 0;
  skill_correct integer := 0;
  xp_earned integer := 0;
  today date := (now() at time zone 'UTC')::date;
  v_role_id uuid;
  unlocked record;
  new_skills jsonb := '[]'::jsonb;
begin
  if p_id is null or p_user_id is null or p_grade->>'assessmentId' is distinct from p_id::text
     or purpose is null or purpose not in ('daily','practice','course','skill')
     or difficulty is null or difficulty not between 1 and 5
     or total is null or total not between 1 and 20 or correct is null or correct not between 0 and total
     or score is null or score <> round(correct::numeric / total * 100)
     or jsonb_typeof(p_grade->'skills') is distinct from 'array'
     or jsonb_array_length(p_grade->'skills') not between 1 and 20
     or jsonb_typeof(p_answers) is distinct from 'object' then
    raise exception 'Invalid verified grade' using errcode='22023';
  end if;
  -- The same lock serializes different assessments for one learner across instances.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select * into prior from vf_submission_ledger where id=p_id for update;
  if found then
    if prior.user_id <> p_user_id then raise exception 'Submission owner mismatch' using errcode='42501'; end if;
    if prior.status='completed' then return prior.result; end if;
    -- Never retry a legacy partial/pending write: only this RPC is all-or-nothing.
    raise exception 'Legacy submission requires progress reconciliation' using errcode='55000';
  end if;
  if exists(select 1 from vf_submission_ledger where user_id=p_user_id and status='pending') then
    raise exception 'Legacy submission still pending' using errcode='55000';
  end if;
  if not exists(select 1 from profiles where id=p_user_id) then
    raise exception 'Learner profile missing' using errcode='23503';
  end if;
  if (select count(distinct s->>'skill_id') from jsonb_array_elements(p_grade->'skills') s)
      <> jsonb_array_length(p_grade->'skills') then
    raise exception 'Duplicate skill result' using errcode='22023';
  end if;
  for item in select * from jsonb_array_elements(p_grade->'skills') loop
    if (item->>'total')::integer is null or (item->>'total')::integer not between 1 and total
       or (item->>'correct')::integer is null or (item->>'correct')::integer not between 0 and (item->>'total')::integer
       or (item->>'score')::integer is distinct from round((item->>'correct')::numeric/(item->>'total')::numeric*100)::integer
       or not exists(select 1 from skills where id=(item->>'skill_id')::uuid) then
      raise exception 'Invalid skill result' using errcode='22023';
    end if;
    skill_total := skill_total+(item->>'total')::integer;
    skill_correct := skill_correct+(item->>'correct')::integer;
  end loop;
  if skill_total<>total or skill_correct<>correct then
    raise exception 'Skill totals do not match' using errcode='22023';
  end if;

  -- An existing completed daily check is never overwritten by a second token.
  if purpose='daily' then
    select * into daily from daily_attempts where user_id=p_user_id and attempt_date=today for update;
    if found and daily.completed_at is not null then
      result := to_jsonb(daily)||jsonb_build_object('review','[]'::jsonb,'alreadyCompleted',true);
      insert into vf_submission_ledger(id,user_id,status,result) values(p_id,p_user_id,'completed',result);
      return result;
    end if;
    xp_earned := 50+correct*5;
    insert into daily_attempts(user_id,attempt_date,completed_at,correct_count,total_count,xp_earned,difficulty_level)
      values(p_user_id,today,now(),correct,total,xp_earned,difficulty)
      on conflict(user_id,attempt_date) do update set completed_at=excluded.completed_at,
        correct_count=excluded.correct_count,total_count=excluded.total_count,
        xp_earned=excluded.xp_earned,difficulty_level=excluded.difficulty_level
      returning * into daily;
    insert into attempt_skill_scores(attempt_id,skill_id,score)
      select daily.id,(s->>'skill_id')::uuid,(s->>'score')::integer from jsonb_array_elements(p_grade->'skills') s
      on conflict(attempt_id,skill_id) do update set score=excluded.score;
  elsif purpose='course' then
    select * into course from roadmap_courses where id=(p_grade#>>'{metadata,courseId}')::uuid
      and user_id=p_user_id and skill_id=(p_grade#>>'{metadata,skillId}')::uuid for update;
    if not found then raise exception 'Course not found' using errcode='42501'; end if;
    insert into course_assessments(user_id,course_id,score,total,passed,answers)
      values(p_user_id,course.id,score,total,score>=65,p_answers);
    if score>=65 then update roadmap_courses set completed=true where id=course.id; end if;
  end if;
  if purpose in ('course','skill') and (
    jsonb_array_length(p_grade->'skills')<>1 or
    p_grade#>>'{metadata,skillId}' is distinct from p_grade#>>'{skills,0,skill_id}'
  ) then raise exception 'Assessment skill mismatch' using errcode='22023'; end if;

  for item in select * from jsonb_array_elements(p_grade->'skills') loop
    v_skill_id := (item->>'skill_id')::uuid;
    insert into user_skill_scores(user_id,skill_id,score,updated_at)
      values(p_user_id,v_skill_id,(item->>'score')::integer,now())
      on conflict(user_id,skill_id) do update
        set score=round(user_skill_scores.score::numeric*.7+excluded.score::numeric*.3),updated_at=now()
      returning user_skill_scores.score into new_score;
    blended := blended||jsonb_build_array(jsonb_build_object('skill_id',v_skill_id,'skill_name',item->>'skill_name','score',new_score));
    update user_roadmap r set progress=round(new_score::numeric*.68+coalesce((
        select count(*) filter(where c.completed)::numeric/nullif(count(*),0)*100 from roadmap_courses c
        where c.user_id=p_user_id and c.skill_id=v_skill_id
      ),0)*.32),updated_at=now()
      where r.user_id=p_user_id and r.skill_id=v_skill_id;
  end loop;

  if purpose='practice' then
    insert into practice_attempts(user_id,score,correct_count,total_count,difficulty_level,skill_scores)
      values(p_user_id,score,correct,total,difficulty,blended) returning * into practice;
    xp_earned := 30+correct*3;
    select target_role_id into v_role_id from profiles where id=p_user_id;
    for unlocked in
      select distinct d.dependent_skill_id,s.name from skill_dependencies d
      join skills s on s.id=d.dependent_skill_id
      join role_skills rs on rs.skill_id=d.dependent_skill_id and rs.role_id=v_role_id
      where exists(select 1 from jsonb_array_elements(blended) b
        where (b->>'skill_id')::uuid=d.prerequisite_skill_id and (b->>'score')::integer>=80)
      and not exists(select 1 from skill_dependencies req left join user_skill_scores us
        on us.user_id=p_user_id and us.skill_id=req.prerequisite_skill_id
        where req.dependent_skill_id=d.dependent_skill_id and coalesce(us.score,0)<80)
      and not exists(select 1 from user_roadmap r where r.user_id=p_user_id and r.role_id=v_role_id and r.skill_id=d.dependent_skill_id)
    loop
      insert into user_roadmap(user_id,role_id,skill_id,category,priority,status,progress)
        values(p_user_id,v_role_id,unlocked.dependent_skill_id,'Missing',4,'todo',0) on conflict do nothing;
      if found then new_skills:=new_skills||jsonb_build_array(unlocked.name); end if;
    end loop;
  end if;

  if purpose in ('daily','practice') then
    insert into user_stats(user_id) values(p_user_id) on conflict do nothing;
    select * into stats from user_stats where user_id=p_user_id for update;
    update user_stats set xp=stats.xp+xp_earned,level=floor((stats.xp+xp_earned)::numeric/500)::integer+1,
      streak=case when stats.last_activity_date=today then greatest(stats.streak,1)
        when stats.last_activity_date=today-1 then stats.streak+1 else 1 end,
      last_activity_date=today,updated_at=now() where user_id=p_user_id returning * into stats;
    result := (case when purpose='daily' then to_jsonb(daily) else to_jsonb(practice) end)
      ||jsonb_build_object('xp_earned',xp_earned,'xp_total',stats.xp,'level',stats.level,'review',p_grade->'review');
    if purpose='daily' then result:=result||jsonb_build_object('streak',stats.streak);
    else result:=result||jsonb_build_object('newSkillsAdded',new_skills,'skillScores',blended); end if;
  else
    result:=jsonb_build_object('score',score,'correct',correct,'total',total,'passed',score>=65,'skillScores',blended,'review',p_grade->'review');
  end if;
  insert into vf_submission_ledger(id,user_id,status,result) values(p_id,p_user_id,'completed',result);
  return result;
end $$;
revoke all on function public.vf_commit_assessment(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.vf_commit_assessment(uuid,uuid,jsonb,jsonb) to service_role;

-- Client reads retain the existing own/assigned-staff policies. All derived writes
-- go through verified server routes. Remove policies too, so regranting a table
-- privilege alone cannot accidentally restore unrestricted score mutation.
do $$ declare item record; begin
  for item in select schemaname,tablename,policyname from pg_policies
    where schemaname='public' and tablename in ('daily_attempts','attempt_answers','attempt_skill_scores',
      'user_skill_scores','practice_attempts','course_assessments','user_stats','user_roadmap','roadmap_courses')
      and cmd in ('INSERT','UPDATE','DELETE','ALL')
  loop execute format('drop policy %I on %I.%I',item.policyname,item.schemaname,item.tablename); end loop;
end $$;
revoke insert,update,delete,truncate,references,trigger on public.daily_attempts,public.attempt_answers,
  public.attempt_skill_scores,public.user_skill_scores,public.practice_attempts,public.course_assessments,
  public.user_stats,public.user_roadmap,public.roadmap_courses from anon,authenticated;
grant select on public.daily_attempts,public.attempt_answers,public.attempt_skill_scores,public.user_skill_scores,
  public.practice_attempts,public.course_assessments,public.user_stats,public.user_roadmap,public.roadmap_courses to authenticated;
grant all on public.daily_attempts,public.attempt_answers,public.attempt_skill_scores,public.user_skill_scores,
  public.practice_attempts,public.course_assessments,public.user_stats,public.user_roadmap,public.roadmap_courses to service_role;
-- Login may create only an untouched default stats row; it cannot change one.
grant insert(user_id) on public.user_stats to authenticated;
create policy user_stats_insert_defaults on public.user_stats for insert to authenticated
  with check(auth.uid()=user_id and xp=0 and level=1 and streak=0 and last_activity_date is null and updated_at is null);

comment on function public.vf_commit_assessment(uuid,uuid,jsonb,jsonb) is
  'Service role only: commit a server-decrypted and graded assessment atomically, including idempotent replay, attempt, scores, course completion, roadmap and XP. Never expose the server key.';
commit;
