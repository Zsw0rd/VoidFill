"""Encrypted, capability-scoped demo state shared by Vercel function instances."""
import base64
import hashlib
import json
import os
import time
import uuid
from functools import lru_cache

import httpx
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from fastapi import HTTPException
from ml.guest import GuestStore, ROLES


@lru_cache(maxsize=1)
def client():
    return httpx.Client(timeout=10, limits=httpx.Limits(max_connections=20, max_keepalive_connections=5))


def rpc(name, body):
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise HTTPException(503, "Cloud demo storage is not configured")
    try:
        response = client().post(url + "/rest/v1/rpc/" + name, json=body, headers={"apikey": key, "Authorization": "Bearer " + key})
    except httpx.RequestError as error:
        raise HTTPException(503, "Cloud demo storage is unavailable") from error
    if response.status_code >= 400:
        raise HTTPException(503, "Cloud demo storage is unavailable")
    return response.json()


def cipher():
    secret = os.environ.get("ML_ASSESSMENT_SECRET") or os.environ.get("ML_SERVICE_TOKEN", "")
    if len(secret) < 32:
        raise HTTPException(503, "Cloud session encryption is not configured")
    return AESGCM(hashlib.sha256(("voidfill-demo-v1:" + secret).encode()).digest())


def seal(session, identifier):
    nonce = os.urandom(12)
    encrypted = cipher().encrypt(nonce, json.dumps(session).encode(), identifier.encode())
    return base64.b64encode(nonce + encrypted).decode()


def unseal(snapshot, identifier):
    data = base64.b64decode(snapshot)
    return json.loads(cipher().decrypt(data[:12], data[12:], identifier.encode()))


def expiry(session):
    return min(session["expires"], max(session["leases"].values(), default=0))


def execute(operation, token, body):
    store = GuestStore()
    if operation == "start":
        if "staff" in body:
            result = store.create_staff(body["staff"])
        else:
            role = body.get("role", 0)
            if not isinstance(role, int) or role not in range(len(ROLES) - 1):
                raise HTTPException(400, "Unknown role")
            result = store.create(role)
        identifier = store.digest(result["token"])
        session = store.sessions[identifier]
        if not rpc("vf_demo_create", {"p_id": identifier, "p_snapshot": seal(session, identifier), "p_expires": expiry(session)}):
            raise HTTPException(429, "Demo capacity reached. Try again shortly.")
        return result
    identifier = store.digest(token)
    lock = str(uuid.uuid4())
    for _ in range(30):
        checked = rpc("vf_demo_checkout", {"p_id": identifier, "p_lock": lock})
        if checked["status"] != "busy":
            break
        time.sleep(.05)
    if checked["status"] == "busy":
        raise HTTPException(409, "Demo session is busy. Retry shortly.")
    if checked["status"] == "missing":
        if operation == "end":
            return {"ok": True}
        raise HTTPException(401, "Demo session ended. Reopen the private demo URL.")
    try:
        session = unseal(checked["snapshot"], identifier)
    except (InvalidTag, ValueError, KeyError) as error:
        rpc("vf_demo_save", {"p_id": identifier, "p_lock": lock, "p_snapshot": None, "p_expires": 0})
        raise HTTPException(401, "Demo session ended. Reopen the private demo URL.") from error
    store.sessions[identifier] = session
    try:
        if operation == "end":
            store.end(token); result = {"ok": True}
        elif operation == "user":
            result = {"data": {"user": store.get(token)["user"]}, "error": None}
        elif operation == "lease":
            result = store.lease(token, body.get("tab"), body.get("release", False), body.get("sequence"))
        elif operation == "query":
            result = store.query(token, body)
        elif operation == "ledger":
            result = store.ledger(token, body)
        else:
            raise HTTPException(404, "Unknown demo operation")
        updated = store.sessions.get(identifier)
        saved = rpc("vf_demo_save", {"p_id": identifier, "p_lock": lock, "p_snapshot": seal(updated, identifier) if updated else None, "p_expires": expiry(updated) if updated else 0})
        if not saved:
            raise HTTPException(409, "Demo session changed. Retry shortly.")
        return result
    except Exception:
        rpc("vf_demo_save", {"p_id": identifier, "p_lock": lock, "p_snapshot": checked["snapshot"], "p_expires": checked["expires"]})
        raise
