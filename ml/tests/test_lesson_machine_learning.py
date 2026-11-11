"""Source accounting and independently computed ML lesson answer checks.

Uses tiny arrays, language operations and metric functions only: no model
training, downloads, notebook execution, paid APIs or browser automation.
"""
import json
import math
import re
import shutil
import subprocess
from collections import Counter
from copy import deepcopy
from datetime import datetime, timedelta
from fractions import Fraction

import numpy as np
from sklearn.base import is_classifier, is_regressor
from sklearn.metrics import adjusted_rand_score, confusion_matrix, precision_score, recall_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC, SVR

from ml.lesson_questions import ROOT, build_questions
from ml.lesson_validation import validate_lesson_questions
from ml.lessons.machine_learning import (
    AI, ML, BANKS, ORIENTATIONS, SOURCE_FINDINGS, LEGACY_QUESTION_FINDINGS,
)


def resources():
    return sum([json.loads((ROOT / path).read_text(encoding="utf8")) for path in
                ["ml/data/resources.json", "ml/data/careers/resources.json"]], [])


def answer(resource_id, code):
    bank = next(b for b in BANKS if resource_id in b["resource_ids"])
    return next(q[4] for q in bank["questions"] if q[0] == code)


def test_all_75_rows_have_exact_reviewed_teaching_or_guide_bindings():
    assigned = {r["id"] for r in resources() if "machine-learning" in r["topics"]}
    by_id = {r["id"]: r for r in resources()}
    decisions = [*BANKS, *ORIENTATIONS]
    bindings = [rid for record in decisions for rid in record["resource_ids"]]
    assert len(assigned) == 75
    assert len(BANKS) == 58 and len(ORIENTATIONS) == 17
    assert Counter(bindings) == Counter({rid: 1 for rid in assigned})
    assert Counter(g["kind"] for g in ORIENTATIONS) == {"orientation": 9, "practice-guide": 8}
    for record in decisions:
        assert record["reviewed_at"] == "2026-11-10"
        assert record["url"].startswith((ML, AI))
        assert record["topics"] == ["machine-learning"]
        for rid in record["resource_ids"]:
            assert by_id[rid]["url"] == record["url"]
            assert "machine-learning" in by_id[rid]["topics"]
    for guide in ORIENTATIONS:
        assert len(guide["reason"]) > 80 and "questions" not in guide
        assert set(guide["child_resource_ids"]) <= set(by_id)


def test_generated_checks_are_deterministic_balanced_bound_and_unique():
    before = deepcopy(BANKS)
    rows = build_questions(banks=BANKS)
    assert BANKS == before and rows == build_questions(banks=BANKS)
    assert validate_lesson_questions(rows, resources()) == rows
    assert len(rows) == 348 == len({q["id"] for q in rows}) == len({q["prompt"] for q in rows})
    assert {q["correct_index"] for q in rows} == {0, 1, 2, 3}
    for bank in BANKS:
        bank_rows = [q for q in rows if q["resource_ids"] == bank["resource_ids"]]
        assert len(bank_rows) == 6
        assert sum(q["difficulty"] <= 2 for q in bank_rows) == 3
        assert sum(q["difficulty"] == 3 for q in bank_rows) == 3
        assert len({q["objective_id"] for q in bank_rows}) >= 3
        assert all(q["source_url"].split("#", 1)[0] == bank["url"] for q in bank_rows)


def test_primary_review_records_verify_fragments_and_actual_guide_links_without_network():
    review = json.loads((ROOT / "ml/lessons/machine_learning_sources.json").read_text(encoding="utf8"))
    by_id = {r["resource_id"]: r for r in review}
    assert len(review) == len(by_id) == 75
    for record in [*BANKS, *ORIENTATIONS]:
        evidence = by_id[record["resource_ids"][0]]
        assert evidence["url"] == record["url"]
        assert evidence["reviewed_at"] == record["reviewed_at"]
        assert re.fullmatch(r"[0-9a-f]{64}", evidence["sha256"])
        assert evidence["bytes"] > 400
        assert evidence["raw_url"].startswith("https://raw.githubusercontent.com/microsoft/")
        for q in record.get("questions", []):
            if q[-1]:
                assert q[-1][1:] in evidence["section_slugs"], (evidence["resource_id"], q[0], q[-1])
        assert set(record.get("child_resource_ids", [])) <= set(evidence["catalogue_link_ids"])


