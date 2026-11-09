"""Prepare a verified serving model at build time; reuse only source-bound files."""
import hashlib
import json
import os
import re
import shutil
import stat
import tempfile
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
CHUNK_BYTES = 1024 * 1024
SHA256 = re.compile(r"[a-f0-9]{64}")
RESERVED_NAMES = {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}


def file_sha256(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def relative_name(name):
    """Accept one canonical portable relative path, including nested licenses."""
    if not isinstance(name, str) or not name or "\\" in name or ":" in name:
        raise RuntimeError("Invalid model bundle path")
    path = PurePosixPath(name)
    if not path.parts or path.is_absolute() or path.as_posix() != name or any(
        part in (".", "..") or not re.fullmatch(r"[A-Za-z0-9._-]+", part)
        or part.endswith(".") or part.split(".")[0].upper() in RESERVED_NAMES for part in path.parts
    ):
        raise RuntimeError("Invalid model bundle path")
    return path


def has_link(path):
    return path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction())


def safe_path(directory, name):
    relative = relative_name(name)
    path = directory.joinpath(*relative.parts)
    if any(has_link(item) for item in (path, *path.parents)):
        raise RuntimeError("Model paths must not contain symlinks or junctions")
    if not path.resolve().is_relative_to(directory.resolve()):
        raise RuntimeError("Invalid model bundle path")
    return path


def archive_entries(bundle):
    entries = {}
    seen = set()
    for item in bundle.infolist():
        name = relative_name(item.filename).as_posix()
        kind = stat.S_IFMT(item.external_attr >> 16)
        if item.is_dir() or kind not in (0, stat.S_IFREG) or name.casefold() in seen:
            raise RuntimeError("Invalid or duplicate model bundle entry")
        seen.add(name.casefold())
        entries[name] = item
    if not entries:
        raise RuntimeError("Empty model bundle")
    return entries


def files_from_verified_archive(archive, expected_sha256):
    """Derive trusted file metadata ONLY from decompressed, archive-verified bytes.

    Used by the explicit release packager and to augment the existing release.
    Cached/extracted model files never supply their own expected checksums.
    """
    if not SHA256.fullmatch(expected_sha256) or file_sha256(archive) != expected_sha256:
        raise RuntimeError("Model archive checksum mismatch")
    files = []
    with zipfile.ZipFile(archive) as bundle:
        for name, item in sorted(archive_entries(bundle).items()):
            with bundle.open(item) as source:
                digest = hashlib.file_digest(source, "sha256").hexdigest()
            files.append({"name": name, "sha256": digest, "bytes": item.file_size})
    return files


def validated_release(release):
    if not isinstance(release.get("sha256"), str) or not SHA256.fullmatch(release["sha256"]):
        raise RuntimeError("Invalid model release checksum")
    if release.get("files_archive_sha256") != release["sha256"]:
        raise RuntimeError("Model file manifest is not bound to this archive")
    files = release.get("files")
    parts = release.get("parts")
    if not isinstance(files, list) or not files or not isinstance(parts, list) or not parts:
        raise RuntimeError("Model release requires source-controlled file and shard hashes")
    for records, leaf_only in ((files, False), (parts, True)):
        seen = set()
        for item in records:
            if not isinstance(item, dict):
                raise RuntimeError("Invalid model release entry")
            name = relative_name(item.get("name")).as_posix()
            if (leaf_only and "/" in name) or name.casefold() in seen:
                raise RuntimeError("Invalid or duplicate model release entry")
            seen.add(name.casefold())
            if not isinstance(item.get("sha256"), str) or not SHA256.fullmatch(item["sha256"]) or type(item.get("bytes")) is not int or item["bytes"] < (1 if leaf_only else 0):
                raise RuntimeError("Invalid model release file metadata")
    base = urlsplit(release.get("base_url", ""))
    if base.scheme != "https" or not base.hostname or base.username or base.password or base.query or base.fragment:
        raise RuntimeError("Invalid public model artifact origin")
    return {item["name"]: item for item in files}


