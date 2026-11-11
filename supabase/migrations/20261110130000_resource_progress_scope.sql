-- Apply before the matching application, then apply its URL seed migration.
-- Changes only the derived resource fraction of progress. Historical course,
-- assessment, submission, score and XP rows are not backfilled or deleted.
begin;

-- Match ECMAScript String.trim(), including tabs, NBSP and the BOM. Do not
-- canonicalise URLs: query, fragment, path and case remain exact membership keys.
create or replace function public.vf_resource_url_key(p_url text)
returns text language sql immutable strict parallel safe
set search_path=pg_catalog,pg_temp as $$
  select btrim(p_url,
    chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||
    chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||
    chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||
    chr(8287)||chr(12288)||chr(65279));
$$;
revoke all on function public.vf_resource_url_key(text) from public,anon,authenticated;
grant execute on function public.vf_resource_url_key(text) to service_role;

create table if not exists public.vf_ungraded_resource_urls (
  url text primary key check(octet_length(url) between 1 and 2048 and url like 'https://%'
                            and url=public.vf_resource_url_key(url))
);
alter table public.vf_ungraded_resource_urls enable row level security;
revoke all on public.vf_ungraded_resource_urls from public,anon,authenticated,service_role;
grant select on public.vf_ungraded_resource_urls to service_role;
comment on table public.vf_ungraded_resource_urls is
  'Reviewed public ungraded guide URL membership projected from resource-scopes.json. Migrations own updates; no learner or browser writes.';

-- The historical grading function is reproduced with only its course-count
-- predicate changed. Advisory lock ordering, replay, XP, validation and sealed
-- course-session behaviour remain identical to the atomic-grading release.
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
          and not exists(select 1 from public.vf_ungraded_resource_urls g
            where g.url=public.vf_resource_url_key(c.url))
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

comment on function public.vf_commit_assessment(uuid,uuid,jsonb,jsonb) is
  'Service role only: atomic verified grading/replay. Derived roadmap resource progress excludes reviewed guides; historical sealed sessions and XP are preserved.';
commit;
