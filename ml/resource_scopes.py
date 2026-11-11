"""Reviewed public guide classifications shared by recommendations and checks."""
import json
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def resource_scopes():
    return json.loads((Path(__file__).resolve().parent / "data/lessons/resource-scopes.json").read_text(encoding="utf8"))


def guide_for_resource(url, topic=None, scopes=None):
    for row in resource_scopes() if scopes is None else scopes:
        if row["url"] == url.strip() and (topic is None or topic in row["topics"]):
            return row
    return None


def guide_only_question_ids(resources, questions, scopes=None):
    """Legacy sealed questions remain stored; new sessions use teaching sources."""
    from ml.assessment_selection import question_resource_ids
    guide_urls = {row["url"] for row in (resource_scopes() if scopes is None else scopes)}
    known_ids = {row["id"] for row in resources}
    guide_ids = {row["id"] for row in resources if row["url"] in guide_urls}
    return frozenset(question["id"] for question in questions
                     if (bindings := question_resource_ids(question) & known_ids) and bindings <= guide_ids)
