from copy import deepcopy

import numpy as np
import pytest

from ml.index_careers import build_index


class RecordingEncoder:
    def __init__(self):
        self.calls = []

    def encode(self, texts, batch_size):
        self.calls.append(list(texts))
        result = np.zeros((len(texts), 768), dtype=np.float32)
        result[:, 0] = 1
        return result


def inputs():
    return {"resources": ["Public resource"], "questions": ["First question"],
            "topics": ["Topic"], "passages": ["Passage"], "owners": [0],
            "queries": ["Public query"], "roles": ["Role"]}


def prepared():
    resources = [{"id": "resource"}]
    questions = [{"id": "one", "prompt": "First question", "correct_index": 0}]
    report = {"model": "synthetic-encoder"}
    values = inputs()
    arrays, metadata = build_index(RecordingEncoder(), resources, questions, report, {"data": "old"}, values)
    return resources, questions, report, values, arrays, metadata


def test_append_encodes_only_new_text_and_preserves_every_existing_array():
    resources, questions, report, values, arrays, metadata = prepared()
    before = deepcopy(arrays)
    questions.append({"id": "two", "prompt": "New question", "correct_index": 2})
    values["questions"].append("New question")
    encoder = RecordingEncoder()
    result, updated = build_index(encoder, resources, questions, report, {"data": "new"}, values, metadata, arrays)
    assert encoder.calls == [["New question"]]
    assert updated["index_update"] == {"mode": "incremental-fp32", "preserved_question_vectors": 1, "encoded_question_vectors": 1, "preserved_resource_vectors": 1, "encoded_resource_vectors": 0}
    for key in arrays:
        assert np.array_equal(arrays[key], before[key])
        assert np.array_equal(result[key][:1] if key == "questions" else result[key], before[key])
    assert result["questions"].dtype == np.float32


def test_changed_old_stem_answer_mapping_model_and_order_cannot_be_refreshed_as_append():
    for mutation in ["stem", "answer", "model", "order", "topic", "vector_shape", "owners"]:
        resources, questions, report, values, arrays, metadata = prepared()
        if mutation == "stem": questions[0]["prompt"] = "Changed existing question"; values["questions"][0] = questions[0]["prompt"]
        elif mutation == "answer": questions[0]["correct_index"] = 3
        elif mutation == "model": report["model"] = "different-model"
        elif mutation == "order": questions[0]["id"] = "different-id"
        elif mutation == "topic": values["topics"][0] = "Changed topic"
        elif mutation == "vector_shape": arrays["questions"] = np.ones((2, 768), dtype=np.float32)
        elif mutation == "owners": arrays["owners"][0] = 99
        encoder = RecordingEncoder()
        with pytest.raises(ValueError):
            build_index(encoder, resources, questions, report, {"data": "new"}, values, metadata, arrays)
        assert encoder.calls == []


def test_identical_inputs_do_not_reencode_and_legacy_upgrade_requires_all_old_hashes():
    resources, questions, report, values, arrays, metadata = prepared()
    encoder = RecordingEncoder()
    _, same = build_index(encoder, resources, questions, report, {"data": "old"}, values, metadata, arrays)
    assert same["index_update"]["encoded_question_vectors"] == 0
    assert encoder.calls == []
    legacy = {key: value for key, value in metadata.items() if key not in {"embedding_input_hashes", "question_row_hashes"}}
    with pytest.raises(ValueError, match="Legacy index inputs changed"):
        build_index(encoder, resources, questions, report, {"data": "changed"}, values, legacy, arrays)


def test_new_teaching_resources_passages_and_reordered_public_queries_are_really_encoded():
    resources, questions, report, values, arrays, metadata = prepared()
    resources.append({"id": "new-resource"}); values["resources"].append("New teaching text")
    values["passages"].append("New teaching passage"); values["owners"].append(1)
    values["queries"] = ["New public query", "Public query"]
    encoder = RecordingEncoder()
    updated, result = build_index(encoder, resources, questions, report, {"data": "new"}, values, metadata, arrays)
    assert encoder.calls == [["New teaching text"], ["New teaching passage"], ["New public query"]]
    assert result["resource_ids"] == ["resource", "new-resource"]
    assert np.array_equal(updated["resources"][:1], arrays["resources"])
    assert np.array_equal(updated["passages"][:1], arrays["passages"])
    assert np.array_equal(updated["queries"][1], arrays["queries"][0])
    assert updated["owners"].tolist() == [0, 1]
    assert result["index_update"]["encoded_resource_vectors"] == 1
