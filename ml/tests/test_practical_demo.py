import copy
from uuid import uuid4

import pytest
from fastapi import HTTPException
from ml.guest import GuestStore, ROLES
from ml.practical_demo import execute
from ml import practical_demo


def draft(store, token):
    return store.practical(token, {"action": "save", "expected_version": 0, "role_id": ROLES[0]["id"], "level": "foundation", "content": "I created a synthetic example and checked my result against two independent cases. My next step is to document the limitations.", "links": ["https://example.com/synthetic-work"]})["project"]


def test_private_draft_versions_isolation_and_no_progress_awards():
    store = GuestStore()
    first, second = store.create(), store.create()
    before = copy.deepcopy(store.get(first["token"])["tables"]["user_stats"])
    project = draft(store, first["token"])
    assert not store.practical(second["token"], {"action": "load"})["projects"]
    assert store.practical(first["token"], {"action": "load"})["projects"][0]["id"] == project["id"]
    with pytest.raises(HTTPException) as denied:
        store.practical(second["token"], {"action": "save", "project_id": project["id"], "expected_version": 1, "role_id": ROLES[0]["id"], "level": "foundation", "content": "forged", "links": []})
    assert denied.value.status_code == 403
    with pytest.raises(HTTPException) as stale:
        store.practical(first["token"], {"action": "save", "project_id": project["id"], "expected_version": 0, "role_id": ROLES[0]["id"], "level": "foundation", "content": "stale", "links": []})
    assert stale.value.status_code == 409
    assert store.get(first["token"])["tables"]["user_stats"] == before
    with pytest.raises(HTTPException):
        store.query(first["token"], {"table": "practical_reviews", "operation": "insert", "values": {"verdict": "ready"}})


def test_case_inputs_survive_save_reload_and_future_catalogue_edits(monkeypatch):
    content = copy.deepcopy(practical_demo.catalogue())
    monkeypatch.setattr(practical_demo, "catalogue", lambda: content)
    role = next(row for row in content["roles"] if row["id"] == ROLES[0]["id"])
    original_inputs = copy.deepcopy(role["curriculum"]["foundation"]["case_inputs"])
    store = GuestStore()
    first = store.create()
    project = draft(store, first["token"])
    frozen = copy.deepcopy(project["brief"])
    assert frozen["case_inputs"] == original_inputs
    assert frozen["rubric"][-1] == role["curriculum"]["foundation"]["case_verification"]
    assert frozen["version"].endswith("/" + role["curriculum"]["case_pack_version"])
    role["curriculum"]["foundation"]["case_inputs"] = ["A later synthetic case with different inputs."]
    role["curriculum"]["case_pack_version"] = "future-case-pack"
    assert store.practical(first["token"], {"action": "load"})["projects"][0]["brief"] == frozen
    updated = store.practical(first["token"], {"action": "save", "project_id": project["id"], "expected_version": 1, "role_id": project["role_id"], "level": "foundation", "content": "A revision preserves its original brief and inputs.", "links": []})["project"]
    assert updated["brief"] == frozen
    second = store.create()
    assert draft(store, second["token"])["brief"]["case_inputs"] != original_inputs


def test_seeded_mentor_submissions_include_case_inputs_and_frozen_verification():
    store = GuestStore()
    token = store.create_staff("mentor")["token"]
    workspace = store.practical(token, {"action": "load", "mode": "mentor"})
    assert workspace["submissions"]
    for submission in workspace["submissions"]:
        stage = next(role for role in practical_demo.catalogue()["roles"] if role["id"] == submission["brief"]["role_id"])["curriculum"][submission["brief"]["level"]]
        assert submission["brief"]["case_inputs"] == stage["case_inputs"]
        assert submission["brief"]["rubric"][-1] == stage["case_verification"]
    workspace["submissions"][0]["brief"]["case_inputs"].append("Changed only in the returned copy.")
    assert store.practical(token, {"action": "load", "mode": "mentor"})["submissions"][0]["brief"]["case_inputs"] != workspace["submissions"][0]["brief"]["case_inputs"]


def test_unassigned_learner_cannot_share_or_impersonate_a_mentor():
    store = GuestStore()
    user = store.create()
    project = draft(store, user["token"])
    with pytest.raises(HTTPException) as unassigned:
        store.practical(user["token"], {"action": "submit", "project_id": project["id"], "expected_version": 1, "mentor_id": str(uuid4()), "request_id": str(uuid4()), "consent": True})
    assert unassigned.value.status_code == 409
    with pytest.raises(HTTPException) as forged:
        store.practical(user["token"], {"action": "load", "mode": "mentor"})
    assert forged.value.status_code == 403