def test_numeric_keys_against_numpy_python_and_metric_functions():
    data = "89cd5bb2ed626c6062fa7c6a"
    assert answer(data, "average") == f"{(12 + 18) / 2:g}"
    assert answer(data, "half-bushel") == f"{9 / 0.5:g}"
    assert answer("2b19a333828f0415582f2cc5", "prediction") == str(5 + 2 * 4)
    # Construct actual binary labels with TP=18, FN=12, FP=6, TN=6.
    actual = [1] * 30 + [0] * 12
    predicted = [1] * 18 + [0] * 12 + [1] * 6 + [0] * 6
    assert confusion_matrix(actual, predicted).tolist() == [[6, 6], [12, 18]]
    logistic = "80fa4d18046d23b6fffe27dc"
    assert answer(logistic, "precision") == str(precision_score(actual, predicted))
    assert answer(logistic, "recall") == str(recall_score(actual, predicted))
    assert answer("444dada88136c9d89d3748b1", "test-size") == str(int(100 * 0.3))
    assert answer("444dada88136c9d89d3748b1", "top-class") == ["A", "B", "C"][int(np.argmax([0.2, 0.7, 0.1]))]
    assert answer("68f07271e7cd3852c7c9b888", "new-centroid") == f"{np.mean([2, 4, 9]):g}"
    words = "bright stars guide sailors".split()
    assert answer("7d7d7e40def35e4fbc555ad2", "bigrams") == str(len(list(zip(words, words[1:]))))
    assert answer("7d7d7e40def35e4fbc555ad2", "frequency") == str("Blue sky blue sea".lower().split().count("blue"))
    assert answer("6e480609fa7263de12f2354d", "difference-values") == str(np.diff([10, 13, 18]).tolist())
    samples = np.arange(8)
    windows = np.lib.stride_tricks.sliding_window_view(samples, 5)
    assert answer("d5aabaecb172aa8ce7253ddb", "window-count") == str(len(windows))
    assert windows[0, :4].tolist() == [0, 1, 2, 3] and windows[0, -1] == 4
    target_time = datetime(2026, 1, 1, 9) + timedelta(hours=4)
    assert answer("d5aabaecb172aa8ce7253ddb", "target-timestamps") == target_time.strftime("%H:%M")
    qlesson = "0131853a327944e9e99b399d"
    assert answer(qlesson, "table-size") == str(np.zeros((6, 5, 4)).size)
    assert answer(qlesson, "nonterminal-update") == f"{(1 - 0.5) * 2 + 0.5 * (1 + 0.9 * 4):g}"
    cartpole = "e510c3148513e66df9d9e6d8"
    assert answer(cartpole, "state-count") == str(np.zeros((3, 4, 2, 5, 2)).size)
    running_mean = np.convolve([10, 20, 30, 40], np.ones(2) / 2, mode="valid")
    assert answer(cartpole, "running-mean") == str(running_mean.astype(int).tolist())
    perceptron = "46a7e6a77b4dbc77f76db48a"
    assert answer(perceptron, "dot-output") == ("+1" if np.dot([2, -1], [3, 4]) >= 0 else "-1")
    updated = np.zeros(2) + 0.5 * np.array([2, -4]) * 1
    assert answer(perceptron, "update") == str(updated.astype(int).tolist())
    assert answer("911ffe1c58b8af2e5ba63de4", "scores") == str(int(np.argmax([-0.4, 0.2, 1.5, 0.6])))
    own_framework = "ff54a82ff50edcbd568943b3"
    assert answer(own_framework, "gradient-step") == f"{3 - 0.1 * 4:g}"
    assert answer(own_framework, "absolute-error") == str(int(np.abs(np.array([2, 5]) - [1, 7]).sum()))
    assert answer("1bd3c2667139203537686631", "weighted-sum") == str(int(np.dot([1, 3], [2, 4])))
    cv = "c7c56a433efa2ea3052c0a04"
    assert answer(cv, "shape") == str(np.zeros((50, 80, 3)).shape)
    assert answer(cv, "channel-swap") == str(np.array([10, 20, 30])[::-1].tolist())
    detection = "d78317785ba7cee2add3cbeb"
    assert answer(detection, "iou-number") == str(Fraction(10, 20 + 20 - 10))
    assert answer(detection, "mean-ap") == f"{np.mean([0.6, 0.8]):g}"
    assert answer("8912ef2a4435e94decd28e50", "mask-size") == str(np.zeros((48, 64)).size)
    vocabulary = ["red", "blue", "green"]
    assert answer("08c8de199e82fb31fc61c6c4", "count-vector") == str(["red blue red".split().count(t) for t in vocabulary])
    assert answer("e4c6fcd7da2e00369091132a", "mean-vector") == str(np.mean([[2, 4], [4, 8]], axis=0).astype(int).tolist())
    assert answer("cb2e525fedcd48a5178d3997", "scalar-cell") == str(2 * 3 + 4 * 1 - 1)
    context = np.array([0.25, 0.75]) @ np.array([[2, 0], [0, 4]])
    assert answer("07e15a8774b6359d837912eb", "weighted-context") == f"[{context[0]:g}, {context[1]:g}]"
    assert answer("7c8a05902f3cd828d79eedda", "bio-count") == str(2 * 2 + 1)
    assert answer("45e7b6b08a82e12efed49d33", "perplexity-number") == f"{math.pow(1 / 0.25, 1 / 2):g}"
    assert 2 + 2 * 2 + 3 * 4 + 4 * 3 == 30
    assert answer("719503d74361a99df21f8afb", "integer-candidate").startswith("Yes;")
    assert answer("6cacd4c63fd96fb1f367587e", "prompt-class") == ["cat", "dog", "bird"][int(np.argmax([0.1, 0.7, 0.2]))]
    assert answer("6cacd4c63fd96fb1f367587e", "batch-pairs") == str(np.eye(4).astype(bool).sum())


