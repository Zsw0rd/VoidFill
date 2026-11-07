"""Audit the actual prepared data and larger-model runtime contract."""
import json
import re
from pathlib import Path
import numpy as np
import pytest
from ml.service import LearningEngine

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/technical-qa"


def norm(text):
    return re.sub(r"\W+", " ", text.lower()).strip()


@pytest.mark.offline_training
def test_large_data_has_disjoint_titles_and_served_positive_texts():
    if not (RAW / "train.json").exists():
        pytest.skip("Expanded training data has not been prepared on this checkout")
    rows = {part: json.loads((RAW / f"{part}.json").read_text(encoding="utf8")) for part in ("train", "validation", "test")}
    assert len(rows["train"]) > 60000
    titles = {part: {norm(r["query"]) for r in data} for part, data in rows.items()}
    answers = {part: {norm(r["positive"]) for r in data} for part, data in rows.items()}
    for a, b in (("train", "validation"), ("train", "test"), ("validation", "test")):
        assert not titles[a] & titles[b]
        assert not answers[a] & answers[b]
    frozen = json.loads((ROOT / "data/training_pairs.json").read_text(encoding="utf8"))
    assert not titles["train"] & {norm(r["query"]) for r in frozen}


@pytest.mark.offline_training
def test_curriculum_mining_excludes_validation_and_test_lessons():
    if not (RAW / "mined-curriculum.json").exists():
        pytest.skip("Curriculum passages have not been mined")
    rows = json.loads((RAW / "mined-curriculum.json").read_text(encoding="utf8"))
    groups = json.loads((ROOT / "data/splits.json").read_text(encoding="utf8"))
    heldout = set(groups["validation"]) | set(groups["test"])
    assert not {r["group"] for r in rows} & heldout
    assert len({r["group"] for r in rows}) > 100
    assert all(r["negative"] and r["negative"] != r["positive"] for r in rows)


def test_query_instruction_is_used_only_for_query_encoding():
    engine = object.__new__(LearningEngine)
    engine.report = {"query_prefix": "Find passages: "}
    calls = []
    engine.encode = lambda texts, *, public=False: calls.append(texts) or np.zeros((len(texts), 768))
    engine.encode_queries(["SQL joins"])
    engine.encode(["A document"])
    assert calls == [["Find passages: SQL joins"], ["A document"]]


def test_unsupported_topic_stays_unknown_with_high_background_similarity():
    engine = object.__new__(LearningEngine)
    engine.report = {"topic_min_similarity": .72, "topic_min_margin": .04}
    engine.topic_vectors = np.eye(8)
    engine.encode = lambda texts, *, public=False: np.array([[.69, .66, .65, .64, .63, .62, .61, .60]])
    assert engine.topic("Underwater basket weaving") is None
    assert engine.topic("SQL Fundamentals") == "sql"


@pytest.mark.offline_training
def test_catalogue_cache_reuses_vectors_and_invalidates_changed_content(tmp_path, monkeypatch):
    from types import SimpleNamespace
    import ml.service as service
    monkeypatch.setattr(service, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "artifacts").mkdir()
    checkpoint = tmp_path / "checkpoint"; checkpoint.mkdir()
    (checkpoint / "config.json").write_text("{}")
    (checkpoint / "model.safetensors").write_bytes(b"mock weight fingerprint")
    (tmp_path / "retrieval.py").write_text("passage window revision 1")
    (tmp_path / "data/resources.json").write_text(json.dumps([{"title": "SQL", "description": "SQL joins and tables"}]))
    (tmp_path / "data/questions.json").write_text(json.dumps([{"prompt": "What is a JOIN?"}]))
    calls = []
    def engine():
        instance = object.__new__(LearningEngine)
        instance.report = {"retrieval": "passages-v1"}
        instance.model = SimpleNamespace(max_seq_length=256)
        instance.resources = json.loads((tmp_path / "data/resources.json").read_text())
        instance.questions = json.loads((tmp_path / "data/questions.json").read_text())
        instance.encode = lambda texts: calls.append(list(texts)) or np.ones((len(texts), 4), dtype=np.float32)
        return instance
    first = engine(); first._catalogue_vectors(checkpoint)
    initial_calls = len(calls)
    assert initial_calls > 0
    cached = engine(); cached._catalogue_vectors(checkpoint)
    assert len(calls) == initial_calls
    np.testing.assert_array_equal(first.question_vectors, cached.question_vectors)
    (tmp_path / "data/questions.json").write_text(json.dumps([{"prompt": "Explain INNER JOIN"}]))
    updated = engine(); updated._catalogue_vectors(checkpoint)
    assert len(calls) > initial_calls
    assert len(list((tmp_path / "artifacts/catalogue-cache").glob("*.npz"))) == 2
