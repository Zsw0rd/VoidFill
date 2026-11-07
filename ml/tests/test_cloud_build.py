"""Build-cache integrity checks use tiny synthetic ZIPs and zero real downloads."""
import copy
import hashlib
import io
import json
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