def model_tree(directory):
    if any(has_link(path) for path in (directory, *directory.parents)):
        raise RuntimeError("Model paths must not contain symlinks or junctions")
    if not directory.exists():
        return set()
    if not directory.is_dir():
        raise RuntimeError("Model target is not a directory")
    files = set()
    for folder, directories, names in os.walk(directory, followlinks=False):
        for name in [*directories, *names]:
            path = Path(folder) / name
            safe_path(directory, path.relative_to(directory).as_posix())
        for name in names:
            path = Path(folder) / name
            if not path.is_file():
                raise RuntimeError("Invalid cached model file")
            files.add(path.relative_to(directory).as_posix())
    return files


def cache_matches(directory, files):
    # An unbound cache marker, partial restore or additional file is never trusted.
    if model_tree(directory) != set(files):
        return False
    return all(
        (path := safe_path(directory, name)).stat().st_size == item["bytes"]
        and file_sha256(path) == item["sha256"] for name, item in files.items()
    )


def download_archive(release, work):
    def download(part):
        destination = safe_path(work, part["name"])
        digest = hashlib.sha256()
        length = 0
        with urllib.request.urlopen(release["base_url"].rstrip("/") + "/" + part["name"], timeout=120) as source, destination.open("wb") as output:
            while chunk := source.read(min(CHUNK_BYTES, part["bytes"] - length + 1)):
                length += len(chunk)
                if length > part["bytes"]:
                    raise RuntimeError("Model shard size mismatch: " + part["name"])
                digest.update(chunk)
                output.write(chunk)
        if length != part["bytes"] or digest.hexdigest() != part["sha256"]:
            raise RuntimeError("Model shard checksum mismatch: " + part["name"])
        return destination

    with ThreadPoolExecutor(max_workers=4) as pool:
        parts = list(pool.map(download, release["parts"]))
    archive = work / "model.zip"
    with archive.open("wb") as output:
        for part in parts:
            with part.open("rb") as source:
                shutil.copyfileobj(source, output)
    if file_sha256(archive) != release["sha256"]:
        raise RuntimeError("Model archive checksum mismatch")
    return archive


def extract_verified(archive, staging, files):
    with zipfile.ZipFile(archive) as bundle:
        entries = archive_entries(bundle)
        if set(entries) != set(files):
            raise RuntimeError("Model archive does not match its source-controlled file manifest")
        for name, item in entries.items():
            if item.file_size != files[name]["bytes"]:
                raise RuntimeError("Model file size mismatch: " + name)
            path = safe_path(staging, name)
            path.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(item) as source, path.open("wb") as output:
                shutil.copyfileobj(source, output)
            if file_sha256(path) != files[name]["sha256"]:
                raise RuntimeError("Model file checksum mismatch: " + name)


def publish_verified(staging, directory, files):
    # Inspect first and never follow cached symlinks. Only unlisted regular files
    # inside this explicit model directory are removed after archive verification.
    extras = model_tree(directory) - set(files)
    for name in extras:
        safe_path(directory, name).unlink()
    if directory.exists():
        required_directories = {parent.as_posix() for name in files for parent in PurePosixPath(name).parents if parent.as_posix() != "."}
        for path in sorted((path for path in directory.rglob("*") if path.is_dir()), key=lambda path: len(path.parts), reverse=True):
            name = path.relative_to(directory).as_posix()
            if name not in required_directories:
                safe_path(directory, name).rmdir()
    directory.mkdir(parents=True, exist_ok=True)
    for name in files:
        destination = safe_path(directory, name)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(prefix=".vf-model-", dir=destination.parent, delete=False) as temporary:
            temporary_path = Path(temporary.name)
            with safe_path(staging, name).open("rb") as source:
                shutil.copyfileobj(source, temporary)
        try:
            temporary_path.replace(destination)
        finally:
            temporary_path.unlink(missing_ok=True)
    if not cache_matches(directory, files):
        raise RuntimeError("Prepared model did not pass final file verification")


