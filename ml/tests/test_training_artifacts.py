"""Explicit opt-in checks for unpublished local training checkpoints.

These assertions require the real saved research artifacts; they do not create
or substitute training evidence for the production ONNX serving release.
"""
import json

import pytest


@pytest.mark.offline_training
def test_expanded_checkpoint_records_real_weight_changes():
    from pathlib import Path
    root = Path(__file__).resolve().parents[1]
    active = json.loads((root / "artifacts/metrics.json").read_text(encoding="utf8"))
    if active.get("retrieval") == "passages-v1":
        if active.get("architecture") == "BAAI/bge-base-en-v1.5":
            assert active["parameters"] > active["previous_parameters"] * 4
            assert active["dataset"]["splits"]["train"] >= 60000
            assert active["eligible_for_promotion"] is True
            if active["fine_tuned_weights_selected"]:
                assert active["max_abs_parameter_change_from_base"] > 0
        else:
            assert active["max_abs_parameter_change_from_v1"] > 0
            assert active["expanded_dataset"]["auxiliary_train"] >= 10000
            assert active["task_training_groups"] == 65
            assert active["selected_epoch"] > 0
