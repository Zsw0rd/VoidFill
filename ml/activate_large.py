"""Promote a completed v3 candidate using its recorded validation gate.

Stop the local service first. Existing model directories are preserved, never
deleted, and all rename targets must resolve inside this workspace's artifacts.
"""
import json
import shutil
import time
from pathlib import Path
from ml.train import ROOT


def main():
    artifacts = (ROOT / "artifacts").resolve()
    candidate = (artifacts / "retriever-v3-candidate").resolve()
    active = (artifacts / "retriever").resolve()
    staging = (artifacts / "retriever-v3-staging").resolve()
    backup = (artifacts / f"retriever-before-v3-{time.time_ns()}").resolve()
    for path in (candidate, active, staging, backup):
        if not path.is_relative_to(artifacts) or path == artifacts:
            raise RuntimeError("Model path escaped the workspace artifact directory")
    if staging.exists():
        raise RuntimeError("A promotion staging directory already exists. Inspect it before retrying.")
    report = json.loads((candidate / "training-report.json").read_text(encoding="utf8"))
    if not report["eligible_for_promotion"]:
        raise RuntimeError("Candidate did not improve validation MRR over v2")
    report["inference_device"] = "auto"
    report["activation"] = "Validation-gated local promotion; previous active directory preserved for rollback"
    # Copy first; failure cannot affect the working checkpoint.
    shutil.copytree(candidate, staging)
    active.rename(backup)
    try:
        staging.rename(active)
    except Exception:
        backup.rename(active)
        raise
    metrics = artifacts / "metrics.json"
    (artifacts / "metrics-before-v3.json").write_bytes(metrics.read_bytes())
    temporary = artifacts / "metrics-v3.tmp.json"
    temporary.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    temporary.replace(metrics)
    print(json.dumps({"activated": report["model"], "parameters": report["parameters"], "selected_stage": report["selected_stage"], "fine_tuned_weights_selected": report["fine_tuned_weights_selected"], "previous_directory": str(backup), "test": report["selected"]["test"]}), flush=True)


if __name__ == "__main__": main()