def vercel_archive_cache(project_root, environ=None):
    """Use only the active Python builder's cache-preserved virtual environment.

    @vercel/python 31 preserves these venv roots, not arbitrary project files.
    The dedicated archive is outside site-packages and never used for imports.
    An unknown future builder layout safely falls back to a verified download.
    """
    environ = os.environ if environ is None else environ
    if environ.get("VERCEL") != "1":
        return None
    raw = environ.get("VERCEL_PYTHON_VENV_PATH")
    if not raw:
        return None
    root = Path(project_root)
    venv = Path(raw)
    allowed = [root / ".vercel/python/.venv", root / ".vercel/python/services/learning/.venv"]
    if not venv.is_absolute() or venv not in allowed:
        return None
    # Check the original spelling before resolving: resolution must not hide links.
    cache = venv / "voidfill-model-cache"
    safe_path(root, cache.relative_to(root).as_posix())
    return cache


def prepare_model(release, directory, archive_cache=None, report=None):
    """Prepare files, optionally retaining only the compressed, verified archive.

    Both extracted trees and cached archives are untrusted inputs. Cache hits
    never rely on a marker: source-controlled hashes and the full extracted-file
    manifest remain authoritative. Return True when no shard downloads occurred.
    """
    directory = Path(directory)
    files = validated_release(release)
    archive_files = {"model.zip": {"sha256": release["sha256"], "bytes": sum(part["bytes"] for part in release["parts"])}}
    archive_cache = Path(archive_cache) if archive_cache is not None else None
    # Reject a malicious cache tree even when runtime files happen to be valid.
    cached_archive = archive_cache is not None and cache_matches(archive_cache, archive_files)
    stats = {"source": "existing_files", "shard_downloads": 0, "download_bytes": 0,
             "archive_bytes": archive_files["model.zip"]["bytes"], "archive_cache_enabled": archive_cache is not None,
             "archive_cache_saved": bool(cached_archive)}
    if cache_matches(directory, files):
        if report is not None:
            report.update(stats)
        return True
    with tempfile.TemporaryDirectory(prefix="voidfill-model-") as temporary:
        work = Path(temporary)
        if cached_archive:
            archive = safe_path(archive_cache, "model.zip")
            stats["source"] = "vercel_archive"
        else:
            archive = download_archive(release, work)
            stats.update(source="download", shard_downloads=len(release["parts"]), download_bytes=archive_files["model.zip"]["bytes"])
        staging = work / "verified"
        extract_verified(archive, staging, files)
        publish_verified(staging, directory, files)
        if archive_cache is not None and not cached_archive:
            # Only this owned subdirectory is replaced. The venv and other caches
            # are untouched; no model files are placed in executable site-packages.
            publish_verified(work, archive_cache, archive_files)
            stats["archive_cache_saved"] = True
    if report is not None:
        report.update(stats)
    return cached_archive


def main():
    release = json.loads((ROOT / "cloud-release.json").read_text(encoding="utf8"))
    report = {}
    reused = prepare_model(release, ROOT / "artifacts/cloud", vercel_archive_cache(ROOT.parent), report)
    from ml.career_catalogue import DIRECTORY, content_fingerprints
    extension = json.loads((DIRECTORY / "index.json").read_text(encoding="utf8"))
    actual = content_fingerprints()
    if extension["inputs"] != actual:
        changed = [name for name, digest in actual.items() if extension["inputs"].get(name) != digest]
        raise RuntimeError("Career content changed without rebuilding its public index: " + ", ".join(changed))
    print("Model artifact preparation: " + json.dumps(report, sort_keys=True), flush=True)
    reused_description = "Reused verified Vercel model archive" if report["source"] == "vercel_archive" else "Reused verified existing model files"
    print((reused_description if reused else "Downloaded and verified model files") + "; verified career fingerprints: " + release["backend"], flush=True)


if __name__ == "__main__":
    main()
