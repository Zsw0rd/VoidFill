"""Disposable practical-workflow parity. No live accounts, messages or Supabase tables."""
import copy
import json
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import HTTPException


@lru_cache(maxsize=1)
def catalogue():
    return json.loads((Path(__file__).parent / "data/careers/catalogue.json").read_text(encoding="utf-8"))


def brief(role_id, level):
    role = next((row for row in catalogue()["roles"] if row["id"] == role_id), None)
    if not role or level not in {"foundation", "intermediate"}:
        raise HTTPException(400, "Choose an available career activity.")
    activity = role["activity"]
    capstone = role.get("curriculum", {}).get(level, {}).get("milestones", [{}])[-1]
    return {"version": catalogue()["version"], "role_id": role["id"], "role_name": role["name"], "role_key": role["key"], "level": level, "title": activity["title"], "instructions": activity["instructions"], "deliverable": capstone.get("deliverable", activity["evidence_type"]), "rubric": capstone.get("checks", activity["rubric"])[:20], "note": activity["note"]}


def stamp():
    return datetime.now(timezone.utc).isoformat()


def assignment(session, learner):
    return next(iter(sorted([row for row in session["tables"].get("mentor_assignments", []) if row["user_id"] == learner], key=lambda row: (row["assigned_at"], row["id"]), reverse=True)), None)


def can_review(session, submission):
    current = assignment(session, submission["user_id"])
    uid = session["user"]["id"]
    return session.get("staff_role") in {"mentor", "admin", "super_admin"} and not submission.get("withdrawn_at") and submission.get("mentor_id") == uid and current is not None and current["id"] == submission.get("assignment_id") and current["mentor_id"] == uid


def initialize(session):
    if session.get("practical_initialized"):
        return
    tables = session["tables"]
    for table in ("practical_projects", "practical_submissions", "practical_reviews"):
        tables.setdefault(table, [])
    if session.get("staff_role"):
        # Each staff preview gets independent synthetic evidence for its seeded circle.
        for index, row in enumerate(tables.get("mentor_assignments", [])):
            profile = next(item for item in tables["profiles"] if item["id"] == row["user_id"])
            activity = brief(profile["target_role_id"], "foundation")
            mentor = next(item for item in tables["admin_users"] if item["id"] == row["mentor_id"])
            project = {"id": str(uuid.uuid4()), "user_id": row["user_id"], "role_id": profile["target_role_id"], "level": "foundation", "brief": activity, "content": "Synthetic practice evidence: I created a small example, documented my assumptions and checked the result against the activity checklist. I would next test a second case and explain any differences.", "links": [], "draft_version": 1, "created_at": stamp(), "updated_at": stamp()}
            tables["practical_projects"].append(project)
            tables["practical_submissions"].append({"id": str(uuid.uuid4()), "project_id": project["id"], "user_id": row["user_id"], "learner_name": profile["full_name"], "revision": 1, "draft_version": 1, "brief": copy.deepcopy(activity), "content": project["content"], "links": [], "mentor_id": row["mentor_id"], "mentor_name": mentor["display_name"], "assignment_id": row["id"], "request_id": str(uuid.uuid4()), "consented_at": stamp(), "submitted_at": stamp(), "withdrawn_at": None})
    session["practical_initialized"] = True


