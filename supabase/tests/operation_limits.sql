-- Disposable PostgreSQL only. No real users or permanent records.
begin;
do $verify$
declare
  learner uuid:=gen_random_uuid();
  other_learner uuid:=gen_random_uuid();
  result jsonb;
  before_count integer;
begin
  insert into auth.users(id) values(learner),(other_learner);
  assert not has_function_privilege('authenticated','public.vf_consume_operation_budget(uuid,text)','execute'), 'Browser can forge budget identity';
  assert not has_function_privilege('anon','public.vf_consume_operation_budget(uuid,text)','execute'), 'Anonymous budget access';
  assert not has_table_privilege('authenticated','public.operation_budgets','select,insert,update,delete'), 'Browser can read or reset quotas';
  assert has_function_privilege('service_role','public.vf_consume_operation_budget(uuid,text)','execute'), 'Server quota access missing';
  for i in 1..3 loop
    result:=public.vf_consume_operation_budget(learner,'resume');
    assert (result->>'allowed')::boolean, 'Legitimate resume request denied';
  end loop;
  select sum(request_count)::integer into before_count from public.operation_budgets where user_id=learner;
  result:=public.vf_consume_operation_budget(learner,'resume');
  assert not (result->>'allowed')::boolean, 'Resume burst was not limited';
  assert (result->>'retry_after')::integer between 1 and 300, 'Invalid retry interval';
  assert (select sum(request_count) from public.operation_budgets where user_id=learner)=before_count, 'Denied requests consumed other windows';
  result:=public.vf_consume_operation_budget(other_learner,'resume');
  assert (result->>'allowed')::boolean, 'One user exhausted another user budget';
  result:=public.vf_consume_operation_budget(learner,'assessment');
  assert (result->>'allowed')::boolean, 'Resume quota blocked knowledge checks';
  for i in 1..20 loop
    result:=public.vf_consume_operation_budget(learner,'practical');
    assert (result->>'allowed')::boolean, 'Legitimate practical write denied';
  end loop;
  result:=public.vf_consume_operation_budget(learner,'practical');
  assert not (result->>'allowed')::boolean, 'Practical evidence writes unbounded';
  update public.operation_budgets set window_start=window_start-interval '2 days',expires_at=now()-interval '1 minute' where user_id=learner;
  result:=public.vf_consume_operation_budget(learner,'resume');
  assert (result->>'allowed')::boolean, 'Expired window did not reset';
  assert public.vf_prune_operation_budgets()>0, 'Expired budget cleanup did not run';
end $verify$;
rollback;
