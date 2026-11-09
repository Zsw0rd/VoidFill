"""Build-cache integrity checks use tiny synthetic ZIPs and zero real downloads."""
import copy
import hashlib
import io
import json
import shutil
import stat
import zipfile
from pathlib import Path

import pytest

from ml import cloud_build


def sha(data):
    return hashlib.sha256(data).hexdigest()


@pytest.fixture
def model_release(tmp_path, monkeypatch):
    contents = {"model.onnx": b"synthetic float32 model", "tokenizer.json": b'{"synthetic":true}', "licenses/NOTICE.txt": b"Synthetic license text"}
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in contents.items():
            archive.writestr(name, data)
    data = stream.getvalue()
    split = len(data) // 2
    payloads = {"model-00.part": data[:split], "model-01.part": data[split:]}
    release = {"backend": "onnx-fp32", "sha256": sha(data), "files_archive_sha256": sha(data), "base_url": "https://models.example.invalid/public",
               "parts": [{"name": name, "bytes": len(body), "sha256": sha(body)} for name, body in payloads.items()],
               "files": [{"name": name, "bytes": len(body), "sha256": sha(body)} for name, body in contents.items()]}
    calls = []

    def download(url, timeout):
        assert timeout == 120
        calls.append(url)
        return io.BytesIO(payloads[url.rsplit("/", 1)[1]])

    monkeypatch.setattr(cloud_build.urllib.request, "urlopen", download)
    return release, contents, payloads, calls, tmp_path / "model", data


def write_cache(directory, contents):
    for name, data in contents.items():
        path = directory / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def test_valid_source_bound_cache_skips_every_network_request(model_release):
    release, contents, _, calls, target, _ = model_release
    write_cache(target, contents)
    before = {name: (target / name).stat().st_mtime_ns for name in contents}
    assert cloud_build.prepare_model(release, target) is True
    assert calls == []
    assert before == {name: (target / name).stat().st_mtime_ns for name in contents}


@pytest.mark.parametrize("damage", ["tampered", "missing", "marker", "directory_collision"])
def test_partial_or_poisoned_cache_downloads_verifies_and_recovers(model_release, damage):
    release, contents, _, calls, target, _ = model_release
    write_cache(target, contents)
    if damage == "tampered":
        body = contents["model.onnx"]
        (target / "model.onnx").write_bytes(bytes([body[0] ^ 1]) + body[1:])
    elif damage == "missing":
        (target / "tokenizer.json").unlink()
    elif damage == "marker":
        (target / ".verified.json").write_text(json.dumps({"sha256": release["sha256"]}))
        (target / "model.onnx").write_bytes(b"forged")
    else:
        (target / "model.onnx").unlink()
        (target / "model.onnx").mkdir()
        (target / "model.onnx/extra.txt").write_bytes(b"untrusted")
    assert cloud_build.prepare_model(release, target) is False
    assert len(calls) == 2
    assert {path.relative_to(target).as_posix(): path.read_bytes() for path in target.rglob("*") if path.is_file()} == contents
    assert cloud_build.prepare_model(release, target) is True
    assert len(calls) == 2


def test_file_hashes_are_derived_from_the_verified_archive_not_cached_files(model_release, tmp_path):
    release, contents, _, _, _, data = model_release
    archive = tmp_path / "original.zip"
    archive.write_bytes(data)
    derived = cloud_build.files_from_verified_archive(archive, release["sha256"])
    assert {item["name"]: item["sha256"] for item in derived} == {name: sha(body) for name, body in contents.items()}
    with pytest.raises(RuntimeError, match="archive checksum"):
        cloud_build.files_from_verified_archive(archive, "0" * 64)


def test_a_file_manifest_for_another_archive_cannot_validate_a_cache(model_release):
    release, contents, _, calls, target, _ = model_release
    write_cache(target, contents)
    release["sha256"] = "0" * 64
    with pytest.raises(RuntimeError, match="not bound"):
        cloud_build.prepare_model(release, target)
    assert calls == []


def test_wrong_shard_hash_rejects_the_download_before_publication(model_release):
    release, _, _, _, target, _ = model_release
    release["parts"][0]["sha256"] = "0" * 64
    with pytest.raises(RuntimeError, match="shard checksum"):
        cloud_build.prepare_model(release, target)
    assert not target.exists()


def test_archive_hash_is_checked_even_when_all_shards_match(model_release):
    release, _, payloads, _, target, _ = model_release
    # The server supplies a changed shard and its changed hash. The trusted whole
    # archive digest still detects it; valid per-shard hashes alone are insufficient.
    name = release["parts"][0]["name"]
    body = payloads[name]
    payloads[name] = bytes([body[0] ^ 1]) + body[1:]
    release["parts"][0]["sha256"] = sha(payloads[name])
    with pytest.raises(RuntimeError, match="archive checksum"):
        cloud_build.prepare_model(release, target)
    assert not target.exists()


