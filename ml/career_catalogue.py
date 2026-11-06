"""Shared public metadata used by normal accounts, demos and the learning engine."""
import hashlib
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIRECTORY = ROOT / "data/careers"
CATALOGUE = json.loads((DIRECTORY / "catalogue.json").read_text(encoding="utf8"))
TOPICS = CATALOGUE["topics"]


def normalized(value):
    return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", value).lower()).strip()


SKILL_LOOKUP = {normalized(skill["name"]): skill for skill in CATALOGUE["skills"]}
TOPIC_ALIASES = {
    "python": ["python", "pandas"], "sql": ["sql", "relational database"],
    "visualization": ["data visualization", "data visualisation", "matplotlib", "seaborn"],
    "web": ["web fundamentals", "html", "css", "javascript", "frontend", "react"],
    "git": ["git", "version control"], "algorithms": ["dsa", "algorithms", "data structures"],
    "machine-learning": ["machine learning", "neural networks", "deep learning"],
    "data-science": ["data science", "statistics", "probability"],
    "api": ["backend apis", "rest api", "http api"], "testing": ["software testing", "test automation"],
    "linux": ["linux"], "networking": ["network fundamentals", "computer networking"],
    "cloud": ["cloud fundamentals", "cloud computing"], "security": ["security foundations", "cybersecurity fundamentals"],
    "marketing": ["digital marketing"], "recruiting": ["recruitment foundations", "recruiting"],
    "sales": ["sales foundations"], "success": ["customer success", "customer service"],
    "projects": ["project coordination", "project management"], "accounting": ["accounting foundations", "bookkeeping"],
    "spreadsheets": ["spreadsheet analysis", "spreadsheets", "excel"],
    "communication": ["workplace communication"], "analysis": ["business analysis"],
}


def topic_for_skill(name):
    value = normalized(name)
    if value in SKILL_LOOKUP:
        return SKILL_LOOKUP[value]["topic"]
    # Exact aliases only. Embedding proximity cannot establish quiz coverage.
    for topic, aliases in TOPIC_ALIASES.items():
        if value in [normalized(alias) for alias in aliases]:
            return topic
    return None


def load_learning_content():
    def rows(name):
        return json.loads((ROOT / f"data/{name}.json").read_text(encoding="utf8")) + json.loads((DIRECTORY / f"{name}.json").read_text(encoding="utf8"))
    return rows("resources"), rows("questions")


def canonical_json_fingerprint(payload):
    # Windows checkouts may use CRLF; embeddings depend on parsed content, not
    # source-file formatting. Array order and all string values remain significant.
    canonical = json.dumps(json.loads(payload), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf8")
    return hashlib.sha256(canonical).hexdigest()


def content_fingerprints():
    paths = [ROOT / "data/resources.json", ROOT / "data/questions.json", DIRECTORY / "resources.json", DIRECTORY / "questions.json", DIRECTORY / "catalogue.json", ROOT / "cloud-release.json"]
    return {str(path.relative_to(ROOT)).replace("\\", "/"): canonical_json_fingerprint(path.read_bytes()) for path in paths}


def role_texts():
    skills = {skill["key"]: skill for skill in CATALOGUE["skills"]}
    return [role["name"] + ". " + role["description"] + ". " + ", ".join(skills[item["skill"]]["name"] for item in role["requirements"]) for role in CATALOGUE["roles"]]


def guest_catalogue():
    # Legacy first entries are an established test/demo contract.
    legacy_skills = ["Python Basics", "SQL Fundamentals", "Data Visualization", "Web Fundamentals", "Git & Version Control", "DSA Basics"]
    legacy_roles = ["Data Analyst", "Frontend Developer", "AI Applications Developer"]
    skills = sorted(CATALOGUE["skills"], key=lambda s: (legacy_skills.index(s["name"]) if s["name"] in legacy_skills else 100, s["name"]))
    roles = sorted(CATALOGUE["roles"], key=lambda r: (legacy_roles.index(r["name"]) if r["name"] in legacy_roles else 100, r["name"]))
    by_key = {skill["key"]: skill for skill in skills}
    requirements = [{"role_id": role["id"], "skill_id": by_key[item["skill"]]["id"], "weight": item["importance"], "required_score": item["target"], "essential": item["essential"], "catalogue_version": CATALOGUE["version"]} for role in roles for item in role["requirements"]]
    dependencies = [{"prerequisite_skill_id": by_key[a]["id"], "dependent_skill_id": by_key[b]["id"]} for a, b in CATALOGUE["dependencies"]]
    return {"skills": skills, "roles": [*roles, CATALOGUE["personal_goal_role"]], "role_skills": requirements, "skill_dependencies": dependencies}
