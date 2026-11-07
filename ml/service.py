"""Offline retrieval service. Next.js is the authenticated, public-facing boundary."""
from __future__ import annotations

import json
import hashlib
import os
import secrets
import threading
from collections import OrderedDict
from contextlib import asynccontextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.environ.setdefault("HF_HOME", str(ROOT / ".cache/huggingface"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile, File, Request
from pydantic import BaseModel, ConfigDict, Field
from ml.guest import guests
from ml.resume import parse_resume, MAX_BYTES
from ml.retrieval import passages
from ml.career_catalogue import CATALOGUE, DIRECTORY, TOPICS, content_fingerprints, load_learning_content, topic_for_skill

class Skill(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=160)
    score: float | None = Field(default=None, ge=0, le=100)
    target: float = Field(default=75, ge=0, le=100)
    importance: float = Field(default=1, ge=0, le=10)


class RecommendationRequest(BaseModel):
    skills: list[Skill] = Field(min_length=1, max_length=40)
    role: str = Field(default="Learner", max_length=200)
    limit: int = Field(default=4, ge=1, le=5)


class AssessmentRequest(RecommendationRequest):
    count: int = Field(default=10, ge=1, le=20)
    difficulty: int = Field(default=1, ge=1, le=5)
    context: str = Field(default="", max_length=2000)


class AnalysisRequest(RecommendationRequest):
    average_test_score: float = Field(default=0, ge=0, le=100)
    test_count: int = Field(default=0, ge=0)


class LearningEngine:
    def __init__(self):
        self.backend = os.environ.get("ML_BACKEND", "onnx" if os.environ.get("VERCEL") else "torch")
        self.lock = threading.Lock()
        self.embedding_cache = OrderedDict()
        self.batch_size = 16
        self.resources, self.questions = load_learning_content()
        self.public_assessment_contexts = {topic: {r["title"][:500] for r in self.resources if topic in r["topics"]} for topic in TOPICS}
        if self.backend == "onnx":
            from ml.onnx_encoder import OnnxEncoder
            directory = Path(os.environ.get("ML_ARTIFACT_DIR", ROOT / "artifacts/cloud"))
            self.report = json.loads((directory / "metrics.json").read_text(encoding="utf8"))
            self.model = OnnxEncoder(directory)
            self.batch_size = 4
            with np.load(directory / "catalogue.npz", allow_pickle=False) as cached:
                self.resource_vectors = cached["resources"]
                self.question_vectors = cached["questions"]
                self.topic_vectors = cached["topics"]
                self.passage_vectors = cached["passages"]
                self.passage_owners = cached["owners"]
            self._career_vectors()
            if (directory / "public-queries.json").exists():
                keys = json.loads((directory / "public-queries.json").read_text(encoding="utf8"))
                with np.load(directory / "public-queries.npz", allow_pickle=False) as cached:
                    self.embedding_cache.update(zip(keys, cached["vectors"]))
            return
        import torch
        from sentence_transformers import SentenceTransformer
        checkpoint = ROOT / "artifacts/retriever"
        if not (checkpoint / "config.json").exists():
            raise RuntimeError("Trained model missing. Run npm run ml:prepare and npm run ml:train first.")
        self.report = json.loads((ROOT / "artifacts/metrics.json").read_text(encoding="utf-8"))
        torch.set_num_threads(min(4, os.cpu_count() or 1))
        requested = os.environ.get("ML_DEVICE", self.report.get("inference_device", "cpu"))
        device = ("cuda" if torch.cuda.is_available() else "cpu") if requested == "auto" else requested
        self.model = SentenceTransformer(str(checkpoint), device=device, local_files_only=True, trust_remote_code=False)
        self.model.eval()
        self._catalogue_vectors(checkpoint)

    def _catalogue_vectors(self, checkpoint: Path):
        # Only public catalogue/question embeddings enter this cache. Resume
        # vectors and guest inputs are never persisted here.
        digest = hashlib.sha256()
        inputs = sorted(checkpoint.rglob("*.json")) + sorted(checkpoint.glob("*.safetensors")) + [ROOT / "data/resources.json", ROOT / "data/questions.json", DIRECTORY / "resources.json", DIRECTORY / "questions.json", DIRECTORY / "catalogue.json", ROOT / "retrieval.py"]
        for filename in inputs:
            with filename.open("rb") as source:
                digest.update(hashlib.file_digest(source, "sha256").digest())
        digest.update(json.dumps(TOPICS, sort_keys=True).encode())
        digest.update(str(self.model.max_seq_length).encode())
        digest.update(str(self.report.get("retrieval", "intro-only")).encode())
        cache_dir = ROOT / "artifacts/catalogue-cache"
        cache_dir.mkdir(exist_ok=True)
        filename = cache_dir / (digest.hexdigest() + ".npz")
        if filename.exists():
            try:
                with np.load(filename, allow_pickle=False) as cached:
                    self.resource_vectors = cached["resources"]
                    self.question_vectors = cached["questions"]
                    self.topic_vectors = cached["topics"]
                    self.passage_vectors = cached["passages"] if self.report.get("retrieval") == "passages-v1" else None
                    self.passage_owners = cached["owners"]
                return
            except (OSError, ValueError, KeyError):
                pass  # Rebuild a partial/corrupted cache using the local model.
        self.resource_vectors = self.encode([r["title"] + ". " + r["description"] for r in self.resources])
        self.passage_vectors = None
        if self.report.get("retrieval") == "passages-v1":
            chunks, owners = [], []
            for index, resource in enumerate(self.resources):
                windows = passages(resource)
                chunks.extend(windows)
                owners.extend([index] * len(windows))
            self.passage_vectors = self.encode(chunks)
            self.passage_owners = np.array(owners)
        self.question_vectors = self.encode([q["prompt"] for q in self.questions])
        self.topic_vectors = self.encode(list(TOPICS.values()))
        temporary = cache_dir / f"{digest.hexdigest()}-{os.getpid()}.tmp.npz"
        np.savez_compressed(temporary, resources=self.resource_vectors, questions=self.question_vectors, topics=self.topic_vectors, passages=self.passage_vectors if self.passage_vectors is not None else np.empty((0, 0)), owners=getattr(self, "passage_owners", np.array([], dtype=int)))
        os.replace(temporary, filename)

    def encode(self, texts: list[str], *, public=False) -> np.ndarray:
        # Only public catalogue/skill queries are cached. Resume content is never cached.
        with self.lock:
            if not public:
                return self.model.encode(texts, batch_size=self.batch_size, normalize_embeddings=True, show_progress_bar=False)
            missing = list(dict.fromkeys(text for text in texts if text not in self.embedding_cache))
            if missing:
                vectors = self.model.encode(missing, batch_size=self.batch_size, normalize_embeddings=True, show_progress_bar=False)
                for text, vector in zip(missing, vectors):
                    self.embedding_cache[text] = vector
            result = np.stack([self.embedding_cache[text] for text in texts])
            for text in texts:
                self.embedding_cache.move_to_end(text)
            while len(self.embedding_cache) > 512:
                self.embedding_cache.popitem(last=False)
            return result

    def encode_queries(self, texts: list[str], *, public=False) -> np.ndarray:
        prefix = self.report.get("query_prefix", "")
        return self.encode([prefix + text for text in texts], public=public)

    def _career_vectors(self):
        metadata = json.loads((DIRECTORY / "index.json").read_text(encoding="utf8"))
        if metadata["inputs"] != content_fingerprints() or metadata["model"] != self.report["model"]:
            raise RuntimeError("Career index is stale. Run python -m ml.index_careers before building.")
        base_resources = len(self.resources) - len(metadata["resource_ids"])
        base_questions = len(self.questions) - len(metadata["question_ids"])
        if len(self.resource_vectors) != base_resources or len(self.question_vectors) != base_questions:
            raise RuntimeError("Base model catalogue does not match the career extension.")
        if [r["id"] for r in self.resources[base_resources:]] != metadata["resource_ids"] or [q["id"] for q in self.questions[base_questions:]] != metadata["question_ids"]:
            raise RuntimeError("Career index item ordering does not match the content.")
        with np.load(DIRECTORY / "vectors.npz", allow_pickle=False) as extension:
            self.resource_vectors = np.concatenate([self.resource_vectors, extension["resources"]])
            self.question_vectors = np.concatenate([self.question_vectors, extension["questions"]])
            self.topic_vectors = extension["topics"]
            self.career_role_vectors = extension["roles"]
            self.passage_vectors = np.concatenate([self.passage_vectors, extension["passages"]])
            self.passage_owners = np.concatenate([self.passage_owners, extension["owners"] + base_resources])
            self.embedding_cache.update(zip(metadata["public_queries"], extension["queries"]))

    def topic(self, name: str) -> str | None:
        return topic_for_skill(name)

    def recommend(self, request: RecommendationRequest) -> dict:
        results, unsupported = [], []
        for skill in request.skills:
            topic = self.topic(skill.name)
            candidates = [i for i, r in enumerate(self.resources) if topic in r["topics"]] if topic else []
            if not candidates:
                unsupported.append(skill.name)
                results.append({"skill_id": skill.id, "skill_name": skill.name, "resources": []})
                continue
            query = f"{skill.name}. {TOPICS[topic]}"
            vector = self.encode_queries([query], public=True)[0]
            if self.passage_vectors is not None:
                scores_all = vector @ self.passage_vectors.T
                scores = np.array([scores_all[self.passage_owners == i].max() for i in candidates])
            else:
                scores = vector @ self.resource_vectors[candidates].T
            order = np.argsort(-scores, kind="stable")
            selected, urls = [], set()
            for rank in order:
                r = self.resources[candidates[int(rank)]]
                if r["url"] in urls:
                    continue
                urls.add(r["url"])
                selected.append({k: r[k] for k in ["id", "title", "type", "provider", "url", "difficulty", "estimated_hours"]} | {"description": r["description"][:320], "similarity": round(float(scores[int(rank)]), 4), "source": r["source"]})
                if len(selected) >= request.limit:
                    break
            results.append({"skill_id": skill.id, "skill_name": skill.name, "resources": selected})
        return {"recommendations": results, "unsupported_skills": unsupported, "model": self.report["model"]}

    def assessment(self, request: AssessmentRequest) -> dict:
        rng = np.random.default_rng()
        pools, unsupported = [], []
        available = []
        for skill in request.skills:
            topic = self.topic(skill.name)
            levels = [q["difficulty"] for q in self.questions if topic and topic in q["topics"]]
            if levels:
                available.append(max(levels))
        # A foundation-only bank must never be labelled an expert assessment.
        effective_difficulty = min(request.difficulty, min(available)) if available else request.difficulty
        for skill in request.skills:
            topic = self.topic(skill.name)
            candidates = [i for i, q in enumerate(self.questions) if topic in q["topics"] and (q["difficulty"] <= 2 if effective_difficulty <= 2 else q["difficulty"] == effective_difficulty)] if topic else []
            if not candidates:
                unsupported.append(skill.name)
                continue
            query = f"{skill.name}. {TOPICS[topic]}. {request.context[:500]}"
            public_context = not request.context or request.context[:500] in self.public_assessment_contexts[topic]
            similarities = self.encode_queries([query], public=public_context)[0] @ self.question_vectors[candidates].T
            # Source pre/post labels and authored difficulty are estimates, not a learned ability scale.
            scores = similarities - np.array([abs(self.questions[i]["difficulty"] - effective_difficulty) * .18 for i in candidates]) + rng.gumbel(0, .05, len(candidates))
            order = [candidates[int(i)] for i in np.argsort(-scores)]
            pools.append({"skill": skill, "indices": order, "weight": 2 if skill.score is None or skill.score < 50 else 1})
        if not pools:
            raise HTTPException(422, "No question-bank coverage for the requested skills")
        selected, seen = [], set()
        while len(selected) < request.count:
            added = False
            for pool in pools:
                for _ in range(pool["weight"]):
                    while pool["indices"] and self.questions[pool["indices"][0]]["id"] in seen:
                        pool["indices"].pop(0)
                    if not pool["indices"] or len(selected) >= request.count:
                        break
                    q = dict(self.questions[pool["indices"].pop(0)])
                    seen.add(q["id"])
                    q["skill_id"] = pool["skill"].id
                    q["skill_name"] = pool["skill"].name
                    selected.append(q)
                    added = True
            if not added:
                break
        rng.shuffle(selected)
        return {"questions": selected, "difficulty": effective_difficulty, "difficultyLabel": ["", "Easy", "Moderate", "Intermediate", "Hard", "Expert"][effective_difficulty], "question_source": "retrieved curriculum and original authored knowledge scenarios; practical work reviewed separately", "unsupported_skills": unsupported, "model": self.report["model"]}

    def analyze(self, request: AnalysisRequest) -> dict:
        recommendations = self.recommend(request)
        by_skill = {r["skill_id"]: r["resources"] for r in recommendations["recommendations"]}
        assessed = [s for s in request.skills if s.score is not None]
        covered = [s for s in request.skills if self.topic(s.name)]
        manual = [s for s in request.skills if not self.topic(s.name)]
        gaps = sorted([s for s in request.skills if s.score is None or s.score < s.target], key=lambda s: (s.target - (s.score or 0)) * s.importance, reverse=True)
        critical = []
        for skill in gaps:
            gap = max(0, skill.target - (skill.score or 0))
            resources = by_skill.get(skill.id, [])
            available = bool(self.topic(skill.name))
            advice = (f"Use the practical activity in Career explorer to collect evidence for {skill.name}. A dedicated knowledge check is not available yet." if not available else f"Take a baseline knowledge assessment for {skill.name} before interpreting this gap." if skill.score is None else f"Practice {skill.name}, review the recommended material, then check your knowledge again.")
            critical.append({"skill": skill.name, "currentScore": skill.score or 0, "targetScore": skill.target, "gap": gap, "assessed": skill.score is not None, "severity": "unassessed" if skill.score is None else "critical" if gap >= 40 else "moderate" if gap >= 15 else "minor", "recommendation": advice, "resources": [{"title": r["title"], "type": r["type"], "provider": r["provider"], "url": r["url"]} for r in resources[:3]]})
        analysis = {"overallAssessment": f"For {request.role}, {len(assessed)} of {len(request.skills)} learning areas have assessment data. Knowledge checks cover {len(covered)} areas; {len(manual)} specialist areas need practical review. Targets guide learning and do not measure job readiness.", "strengthAreas": [s.name for s in assessed if s.score >= s.target], "criticalGaps": critical, "learningPath": [{"phase": i + 1, "title": f"Build {s.name}", "duration": "At your own pace", "focus": f"Collect practical evidence for {s.name}." if not self.topic(s.name) else f"Work toward the configured {s.target:g}/100 learning target for {s.name}.", "milestones": ["Complete the career activity", "Review your work against its rubric", "Record a private reflection"] if not self.topic(s.name) else ["Review a recommended resource", "Complete knowledge questions", "Reassess and compare with your previous result"]} for i, s in enumerate(gaps[:5])], "motivationalTip": "Build both knowledge and practical evidence. Use feedback to choose your next learning step."}
        return {"analysis": analysis, "model": self.report["model"], "unsupported_skills": recommendations["unsupported_skills"]}


engine: LearningEngine | None = None
engine_lock = threading.Lock()
resume_slots = threading.BoundedSemaphore(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    if not os.environ.get("ML_SERVICE_TOKEN"):
        raise RuntimeError("ML_SERVICE_TOKEN is required. Use npm run dev or npm run dev:ml.")
    if not os.environ.get("VERCEL"):
        engine = LearningEngine()
        guests.start_cleanup()
    yield
    guests.stop.set()
    guests.sessions.clear()
    engine = None


app = FastAPI(title="VoidFill local ML", lifespan=lifespan, docs_url=None, redoc_url=None)


def authorize(x_ml_token: str = Header(default="")):
    expected = os.environ.get("ML_SERVICE_TOKEN", "")
    if not expected or not secrets.compare_digest(x_ml_token, expected):
        raise HTTPException(401, "Unauthorized service request")


def get_engine() -> LearningEngine:
    global engine
    if engine is None:
        with engine_lock:
            if engine is None:
                engine = LearningEngine()
    return engine


@app.get("/health")
def health():
    active = get_engine()
    return {"status": "ready", "model": active.report["model"], "parameters": active.report["parameters"], "embedding_dimensions": active.model.get_embedding_dimension(), "resources": len(active.resources), "questions": len(active.questions), "device": str(active.model.device), "backend": active.backend, "features": ["guest-v1", "resume-v1"]}


@app.post("/recommend", dependencies=[Depends(authorize)])
def recommend(request: RecommendationRequest):
    return get_engine().recommend(request)


@app.post("/assessment", dependencies=[Depends(authorize)])
def assessment(request: AssessmentRequest):
    return get_engine().assessment(request)


@app.post("/analyze", dependencies=[Depends(authorize)])
def analyze(request: AnalysisRequest):
    return get_engine().analyze(request)


@app.post("/resume/parse", dependencies=[Depends(authorize)])
def resume_parse(file: UploadFile = File(...)):
    if not resume_slots.acquire(blocking=False):
        file.file.close()
        raise HTTPException(429, "Resume parser is busy. Please retry shortly.")
    try:
        data = file.file.read(MAX_BYTES + 1)
        return parse_resume(data, file.filename or "resume", get_engine())
    finally:
        file.file.close()
        resume_slots.release()


@app.post("/guest/{operation}", dependencies=[Depends(authorize)])
async def guest_operation(operation: str, request: Request, x_demo_token: str = Header(default="")):
    raw = await request.body()
    if len(raw) > 1_000_000:
        raise HTTPException(413, "Demo request too large")
    try:
        body = json.loads(raw or b"{}")
    except ValueError:
        raise HTTPException(400, "Invalid JSON")
    if not isinstance(body, dict):
        raise HTTPException(400, "Invalid request")
    if os.environ.get("VERCEL"):
        from ml.cloud_guests import execute
        from starlette.concurrency import run_in_threadpool
        return await run_in_threadpool(execute, operation, x_demo_token, body)
    if operation == "start":
        if "staff" in body:
            return guests.create_staff(body["staff"])
        role = body.get("role", 0)
        if not isinstance(role, int) or role not in range(len(CATALOGUE["roles"])):
            raise HTTPException(400, "Unknown role")
        return guests.create(role)
    if operation == "end":
        guests.end(x_demo_token)
        return {"ok": True}
    if operation == "user":
        return {"data": {"user": guests.get(x_demo_token)["user"]}, "error": None}
    if operation == "lease":
        return guests.lease(x_demo_token, body.get("tab"), body.get("release", False), body.get("sequence"))
    if operation == "query":
        return guests.query(x_demo_token, body)
    if operation == "ledger":
        return guests.ledger(x_demo_token, body)
    if operation == "practical":
        return guests.practical(x_demo_token, body)
    raise HTTPException(404, "Unknown demo operation")
