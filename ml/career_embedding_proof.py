"""Prove a case-contract-only update leaves every public embedding input intact.

No encoder is instantiated. Refreshing an index's source fingerprints is allowed
only after ordered indexing inputs, stored vectors, IDs and runtime matcher code
have been compared exhaustively to the documented source release.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from types import FunctionType

from ml.career_catalogue import content_fingerprints, role_texts
from ml.retrieval import passages

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "50cc8a0e0c1ad18118229a35b1040368893a3681"
REPORT = ROOT / "ml/evaluation-career-embedding-proof.json"
DATA_PATHS = ["ml/data/resources.json", "ml/data/questions.json", "ml/data/careers/resources.json", "ml/data/careers/questions.json", "ml/data/careers/catalogue.json", "ml/cloud-release.json"]


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf8")).hexdigest()


def file_digest(data):
    return hashlib.sha256(data).hexdigest()


def git_bytes(path):
    return subprocess.run(["git", "show", BASELINE + ":" + path], cwd=ROOT, check=True, capture_output=True).stdout


def input_inventory(snapshot, prefix):
    """Ordered expressions in the unchanged ml.index_careers entry point.

    Passage splitting and role text generation use the actual serving/indexing
    functions; the latter gets an isolated catalogue global, with no mutation of
    the current process's shared catalogue.
    """
    catalogue = snapshot["ml/data/careers/catalogue.json"]
    resources = snapshot["ml/data/careers/resources.json"]
    questions = snapshot["ml/data/careers/questions.json"]
    chunks, owners = [], []
    for index, resource in enumerate(resources):
        windows = passages(resource)
        chunks.extend(windows)
        owners.extend([index] * len(windows))
    queries = []
    for skill in catalogue["skills"]:
        if skill["topic"]:
            query = f'{skill["name"]}. {catalogue["topics"][skill["topic"]]}'
            queries.extend([prefix + query, prefix + query + ". "])
            queries.extend(prefix + query + ". " + resource["title"][:500] for resource in snapshot["ml/data/resources.json"] + resources if skill["topic"] in resource["topics"])
    roles_for_snapshot = FunctionType(role_texts.__code__, {**role_texts.__globals__, "CATALOGUE": catalogue})
    return {
        "resources": [resource["title"] + ". " + resource["description"] for resource in resources],
        "questions": [question["prompt"] for question in questions],
        "topics": list(catalogue["topics"].values()), "passages": chunks,
        "passage_owners": owners, "public_queries": list(dict.fromkeys(queries)),
        "roles": roles_for_snapshot(),
        "resource_ids": [resource["id"] for resource in resources],
        "question_ids": [question["id"] for question in questions],
    }


def current_inventory():
    snapshot = {path: json.loads((ROOT / path).read_bytes()) for path in DATA_PATHS}
    metrics = json.loads((ROOT / "ml/artifacts/cloud/metrics.json").read_bytes())
    return input_inventory(snapshot, metrics.get("query_prefix", ""))


def matcher_inputs(catalogue):
    return [[role["curriculum"]["case"], role["activity"]["title"], role["activity"]["instructions"],
             *[text for level in ("foundation", "intermediate") for item in role["curriculum"][level]["milestones"] for text in [item["title"], item["outcome"], item["deliverable"], *item["checks"]]]]
            for role in catalogue["roles"]]


def matcher_runtime(source):
    # Type-only additions must not disguise a change to matching behavior.
    script = """import ts from 'typescript'; let value='';for await(const chunk of process.stdin)value+=chunk;
    process.stdout.write(ts.transpileModule(value,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);"""
    return subprocess.run(["node", "--input-type=module", "-e", script], input=source, text=True, encoding="utf8", capture_output=True, cwd=ROOT, check=True, timeout=20).stdout


def prove(refresh=False):
    before = {path: json.loads(git_bytes(path)) for path in DATA_PATHS}
    after = {path: json.loads((ROOT / path).read_bytes()) for path in DATA_PATHS}
    metrics = json.loads((ROOT / "ml/artifacts/cloud/metrics.json").read_bytes())
    old_inputs, new_inputs = (input_inventory(snapshot, metrics.get("query_prefix", "")) for snapshot in (before, after))
    comparisons = {name: {"count": len(values), "before_sha256": digest(old_inputs[name]), "after_sha256": digest(values), "equal": old_inputs[name] == values} for name, values in new_inputs.items()}
    old_catalogue, catalogue = before["ml/data/careers/catalogue.json"], after["ml/data/careers/catalogue.json"]
    vectors_path = "ml/data/careers/vectors.npz"
    old_vectors = file_digest(git_bytes(vectors_path))
    vectors = file_digest((ROOT / vectors_path).read_bytes())
    old_roles = [{key: value for key, value in role.items() if key != "curriculum"} for role in old_catalogue["roles"]]
    new_roles = [{key: value for key, value in role.items() if key != "curriculum"} for role in catalogue["roles"]]
    checks = {
        "all_ordered_embedding_inputs_equal": all(item["equal"] for item in comparisons.values()),
        "indexing_implementation_unchanged": git_bytes("ml/index_careers.py").decode().replace("\r\n", "\n") == (ROOT / "ml/index_careers.py").read_text(encoding="utf8"),
        "retrieval_implementation_unchanged": git_bytes("ml/retrieval.py").decode().replace("\r\n", "\n") == (ROOT / "ml/retrieval.py").read_text(encoding="utf8"),
        "vectors_bytes_equal": old_vectors == vectors,
        "model_release_manifest_equal": before["ml/cloud-release.json"] == after["ml/cloud-release.json"],
        "all_questions_and_resources_equal": all(before[path] == after[path] for path in DATA_PATHS[:4]),
        "catalogue_storage_version_equal": catalogue["version"] == old_catalogue["version"],
        "all_skills_and_role_requirements_equal": catalogue["skills"] == old_catalogue["skills"] and old_roles == new_roles,
        "all_original_milestones_equal": all(new["curriculum"][level]["milestones"] == old["curriculum"][level]["milestones"] for new, old in zip(catalogue["roles"], old_catalogue["roles"], strict=True) for level in ("foundation", "intermediate")),
        "matcher_input_text_equal": matcher_inputs(old_catalogue) == matcher_inputs(catalogue),
        "matcher_executable_code_equal": matcher_runtime(git_bytes("lib/careerCatalog.ts").decode()) == matcher_runtime((ROOT / "lib/careerCatalog.ts").read_text(encoding="utf8")),
        "fp32_backend_retained": after["ml/cloud-release.json"]["backend"] == metrics["inference_backend"] == "onnx-fp32",
    }
    if not all(checks.values()):
        raise RuntimeError("Fingerprint-only refresh denied: " + ", ".join(name for name, value in checks.items() if not value))
    path = ROOT / "ml/data/careers/index.json"
    index = json.loads(path.read_bytes())
    if index["public_queries"] != new_inputs["public_queries"] or index["resource_ids"] != new_inputs["resource_ids"] or index["question_ids"] != new_inputs["question_ids"]:
        raise RuntimeError("Index metadata mapping differs from proved ordered inputs")
    if refresh:
        index["inputs"] = content_fingerprints()
        path.write_text(json.dumps(index, indent=2) + "\n", encoding="utf8")
    checks["content_fingerprints_current"] = index["inputs"] == content_fingerprints()
    implementation = {name: file_digest((ROOT / name).read_text(encoding="utf8").encode()) for name in ("ml/index_careers.py", "ml/retrieval.py")}
    implementation["matcher_executable_js"] = file_digest(matcher_runtime((ROOT / "lib/careerCatalog.ts").read_text(encoding="utf8")).encode())
    return {"version": 1, "baseline_commit": BASELINE, "scope": "Exhaustive ordered input and vector-byte equality for a case-contract-only update. No encoder inference or FP32 reindex was performed; only the changed catalogue source fingerprint is refreshed after proof passes.", "model": metrics["model"], "backend": after["ml/cloud-release.json"]["backend"], "checks": checks, "inputs": comparisons, "vectors_sha256": vectors, "baseline_vectors_sha256": old_vectors, "matcher_inputs_sha256": digest(matcher_inputs(catalogue)), "current_content_fingerprints": content_fingerprints(), "implementation_sha256": implementation}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh-fingerprints", action="store_true")
    args = parser.parse_args()
    report = prove(args.refresh_fingerprints)
    if not all(report["checks"].values()):
        raise SystemExit("Content fingerprints are stale; no pass was recorded")
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"baseline": BASELINE, "checks_passed": len(report["checks"]), "input_groups": len(report["inputs"]), "vectors_sha256": report["vectors_sha256"], "reindexed": False}))


if __name__ == "__main__":
    main()
