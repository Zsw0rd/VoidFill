import copy
import time

import pytest
from fastapi import HTTPException
from ml import cloud_guests


@pytest.fixture
def storage(monkeypatch):
    monkeypatch.setenv("ML_SERVICE_TOKEN", "synthetic-cloud-encryption-token-at-least-32-chars")
    rows = {}
    def rpc(name, body):
        identifier = body["p_id"]
        if name == "vf_demo_create":
            rows[identifier] = {"snapshot": body["p_snapshot"], "expires": body["p_expires"], "lock": None}
            return True
        row = rows.get(identifier)
        if name == "vf_demo_checkout":
            if not row or row["expires"] <= time.time():
                rows.pop(identifier, None)
                return {"status": "missing"}
            if row["lock"]:
                return {"status": "busy"}
            row["lock"] = body["p_lock"]
            return {"status": "claimed", **copy.deepcopy(row)}
        if name == "vf_demo_save":
            if not row or row["lock"] != body["p_lock"]:
                return False
            if body["p_snapshot"] is None:
                del rows[identifier]
            else:
                rows[identifier] = {"snapshot": body["p_snapshot"], "expires": body["p_expires"], "lock": None}
            return True
        raise AssertionError(name)
    monkeypatch.setattr(cloud_guests, "rpc", rpc)
    return rows


def test_cloud_demo_survives_new_store_instances_and_preserves_isolation(storage):
    first = cloud_guests.execute("start", "", {"role": 0})
    second = cloud_guests.execute("start", "", {"role": 1})
    cloud_guests.execute("query", first["token"], {"table": "profiles", "operation": "update", "values": {"full_name": "Private Learner"}})
    profile = cloud_guests.execute("query", first["token"], {"table": "profiles", "single": "required"})
    other = cloud_guests.execute("query", second["token"], {"table": "profiles", "single": "required"})
    assert profile["data"]["full_name"] == "Private Learner"
    assert other["data"]["full_name"] != "Private Learner"
    assert all("Private Learner" not in row["snapshot"] for row in storage.values())
    cloud_guests.execute("end", first["token"], {})
    with pytest.raises(HTTPException) as denied:
        cloud_guests.execute("user", first["token"], {})
    assert denied.value.status_code == 401
    assert cloud_guests.execute("user", second["token"], {})["data"]["user"]["id"] == second["user"]["id"]


def test_practical_drafts_and_reviews_survive_encrypted_cloud_roundtrip(storage):
    from ml.guest import ROLES
    first = cloud_guests.execute("start", "", {"role": 0})
    second = cloud_guests.execute("start", "", {"role": 0})
    evidence = "Private synthetic evidence checked against two examples; this text must remain encrypted at rest."
    draft = cloud_guests.execute("practical", first["token"], {"action": "save", "role_id": ROLES[0]["id"], "level": "foundation", "expected_version": 0, "content": evidence, "links": []})["project"]
    assert cloud_guests.execute("practical", first["token"], {"action": "load"})["projects"][0]["content"] == evidence
    assert not cloud_guests.execute("practical", second["token"], {"action": "load"})["projects"]
    assert all(evidence not in row["snapshot"] for row in storage.values())
    with pytest.raises(HTTPException):
        cloud_guests.execute("practical", first["token"], {"action": "save", "role_id": ROLES[0]["id"], "level": "foundation", "project_id": draft["id"], "expected_version": 0, "content": "stale write", "links": []})
    assert cloud_guests.execute("practical", first["token"], {"action": "load"})["projects"][0]["content"] == evidence
    mentor = cloud_guests.execute("start", "", {"staff": "mentor"})
    item = cloud_guests.execute("practical", mentor["token"], {"action": "load", "mode": "mentor"})["submissions"][0]
    cloud_guests.execute("practical", mentor["token"], {"action": "review", "submission_id": item["id"], "verdict": "revise", "feedback": "Document a checked second case before the next review.", "criteria": [{"criterion": index, "judgement": "developing", "comment": ""} for index, _ in enumerate(item["brief"]["rubric"])]})
    result = cloud_guests.execute("practical", mentor["token"], {"action": "load", "mode": "mentor"})
    assert len(result["reviews"]) == 1


def test_encrypted_demo_snapshots_are_bound_to_their_session(storage):
    first = cloud_guests.execute("start", "", {"role": 0})
    second = cloud_guests.execute("start", "", {"role": 0})
    rows = list(storage.values())
    rows[0]["snapshot"], rows[1]["snapshot"] = rows[1]["snapshot"], rows[0]["snapshot"]
    with pytest.raises(HTTPException) as denied:
        cloud_guests.execute("user", first["token"], {})
    assert denied.value.status_code == 401
