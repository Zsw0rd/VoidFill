-- Shared budgets across Vercel instances. Only authenticated server code may call
-- the RPC with its verified user; neither browsers nor the anonymous API may mutate it.
begin;
create table if not exists public.operation_budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  window_seconds integer not null check (window_seconds > 0),
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0),
  expires_at timestamptz not null,
  primary key(user_id, operation, window_seconds, window_start)
);
alter table public.operation_budgets enable row level security;
revoke all on public.operation_budgets from public, anon, authenticated;
grant all on public.operation_budgets to service_role;
create index if not exists operation_budgets_expiry on public.operation_budgets(expires_at);

create or replace function public.vf_consume_operation_budget(p_user_id uuid, p_operation text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_windows integer[];
  v_limits integer[];
  v_start timestamptz;
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_retry integer := 0;
  i integer;
begin
  if p_user_id is null then raise exception 'A verified user is required'; end if;
  case p_operation
    when 'assessment' then v_windows := array[900,86400]; v_limits := array[30,240];
    when 'recommendation' then v_windows := array[300,86400]; v_limits := array[15,120];
    when 'insight' then v_windows := array[300,86400]; v_limits := array[10,80];
    when 'resume' then v_windows := array[300,86400]; v_limits := array[3,20];
    when 'chat' then v_windows := array[60,86400]; v_limits := array[12,120];
    when 'practical' then v_windows := array[300,86400]; v_limits := array[20,120];
    else raise exception 'Unsupported operation';
  end case;
  perform pg_advisory_xact_lock(hashtextextended('vf-budget:' || p_user_id::text || ':' || p_operation, 0));
  for i in 1..array_length(v_windows,1) loop
    v_start := to_timestamp(floor(extract(epoch from v_now) / v_windows[i]) * v_windows[i]);
    select request_count into v_count from public.operation_budgets
      where user_id=p_user_id and operation=p_operation and window_seconds=v_windows[i] and window_start=v_start;
    if coalesce(v_count,0) >= v_limits[i] then
      v_retry := greatest(v_retry, ceil(extract(epoch from v_start + make_interval(secs => v_windows[i]) - v_now))::integer);
    end if;
  end loop;
  if v_retry > 0 then return jsonb_build_object('allowed',false,'retry_after',v_retry); end if;
  for i in 1..array_length(v_windows,1) loop
    v_start := to_timestamp(floor(extract(epoch from v_now) / v_windows[i]) * v_windows[i]);
    insert into public.operation_budgets(user_id,operation,window_seconds,window_start,request_count,expires_at)
      values(p_user_id,p_operation,v_windows[i],v_start,1,v_start+make_interval(secs=>v_windows[i])+interval '1 day')
      on conflict(user_id,operation,window_seconds,window_start) do update set request_count=operation_budgets.request_count+1;
  end loop;
  return jsonb_build_object('allowed',true,'retry_after',0);
end $$;
revoke all on function public.vf_consume_operation_budget(uuid,text) from public, anon, authenticated;
grant execute on function public.vf_consume_operation_budget(uuid,text) to service_role;

create or replace function public.vf_prune_operation_budgets()
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_removed integer;
begin
  delete from public.operation_budgets where ctid in
    (select ctid from public.operation_budgets where expires_at < now() order by expires_at limit 10000);
  get diagnostics v_removed = row_count;
  return v_removed;
end $$;
revoke all on function public.vf_prune_operation_budgets() from public,anon,authenticated;
grant execute on function public.vf_prune_operation_budgets() to service_role;
do $$
begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    if not exists(select 1 from cron.job where jobname='vf-operation-budget-cleanup') then
      perform cron.schedule('vf-operation-budget-cleanup','17 * * * *','select public.vf_prune_operation_budgets();');
    end if;
  end if;
end $$;
commit;
