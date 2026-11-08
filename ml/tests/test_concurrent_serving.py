"""Concurrency contracts use controlled events, not flaky latency thresholds."""
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
import json
import threading
import time

import numpy as np

from ml.service import LearningEngine
from ml import telemetry


def fixture_engine(encode):
    engine = object.__new__(LearningEngine)
    engine.lock = threading.Lock()
    engine.cache_lock = threading.Lock()
    engine.embedding_cache = OrderedDict()
    engine.batch_size = 4
    engine.model = SimpleNamespace(encode=encode)
    return engine


def test_public_cache_hit_does_not_wait_for_private_model_work():
    private_started, release_private = threading.Event(), threading.Event()

    def encode(texts, **_):
        private_started.set()
        assert release_private.wait(5)
        return np.array([[0.0, 1.0]] * len(texts), dtype=np.float32)

    engine = fixture_engine(encode)
    original = np.array([1.0, 0.0], dtype=np.float32)
    engine.embedding_cache["public skill"] = original
    with ThreadPoolExecutor(max_workers=2) as pool:
        private = pool.submit(engine.encode, ["private resume"], public=False)
        try:
            assert private_started.wait(2)
            public = pool.submit(engine.encode, ["public skill"], public=True)
            # A blocked inference never receives its release until the cache hit
            # has completed. The old single lock deterministically times out.
            result = public.result(timeout=2)
            np.testing.assert_array_equal(result[0], original)
            result[0, 0] = 0.5
            np.testing.assert_array_equal(engine.embedding_cache["public skill"], original)
        finally:
            release_private.set()
        assert private.result(timeout=2).shape == (1, 2)
    assert "private resume" not in engine.embedding_cache


def test_concurrent_public_cache_misses_share_one_encode_and_keep_lru_bounded():
    calls, active, peak = [], 0, 0
    state_lock = threading.Lock()

    def encode(texts, **_):
        nonlocal active, peak
        with state_lock:
            calls.append(list(texts)); active += 1; peak = max(peak, active)
        time.sleep(0.01)
        with state_lock:
            active -= 1
        return np.array([[1.0, 0.0]] * len(texts), dtype=np.float32)

    engine = fixture_engine(encode)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda _: engine.encode(["same public skill"], public=True), range(8)))
    assert calls == [["same public skill"]]
    assert peak == 1
    assert all(np.array_equal(value, results[0]) for value in results)
    engine.encode([f"public-{index}" for index in range(600)], public=True)
    assert len(engine.embedding_cache) == 512
    assert "public-599" in engine.embedding_cache
    assert "same public skill" not in engine.embedding_cache


def test_actual_model_calls_stay_serialized_and_private_vectors_never_enter_cache():
    active, peak = 0, 0
    state_lock = threading.Lock()

    def encode(texts, **_):
        nonlocal active, peak
        with state_lock:
            active += 1; peak = max(peak, active)
        time.sleep(0.005)
        with state_lock:
            active -= 1
        return np.array([[0.0, 1.0]] * len(texts), dtype=np.float32)

    engine = fixture_engine(encode)
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda index: engine.encode([f"private-{index}"], public=False), range(8)))
    assert peak == 1
    assert not engine.embedding_cache


def test_private_telemetry_has_no_path_inputs_identity_or_headers(capsys):
    assert telemetry.safe_operation("/guest/private-session-capability") == "guest"
    assert telemetry.safe_operation("/unrecognized/private-email@example.invalid") == "other"
    telemetry.finish_request(telemetry.begin_request(), "assessment", 200)
    telemetry.finish_initialization("onnx_session", telemetry.begin_initialization(), True)
    rows = [json.loads(line) for line in capsys.readouterr().out.splitlines()]
    assert rows[0]["event"] == "ml_request"
    assert rows[0]["runtime"]["process_cpu_delta_us"] >= 0
    assert isinstance(rows[0]["runtime"]["first_request_in_process"], bool)
    assert rows[1]["component"] == "onnx_session" and rows[1]["succeeded"]
    assert set(rows[0]) == {"event", "operation", "status", "duration_ms", "runtime"}
    assert "private-" not in json.dumps(rows)
    assert "headers" not in json.dumps(rows) and "token" not in json.dumps(rows)
