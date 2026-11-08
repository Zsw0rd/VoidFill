-- Account privacy requests are records for human review. This migration does not
-- erase accounts, change staff access, or alter existing learning records.
begin;
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  account_email text not null,
  staff_account boolean not null default false,
  status text not null default 'pending' check (status in ('pending','in_review','cancelled','closed')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolution text not null default '' check (char_length(resolution) <= 2000),
  resolved_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public,anon,authenticated;
grant select on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;
drop policy if exists account_request_owner_read on public.account_deletion_requests;
create policy account_request_owner_read on public.account_deletion_requests for select to authenticated using (user_id=auth.uid());
create index if not exists account_request_review_queue on public.account_deletion_requests(status,requested_at);

create or replace function public.vf_manage_account_deletion_request(p_actor uuid, p_action text, p_request_id uuid default null, p_resolution text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_row public.account_deletion_requests%rowtype;
  v_email text;
  v_staff boolean;
begin
  if p_actor is null then raise exception 'Verified caller required'; end if;
  if p_action='request' then
    perform pg_advisory_xact_lock(hashtextextended('vf-account-request:'||p_actor::text,0));
    select email into v_email from auth.users where id=p_actor;
    if v_email is null or char_length(v_email)>254 then raise exception 'Account email required'; end if;
    v_staff:=exists(select 1 from public.admin_users where id=p_actor);
    select * into v_row from public.account_deletion_requests where user_id=p_actor for update;
    if v_row.id is not null and v_row.status in ('pending','in_review') then return to_jsonb(v_row)-'user_id'-'account_email'-'reviewed_by'; end if;
    insert into public.account_deletion_requests(user_id,account_email,staff_account)
      values(p_actor,v_email,v_staff)
      -- A reopened intent gets a new reference so stale inbox/cancel actions
      -- cannot act on a later request merely because the account is the same.
      on conflict(user_id) do update set id=gen_random_uuid(),account_email=excluded.account_email,staff_account=excluded.staff_account,status='pending',requested_at=now(),updated_at=now(),resolution='',resolved_at=null,reviewed_by=null
      returning * into v_row;
  elsif p_action='cancel' then
    select * into v_row from public.account_deletion_requests where id=p_request_id and user_id=p_actor for update;
    if v_row.id is null then raise exception 'Request not found'; end if;
    if v_row.status in ('pending','in_review') then
      update public.account_deletion_requests set status='cancelled',updated_at=now(),resolution='',resolved_at=null,reviewed_by=null where id=v_row.id returning * into v_row;
    end if;
  elsif p_action in ('start','close') then
    if not exists(select 1 from public.admin_users where id=p_actor and admin_role in ('admin','super_admin')) then raise exception 'Administrator required'; end if;
    select * into v_row from public.account_deletion_requests where id=p_request_id for update;
    if v_row.id is null or v_row.status not in ('pending','in_review') then raise exception 'No open request'; end if;
    if v_row.user_id=p_actor then raise exception 'A different administrator must review this request'; end if;
    if p_action='close' and (p_resolution is null or char_length(btrim(p_resolution)) not between 20 and 2000) then raise exception 'A useful response is required'; end if;
    update public.account_deletion_requests set status=case when p_action='start' then 'in_review' else 'closed' end,
      updated_at=now(),reviewed_by=p_actor,resolution=case when p_action='close' then btrim(p_resolution) else '' end,
      resolved_at=case when p_action='close' then now() else null end where id=v_row.id returning * into v_row;
  else raise exception 'Unsupported account request action';
  end if;
  return to_jsonb(v_row)-'user_id'-'account_email'-'reviewed_by';
end $$;
revoke all on function public.vf_manage_account_deletion_request(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.vf_manage_account_deletion_request(uuid,text,uuid,text) to service_role;
commit;
