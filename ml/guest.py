"""Temporary learner database. Guest records never touch Supabase or disk.

Opaque capabilities are hashed, leases expire on a background clock, and every
query sees exactly one session plus an immutable learning catalogue.
"""
from __future__ import annotations
import copy
import hashlib
import json
import secrets
import threading
import time
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException


def identifier(value):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "voidfill-demo:" + value))


SKILLS = [{"id": identifier(name), "name": name, "category": category} for name, category in [("Python Basics", "Programming"), ("SQL Fundamentals", "Data"), ("Data Visualization", "Data"), ("Web Fundamentals", "Web"), ("Git & Version Control", "Tools"), ("DSA Basics", "CS")]]
ROLES = [{"id": identifier(name), "name": name, "description": desc} for name, desc in [("Data Analyst", "SQL, visualization and Python"), ("Frontend Developer", "HTML, CSS, JavaScript and Git"), ("AI Applications Developer", "Python, data and applied AI")]]
ROLE_INDICES = [[0, 1, 2, 4], [3, 4, 5], [0, 1, 2, 4, 5]]
CATALOG = {"skills": SKILLS, "roles": ROLES, "role_skills": [{"role_id": role["id"], "skill_id": SKILLS[i]["id"], "weight": 1 if i in (1, 2, 3, 4) else .85} for role, indices in zip(ROLES, ROLE_INDICES) for i in indices], "skill_dependencies": [{"prerequisite_skill_id": SKILLS[a]["id"], "dependent_skill_id": SKILLS[b]["id"]} for a, b in [(0, 2), (1, 2), (4, 3)]]}
TABLES = {"profiles", "user_stats", "user_skill_scores", "daily_attempts", "practice_attempts", "attempt_skill_scores", "user_roadmap", "roadmap_courses", "course_assessments", "ai_insights", "chat_conversations", "chat_messages"}
EMPTY = {"admin_users", "mentor_assignments"}


