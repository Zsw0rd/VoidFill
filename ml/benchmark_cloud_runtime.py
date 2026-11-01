"""Measure real serving initialization and cache hits without importing PyTorch."""
import json
import statistics
import sys
import time
from pathlib import Path

start = time.perf_counter()
from ml.service import LearningEngine, RecommendationRequest
from ml.guest import SKILLS

engine = LearningEngine()
initialized = time.perf_counter()
request = RecommendationRequest(skills=[{"id": item["id"], "name": item["name"]} for item in SKILLS])
first = engine.recommend(request)
finished = time.perf_counter()
times = []
for _ in range(100):
    t = time.perf_counter()
    result = engine.recommend(request)
    times.append((time.perf_counter() - t) * 1000)
    assert result == first
report = {"initialization_ms": (initialized-start)*1000, "first_six_skill_recommendation_ms": (finished-initialized)*1000, "warm_six_skill_median_ms": statistics.median(times), "warm_six_skill_p95_ms": sorted(times)[94], "model_graph_loaded_for_public_queries": engine.model.session is not None, "torch_imported": "torch" in sys.modules, "scope": "Local CPU measurements; Vercel network and platform cold-start overhead are not included."}
path = Path(__file__).resolve().parent / "evaluation-cloud-serving.json"
path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
print(json.dumps(report), flush=True)
