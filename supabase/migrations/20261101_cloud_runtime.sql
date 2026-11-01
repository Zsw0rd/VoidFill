-- Additive server-only persistence for Vercel's stateless functions.
-- No existing learner data or policies are changed by this migration.
begin;
create table if not exists public.vf_submission_ledger (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','completed','failed')),
  result jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists vf_one_pending_submission
  on public.vf_submission_ledger(user_id) where status='pending';
alter table public.vf_submission_ledger enable row level security;
revoke all on public.vf_submission_ledger from anon, authenticated;
grant all on public.vf_submission_ledger to service_role;

create or replace function public.vf_claim_submission(p_id uuid, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prior public.vf_submission_ledger;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  select * into prior from vf_submission_ledger where id=p_id;
  if found then
    if prior.user_id<>p_user_id then return jsonb_build_object('status','failed'); end if;
    return jsonb_build_object('status',prior.status,'result',prior.result);
  end if;
  -- A Vercel request has a 300s maximum; abandon crashed claims after 10 minutes.
  update vf_submission_ledger set status='failed'
    where user_id=p_user_id and status='pending' and created_at<now()-interval '10 minutes';
  if exists(select 1 from vf_submission_ledger where user_id=p_user_id and status='pending') then
    return jsonb_build_object('status','pending');
  end if;
  insert into vf_submission_ledger(id,user_id,status) values(p_id,p_user_id,'pending');
  return jsonb_build_object('status','claimed');
end $$;
revoke all on function public.vf_claim_submission(uuid,uuid) from public,anon,authenticated;
grant execute on function public.vf_claim_submission(uuid,uuid) to service_role;

create table if not exists public.vf_demo_sessions (
  id text primary key check(length(id)=64),
  snapshot text not null,
  expires_at timestamptz not null,
  lock_owner uuid,
  lock_until timestamptz
);
alter table public.vf_demo_sessions enable row level security;
revoke all on public.vf_demo_sessions from anon,authenticated;
grant all on public.vf_demo_sessions to service_role;
create index if not exists vf_demo_expiry on public.vf_demo_sessions(expires_at);

create or replace function public.vf_demo_create(p_id text,p_snapshot text,p_expires double precision)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(41298751);
  delete from vf_demo_sessions where expires_at<=now();
  if (select count(*) from vf_demo_sessions)>=100 then return false; end if;
  insert into vf_demo_sessions(id,snapshot,expires_at) values(p_id,p_snapshot,to_timestamp(p_expires));
  return true;
end $$;

create or replace function public.vf_demo_checkout(p_id text,p_lock uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare item public.vf_demo_sessions;
begin
  delete from vf_demo_sessions where expires_at<=now();
  select * into item from vf_demo_sessions where id=p_id for update;
  if not found then return jsonb_build_object('status','missing'); end if;
  if item.lock_until>now() then return jsonb_build_object('status','busy'); end if;
  update vf_demo_sessions set lock_owner=p_lock,lock_until=now()+interval '30 seconds' where id=p_id;
  return jsonb_build_object('status','claimed','snapshot',item.snapshot,'expires',extract(epoch from item.expires_at));
end $$;

create or replace function public.vf_demo_save(p_id text,p_lock uuid,p_snapshot text,p_expires double precision)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare affected integer;
begin
  if p_snapshot is null then
    delete from vf_demo_sessions where id=p_id and lock_owner=p_lock and lock_until>now();
  else
    update vf_demo_sessions set snapshot=p_snapshot,expires_at=to_timestamp(p_expires),lock_owner=null,lock_until=null
      where id=p_id and lock_owner=p_lock and lock_until>now();
  end if;
  get diagnostics affected=row_count;
  return affected=1;
end $$;
revoke all on function public.vf_demo_create(text,text,double precision) from public,anon,authenticated;
revoke all on function public.vf_demo_checkout(text,uuid) from public,anon,authenticated;
revoke all on function public.vf_demo_save(text,uuid,text,double precision) from public,anon,authenticated;
grant execute on function public.vf_demo_create(text,text,double precision) to service_role;
grant execute on function public.vf_demo_checkout(text,uuid) to service_role;
grant execute on function public.vf_demo_save(text,uuid,text,double precision) to service_role;
create extension if not exists pg_cron;
select cron.schedule('voidfill-expired-demo-sessions','* * * * *',
  $$delete from public.vf_demo_sessions where expires_at<=now()$$);
select cron.schedule('voidfill-submission-retention','20 3 * * *',
  $$delete from public.vf_submission_ledger where created_at<now()-interval '7 days';
    delete from cron.job_run_details where end_time<now()-interval '7 days'
      and jobid in (select jobid from cron.job where jobname in ('voidfill-expired-demo-sessions','voidfill-submission-retention'))$$);
commit;
