"""Fail closed on malformed public lesson rows before bank/vector selection."""
import re
import hashlib
from datetime import date
from urllib.parse import urlsplit


def validate_source_warnings(rows, resources):
    by_id = {row["id"]: row for row in resources}
    seen = set()
    try:
        if not isinstance(rows, list):
            raise ValueError()
        for row in rows:
            if set(row) != {"resource_ids", "url", "reviewed_at", "section", "detail", "support_urls"}:
                raise ValueError()
            bindings = row["resource_ids"]
            if not isinstance(bindings, list) or not bindings or len(set(bindings)) != len(bindings):
                raise ValueError()
            if any(by_id[key]["url"] != row["url"] for key in bindings):
                raise ValueError()
            for key, length in (("section", 180), ("detail", 1500)):
                if not isinstance(row[key], str) or not 0 < len(row[key].strip()) <= length:
                    raise ValueError()
            date.fromisoformat(row["reviewed_at"])
            key = (row["url"], row["section"], row["detail"])
            if key in seen or not isinstance(row["support_urls"], list):
                raise ValueError()
            seen.add(key)
            for link in row["support_urls"]:
                parsed = urlsplit(link)
                if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
                    raise ValueError()
        return rows
    except (KeyError, TypeError, ValueError, AttributeError):
        raise RuntimeError("Source corrections must reference known public lessons and safe public citations.") from None


def validate_resource_scopes(rows, resources, lessons=()):
    by_id = {row["id"]: row for row in resources}
    seen = set()
    try:
        if not isinstance(rows, list):
            raise ValueError()
        for row in rows:
            if set(row) != {"resource_ids", "url", "topics", "reviewed_at", "reason", "child_resource_ids", "kind", "assessment", "related_lessons"}:
                raise ValueError()
            linked = [by_id[key] for key in row["resource_ids"]]
            if not linked or len(set(row["resource_ids"])) != len(linked) or {resource["url"] for resource in linked} != {row["url"]}:
                raise ValueError()
            topics = row["topics"]
            if not isinstance(topics, list) or not topics or len(set(topics)) != len(topics) or not set(topics) <= {topic for resource in linked for topic in resource["topics"]}:
                raise ValueError()
            if any(not set(topics) & set(resource["topics"]) for resource in linked):
                raise ValueError()
            for topic in topics:
                if (row["url"], topic) in seen:
                    raise ValueError()
                seen.add((row["url"], topic))
            if not isinstance(row["reason"], str) or not 0 < len(row["reason"].strip()) <= 1800:
                raise ValueError()
            date.fromisoformat(row["reviewed_at"])
            if row["assessment"] != "ungraded" or row["kind"] not in {"orientation", "career-context", "reference-directory", "setup-guide", "practice-guide", "course-overview", "scope-mismatch"}:
                raise ValueError()
            children = row["child_resource_ids"]
            if not isinstance(children, list) or len(set(children)) != len(children) or set(children) & set(row["resource_ids"]):
                raise ValueError()
            if any(key not in by_id for key in children):
                raise ValueError()
            guide_urls = {item["url"] for item in rows}
            expected = [{key: by_id[rid][key] for key in ("id", "title", "url")} for rid in children if by_id[rid]["url"] not in guide_urls]
            if row["related_lessons"] != expected:
                raise ValueError()
        if any((question["source_url"].split("#", 1)[0], topic) in seen for question in lessons for topic in question["topics"]):
            raise ValueError()
        return rows
    except (KeyError, TypeError, ValueError, AttributeError):
        raise RuntimeError("Resource scopes must classify known resources explicitly, without answer keys, conflicting lesson banks or invented teaching links.") from None


def validate_lesson_resources(rows, existing_resources, allowed_topics):
    try:
        if not isinstance(rows, list):
            raise ValueError()
        seen = {row["id"] for row in existing_resources}
        existing_urls = {(row["url"], topic) for row in existing_resources for topic in row["topics"]}
        for row in rows:
            url = urlsplit(row["url"])
            topics = row["topics"]
            if url.scheme != "https" or url.username or url.password or url.fragment:
                raise ValueError()
            if not isinstance(topics, list) or len(topics) != 1 or topics[0] not in allowed_topics:
                raise ValueError()
            expected = "lesson-resource-" + hashlib.sha256((row["url"] + "|" + topics[0]).encode()).hexdigest()[:20]
            if row["id"] != expected or row["id"] in seen or (row["url"], topics[0]) in existing_urls:
                raise ValueError()
            seen.add(row["id"]); existing_urls.add((row["url"], topics[0]))
            for field in ("title", "provider", "description", "text", "source", "license"):
                if not isinstance(row[field], str) or not row[field].strip():
                    raise ValueError()
            if row["type"] != "tutorial" or row["difficulty"] not in ("beginner", "intermediate"):
                raise ValueError()
        return rows
    except (ValueError, TypeError, KeyError, AttributeError):
        raise RuntimeError("Additional lesson resources must be unique, public HTTPS teaching metadata with known topics.") from None


def validate_lesson_questions(rows, resources, existing_ids=()):
    by_id = {row["id"]: row for row in resources}
    seen = set(existing_ids)
    try:
        if not isinstance(rows, list):
            raise ValueError()
        for row in rows:
            if not re.fullmatch(r"lesson-[0-9a-f]{20}", row["id"]) or row["id"] in seen:
                raise ValueError()
            seen.add(row["id"])
            bindings = row["resource_ids"]
            topics = row["topics"]
            if not isinstance(bindings, list) or not bindings or len(set(bindings)) != len(bindings) or row["resource_id"] != bindings[0]:
                raise ValueError()
            if not isinstance(topics, list) or not topics or len(set(topics)) != len(topics):
                raise ValueError()
            linked = [by_id[key] for key in bindings]
            urls = {resource["url"] for resource in linked}
            if len(urls) != 1 or not set(topics) <= {topic for resource in linked for topic in resource["topics"]}:
                raise ValueError()
            if any(not set(topics) & set(resource["topics"]) for resource in linked):
                raise ValueError()
            url = urlsplit(row["source_url"])
            if url.scheme != "https" or url.username or url.password or row["source_url"].split("#", 1)[0] != linked[0]["url"]:
                raise ValueError()
            if type(row["difficulty"]) is not int or row["difficulty"] not in (1, 2, 3):
                raise ValueError()
            options = row["options"]
            if not isinstance(options, list) or len(options) != 4 or len(set(options)) != 4 or not all(isinstance(option, str) and 0 < len(option.strip()) <= 300 for option in options):
                raise ValueError()
            if type(row["correct_index"]) is not int or not 0 <= row["correct_index"] < len(options):
                raise ValueError()
            for name, limit in [("prompt", 1500), ("explanation", 1000), ("objective_id", 160), ("source", 300), ("lesson_scope", 800)]:
                if not isinstance(row[name], str) or not 0 < len(row[name].strip()) <= limit:
                    raise ValueError()
            date.fromisoformat(row["source_reviewed_at"])
            if row["evidence_type"] != "knowledge":
                raise ValueError()
        return rows
    except (KeyError, TypeError, ValueError, AttributeError):
        raise RuntimeError("Lesson question manifest is malformed, unbound or duplicates a stored question.") from None
