import pytest
from fastapi import HTTPException
from ml.guest import GuestStore


def test_staff_seeds_and_mentor_scope():
    store = GuestStore()
    admin = store.create_staff("admin")["token"]
    mentor = store.create_staff("mentor")["token"]
    other = store.create_staff("mentor2")["token"]
    rows = lambda token, table: store.query(token, {"table": table})["data"]
    assert len(rows(admin, "profiles")) == 6
    assert len(rows(admin, "daily_attempts")) == 42
    assert len(rows(admin, "admin_users")) == 3
    assert len(rows(mentor, "profiles")) == len(rows(other, "profiles")) == 3
    assert not {r["id"] for r in rows(mentor, "profiles")} & {r["id"] for r in rows(other, "profiles")}
    assignments = store.query(mentor, {"table": "mentor_assignments", "selection": "*, profiles(full_name,email)"})["data"]
    assert assignments[0]["profiles"]["full_name"] == "Aarav Sharma"
    flagged = store.query(admin, {"table": "chat_messages", "filters": [{"column": "flagged", "op": "eq", "value": True}], "selection": "chat_conversations(profiles(full_name))"})["data"]
    assert {r["chat_conversations"]["profiles"]["full_name"] for r in flagged} == {"Priya Singh", "Kabir Mehta"}


def test_cannot_forge_privilege_or_access_foreign_chats():
    store = GuestStore()
    mentor = store.create_staff("mentor")
    other = store.create_staff("mentor2")
    token, uid = mentor["token"], mentor["user"]["id"]
    foreign = store.query(other["token"], {"table": "chat_conversations"})["data"][0]
    for query in [
        {"table": "admin_users", "operation": "update", "values": {"admin_role": "super_admin"}},
        {"table": "mentor_assignments", "operation": "delete"},
        {"table": "profiles", "operation": "update", "values": {"full_name": "forged"}},
        {"table": "chat_messages", "operation": "insert", "values": {"conversation_id": foreign["id"], "sender_id": uid, "sender_role": "mentor", "content": "forged"}},
    ]:
        with pytest.raises(HTTPException) as error:
            store.query(token, query)
        assert error.value.status_code == 403
    guest = store.create()["token"]
    assert store.query(guest, {"table": "admin_users"})["data"] == []
    with pytest.raises(HTTPException):
        store.query(guest, {"table": "admin_users", "operation": "insert", "values": {"admin_role": "super_admin"}})


def test_mentor_reply_and_admin_assignment_are_disposable():
    store = GuestStore()
    mentor = store.create_staff("mentor")
    token, uid = mentor["token"], mentor["user"]["id"]
    conv = store.query(token, {"table": "chat_conversations"})["data"][0]
    store.query(token, {"table": "chat_messages", "operation": "insert", "values": {"conversation_id": conv["id"], "sender_id": uid, "sender_role": "mentor", "content": "Demo reply"}})
    assert any(r["content"] == "Demo reply" for r in store.query(token, {"table": "chat_messages"})["data"])
    admin = store.create_staff("admin")["token"]
    store.query(admin, {"table": "mentor_assignments", "operation": "delete"})
    assert store.query(admin, {"table": "mentor_assignments"})["data"] == []
    store.end(token)
    with pytest.raises(HTTPException): store.get(token)
    fresh = store.create_staff("mentor")["token"]
    assert not any(r["content"] == "Demo reply" for r in store.query(fresh, {"table": "chat_messages"})["data"])


def test_staff_expiry_uses_existing_session_leases():
    now = [1000]
    store = GuestStore(clock=lambda: now[0])
    token = store.create_staff("admin")["token"]
    store.lease(token, "staff-tab", release=True)
    now[0] += 13
    store.purge()
    assert not store.sessions
