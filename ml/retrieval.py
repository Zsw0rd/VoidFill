"""Passage windows let retrieval see material after a lesson's introduction."""
def passages(resource):
    title = resource["title"] + ". "
    words = resource.get("text", resource["description"]).split()
    return [title + " ".join(words[start:start + 140]) for start in range(0, max(1, len(words)), 110)]
