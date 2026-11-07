-- Practical evidence is separate from assessment scores, XP and private reflections.
-- Apply after the base schema + career profile migrations. Additive and replayable.
begin;

create table if not exists public.practical_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  level text not null check (level in ('foundation', 'intermediate')),
  brief jsonb not null check (jsonb_typeof(brief) = 'object'),
  content text not null default '' check (char_length(content) <= 12000),
  links jsonb not null default '[]' check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 3),
  draft_version integer not null default 1 check (draft_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role_id, level)
);

create table if not exists public.practical_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.practical_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  learner_name text not null,
  revision integer not null check (revision > 0),
  draft_version integer not null check (draft_version > 0),
  brief jsonb not null,
  content text not null,
  links jsonb not null,
  mentor_id uuid references auth.users(id) on delete set null,
  mentor_name text not null,
  assignment_id uuid,
  request_id uuid not null,
  consented_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique(project_id, revision),
  unique(user_id, request_id),
  unique(project_id, draft_version, assignment_id)
);

create table if not exists public.practical_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.practical_submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references auth.users(id) on delete set null,
  mentor_name text not null,
  verdict text not null check (verdict in ('ready', 'revise')),
  feedback text not null check (char_length(feedback) between 10 and 6000),
  criteria jsonb not null check (jsonb_typeof(criteria) = 'array' and jsonb_array_length(criteria) between 1 and 20),
  created_at timestamptz not null default now()
);
create index if not exists practical_submissions_learner on public.practical_submissions(user_id, submitted_at desc);
create index if not exists practical_submissions_mentor on public.practical_submissions(mentor_id, submitted_at desc) where withdrawn_at is null;
create index if not exists practical_reviews_learner on public.practical_reviews(user_id);