def test_synthetic_review_is_immutable_assignment_scoped_and_separate_from_xp():
    store = GuestStore()
    who = store.create_staff("mentor")
    token = who["token"]
    work = store.practical(token, {"action": "load", "mode": "mentor"})
    assert len(work["submissions"]) == 3 and work["projects"] == []
    submission = work["submissions"][0]
    before = copy.deepcopy(store.get(token)["tables"]["user_stats"])
    review = {"action": "review", "submission_id": submission["id"], "verdict": "revise", "feedback": "Good first attempt; add an independently checked second example.", "criteria": [{"criterion": index, "judgement": "developing", "comment": ""} for index, _ in enumerate(submission["brief"]["rubric"])]}
    result = store.practical(token, review)
    assert result["review"]["verdict"] == "revise"
    assert store.get(token)["tables"]["user_stats"] == before
    with pytest.raises(HTTPException) as duplicate:
        store.practical(token, review)
    assert duplicate.value.status_code == 409
    old = next(row for row in store.get(token)["tables"]["mentor_assignments"] if row["user_id"] == submission["user_id"])
    store.get(token)["tables"]["mentor_assignments"].remove(old)
    assert all(row["id"] != submission["id"] for row in store.practical(token, {"action": "load", "mode": "mentor"})["submissions"])
    assert not store.practical(token, {"action": "load", "mode": "mentor"})["reviews"]
    with pytest.raises(HTTPException) as revoked:
        store.practical(token, review)
    assert revoked.value.status_code == 403


def test_review_cannot_skip_criteria_or_claim_ready_with_missing_evidence():
    store = GuestStore()
    token = store.create_staff("mentor")["token"]
    row = store.practical(token, {"action": "load", "mode": "mentor"})["submissions"][0]
    invalid = {"action": "review", "submission_id": row["id"], "verdict": "ready", "feedback": "This is a synthetic test review.", "criteria": []}
    with pytest.raises(HTTPException):
        store.practical(token, invalid)
    invalid["criteria"] = [{"criterion": index, "judgement": "developing", "comment": ""} for index, _ in enumerate(row["brief"]["rubric"])]
    with pytest.raises(HTTPException):
        store.practical(token, invalid)
    assert not store.practical(token, {"action": "load", "mode": "mentor"})["reviews"]


def test_explicit_sharing_replay_snapshot_and_withdrawal():
    store = GuestStore()
    who = store.create_staff("mentor")
    token, mentor_id = who["token"], who["user"]["id"]
    store.practical(token, {"action": "load", "mode": "mentor"})
    session = store.get(token)
    learner_id = session["tables"]["mentor_assignments"][0]["user_id"]
    # A synthetic learner persona in the SAME disposable snapshot exercises the roundtrip.
    learner = {**session, "user": {"id": learner_id}, "staff_role": None}
    project = next(row for row in session["tables"]["practical_projects"] if row["user_id"] == learner_id)
    payload = {"action": "save", "project_id": project["id"], "expected_version": 1, "role_id": project["role_id"], "level": "foundation", "content": project["content"] + " Revision includes an explicit second case.", "links": []}
    updated = execute(learner, payload)["project"]
    share = {"action": "submit", "project_id": project["id"], "expected_version": 2, "mentor_id": mentor_id, "request_id": str(uuid4()), "consent": True}
    shared = execute(learner, share)["submission"]
    assert execute(learner, share)["replayed"]
    with pytest.raises(HTTPException) as missing_consent:
        execute(learner, {**share, "consent": False})
    assert missing_consent.value.status_code == 400
    with pytest.raises(HTTPException) as changed_intent:
        execute(learner, {**share, "expected_version": 99})
    assert changed_intent.value.status_code == 409
    payload.update(expected_version=2, content="Private changes not yet shared. " * 3)
    execute(learner, payload)
    assert shared["content"] == updated["content"]
    execute(learner, {"action": "withdraw", "submission_id": shared["id"]})
    assert all(row["id"] != shared["id"] for row in store.practical(token, {"action": "load", "mode": "mentor"})["submissions"])
    assert any(row["id"] == shared["id"] for row in execute(learner, {"action": "load"})["submissions"])