def test_wrong_extracted_file_hash_does_not_replace_existing_cache(model_release):
    release, contents, _, _, target, _ = model_release
    write_cache(target, contents)
    (target / "model.onnx").write_bytes(b"old but incomplete")
    release["files"][0]["sha256"] = "0" * 64
    with pytest.raises(RuntimeError, match="file checksum"):
        cloud_build.prepare_model(release, target)
    assert (target / "model.onnx").read_bytes() == b"old but incomplete"


@pytest.mark.parametrize("name", ["../escape.onnx", "/absolute.onnx", "C:/escape.onnx", "..\\escape.onnx", "licenses/../escape.onnx", "model.onnx:stream", "NUL", "."])
def test_malicious_archive_paths_are_rejected_before_writing(tmp_path, name):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr(name, b"untrusted")
    path = tmp_path / "bad.zip"
    path.write_bytes(stream.getvalue())
    with pytest.raises(RuntimeError, match="bundle path"):
        cloud_build.files_from_verified_archive(path, sha(stream.getvalue()))
    with pytest.raises(RuntimeError, match="bundle path"):
        cloud_build.extract_verified(path, tmp_path / "staging", {})
    assert not (tmp_path / "escape.onnx").exists()
    assert not (tmp_path / "staging").exists()


def test_archive_symlinks_and_case_collisions_are_rejected(tmp_path):
    for kind in ("symlink", "collision"):
        path = tmp_path / (kind + ".zip")
        with zipfile.ZipFile(path, "w") as archive:
            if kind == "symlink":
                item = zipfile.ZipInfo("model.onnx")
                item.create_system = 3
                item.external_attr = (stat.S_IFLNK | 0o777) << 16
                archive.writestr(item, "../outside")
            else:
                archive.writestr("model.onnx", b"first")
                archive.writestr("MODEL.onnx", b"second")
        with pytest.raises(RuntimeError, match="bundle entry"):
            cloud_build.files_from_verified_archive(path, cloud_build.file_sha256(path))


def test_cached_symlink_is_never_followed_or_written(model_release, tmp_path):
    release, contents, _, calls, target, _ = model_release
    write_cache(target, contents)
    outside = tmp_path / "outside.onnx"
    outside.write_bytes(contents["model.onnx"])
    (target / "model.onnx").unlink()
    try:
        (target / "model.onnx").symlink_to(outside)
    except OSError:
        pytest.skip("This platform requires additional privileges to create symlinks")
    with pytest.raises(RuntimeError, match="symlinks"):
        cloud_build.prepare_model(release, target)
    assert outside.read_bytes() == contents["model.onnx"]
    assert not calls


def test_shard_paths_and_missing_file_metadata_cannot_bypass_verification(model_release):
    release, _, _, calls, target, _ = model_release
    original = copy.deepcopy(release)
    release["parts"][0]["name"] = "../outside.part"
    with pytest.raises(RuntimeError, match="bundle path"):
        cloud_build.prepare_model(release, target)
    del original["files"]
    with pytest.raises(RuntimeError, match="file and shard hashes"):
        cloud_build.prepare_model(original, target)
    assert not calls


def test_fresh_build_downloads_once_and_restored_vercel_archive_needs_no_network(model_release, tmp_path, monkeypatch):
    release, contents, _, calls, first_target, data = model_release
    first_cache = tmp_path / "first/.vercel/python/services/learning/.venv/voidfill-model-cache"
    cold = {}
    assert cloud_build.prepare_model(release, first_target, first_cache, cold) is False
    assert len(calls) == len(release["parts"])
    assert cold == {"source": "download", "shard_downloads": 2, "download_bytes": len(data), "archive_bytes": len(data),
                    "archive_cache_enabled": True, "archive_cache_saved": True}
    assert (first_cache / "model.zip").read_bytes() == data
    # Simulate Vercel restoring only its Python venv, not ml/artifacts/cloud.
    restored_cache = tmp_path / "second/.vercel/python/services/learning/.venv/voidfill-model-cache"
    shutil.copytree(first_cache, restored_cache)
    second_target = tmp_path / "second/ml/artifacts/cloud"
    assert not second_target.exists()

    def no_network(*args, **kwargs):
        pytest.fail("A restored verified build cache must not fetch any shard")

    monkeypatch.setattr(cloud_build.urllib.request, "urlopen", no_network)
    warm = {}
    assert cloud_build.prepare_model(release, second_target, restored_cache, warm) is True
    assert warm == {"source": "vercel_archive", "shard_downloads": 0, "download_bytes": 0, "archive_bytes": len(data),
                    "archive_cache_enabled": True, "archive_cache_saved": True}
    assert {path.relative_to(second_target).as_posix(): path.read_bytes() for path in second_target.rglob("*") if path.is_file()} == contents
    assert (restored_cache / "model.zip").read_bytes() == data