class GuestStore:
    def __init__(self, clock=time.time):
        self.clock = clock
        self.sessions = {}
        self.lock = threading.RLock()
        self.stop = threading.Event()

    def start_cleanup(self):
        def cleanup():
            while not self.stop.wait(2):
                self.purge()
        threading.Thread(target=cleanup, daemon=True, name="guest-expiry").start()

    def purge(self):
        with self.lock:
            now = self.clock()
            for key, session in list(self.sessions.items()):
                session["leases"] = {k: v for k, v in session["leases"].items() if v > now}
                if session["expires"] <= now or not session["leases"]:
                    del self.sessions[key]

    def create(self, role_index=0):
        self.purge()
        with self.lock:
            if len(self.sessions) >= 100:
                raise HTTPException(429, "Demo capacity reached. Try again shortly.")
            token = secrets.token_urlsafe(32)
            uid = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            role = ROLES[role_index % len(ROLES)]
            self.sessions[self.digest(token)] = {"user": {"id": uid, "email": "guest@demo.invalid", "is_anonymous": True}, "expires": self.clock() + 7200, "leases": {"entry": self.clock() + 60}, "ledger": {}, "tables": {"profiles": [{"id": uid, "full_name": "Demo Learner", "onboarded": True, "target_role_id": role["id"], "user_type": "student", "current_skills_text": "", "created_at": now}], "user_stats": [{"user_id": uid, "xp": 0, "level": 1, "streak": 0}]}}
            return {"token": token, "user": self.sessions[self.digest(token)]["user"]}

    @staticmethod
    def digest(token):
        return hashlib.sha256(token.encode()).hexdigest()

    def create_staff(self, persona):
        from ml.staff_demo import seed
        if not isinstance(persona, str) or persona not in {"admin", "mentor", "mentor2"}:
            raise HTTPException(400, "Unknown demo staff account")
        with self.lock:
            result = self.create()
            session = self.get(result["token"])
            user, role, tables = seed(persona)
            user["app_metadata"] = {"demo_staff_role": role}
            session.update(user=user, staff_role=role, tables=tables)
            return {"token": result["token"], "user": user}

    def get(self, token):
        self.purge()
        session = self.sessions.get(self.digest(token))
        if not session:
            raise HTTPException(401, "Demo session ended. Reopen the private demo URL.")
        return session

    def end(self, token):
        with self.lock:
            self.sessions.pop(self.digest(token), None)

    def lease(self, token, tab, release=False, sequence=None):
        with self.lock:
            session = self.get(token)
            if not isinstance(tab, str) or not 1 <= len(tab) <= 80:
                raise HTTPException(400, "Invalid tab lease")
            versions = session.setdefault("lease_sequences", {})
            if tab not in versions and len(versions) >= 512:
                raise HTTPException(429, "Too many demo documents. Start a fresh demo.")
            sequence = versions.get(tab, 0) + 1 if sequence is None else sequence
            if not isinstance(sequence, int) or sequence < 1 or sequence > 1_000_000:
                raise HTTPException(400, "Invalid lease sequence")
            if sequence <= versions.get(tab, 0):
                return {"ok": True}
            versions[tab] = sequence
            session["leases"].pop("entry", None)
            session["leases"][tab] = self.clock() + (12 if release else 60)
            return {"ok": True, "expires_in": 12 if release else 60}

    def ledger(self, token, body):
        with self.lock:
            ledger = self.get(token)["ledger"]
            key = body.get("id", "")
            if not isinstance(key, str) or len(key) != 36:
                raise HTTPException(400, "Invalid assessment")
            action = body.get("action")
            if action == "claim":
                previous = ledger.get(key)
                if previous:
                    return previous
                ledger[key] = {"status": "pending"}
                return {"status": "claimed"}
            if action not in ("completed", "failed") or key not in ledger:
                raise HTTPException(400, "Invalid ledger operation")
            ledger[key] = {"status": action, "result": body.get("result")}
            return {"ok": True}

    def query(self, token, query):
        with self.lock:
            session = self.get(token)
            table = query.get("table")
            operation = query.get("operation", "select")
            staff = bool(session.get("staff_role"))
            if table not in TABLES | set(CATALOG) | EMPTY:
                raise HTTPException(403, "Table unavailable in demo")
            if table not in TABLES and not (staff and table in EMPTY) and operation != "select":
                raise HTTPException(403, "Demo catalogue is read only")
            from ml.staff_demo import visible_tables, validate_write
            tables = {**(visible_tables(session) if staff else session["tables"]), **CATALOG}
            writable = table in TABLES or staff and table in EMPTY
            rows = session["tables"].setdefault(table, []) if writable else tables.get(table, [])
            visible = {id(r) for r in tables.get(table, [])} if staff else None
            filters = query.get("filters", [])
            if len(filters) > 30:
                raise HTTPException(400, "Too many filters")
            def matches(row):
                if visible is not None and id(row) not in visible:
                    return False
                for f in filters:
                    name, op, val = f["column"], f["op"], f.get("value")
                    actual = row.get(name)
                    if op == "eq" and actual != val or op == "in" and actual not in val or op == "is" and actual is not val or op == "not.is" and actual is val:
                        return False
                    if op not in {"eq", "in", "is", "not.is"}:
                        raise HTTPException(400, "Unsupported filter")
                return True
            selected = [r for r in rows if matches(r)]
            if operation in ("insert", "upsert", "update"):
                values = query.get("values")
                values = values if isinstance(values, list) else [values]
                if len(values) > 100 or not all(isinstance(v, dict) for v in values):
                    raise HTTPException(400, "Invalid rows")
                uid = session["user"]["id"]
                changed = []
                for value in values:
                    value = copy.deepcopy(value)
                    if staff:
                        validate_write(session, table, operation, value, selected, tables)
                    elif table == "profiles":
                        value.pop("id", None)
                        if operation != "update":
                            value["id"] = uid
                        if value.get("target_role_id") and value["target_role_id"] not in {r["id"] for r in ROLES}:
                            raise HTTPException(400, "Unknown demo role")
                    elif table == "chat_messages":
                        conversation_id = value.get("conversation_id")
                        if operation == "update" and conversation_id is None:
                            conversation_id = selected[0].get("conversation_id") if selected else None
                        if not any(c["id"] == conversation_id for c in tables.get("chat_conversations", [])):
                            raise HTTPException(403, "Conversation unavailable")
                        # Original API creates assistant messages; never contact a human mentor.
                    elif table == "attempt_skill_scores":
                        if not any(a["id"] == value.get("attempt_id") for a in tables.get("daily_attempts", [])):
                            raise HTTPException(403, "Attempt unavailable")
                    else:
                        value["user_id"] = uid
                    if not staff and table == "chat_conversations" and not value.get("is_ai", operation == "update"):
                        raise HTTPException(403, "Live mentor assignment requires an account")
                    conflict = query.get("onConflict", "id").split(",")
                    existing = next((r for r in rows if all(c in value and r.get(c) == value[c] for c in conflict)), None) if operation == "upsert" else None
                    targets = selected if operation == "update" else [existing] if existing else []
                    if targets:
                        for row in targets:
                            row.update(value)
                            changed.append(row)
                    elif operation != "update":
                        row = {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat(), **value}
                        if table == "roadmap_courses":
                            row.setdefault("completed", False)
                        rows.append(row)
                        changed.append(row)
                selected = changed
            elif operation == "delete":
                if staff:
                    validate_write(session, table, operation, {}, selected, tables)
                rows[:] = [r for r in rows if not matches(r)]
            elif operation != "select":
                raise HTTPException(400, "Unsupported operation")
            for order in reversed(query.get("orders", [])):
                selected.sort(key=lambda r: (r.get(order["column"]) is not None, r.get(order["column"]) or ""), reverse=not order.get("ascending", True))
            count = len(selected)
            selected = selected[:min(query.get("limit", 1000), 1000)]
            selection = query.get("selection", "*")
            projected = [project(row, selection, tables) for row in selected]
            if query.get("single"):
                data = projected[0] if len(projected) == 1 else None
                error = {"message": "Expected one row"} if len(projected) > 1 or not projected and query["single"] == "required" else None
            else:
                data, error = projected, None
            # Bound memory even when a demo client repeatedly writes rows.
            if sum(len(r) for r in session["tables"].values()) > 5000 or len(json.dumps(session)) > 8_000_000:
                self.end(token)
                raise HTTPException(429, "Demo session storage limit reached")
            return {"data": None if query.get("head") else copy.deepcopy(data), "error": error, "count": count}