def test_browser_vector_contract_against_actual_javascript_without_a_browser():
    assert shutil.which("node"), "Node is required to check the lesson's JavaScript vector contract"
    script = """
    const ingredients = Array(380).fill(0);
    const check = {value: '4', checked: true};
    ingredients[check.value] = check.checked ? 1 : 0;
    const input = new Float32Array(ingredients);
    const feeds = {float_input: input};
    console.log(JSON.stringify({length:input.length, fifth:input[4], fourth:input[3],
      total:Array.from(input).reduce((a,b)=>a+b,0), keys:Object.keys(feeds)}));
    """
    result = json.loads(subprocess.run(["node", "-e", script], capture_output=True,
                                      text=True, check=True, timeout=15).stdout)
    assert result == {"length": 380, "fifth": 1, "fourth": 0, "total": 1, "keys": ["float_input"]}
    bank = "9d409b7e327d6e85d596caa5"
    assert answer(bank, "checkbox-index") == "The fifth entry becomes 1"
    assert answer(bank, "tensor-shape") == "[1, 380]"
    assert answer(bank, "feed-name") == "{float_input: tensor}"


def test_concrete_legacy_findings_identify_actual_unchanged_question_keys():
    legacy = {q["id"]: q for q in json.loads((ROOT / "ml/data/questions.json").read_text(encoding="utf8"))}
    assert len(LEGACY_QUESTION_FINDINGS) == 24
    assert len({f["question_id"] for f in LEGACY_QUESTION_FINDINGS}) == 24
    for finding in LEGACY_QUESTION_FINDINGS:
        row = legacy[finding["question_id"]]
        assert row["prompt"] == finding["prompt"]
        assert row["resource_id"] == finding["resource_id"]
        assert row["options"][row["correct_index"]] == finding["current_keyed_answer"]
        assert row["source_url"] == finding["url"]
        assert finding["suggested_action"] == "quarantine"
        assert len(finding["reason"]) > 70 and finding["primary_references"]


def test_source_error_counterexamples_are_independent_of_the_authored_answers():
    # A perfect decreasing line disproves a requirement for correlation near +1.
    x = np.array([1, 2, 3, 4])
    y = -x
    assert np.isclose(np.corrcoef(x, y)[0, 1], -1)
    assert np.square((-x) - y).sum() == 0
    # Identical partitions with permuted IDs are perfectly equivalent, despite
    # the tutorial's raw label equality reporting zero accuracy.
    classes, clusters = [0, 0, 1, 1], [1, 1, 0, 0]
    assert np.mean(np.array(classes) == clusters) == 0
    assert adjusted_rand_score(classes, clusters) == 1
    # Check estimator contracts without fitting or downloading a model.
    assert is_classifier(KNeighborsClassifier())
    assert is_classifier(SVC()) and not is_regressor(SVC())
    assert is_regressor(SVR()) and not is_classifier(SVR())
    # A list has no shape, reproducing the perceptron snippet's immediate defect.
    weights = [0, 0, 0]
    assert not hasattr(weights, "shape")
    # Assignment does not preserve an immutable snapshot of a mutable Q table.
    q = {("s", 0): 1}
    aliased = q
    saved = q.copy()
    q[("s", 0)] = 9
    assert aliased[("s", 0)] == 9 and saved[("s", 0)] == 1


def test_source_findings_are_scoped_warnings_not_claims_of_certification():
    by_id = {r["id"]: r for r in resources()}
    assert len(SOURCE_FINDINGS) == 33
    for finding in SOURCE_FINDINGS:
        assert by_id[finding["resource_id"]]["url"] == finding["url"]
        assert finding["severity"] in {"error", "caution"}
        assert 30 < len(finding["warning"]) < 400
        assert len(finding["detail"]) > 70
        assert all(url.startswith("https://") for url in finding["correct_primary_urls"])
    assert answer("22a7bac053135218fc65a910", "critic") == "Expected return from the current state"
    assert answer("77ed081e085b28907dec5676", "subjectivity") == "Objective versus subjective wording"
    assert answer("1fcb47b0e456d979ca226530", "missing-zero") == "0"