@pytest.mark.parametrize("damage", ["tampered", "missing", "extra", "directory_collision"])
def test_corrupt_vercel_archive_is_refetched_and_warm_reuse_recovers(model_release, tmp_path, damage):
    release, contents, _, calls, target, data = model_release
    cache = tmp_path / "cache"
    cache.mkdir()
    if damage == "tampered":
        (cache / "model.zip").write_bytes(bytes([data[0] ^ 1]) + data[1:])
    elif damage == "extra":
        (cache / "model.zip").write_bytes(data)
        (cache / "unbound-marker.json").write_text(json.dumps({"sha256": release["sha256"]}))
    elif damage == "directory_collision":
        (cache / "model.zip").mkdir()
        (cache / "model.zip/extra").write_bytes(b"untrusted")
    report = {}
    assert cloud_build.prepare_model(release, target, cache, report) is False
    assert len(calls) == 2
    assert report["download_bytes"] == len(data)
    assert cloud_build.model_tree(cache) == {"model.zip"}
    assert (cache / "model.zip").read_bytes() == data
    assert cloud_build.prepare_model(release, tmp_path / "next-build", cache) is True
    assert len(calls) == 2
    assert cloud_build.cache_matches(target, cloud_build.validated_release(release))


def test_cached_archive_still_verifies_extracted_manifest_before_publication(model_release, tmp_path):
    release, _, _, calls, target, data = model_release
    cache = tmp_path / "cache"
    cache.mkdir()
    (cache / "model.zip").write_bytes(data)
    release["files"][0]["sha256"] = "0" * 64
    with pytest.raises(RuntimeError, match="file checksum"):
        cloud_build.prepare_model(release, target, cache)
    assert not target.exists()
    assert (cache / "model.zip").read_bytes() == data
    assert calls == []


def test_vercel_cache_symlinks_fail_closed_before_any_download(model_release, tmp_path):
    release, _, _, calls, target, data = model_release
    outside = tmp_path / "outside.zip"
    outside.write_bytes(data)
    cache = tmp_path / "cache"
    cache.mkdir()
    try:
        (cache / "model.zip").symlink_to(outside)
    except OSError:
        pytest.skip("This platform requires additional privileges to create symlinks")
    with pytest.raises(RuntimeError, match="symlinks"):
        cloud_build.prepare_model(release, target, cache)
    assert outside.read_bytes() == data
    assert not target.exists()
    assert calls == []


@pytest.mark.parametrize("layout", [".vercel/python/.venv", ".vercel/python/services/learning/.venv"])
def test_only_the_active_vercel_python_builder_venv_is_used(tmp_path, layout):
    env = {"VERCEL": "1", "VERCEL_PYTHON_VENV_PATH": str(tmp_path / layout)}
    assert cloud_build.vercel_archive_cache(tmp_path, env) == tmp_path / layout / "voidfill-model-cache"
    assert cloud_build.vercel_archive_cache(tmp_path, {**env, "VERCEL": "0"}) is None
    assert cloud_build.vercel_archive_cache(tmp_path, {"VERCEL": "1", "VIRTUAL_ENV": env["VERCEL_PYTHON_VENV_PATH"]}) is None


@pytest.mark.parametrize("value", ["relative/venv", "/outside/.venv", ".vercel/python/services/other/.venv", ".vercel/python/services/learning/../learning/.venv"])
def test_unknown_builder_layout_falls_back_without_reading_or_writing(tmp_path, value):
    venv = str(tmp_path / value) if value.startswith(".vercel/") else value
    assert cloud_build.vercel_archive_cache(tmp_path, {"VERCEL": "1", "VERCEL_PYTHON_VENV_PATH": venv}) is None
    assert list(tmp_path.iterdir()) == []


def test_build_cache_cannot_be_deployed_in_the_learning_bundle():
    config = json.loads((Path(__file__).resolve().parents[2] / "vercel.json").read_text())
    excludes = config["services"]["learning"]["functions"]["ml/cloud.py"]["excludeFiles"]
    assert ".vercel/**" in excludes.strip("{}").split(",")


def test_native_installation_retains_the_cached_venv_and_uses_only_serving_dependencies():
    """A custom Python31 installer deletes the restored venv before the build.

    Cross-check the native-discovery manifest against the existing serving pins;
    accidentally selecting ml/requirements.txt would install training packages.
    """
    import tomllib
    root = Path(__file__).resolve().parents[2]
    service = json.loads((root / "vercel.json").read_text())["services"]["learning"]
    assert "installCommand" not in service
    project = tomllib.loads((root / "ml/pyproject.toml").read_text())
    serving = [line.strip() for line in (root / "ml/requirements-cloud.txt").read_text().splitlines() if line.strip() and not line.lstrip().startswith("#")]
    assert project["project"]["dependencies"] == serving
    assert project["project"]["requires-python"] == ">=3.12,<3.13"
    assert project["tool"]["uv"]["package"] is False
    assert not any("torch" in item or "transformers" in item for item in project["project"]["dependencies"])
