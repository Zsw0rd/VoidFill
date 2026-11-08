-- Disposable PostgreSQL only. RLS, service-only actions, ownership, idempotency,
-- staff restrictions and preserved learner records. Every fixture is rolled back.
begin;
do $verify$
declare
  learner uuid:=gen_random_uuid();
  stranger uuid:=gen_random_uuid();
  mentor uuid:=gen_random_uuid();
  administrator uuid:=gen_random_uuid();
  request_id uuid;
  previous_request_id uuid;
  own_admin_request uuid;
  result jsonb;
  repeated jsonb;
  before_users bigint;
begin
  insert into auth.users(id,email) values(learner,'account-request-learner@example.invalid'),(stranger,'account-request-stranger@example.invalid'),(mentor,'account-request-mentor@example.invalid'),(administrator,'account-request-admin@example.invalid');
  insert into public.admin_users(id,admin_role,display_name) values(mentor,'mentor','Synthetic mentor'),(administrator,'admin','Synthetic administrator');
  insert into public.user_stats(user_id,xp) values(learner,321) on conflict(user_id) do update set xp=321;
  select count(*) into before_users from auth.users;
  assert not has_function_privilege('authenticated','public.vf_manage_account_deletion_request(uuid,text,uuid,text)','execute'), 'Browser can forge account action identity';
  assert not has_function_privilege('anon','public.vf_manage_account_deletion_request(uuid,text,uuid,text)','execute'), 'Anonymous account action access';
  assert has_function_privilege('service_role','public.vf_manage_account_deletion_request(uuid,text,uuid,text)','execute'), 'Server account action grant missing';
  assert not has_table_privilege('authenticated','public.account_deletion_requests','insert,update,delete'), 'Browser can modify account request records';
  assert not has_table_privilege('anon','public.account_deletion_requests','select'), 'Anonymous account request read';
  result:=public.vf_manage_account_deletion_request(learner,'request');
  request_id:=(result->>'id')::uuid;
  assert result->>'status'='pending', 'New request is not pending';
  assert not (result ? 'user_id') and not (result ? 'account_email') and not (result ? 'reviewed_by'), 'Mutation returned internal identities';
  repeated:=public.vf_manage_account_deletion_request(learner,'request');
  assert repeated=result, 'Retry changed or duplicated an open request';
  assert (select count(*) from public.account_deletion_requests where user_id=learner)=1, 'Request retry duplicated rows';
  begin
    perform public.vf_manage_account_deletion_request(stranger,'cancel',request_id);
    raise exception 'Foreign cancellation unexpectedly accepted';
  exception when raise_exception then if sqlerrm<>'Request not found' then raise; end if; end;
  begin
    perform public.vf_manage_account_deletion_request(mentor,'start',request_id);
    raise exception 'Mentor unexpectedly permitted to review privacy requests';
  exception when raise_exception then if sqlerrm<>'Administrator required' then raise; end if; end;

  perform set_config('request.jwt.claim.sub',learner::text,true);
  execute 'set local role authenticated';
  assert exists(select 1 from public.account_deletion_requests where id=request_id), 'Owner request invisible';
  begin
    perform public.vf_manage_account_deletion_request(learner,'request');
    raise exception 'Browser could invoke service account action';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',stranger::text,true);
  execute 'set local role authenticated';
  assert not exists(select 1 from public.account_deletion_requests where id=request_id), 'Foreign request visible';
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',administrator::text,true);
  execute 'set local role authenticated';
  assert not exists(select 1 from public.account_deletion_requests where id=request_id), 'Staff browser bypassed owner RLS';
  execute 'reset role';

  result:=public.vf_manage_account_deletion_request(administrator,'start',request_id);
  assert result->>'status'='in_review', 'Administrator could not start review';
  result:=public.vf_manage_account_deletion_request(learner,'cancel',request_id);
  assert result->>'status'='cancelled', 'Owner could not cancel open review';
  begin
    perform public.vf_manage_account_deletion_request(administrator,'close',request_id,'This stale review should never close.');
    raise exception 'Cancelled request could still be closed';
  exception when raise_exception then if sqlerrm<>'No open request' then raise; end if; end;
  previous_request_id:=request_id;
  result:=public.vf_manage_account_deletion_request(learner,'request');
  request_id:=(result->>'id')::uuid;
  assert request_id<>previous_request_id and result->>'status'='pending', 'Cancelled request did not safely reopen with a fresh reference';
  begin
    perform public.vf_manage_account_deletion_request(administrator,'start',previous_request_id);
    raise exception 'Stale inbox reference reached a later reopened request';
  exception when raise_exception then if sqlerrm<>'No open request' then raise; end if; end;
  begin
    perform public.vf_manage_account_deletion_request(administrator,'close',request_id,'short');
    raise exception 'Unhelpful closure response accepted';
  exception when raise_exception then if sqlerrm<>'A useful response is required' then raise; end if; end;
  result:=public.vf_manage_account_deletion_request(administrator,'close',request_id,'Identity review is needed; contact the administrator to continue.');
  assert result->>'status'='closed' and char_length(result->>'resolution')>=20, 'Review response not saved';
  assert (select count(*) from auth.users)=before_users, 'Request workflow erased an account';
  assert (select xp from public.user_stats where user_id=learner)=321, 'Request workflow changed earned progress';
  assert exists(select 1 from public.profiles where id=learner), 'Request workflow erased profile';

  result:=public.vf_manage_account_deletion_request(administrator,'request');
  own_admin_request:=(result->>'id')::uuid;
  assert (result->>'staff_account')::boolean, 'Staff responsibility-transfer flag absent';
  begin
    perform public.vf_manage_account_deletion_request(administrator,'start',own_admin_request);
    raise exception 'Administrator reviewed their own removal request';
  exception when raise_exception then if sqlerrm<>'A different administrator must review this request' then raise; end if; end;
end $verify$;
rollback;