def execute(session, body):
    initialize(session)
    tables, uid = session["tables"], session["user"]["id"]
    projects, submissions, reviews = (tables[name] for name in ("practical_projects", "practical_submissions", "practical_reviews"))
    action = body.get("action")
    if action == "load":
        mentor_mode = body.get("mode") == "mentor"
        if mentor_mode and session.get("staff_role") not in {"mentor", "admin", "super_admin"}:
            raise HTTPException(403, "Mentoring access is required.")
        visible = [row for row in submissions if can_review(session, row)] if mentor_mode else [row for row in submissions if row["user_id"] == uid]
        ids = {row["id"] for row in visible}
        current = assignment(session, uid)
        mentor = next((row for row in tables.get("admin_users", []) if current and row["id"] == current["mentor_id"]), None)
        return copy.deepcopy({"projects": [] if mentor_mode else [row for row in projects if row["user_id"] == uid], "submissions": sorted(visible, key=lambda row: row["submitted_at"], reverse=True), "reviews": [row for row in reviews if row["submission_id"] in ids], "mentor": {"id": mentor["id"], "name": mentor.get("display_name") or "Assigned mentor"} if mentor and not mentor_mode else None, "demo": True, "available": True})
    if action == "save":
        content, links = body.get("content", ""), body.get("links", [])
        if not isinstance(content, str) or len(content) > 12000 or not isinstance(links, list) or len(links) > 3:
            raise HTTPException(400, "Check draft and link limits.")
        for link in links:
            url = urlsplit(link)
            if url.scheme != "https" or not url.hostname or "." not in url.hostname or url.username or url.password:
                raise HTTPException(400, "Use public HTTPS links.")
        activity = brief(body.get("role_id"), body.get("level"))
        if body.get("project_id"):
            project = next((row for row in projects if row["id"] == body["project_id"] and row["user_id"] == uid), None)
            if not project:
                raise HTTPException(403, "Draft unavailable.")
            if project["draft_version"] != body.get("expected_version") or project["role_id"] != body["role_id"] or project["level"] != body["level"]:
                raise HTTPException(409, "This draft changed. Refresh before saving.")
            project.update(content=content.strip(), links=copy.deepcopy(links), draft_version=project["draft_version"] + 1, updated_at=stamp())
        else:
            if body.get("expected_version") != 0 or any(row["user_id"] == uid and row["role_id"] == body["role_id"] and row["level"] == body["level"] for row in projects):
                raise HTTPException(409, "A draft already exists. Refresh before editing.")
            if len(projects) >= 120:
                raise HTTPException(429, "Demo practical draft limit reached.")
            project = {"id": str(uuid.uuid4()), "user_id": uid, "role_id": body["role_id"], "level": body["level"], "brief": activity, "content": content.strip(), "links": copy.deepcopy(links), "draft_version": 1, "created_at": stamp(), "updated_at": stamp()}
            projects.append(project)
        return copy.deepcopy({"ok": True, "project": project})
    if action == "submit":
        if body.get("consent") is not True:
            raise HTTPException(400, "Confirm sharing with your assigned mentor.")
        previous = next((row for row in submissions if row["user_id"] == uid and row["request_id"] == body.get("request_id")), None)
        if previous:
            if previous["project_id"] != body.get("project_id") or previous["draft_version"] != body.get("expected_version") or previous["mentor_id"] != body.get("mentor_id"):
                raise HTTPException(409, "This request was already used for a different sharing action.")
            return copy.deepcopy({"ok": True, "submission": previous, "replayed": True})
        project = next((row for row in projects if row["id"] == body.get("project_id") and row["user_id"] == uid), None)
        if not project:
            raise HTTPException(403, "Draft unavailable.")
        if body.get("expected_version") != project["draft_version"]:
            raise HTTPException(409, "Your draft changed. Review the saved version before sharing.")
        if body.get("consent") is not True or len(project["content"].strip()) < 40:
            raise HTTPException(400, "Add at least 40 characters of evidence and confirm sharing.")
        current = assignment(session, uid)
        if not current or current["mentor_id"] != body.get("mentor_id"):
            raise HTTPException(409, "Your assigned mentor changed. Refresh and confirm sharing again.")
        mentor = next((row for row in tables.get("admin_users", []) if row["id"] == current["mentor_id"] and row.get("admin_role") in {"mentor", "admin", "super_admin"}), None)
        if not mentor:
            raise HTTPException(403, "An eligible assigned mentor is required.")
        previous = next((row for row in submissions if row["project_id"] == project["id"] and row["draft_version"] == project["draft_version"] and row["assignment_id"] == current["id"]), None)
        if previous:
            if previous.get("withdrawn_at"):
                raise HTTPException(409, "Edit and save a new draft before sharing withdrawn work again.")
            return copy.deepcopy({"ok": True, "submission": previous, "replayed": True})
        if len(submissions) >= 200:
            raise HTTPException(429, "Demo submission limit reached.")
        profile = next((row for row in tables.get("profiles", []) if row["id"] == uid), {})
        row = {"id": str(uuid.uuid4()), "project_id": project["id"], "user_id": uid, "learner_name": profile.get("full_name") or "Learner", "revision": max([item["revision"] for item in submissions if item["project_id"] == project["id"]], default=0)+1, "draft_version": project["draft_version"], "brief": copy.deepcopy(project["brief"]), "content": project["content"], "links": copy.deepcopy(project["links"]), "mentor_id": mentor["id"], "mentor_name": mentor.get("display_name") or "Assigned mentor", "assignment_id": current["id"], "request_id": body["request_id"], "consented_at": stamp(), "submitted_at": stamp(), "withdrawn_at": None}
        submissions.append(row)
        return copy.deepcopy({"ok": True, "submission": row})
    if action == "withdraw":
        submission = next((row for row in submissions if row["id"] == body.get("submission_id") and row["user_id"] == uid), None)
        if not submission:
            raise HTTPException(403, "Submission unavailable.")
        submission["withdrawn_at"] = submission.get("withdrawn_at") or stamp()
        return copy.deepcopy({"ok": True, "submission": submission})
    if action == "review":
        submission = next((row for row in submissions if row["id"] == body.get("submission_id")), None)
        if not submission or not can_review(session, submission):
            raise HTTPException(403, "This work is no longer shared with your current assignment.")
        if any(row["submission_id"] == submission["id"] for row in reviews):
            raise HTTPException(409, "This version already has feedback.")
        criteria = body.get("criteria", [])
        expected = set(range(len(submission["brief"]["rubric"])))
        if len(criteria) != len(expected) or {row.get("criterion") for row in criteria} != expected or any(row.get("judgement") not in {"demonstrated", "developing", "not_yet"} or len(row.get("comment", "")) > 1200 for row in criteria) or body.get("verdict") not in {"ready", "revise"} or not 10 <= len(body.get("feedback", "").strip()) <= 6000 or body.get("verdict") == "ready" and any(row["judgement"] != "demonstrated" for row in criteria):
            raise HTTPException(400, "Review every criterion and provide feedback; ready work must demonstrate every criterion.")
        mentor = next(row for row in tables["admin_users"] if row["id"] == uid)
        review = {"id": str(uuid.uuid4()), "submission_id": submission["id"], "user_id": submission["user_id"], "mentor_id": uid, "mentor_name": mentor["display_name"], "verdict": body["verdict"], "feedback": body["feedback"].strip(), "criteria": copy.deepcopy(criteria), "created_at": stamp()}
        reviews.append(review)
        return copy.deepcopy({"ok": True, "review": review})
    raise HTTPException(400, "Unknown practical action.")
