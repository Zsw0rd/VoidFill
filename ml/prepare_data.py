"""Build a reproducible dataset from Microsoft's MIT-licensed curricula.

Supervision is the curriculum author's quiz-to-lesson link, not model-generated
relevance labels. Never execute downloaded curriculum code.
"""
from __future__ import annotations

import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
RAW = DATA / "raw"
REPOS = ["Web-Dev-For-Beginners", "ML-For-Beginners", "Data-Science-For-Beginners", "AI-For-Beginners"]


def download(url: str, cache: Path | None = None) -> str:
    if cache and cache.exists():
        return cache.read_text(encoding="utf-8")
    response = requests.get(url, timeout=60, headers={"User-Agent": "VoidFill-dataset-builder/1.0"})
    response.raise_for_status()
    if cache:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(response.text, encoding="utf-8")
    return response.text


def clean(text: str) -> str:
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"(?im)^.*(?:pre[- ](?:lecture )?quiz|post[- ](?:lecture )?quiz|sketchnote|written by|illustration by).*$", " ", text)
    return re.sub(r"\s+", " ", text.replace("#", " ").replace("*", " ")).strip()


def topics_for(repo: str, path: str, title: str) -> list[str]:
    text = (path + " " + title).lower()
    if "github" in text or re.search(r"\bgit\b", text):
        return ["git"]
    if repo == "Web-Dev-For-Beginners":
        return ["web"]
    if any(term in text for term in ["relational", "sql", "database"]):
        return ["sql"]
    if any(term in text for term in ["visualization", "visualisation", "visualizing"]):
        return ["visualization"]
    if any(term in text for term in ["python", "pandas"]):
        return ["python"]
    if repo == "Data-Science-For-Beginners":
        return ["data-science"]
    return ["machine-learning"]


