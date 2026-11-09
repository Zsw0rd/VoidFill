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


def resource_question_indices(resources, questions, topic, resource_url):
    """Return same-topic questions explicitly linked to this public resource.

    Stored resource URLs identify catalogue rows without fetching any URL.
    Equal titles, similar descriptions and reference-only source_url fields
    cannot widen the bank. Duplicate catalogue rows with the same URL are safe
    only when they also belong to the requested skill topic.
    """
    resource_ids = {
        resource["id"] for resource in resources
        if resource["url"] == resource_url.strip() and topic in resource["topics"]
    }
    return {
        index for index, question in enumerate(questions)
        if question.get("resource_id") in resource_ids and topic in question["topics"]
    }
