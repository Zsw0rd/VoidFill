"""Resource checks require explicit lesson links, not embedding proximity.

Authored question source URLs can be concept references. They do not establish
that the linked resource teaches or assesses every question citing that page.
"""

RESOURCE_ASSESSMENT_UNAVAILABLE = "resource_assessment_unavailable"

# Imported topic tags can describe a lesson's tools rather than the knowledge
# its quiz assesses. This reviewed regression lesson's six questions concern
# statistical variables, regression, overfitting, feature selection and dataset
# splitting, not Python-language fundamentals. Keep the original rows/vectors
# and their explicit lesson check; omit them only from broad Python skill checks.
SKILL_RESOURCE_EXCLUSIONS = {
    "python": frozenset({"d4efc35e0bb394adf9e02a90"}),
}


def question_in_skill_scope(question, topic):
    return question.get("resource_id") not in SKILL_RESOURCE_EXCLUSIONS.get(topic, ())


def question_resource_ids(question):
    """Explicit author bindings; a reference URL never grants membership."""
    if "resource_ids" in question:
        values = question["resource_ids"]
        if not isinstance(values, list) or not values or any(not isinstance(value, str) or not value for value in values):
            return frozenset()
        return frozenset(values)
    value = question.get("resource_id")
    return frozenset([value]) if isinstance(value, str) and value else frozenset()


def resource_question_indices(resources, questions, topic, resource_url):
    """Return same-topic questions explicitly linked to this public resource.

    Stored resource URLs identify catalogue rows without fetching any URL.
    Equal titles, similar descriptions and reference-only source_url fields
    cannot widen the bank. Duplicate catalogue rows with the same URL are safe
    only when they also belong to the requested skill topic.
    """
    from ml.resource_scopes import guide_for_resource
    if guide_for_resource(resource_url, topic):
        return set()
    resource_ids = {
        resource["id"] for resource in resources
        if resource["url"] == resource_url.strip() and topic in resource["topics"]
    }
    linked = {
        index for index, question in enumerate(questions)
        if question_resource_ids(question) & resource_ids and topic in question["topics"]
    }
    reviewed = {index for index in linked if questions[index].get("id", "").startswith("lesson-")}
    return reviewed or linked