-- Bind consent to the exact assignment, not just a mentor's identity. Reassignment
-- never exposes older submissions/reviews to the new mentor. The latest current
-- assignment is the same ordering used by the learning workspace.
create or replace function public.vf_practical_can_review(p_user uuid, p_mentor uuid, p_assignment uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select p_mentor = auth.uid()
    and exists(select 1 from public.admin_users au where au.id = auth.uid() and au.admin_role in ('mentor','admin','super_admin'))
    and p_assignment = (select ma.id from public.mentor_assignments ma where ma.user_id = p_user order by ma.assigned_at desc, ma.id desc limit 1)
    and exists(select 1 from public.mentor_assignments ma where ma.id = p_assignment and ma.user_id = p_user and ma.mentor_id = auth.uid());
$$;
revoke all on function public.vf_practical_can_review(uuid,uuid,uuid) from public, anon;
grant execute on function public.vf_practical_can_review(uuid,uuid,uuid) to authenticated, service_role;

-- Reveal only the current learner's assigned mentor display name, not staff rows.
create or replace function public.vf_practical_current_mentor()
returns jsonb language sql stable security definer set search_path = pg_catalog, public as $$
  select jsonb_build_object('id',au.id,'name',coalesce(nullif(au.display_name,''),'Your assigned mentor'))
  from public.mentor_assignments ma join public.admin_users au on au.id=ma.mentor_id
  where ma.user_id=auth.uid() and au.admin_role in ('mentor','admin','super_admin')
  order by ma.assigned_at desc,ma.id desc limit 1;
$$;
revoke all on function public.vf_practical_current_mentor() from public, anon;
grant execute on function public.vf_practical_current_mentor() to authenticated, service_role;

-- Serialize consent/review transactions with assignment changes, including admin
-- writes outside this RPC. Otherwise a new assignment could race a review after
-- the review's membership check. No unrelated learner is locked.
create or replace function public.vf_practical_lock_assignment()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid;
begin
  if tg_op='UPDATE' and old.user_id is distinct from new.user_id then
    for v_user in select distinct item from unnest(array[old.user_id,new.user_id]) item where item is not null order by item loop
      perform pg_advisory_xact_lock(hashtextextended('vf-practical:'||v_user::text,0));
    end loop;
  else
    v_user:=case when tg_op='DELETE' then old.user_id else new.user_id end;
    perform pg_advisory_xact_lock(hashtextextended('vf-practical:'||v_user::text,0));
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.vf_practical_lock_assignment() from public,anon,authenticated;
drop trigger if exists vf_practical_assignment_lock on public.mentor_assignments;
create trigger vf_practical_assignment_lock before insert or update or delete on public.mentor_assignments
  for each row execute function public.vf_practical_lock_assignment();

alter table public.practical_projects enable row level security;
alter table public.practical_submissions enable row level security;
alter table public.practical_reviews enable row level security;
revoke all on public.practical_projects, public.practical_submissions, public.practical_reviews from anon, authenticated;
grant select on public.practical_projects, public.practical_submissions, public.practical_reviews to authenticated;
grant all on public.practical_projects, public.practical_submissions, public.practical_reviews to service_role;
drop policy if exists practical_project_owner_read on public.practical_projects;
create policy practical_project_owner_read on public.practical_projects for select to authenticated using (user_id = auth.uid());
drop policy if exists practical_submission_read on public.practical_submissions;
create policy practical_submission_read on public.practical_submissions for select to authenticated using (
  user_id = auth.uid() or (withdrawn_at is null and public.vf_practical_can_review(user_id, mentor_id, assignment_id))
);
drop policy if exists practical_review_read on public.practical_reviews;
create policy practical_review_read on public.practical_reviews for select to authenticated using (
  user_id = auth.uid() or exists(select 1 from public.practical_submissions ps where ps.id = submission_id and ps.withdrawn_at is null and public.vf_practical_can_review(ps.user_id, ps.mentor_id, ps.assignment_id))
);

-- Only the server service role can mutate. The API obtains p_actor from getUser(),
-- validates request bodies, and creates rubric snapshots from the local catalogue.
-- Identity, assignment, version and review guards are repeated inside this transaction.
create or replace function public.vf_practical_mutate(p_actor uuid, p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_project public.practical_projects%rowtype;
  v_submission public.practical_submissions%rowtype;
  v_assignment public.mentor_assignments%rowtype;
  v_review public.practical_reviews%rowtype;
  v_count integer;
  v_name text;
  v_actor_role text;
  v_links jsonb;
  v_criteria jsonb;
  v_lock_user uuid;
begin
  if p_actor is null or jsonb_typeof(p_payload) is distinct from 'object' then raise exception 'VF_PRACTICAL_INVALID: Invalid practical request.'; end if;
  v_lock_user:=p_actor;
  if p_action='review' then
    select user_id into v_lock_user from public.practical_submissions where id=(p_payload->>'submission_id')::uuid;
    if not found then raise exception 'VF_PRACTICAL_FORBIDDEN: Submission unavailable.'; end if;
  end if;
  -- Always lock the evidence owner before the submission row, including reviews.
  -- This avoids a withdraw/review deadlock and cross-mentor lock cycles.
  perform pg_advisory_xact_lock(hashtextextended('vf-practical:' || v_lock_user::text, 0));
  if p_action = 'save' then
    if char_length(coalesce(p_payload->>'content','')) > 12000 or coalesce(p_payload->>'level','') not in ('foundation','intermediate') then raise exception 'VF_PRACTICAL_INVALID: Invalid draft.'; end if;
    v_links := coalesce(p_payload->'links','[]'::jsonb);
    if jsonb_typeof(v_links) <> 'array' or jsonb_array_length(v_links) > 3 or exists(select 1 from jsonb_array_elements_text(v_links) l where l !~ '^https://[^/@[:space:]]+\.[^/@[:space:]]+' or char_length(l)>2000) then raise exception 'VF_PRACTICAL_INVALID: Use up to three public HTTPS links.'; end if;
    if p_payload->>'project_id' is null then
      if coalesce((p_payload->>'expected_version')::integer,-1) <> 0 or jsonb_typeof(p_payload->'brief') <> 'object' or jsonb_typeof(p_payload->'brief'->'rubric') <> 'array' or jsonb_array_length(p_payload->'brief'->'rubric') not between 1 and 20 then raise exception 'VF_PRACTICAL_INVALID: Invalid activity brief.'; end if;
      if exists(select 1 from public.practical_projects where user_id=p_actor and role_id=(p_payload->>'role_id')::uuid and level=p_payload->>'level') then raise exception 'VF_PRACTICAL_CONFLICT: A draft already exists. Refresh before editing.'; end if;
      insert into public.practical_projects(user_id,role_id,level,brief,content,links)
        values(p_actor,(p_payload->>'role_id')::uuid,p_payload->>'level',p_payload->'brief',coalesce(p_payload->>'content',''),v_links) returning * into v_project;
    else
      select * into v_project from public.practical_projects where id=(p_payload->>'project_id')::uuid and user_id=p_actor for update;
      if not found then raise exception 'VF_PRACTICAL_FORBIDDEN: Draft unavailable.'; end if;
      if v_project.draft_version is distinct from (p_payload->>'expected_version')::integer or v_project.role_id is distinct from (p_payload->>'role_id')::uuid or v_project.level is distinct from p_payload->>'level' then raise exception 'VF_PRACTICAL_CONFLICT: This draft changed. Refresh before saving.'; end if;
      update public.practical_projects set content=coalesce(p_payload->>'content',''),links=v_links,draft_version=draft_version+1,updated_at=now() where id=v_project.id returning * into v_project;
    end if;
    return jsonb_build_object('ok',true,'project',to_jsonb(v_project));
  elsif p_action = 'submit' then
    if p_payload->>'consent' is distinct from 'true' then raise exception 'VF_PRACTICAL_INVALID: Confirm sharing with your assigned mentor.'; end if;
    select * into v_submission from public.practical_submissions where user_id=p_actor and request_id=(p_payload->>'request_id')::uuid;
    if found then
      if v_submission.project_id is distinct from (p_payload->>'project_id')::uuid or v_submission.draft_version is distinct from (p_payload->>'expected_version')::integer or v_submission.mentor_id is distinct from (p_payload->>'mentor_id')::uuid then
        raise exception 'VF_PRACTICAL_CONFLICT: This request was already used for a different sharing action.';
      end if;
      return jsonb_build_object('ok',true,'submission',to_jsonb(v_submission),'replayed',true);
    end if;
    select * into v_project from public.practical_projects where id=(p_payload->>'project_id')::uuid and user_id=p_actor for update;
    if not found then raise exception 'VF_PRACTICAL_FORBIDDEN: Draft unavailable.'; end if;
    if v_project.draft_version is distinct from (p_payload->>'expected_version')::integer then raise exception 'VF_PRACTICAL_CONFLICT: Your draft changed. Review the saved version before sharing.'; end if;
    if char_length(btrim(v_project.content)) < 40 then raise exception 'VF_PRACTICAL_INVALID: Add at least 40 characters of evidence and confirm sharing.'; end if;
    select * into v_assignment from public.mentor_assignments where user_id=p_actor order by assigned_at desc,id desc limit 1;
    if not found or v_assignment.mentor_id <> (p_payload->>'mentor_id')::uuid then raise exception 'VF_PRACTICAL_CONFLICT: Your assigned mentor changed. Refresh and confirm sharing again.'; end if;
    select display_name,admin_role into v_name,v_actor_role from public.admin_users where id=v_assignment.mentor_id;
    if coalesce(v_actor_role,'') not in ('mentor','admin','super_admin') then raise exception 'VF_PRACTICAL_FORBIDDEN: An eligible assigned mentor is required.'; end if;
    select * into v_submission from public.practical_submissions where project_id=v_project.id and draft_version=v_project.draft_version and assignment_id=v_assignment.id;
    if found then
      if v_submission.withdrawn_at is not null then raise exception 'VF_PRACTICAL_CONFLICT: Edit and save a new draft version before sharing withdrawn work again.'; end if;
      return jsonb_build_object('ok',true,'submission',to_jsonb(v_submission),'replayed',true);
    end if;
    select coalesce(max(revision),0)+1 into v_count from public.practical_submissions where project_id=v_project.id;
    insert into public.practical_submissions(project_id,user_id,learner_name,revision,draft_version,brief,content,links,mentor_id,mentor_name,assignment_id,request_id)
      values(v_project.id,p_actor,coalesce((select full_name from public.profiles where id=p_actor),'Learner'),v_count,v_project.draft_version,v_project.brief,v_project.content,v_project.links,v_assignment.mentor_id,coalesce(nullif(v_name,''),'Assigned mentor'),v_assignment.id,(p_payload->>'request_id')::uuid) returning * into v_submission;
    return jsonb_build_object('ok',true,'submission',to_jsonb(v_submission));
  elsif p_action = 'withdraw' then
    update public.practical_submissions set withdrawn_at=coalesce(withdrawn_at,now()) where id=(p_payload->>'submission_id')::uuid and user_id=p_actor returning * into v_submission;
    if not found then raise exception 'VF_PRACTICAL_FORBIDDEN: Submission unavailable.'; end if;
    return jsonb_build_object('ok',true,'submission',to_jsonb(v_submission));
  elsif p_action = 'review' then
    select * into v_submission from public.practical_submissions where id=(p_payload->>'submission_id')::uuid for update;
    if not found then raise exception 'VF_PRACTICAL_FORBIDDEN: Submission unavailable.'; end if;
    select admin_role,display_name into v_actor_role,v_name from public.admin_users where id=p_actor;
    select * into v_assignment from public.mentor_assignments where user_id=v_submission.user_id order by assigned_at desc,id desc limit 1;
    if coalesce(v_actor_role,'') not in ('mentor','admin','super_admin') or v_submission.withdrawn_at is not null or v_submission.mentor_id is distinct from p_actor or v_assignment.id is distinct from v_submission.assignment_id or v_assignment.mentor_id is distinct from p_actor then raise exception 'VF_PRACTICAL_FORBIDDEN: This work is no longer shared with your current assignment.'; end if;
    if exists(select 1 from public.practical_reviews where submission_id=v_submission.id) then raise exception 'VF_PRACTICAL_CONFLICT: This version already has feedback. Review a new submission instead.'; end if;
    v_criteria := p_payload->'criteria';
    v_count := jsonb_array_length(v_submission.brief->'rubric');
    if jsonb_typeof(v_criteria) <> 'array' or jsonb_array_length(v_criteria) <> v_count or char_length(btrim(coalesce(p_payload->>'feedback',''))) not between 10 and 6000 or coalesce(p_payload->>'verdict','') not in ('ready','revise') then raise exception 'VF_PRACTICAL_INVALID: Complete the rubric and feedback.'; end if;
    if (select count(distinct (r->>'criterion')::integer) from jsonb_array_elements(v_criteria) r) <> v_count or exists(select 1 from jsonb_array_elements(v_criteria) r where (r->>'criterion')::integer not between 0 and v_count-1 or coalesce(r->>'judgement','') not in ('demonstrated','developing','not_yet') or char_length(coalesce(r->>'comment',''))>1200 or (p_payload->>'verdict'='ready' and r->>'judgement'<>'demonstrated')) then raise exception 'VF_PRACTICAL_INVALID: Review every criterion once; ready work must demonstrate every criterion.'; end if;
    insert into public.practical_reviews(submission_id,user_id,mentor_id,mentor_name,verdict,feedback,criteria)
      values(v_submission.id,v_submission.user_id,p_actor,coalesce(nullif(v_name,''),'Assigned mentor'),p_payload->>'verdict',btrim(p_payload->>'feedback'),v_criteria) returning * into v_review;
    return jsonb_build_object('ok',true,'review',to_jsonb(v_review));
  end if;
  raise exception 'VF_PRACTICAL_INVALID: Unknown practical action.';
end;
$$;
revoke all on function public.vf_practical_mutate(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.vf_practical_mutate(uuid,text,jsonb) to service_role;
commit;