def fields(selection):
    parts, depth, start = [], 0, 0
    for i, char in enumerate(selection):
        depth += (char == "(") - (char == ")")
        if char == "," and depth == 0:
            parts.append(selection[start:i].strip())
            start = i + 1
    return parts + [selection[start:].strip()]


def project(row, selection, tables):
    result = {}
    for field in fields(selection):
        if field == "*":
            result.update(row)
        elif "(" in field:
            relation, sub = field.split("(", 1)
            relation = relation.split("!")[0]
            alias, _, target = relation.partition(":")
            name = alias
            relation = target or alias
            if alias == "attempt_skill_scores":
                result[name] = [project(r, sub[:-1], tables) for r in tables.get(alias, []) if r.get("attempt_id") == row.get("id")]
            else:
                source = "skills" if relation in ("skills", "prerequisite_skill_id", "dependent_skill_id") else "roles" if relation == "roles" else relation
                key = relation if relation.endswith("_id") else {"skills": "skill_id", "roles": "target_role_id", "profiles": "user_id", "admin_users": "mentor_id", "chat_conversations": "conversation_id"}.get(source, relation + "_id")
                match = next((r for r in tables.get(source, []) if r.get("id") == row.get(key)), None)
                result[name] = project(match, sub[:-1], tables) if match else None
        else:
            result[field] = row.get(field)
    return result


guests = GuestStore()
