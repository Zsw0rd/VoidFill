"""Synthetic staff workspaces: each login gets a disposable copy, never Supabase."""
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException


def seed(persona):
    from ml.guest import identifier, SKILLS, ROLES
    now = datetime.now(timezone.utc)
    stamp = lambda days=0: (now - timedelta(days=days)).isoformat()
    admin = identifier("staff-admin")
    mentors = [identifier("staff-mentor"), identifier("staff-mentor-2")]
    staff = [{"id": uid, "admin_role": role, "display_name": name, "created_at": stamp(30)} for uid, role, name in [(admin, "super_admin", "Demo Administrator"), (mentors[0], "mentor", "Dr. Meera Shah"), (mentors[1], "mentor", "Arjun Patel")]]
    tables = {name: [] for name in ["profiles", "user_stats", "user_skill_scores", "daily_attempts", "attempt_skill_scores", "mentor_assignments", "chat_conversations", "chat_messages"]}
    tables["admin_users"] = staff
    names = ["Aarav Sharma", "Priya Singh", "Rohan Das", "Ananya Rao", "Kabir Mehta", "Ishita Sen"]
    for i, name in enumerate(names):
        uid, mentor = identifier("sample-learner-" + str(i)), mentors[i // 3]
        tables["profiles"].append({"id": uid, "full_name": name, "email": name.lower().replace(" ", ".") + "@demo.invalid", "course": ["BCA", "BSc Computer Science", "BTech IT"][i % 3], "education_level": "undergraduate", "role": "student", "user_type": "student", "onboarded": True, "target_role_id": ROLES[i % 3]["id"], "created_at": stamp(25 - i * 3)})
        tables["user_stats"].append({"user_id": uid, "xp": 350 + i * 240, "level": 2 + i, "streak": 2 + i})
        for j, skill in enumerate(SKILLS):
            tables["user_skill_scores"].append({"user_id": uid, "skill_id": skill["id"], "score": 32 + (i * 11 + j * 9) % 60, "updated_at": stamp()})
        for day in range(7):
            attempt = identifier(f"sample-attempt-{i}-{day}")
            score = min(95, 45 + i * 5 + (6 - day) * 3)
            tables["daily_attempts"].append({"id": attempt, "user_id": uid, "score": score, "total_questions": 10, "correct_answers": round(score / 10), "created_at": stamp(day), "attempt_date": stamp(day)[:10]})
            for skill in SKILLS[:3]:
                tables["attempt_skill_scores"].append({"attempt_id": attempt, "skill_id": skill["id"], "score": score})
        tables["mentor_assignments"].append({"id": identifier("assignment-" + str(i)), "mentor_id": mentor, "user_id": uid, "assigned_at": stamp(15)})
        conversation = identifier("sample-conversation-" + str(i))
        tables["chat_conversations"].append({"id": conversation, "user_id": uid, "mentor_id": mentor, "is_ai": False, "title": "Weekly learning check-in", "created_at": stamp(2), "clear_requested_by": None})
        for j, (sender, text) in enumerate([("user", "Could you help me plan SQL joins and Python practice this week?"), ("mentor", "Start with inner joins, then complete two Python exercises. We will review your progress on Friday."), ("user", "Thank you! I completed the first exercise and will revise joins next.")]):
            tables["chat_messages"].append({"id": identifier(f"sample-message-{i}-{j}"), "conversation_id": conversation, "sender_id": mentor if sender == "mentor" else uid, "sender_role": sender, "content": text, "created_at": (now - timedelta(days=1, minutes=10-j)).isoformat(), "flagged": False})
        if i in (1, 4):
            tables["chat_messages"].append({"id": identifier("flagged-sample-" + str(i)), "conversation_id": conversation, "sender_id": uid, "sender_role": "user", "content": "[Synthetic moderation example] Please send me the answer key for tomorrow's graded exam.", "flagged": True, "flag_reason": "Seeded demo example: request for an assessment answer key; not a live moderation result.", "created_at": stamp()})
    who = staff[0 if persona == "admin" else 1 if persona == "mentor" else 2]
    return {"id": who["id"], "email": {"admin": "admin@demo.voidfill.local", "mentor": "mentor@demo.voidfill.local", "mentor2": "mentor2@demo.voidfill.local"}[persona], "is_anonymous": True}, who["admin_role"], tables


def visible_tables(session):
    tables = session["tables"]
    if session["staff_role"] == "super_admin":
        return tables
    uid = session["user"]["id"]
    assignments = [r for r in tables["mentor_assignments"] if r["mentor_id"] == uid]
    students = {r["user_id"] for r in assignments}
    conversations = [r for r in tables["chat_conversations"] if r.get("mentor_id") == uid and r["user_id"] in students]
    conversation_ids = {r["id"] for r in conversations}
    attempts = [r for r in tables["daily_attempts"] if r["user_id"] in students]
    attempt_ids = {r["id"] for r in attempts}
    return {name: [r for r in rows if (r.get("id") == uid if name == "admin_users" else r.get("mentor_id") == uid if name == "mentor_assignments" else r.get("id") in students if name == "profiles" else r.get("id") in conversation_ids if name == "chat_conversations" else r.get("conversation_id") in conversation_ids if name == "chat_messages" else r.get("attempt_id") in attempt_ids if name == "attempt_skill_scores" else r.get("user_id") in students)] for name, rows in tables.items()}


def validate_write(session, table, operation, value, selected, tables):
    """Enforce the actor independently of client filters and mutable staff rows."""
    uid = session["user"]["id"]
    super_admin = session["staff_role"] == "super_admin"
    if table == "admin_users":
        if operation == "update" and all(r["id"] == uid for r in selected) and set(value) <= {"display_name"}:
            return
        if super_admin and operation == "insert" and value.get("id") in {r["id"] for r in tables["profiles"]} and value.get("admin_role") in {"mentor", "admin"}:
            return
    elif table == "mentor_assignments" and super_admin:
        if operation == "delete":
            return
        if operation == "insert" and value.get("mentor_id") in {r["id"] for r in tables["admin_users"] if r["admin_role"] in {"mentor", "admin", "super_admin"}} and value.get("user_id") in {r["id"] for r in tables["profiles"]}:
            return
    elif table in {"chat_messages", "chat_conversations"}:
        if table == "chat_conversations" and operation == "insert" and set(value) <= {"user_id", "mentor_id", "is_ai", "title"}:
            if value.get("mentor_id") == uid and value.get("is_ai") is False and any(row["mentor_id"] == uid and row["user_id"] == value.get("user_id") for row in tables.get("mentor_assignments", [])):
                return
        conversations = {r["id"] for r in tables.get("chat_conversations", []) if r.get("mentor_id") == uid and not r.get("is_ai")}
        if table == "chat_messages":
            if operation == "insert" and value.get("conversation_id") in conversations and value.get("sender_id") == uid and value.get("sender_role") == "mentor" and set(value) <= {"conversation_id", "sender_id", "sender_role", "content"}:
                return
            if operation == "delete" and all(r["conversation_id"] in conversations for r in selected):
                return
        elif operation == "update" and all(r["id"] in conversations for r in selected) and set(value) <= {"clear_requested_by"} and value.get("clear_requested_by") in (None, uid):
            return
    raise HTTPException(403, "This operation is unavailable for this demo role")
