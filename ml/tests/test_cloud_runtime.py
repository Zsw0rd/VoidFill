import json
import os
from pathlib import Path

import numpy as np
import pytest

from ml.service import LearningEngine, RecommendationRequest

ROOT = Path(__file__).resolve().parents[1]


def test_seeded_public_queries_do_not_load_the_model(monkeypatch):
    monkeypatch.setenv("ML_BACKEND", "onnx")
    engine = LearningEngine()
    request = RecommendationRequest(skills=[{"id": "test", "name": "SQL Fundamentals"}])
    result = engine.recommend(request)
    assert len(result["recommendations"][0]["resources"]) == 4
    assert engine.model.session is None


def test_private_input_is_not_added_to_public_embedding_cache(monkeypatch):
    monkeypatch.setenv("ML_BACKEND", "onnx")
    engine = LearningEngine()
    previous = list(engine.embedding_cache)
    first = engine.encode(["A private resume summary about Python and SQL"])
    second = engine.encode(["A private resume summary about Python and SQL", "SQL"])
    assert list(engine.embedding_cache) == previous
    np.testing.assert_allclose(first[0], second[0], atol=2e-6)
    assert np.isfinite(first).all()
    assert abs(np.linalg.norm(first[0]) - 1) < 1e-5


def test_cloud_export_preserves_the_recorded_quality_gate():
    report = json.loads((ROOT / "evaluation-cloud.json").read_text(encoding="utf8"))
    selected = report["candidates"][report["selected"]]
    assert selected["eligible"]
    assert report["selected_test"] == report["baseline"]["test"]
    assert selected["validation"] == report["baseline"]["validation"]