def load_quizzes(blob: object) -> list[dict]:
    if isinstance(blob, list):
        return [q for item in blob for q in load_quizzes(item)]
    if isinstance(blob, dict):
        return blob.get("quizzes", [])
    return []


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    lock_path = DATA / "sources.lock.json"
    lock = json.loads(lock_path.read_text(encoding="utf-8")) if lock_path.exists() else {}
    resources, questions, pairs, sources = [], [], [], []
    rejected = {"invalid_question": 0, "unlinked_quiz": 0, "duplicate_question": 0}
    seen_questions: set[str] = set()
    for repo in REPOS:
        if repo not in lock:
            info = json.loads(download(f"https://api.github.com/repos/microsoft/{repo}/commits/main"))
            lock[repo] = info["sha"]
            lock_path.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
        revision = lock[repo]
        base = f"https://raw.githubusercontent.com/microsoft/{repo}/{revision}/"
        license_text = download(base + "LICENSE", RAW / repo / "LICENSE")
        if "MIT License" not in license_text:
            raise RuntimeError(f"Unexpected license for {repo}; inspect it before importing")
        notices = ROOT / "licenses"
        notices.mkdir(exist_ok=True)
        (notices / f"{repo}.txt").write_text(license_text, encoding="utf-8")
        tree = json.loads(download(f"https://api.github.com/repos/microsoft/{repo}/git/trees/{revision}?recursive=1", RAW / repo / "tree.json"))
        if tree.get("truncated"):
            raise RuntimeError(f"Incomplete source tree for {repo}")
        paths = [item["path"] for item in tree["tree"] if item["type"] == "blob"]
        lesson_paths = [p for p in paths if p.endswith("/README.md") and (re.match(r"^\d", p) or p.startswith("lessons/")) and not any(x in p.lower() for x in ["translations/", "assignment", "solution", "node_modules", "/images/", "/translations/"])]
        quiz_paths = [p for p in paths if "quiz-app/src/assets/translations/" in p and (p.endswith("/en.json") or "/en/" in p and p.endswith(".json")) and not p.startswith("translations/")]

        def fetch(path: str) -> tuple[str, str]:
            return path, download(base + path, RAW / repo / path)

        with ThreadPoolExecutor(max_workers=6) as pool:
            files = dict(pool.map(fetch, sorted(set(lesson_paths + quiz_paths))))
        quiz_to_resource = {}
        for path in sorted(lesson_paths):
            markdown = files[path]
            heading = re.search(r"(?m)^#\s+(.+)", markdown)
            title = clean(heading.group(1)) if heading else path.rsplit("/", 1)[0].split("/")[-1].replace("-", " ")
            text = clean(markdown)
            if len(text) < 120:
                continue
            resource_id = hashlib.sha256(f"{repo}/{path}".encode()).hexdigest()[:24]
            resource = {"id": resource_id, "title": title, "type": "tutorial", "provider": "Microsoft Learn curricula", "url": f"https://github.com/microsoft/{repo}/blob/{revision}/{path}", "description": text[:1200], "text": text[:9000], "topics": topics_for(repo, path, title), "difficulty": "beginner", "estimated_hours": None, "source": repo, "source_path": path, "license": "MIT"}
            resources.append(resource)
            for quiz_id in re.findall(r"/quiz/(\d+)", markdown):
                quiz_to_resource[int(quiz_id)] = resource
        for path in quiz_paths:
            for quiz in load_quizzes(json.loads(files[path])):
                resource = quiz_to_resource.get(int(quiz["id"]))
                if not resource:
                    rejected["unlinked_quiz"] += 1
                    continue
                for index, q in enumerate(quiz.get("quiz", [])):
                    options = [str(a.get("answerText", "")).strip() for a in q.get("answerOptions", [])]
                    correct = [i for i, a in enumerate(q.get("answerOptions", [])) if a.get("isCorrect") is True or str(a.get("isCorrect")).lower() == "true"]
                    prompt = str(q.get("questionText", "")).strip()
                    if len(correct) != 1 or not 2 <= len(options) <= 6 or not all(options) or len(set(options)) != len(options) or not prompt or "![" in prompt:
                        rejected["invalid_question"] += 1
                        continue
                    fingerprint = hashlib.sha256(re.sub(r"\W", "", prompt.lower()).encode()).hexdigest()
                    if fingerprint in seen_questions:
                        rejected["duplicate_question"] += 1
                        continue
                    seen_questions.add(fingerprint)
                    questions.append({"id": fingerprint[:24], "prompt": prompt, "options": options, "correct_index": correct[0], "explanation": f"The source quiz marks '{options[correct[0]]}' as correct. Review {resource['title']} for the lesson context.", "resource_id": resource["id"], "source_url": resource["url"], "topics": resource["topics"], "difficulty": 1 if "pre" in quiz["title"].lower() else 2, "difficulty_source": "curriculum pre/post heuristic; not psychometrically calibrated", "license": "MIT", "source": repo})
                    pairs.append({"query": clean(prompt), "resource_id": resource["id"], "group": resource["id"], "source": repo})
        sources.append({"repository": f"https://github.com/microsoft/{repo}", "revision": revision, "license": "MIT", "lessons": len(lesson_paths), "quiz_files": len(quiz_paths)})
        print(f"Imported {repo}: {len(lesson_paths)} lesson files, {len(quiz_paths)} quiz files", flush=True)
    supplement = json.loads((DATA / "supplement.json").read_text(encoding="utf-8"))
    resources.extend(supplement["resources"])
    questions.extend(supplement["questions"])
    for name, rows in [("resources", resources), ("questions", questions), ("training_pairs", pairs)]:
        (DATA / f"{name}.json").write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = {"sources": sources, "resources": len(resources), "questions": len(questions), "training_pairs": len(pairs), "rejected": rejected, "supervision": "Original author quiz-to-lesson links. Supplementary authored questions are excluded from training/evaluation.", "limitations": "Small English beginner curriculum dataset; no learner outcome labels. Source answers have not been independently expert-reviewed; difficulty labels are heuristic."}
    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    main()
