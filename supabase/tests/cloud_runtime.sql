-- Checks real database grants, replay handling, serialization and session locks.
-- Every synthetic record is rolled back. Existing learning records are untouched.
begin;
do $verify$
declare
  owner_id uuid;
  submission_id uuid:=gen_random_uuid();
  lock_id uuid:=gen_random_uuid();
  demo_id text:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  result jsonb;
begin
  select id into owner_id from auth.users order by created_at limit 1;
  assert owner_id is not null, 'An existing auth user is required for this test';
  assert not has_table_privilege('anon','public.vf_demo_sessions','select'), 'Anonymous demo state access';
  assert not has_table_privilege('authenticated','public.vf_submission_ledger','select'), 'Client ledger access';
  assert not has_function_privilege('authenticated','public.vf_claim_submission(uuid,uuid)','execute'), 'Client grading privilege';
  assert has_function_privilege('service_role','public.vf_claim_submission(uuid,uuid)','execute'), 'Missing server grant';
  result:=public.vf_claim_submission(submission_id,owner_id);
  assert result->>'status'='claimed', 'First claim failed';
  update public.vf_submission_ledger set status='completed',result='{"verified":true}' where id=submission_id;
  result:=public.vf_claim_submission(submission_id,owner_id);
  assert result->>'status'='completed' and result->'result'->>'verified'='true', 'Replay failed';
  result:=public.vf_claim_submission(gen_random_uuid(),owner_id);
  assert result->>'status'='claimed', 'Next assessment blocked';
  result:=public.vf_claim_submission(gen_random_uuid(),owner_id);
  assert result->>'status'='pending', 'Concurrent assessments were admitted';
  assert public.vf_demo_create(demo_id,'synthetic-verification',extract(epoch from now()+interval '1 minute')), 'Create failed';
  result:=public.vf_demo_checkout(demo_id,lock_id);
  assert result->>'status'='claimed', 'Checkout failed';
  result:=public.vf_demo_checkout(demo_id,gen_random_uuid());
  assert result->>'status'='busy', 'Session lock failed';
  assert public.vf_demo_save(demo_id,lock_id,null,0), 'Session end failed';
end $verify$;
rollback;
select true as cloud_runtime_verified;
